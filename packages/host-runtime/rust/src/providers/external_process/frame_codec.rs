//! 4-byte big-endian length-prefixed JSON-RPC 2.0 frame codec for component protocol.
//!
//! Protocol: 4-byte big-endian length prefix followed by UTF-8 JSON-RPC 2.0 payload.
//!
//! Rejects:
//! - Oversized frames exceeding max_frame_size
//! - Truncated frames
//! - Invalid UTF-8 bytes
//! - Invalid JSON
//! - Non-JSON-RPC 2.0 shapes

use serde::{Deserialize, Serialize};
use std::fmt;
use std::io::{Read, Write};

pub const DEFAULT_MAX_FRAME_SIZE: usize = 16 * 1024 * 1024; // 16 MB

/// Request or response identifier in JSON-RPC 2.0.
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(untagged)]
pub enum RequestId {
    Number(i64),
    String(String),
}

impl fmt::Display for RequestId {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Number(n) => write!(f, "{}", n),
            Self::String(s) => write!(f, "{}", s),
        }
    }
}

impl From<i64> for RequestId {
    fn from(n: i64) -> Self {
        Self::Number(n)
    }
}

impl From<i32> for RequestId {
    fn from(n: i32) -> Self {
        Self::Number(n as i64)
    }
}

impl From<u64> for RequestId {
    fn from(n: u64) -> Self {
        Self::Number(n as i64)
    }
}

impl From<u32> for RequestId {
    fn from(n: u32) -> Self {
        Self::Number(n as i64)
    }
}

impl From<&str> for RequestId {
    fn from(s: &str) -> Self {
        Self::String(s.to_string())
    }
}

impl From<String> for RequestId {
    fn from(s: String) -> Self {
        Self::String(s)
    }
}

/// JSON-RPC 2.0 Error object.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct JsonRpcError {
    pub code: i64,
    pub message: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub data: Option<serde_json::Value>,
}

/// JSON-RPC 2.0 Request object.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct JsonRpcRequest {
    pub jsonrpc: String,
    pub method: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub params: Option<serde_json::Value>,
    pub id: RequestId,
}

/// JSON-RPC 2.0 Notification object (has no id).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct JsonRpcNotification {
    pub jsonrpc: String,
    pub method: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub params: Option<serde_json::Value>,
}

/// JSON-RPC 2.0 Response object.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct JsonRpcResponse {
    pub jsonrpc: String,
    pub id: Option<RequestId>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub result: Option<serde_json::Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<JsonRpcError>,
}

/// Top-level frame message: Request, Response, or Notification.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(untagged)]
pub enum FrameMessage {
    Request(JsonRpcRequest),
    Response(JsonRpcResponse),
    Notification(JsonRpcNotification),
}

impl FrameMessage {
    pub fn request(
        method: impl Into<String>,
        params: Option<serde_json::Value>,
        id: impl Into<RequestId>,
    ) -> Self {
        Self::Request(JsonRpcRequest {
            jsonrpc: "2.0".to_string(),
            method: method.into(),
            params,
            id: id.into(),
        })
    }

    pub fn response(id: Option<RequestId>, result: serde_json::Value) -> Self {
        Self::Response(JsonRpcResponse {
            jsonrpc: "2.0".to_string(),
            id,
            result: Some(result),
            error: None,
        })
    }

    pub fn response_error(id: Option<RequestId>, error: JsonRpcError) -> Self {
        Self::Response(JsonRpcResponse {
            jsonrpc: "2.0".to_string(),
            id,
            result: None,
            error: Some(error),
        })
    }

    pub fn notification(method: impl Into<String>, params: Option<serde_json::Value>) -> Self {
        Self::Notification(JsonRpcNotification {
            jsonrpc: "2.0".to_string(),
            method: method.into(),
            params,
        })
    }

    pub fn is_request(&self) -> bool {
        matches!(self, Self::Request(_))
    }

    pub fn is_response(&self) -> bool {
        matches!(self, Self::Response(_))
    }

    pub fn is_notification(&self) -> bool {
        matches!(self, Self::Notification(_))
    }
}

/// Errors returned during frame encoding or decoding.
#[derive(Debug, Clone, PartialEq, Eq, thiserror::Error)]
pub enum CodecError {
    #[error("oversized frame: frame length {size} exceeds maximum {max}")]
    OversizedFrame { size: usize, max: usize },
    #[error("truncated frame: stream ended unexpectedly mid-frame")]
    TruncatedFrame,
    #[error("invalid utf-8 in frame payload: {0}")]
    InvalidUtf8(String),
    #[error("invalid json in frame payload: {0}")]
    InvalidJson(String),
    #[error("non-json-rpc-2.0 shape: {0}")]
    NonJsonRpcShape(String),
    #[error("io error: {0}")]
    Io(String),
}

