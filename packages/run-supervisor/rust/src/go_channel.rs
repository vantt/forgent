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
