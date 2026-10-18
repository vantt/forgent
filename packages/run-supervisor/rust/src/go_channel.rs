//! Frames on the GO channel: a 4-byte big-endian length, then that many bytes
//! of UTF-8 JSON (one object). Contract:
//! `packages/run-supervisor/contracts/gate-go.v1.json`.

use std::io::{self, Read, Write};

use serde_json::Value;

/// Largest frame either side accepts.
pub const MAX_FRAME_BYTES: usize = 65_536;

/// Why no frame came out of the channel. Both mean the same to the gate.
#[derive(Debug)]
pub enum FrameError {
    /// The peer closed the channel (or the read failed) before a whole frame.
    Closed,
    /// A length above the limit or a payload that is not one JSON object.
    Protocol,
}

/// Bytes read off a nonblocking channel, cut into frames as they complete.
#[derive(Default)]
pub struct FrameBuf {
    buf: Vec<u8>,
}

impl FrameBuf {
    pub fn push(&mut self, bytes: &[u8]) {
        self.buf.extend_from_slice(bytes);
    }

    /// The next whole frame, `Ok(None)` while one is still partial.
    pub fn next_frame(&mut self) -> Result<Option<Value>, FrameError> {
        if self.buf.len() < 4 {
            return Ok(None);
        }
        let len = u32::from_be_bytes([self.buf[0], self.buf[1], self.buf[2], self.buf[3]]) as usize;
        if len > MAX_FRAME_BYTES {
            return Err(FrameError::Protocol);
        }
        if self.buf.len() < 4 + len {
            return Ok(None);
        }
        let frame = read_frame(&mut self.buf.as_slice())?;
        self.buf.drain(..4 + len);
        Ok(Some(frame))
    }
}

pub fn write_frame(out: &mut impl Write, frame: &Value) -> io::Result<()> {
    let bytes = serde_json::to_vec(frame).map_err(io::Error::other)?;
    if bytes.len() > MAX_FRAME_BYTES {
        return Err(io::Error::new(io::ErrorKind::InvalidInput, "frame over the size limit"));
    }
    let mut buf = Vec::with_capacity(4 + bytes.len());
    buf.extend_from_slice(&(bytes.len() as u32).to_be_bytes());
    buf.extend_from_slice(&bytes);
    out.write_all(&buf)?;
    out.flush()
}

pub fn read_frame(input: &mut impl Read) -> Result<Value, FrameError> {
    let mut head = [0u8; 4];
    input.read_exact(&mut head).map_err(|_| FrameError::Closed)?;
    let len = u32::from_be_bytes(head) as usize;
    if len > MAX_FRAME_BYTES {
        return Err(FrameError::Protocol);
    }
    let mut body = vec![0u8; len];
    input.read_exact(&mut body).map_err(|_| FrameError::Closed)?;
    match serde_json::from_slice::<Value>(&body) {
        Ok(value) if value.is_object() => Ok(value),
        _ => Err(FrameError::Protocol),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn frames_round_trip() {
        let mut wire = Vec::new();
        write_frame(&mut wire, &json!({"type": "HELLO", "attemptId": "a1"})).unwrap();
        let frame = read_frame(&mut wire.as_slice()).unwrap();
        assert_eq!(frame["type"], "HELLO");
    }

    #[test]
    fn frame_buffer_yields_frames_as_they_complete() {
        let mut wire = Vec::new();
        write_frame(&mut wire, &json!({"type": "GO"})).unwrap();
        write_frame(&mut wire, &json!({"type": "BRIEF_DELIVERED"})).unwrap();
        let mut buf = FrameBuf::default();
        buf.push(&wire[..3]);
        assert!(buf.next_frame().unwrap().is_none());
        buf.push(&wire[3..]);
        assert_eq!(buf.next_frame().unwrap().unwrap()["type"], "GO");
        assert_eq!(buf.next_frame().unwrap().unwrap()["type"], "BRIEF_DELIVERED");
        assert!(buf.next_frame().unwrap().is_none());
        let mut oversize = FrameBuf::default();
        oversize.push(&((MAX_FRAME_BYTES + 1) as u32).to_be_bytes());
        assert!(matches!(oversize.next_frame(), Err(FrameError::Protocol)));
    }

    #[test]
    fn oversize_short_and_non_object_frames_are_refused() {
        let mut oversize = ((MAX_FRAME_BYTES + 1) as u32).to_be_bytes().to_vec();
        oversize.extend_from_slice(b"{}");
        assert!(matches!(read_frame(&mut oversize.as_slice()), Err(FrameError::Protocol)));
        assert!(matches!(read_frame(&mut [0u8, 0, 0, 9, b'{'].as_slice()), Err(FrameError::Closed)));
        let mut array = 2u32.to_be_bytes().to_vec();
        array.extend_from_slice(b"[]");
        assert!(matches!(read_frame(&mut array.as_slice()), Err(FrameError::Protocol)));
        assert!(matches!(read_frame(&mut [].as_slice()), Err(FrameError::Closed)));
    }
}