/// Frame codec encoding and decoding 4-byte big-endian length-prefixed JSON-RPC 2.0 messages.
#[derive(Debug, Clone)]
pub struct FrameCodec {
    max_frame_size: usize,
}

impl Default for FrameCodec {
    fn default() -> Self {
        Self::new()
    }
}

impl FrameCodec {
    pub fn new() -> Self {
        Self {
            max_frame_size: DEFAULT_MAX_FRAME_SIZE,
        }
    }

    pub fn with_max_frame_size(mut self, max: usize) -> Self {
        self.max_frame_size = max;
        self
    }

    pub fn max_frame_size(&self) -> usize {
        self.max_frame_size
    }

    /// Encodes a `FrameMessage` into 4-byte big-endian length-prefixed bytes.
    pub fn encode(&self, message: &FrameMessage) -> Result<Vec<u8>, CodecError> {
        let json_bytes = match message {
            FrameMessage::Request(r) => serde_json::to_vec(r),
            FrameMessage::Response(r) => serde_json::to_vec(r),
            FrameMessage::Notification(n) => serde_json::to_vec(n),
        }
        .map_err(|e| CodecError::InvalidJson(e.to_string()))?;

        if json_bytes.len() > self.max_frame_size {
            return Err(CodecError::OversizedFrame {
                size: json_bytes.len(),
                max: self.max_frame_size,
            });
        }

        let len = json_bytes.len() as u32;
        let mut out = Vec::with_capacity(4 + json_bytes.len());
        out.extend_from_slice(&len.to_be_bytes());
        out.extend_from_slice(&json_bytes);
        Ok(out)
    }

    /// Encodes and writes a `FrameMessage` to a writer, then flushes.
    pub fn encode_to_writer<W: Write>(
        &self,
        message: &FrameMessage,
        writer: &mut W,
    ) -> Result<(), CodecError> {
        let bytes = self.encode(message)?;
        writer
            .write_all(&bytes)
            .map_err(|e| CodecError::Io(e.to_string()))?;
        writer.flush().map_err(|e| CodecError::Io(e.to_string()))?;
        Ok(())
    }

    /// Decodes a single frame from a byte slice.
    /// Returns the decoded `FrameMessage` and the total number of bytes consumed (4 + payload len).
    pub fn decode(&self, bytes: &[u8]) -> Result<(FrameMessage, usize), CodecError> {
        if bytes.len() < 4 {
            return Err(CodecError::TruncatedFrame);
        }

        let len = u32::from_be_bytes(bytes[0..4].try_into().unwrap()) as usize;
        if len > self.max_frame_size {
            return Err(CodecError::OversizedFrame {
                size: len,
                max: self.max_frame_size,
            });
        }

        if bytes.len() < 4 + len {
            return Err(CodecError::TruncatedFrame);
        }

        let payload = &bytes[4..4 + len];
        let s = std::str::from_utf8(payload)
            .map_err(|e| CodecError::InvalidUtf8(e.to_string()))?;

        let val: serde_json::Value = serde_json::from_str(s)
            .map_err(|e| CodecError::InvalidJson(e.to_string()))?;

        let msg = Self::validate_jsonrpc(&val)?;
        Ok((msg, 4 + len))
    }

    /// Decodes a single frame from a reader.
    /// Returns `Ok(None)` on clean EOF before any bytes of the length header are read.
    pub fn decode_from_reader<R: Read>(&self, reader: &mut R) -> Result<Option<FrameMessage>, CodecError> {
        let mut len_buf = [0u8; 4];
        let mut total_read = 0;
        while total_read < 4 {
            match reader.read(&mut len_buf[total_read..]) {
                Ok(0) => {
                    if total_read == 0 {
                        return Ok(None);
                    } else {
                        return Err(CodecError::TruncatedFrame);
                    }
                }
                Ok(n) => total_read += n,
                Err(e) if e.kind() == std::io::ErrorKind::Interrupted => continue,
                Err(e) => return Err(CodecError::Io(e.to_string())),
            }
        }

        let len = u32::from_be_bytes(len_buf) as usize;
        if len > self.max_frame_size {
            return Err(CodecError::OversizedFrame {
                size: len,
                max: self.max_frame_size,
            });
        }

        let mut payload = vec![0u8; len];
        let mut payload_read = 0;
        while payload_read < len {
            match reader.read(&mut payload[payload_read..]) {
                Ok(0) => return Err(CodecError::TruncatedFrame),
                Ok(n) => payload_read += n,
                Err(e) if e.kind() == std::io::ErrorKind::Interrupted => continue,
                Err(e) => return Err(CodecError::Io(e.to_string())),
            }
        }

        let s = std::str::from_utf8(&payload)
            .map_err(|e| CodecError::InvalidUtf8(e.to_string()))?;

        let val: serde_json::Value = serde_json::from_str(s)
            .map_err(|e| CodecError::InvalidJson(e.to_string()))?;

        let msg = Self::validate_jsonrpc(&val)?;
        Ok(Some(msg))
    }

    /// Strictly validates JSON-RPC 2.0 semantics and returns the typed `FrameMessage`.
    pub fn validate_jsonrpc(val: &serde_json::Value) -> Result<FrameMessage, CodecError> {
        let obj = val
            .as_object()
            .ok_or_else(|| CodecError::NonJsonRpcShape("message must be a JSON object".to_string()))?;

        // jsonrpc field check: must equal "2.0"
        let jsonrpc = obj
            .get("jsonrpc")
            .and_then(|v| v.as_str())
            .ok_or_else(|| {
                CodecError::NonJsonRpcShape(
                    "missing or non-string 'jsonrpc' field, expected '2.0'".to_string(),
                )
            })?;
        if jsonrpc != "2.0" {
            return Err(CodecError::NonJsonRpcShape(format!(
                "unsupported jsonrpc version '{jsonrpc}', expected '2.0'"
            )));
        }

        let has_method = obj.contains_key("method");
        let has_result = obj.contains_key("result");
        let has_error = obj.contains_key("error");
        let has_id = obj.contains_key("id");

        // Cannot have method AND result/error
        if has_method && (has_result || has_error) {
            return Err(CodecError::NonJsonRpcShape(
                "message cannot contain both 'method' and 'result'/'error'".to_string(),
            ));
        }

        // Cannot have both result AND error in a response
        if has_result && has_error {
            return Err(CodecError::NonJsonRpcShape(
                "response message cannot contain both 'result' and 'error'".to_string(),
            ));
        }

        if has_method {
            let method = obj["method"]
                .as_str()
                .ok_or_else(|| CodecError::NonJsonRpcShape("'method' field must be a string".to_string()))?
                .to_string();

            let params = obj.get("params").cloned();
            if let Some(ref p) = params {
                if !p.is_object() && !p.is_array() && !p.is_null() {
                    return Err(CodecError::NonJsonRpcShape(
                        "'params' must be an object, array, or null".to_string(),
                    ));
                }
            }

            if has_id {
                let id_val = &obj["id"];
                let id = if let Some(n) = id_val.as_i64() {
                    RequestId::Number(n)
                } else if let Some(s) = id_val.as_str() {
                    RequestId::String(s.to_string())
                } else {
                    return Err(CodecError::NonJsonRpcShape(
                        "request 'id' must be an integer or string".to_string(),
                    ));
                };

                Ok(FrameMessage::Request(JsonRpcRequest {
                    jsonrpc: "2.0".to_string(),
                    method,
                    params,
                    id,
                }))
            } else {
                Ok(FrameMessage::Notification(JsonRpcNotification {
                    jsonrpc: "2.0".to_string(),
                    method,
                    params,
                }))
            }
        } else if has_result || has_error {
            let id = if has_id {
                let id_val = &obj["id"];
                if id_val.is_null() {
                    None
                } else if let Some(n) = id_val.as_i64() {
                    Some(RequestId::Number(n))
                } else if let Some(s) = id_val.as_str() {
                    Some(RequestId::String(s.to_string()))
                } else {
                    return Err(CodecError::NonJsonRpcShape(
                        "response 'id' must be an integer, string, or null".to_string(),
                    ));
                }
            } else {
                None
            };

            let error = if has_error {
                let err_obj = obj["error"]
                    .as_object()
                    .ok_or_else(|| CodecError::NonJsonRpcShape("'error' field must be an object".to_string()))?;

                let code = err_obj
                    .get("code")
                    .and_then(|c| c.as_i64())
                    .ok_or_else(|| {
                        CodecError::NonJsonRpcShape(
                            "error 'code' must be an integer".to_string(),
                        )
                    })?;

                let message = err_obj
                    .get("message")
                    .and_then(|m| m.as_str())
                    .ok_or_else(|| {
                        CodecError::NonJsonRpcShape(
                            "error 'message' must be a string".to_string(),
                        )
                    })?
                    .to_string();

                let data = err_obj.get("data").cloned();

                Some(JsonRpcError {
                    code,
                    message,
                    data,
                })
            } else {
                None
            };

            let result = obj.get("result").cloned();

            Ok(FrameMessage::Response(JsonRpcResponse {
                jsonrpc: "2.0".to_string(),
                id,
                result,
                error,
            }))
        } else {
            Err(CodecError::NonJsonRpcShape(
                "message must contain either 'method' or 'result'/'error'".to_string(),
            ))
        }
    }
}
