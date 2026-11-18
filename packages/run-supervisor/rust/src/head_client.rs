//! The client end of a head session's request socket: one request, one reply, with the frame codec of the GO
//! channel (`go_channel`, contract `packages/run-supervisor/contracts/head-request.v1.json`). The server half is
//! `head_request`; this half is for a process inside the head's sandbox (the rotation hook) that asks its own
//! supervisor for a granted verb.

use std::os::unix::fs::MetadataExt;
use std::os::unix::net::UnixStream;
use std::path::Path;
use std::time::Duration;

use serde_json::{json, Value};

use crate::go_channel::{read_frame, write_frame, FrameError};

/// A reply may take as long as the supervisor lets a verb run (60 s) plus its own overhead.
pub const REPLY_TIMEOUT: Duration = Duration::from_millis(70_000);

/// Why a request got no `done` reply. `code` is the supervisor's refusal code (`verb-not-granted`,
/// `role-not-held`, `busy`, ...), or for `verb-failed` the entry's own code carried in `detail`; the client's own
/// failures are `request-socket-unavailable`, `request-socket-foreign`, `request-too-large`, `reply-timeout` and
/// `bad-reply`.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ClientError {
    pub code: String,
    pub detail: Option<String>,
}

impl ClientError {
    fn new(code: &str, detail: impl Into<Option<String>>) -> Self {
        Self {
            code: code.to_string(),
            detail: detail.into(),
        }
    }
}

impl std::fmt::Display for ClientError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match &self.detail {
            Some(d) => write!(f, "{} ({d})", self.code),
            None => f.write_str(&self.code),
        }
    }
}

/// An entry's own failure code: a lowercase word with digits and hyphens.
fn use_case_code(text: &str) -> bool {
    let mut chars = text.chars();
    chars.next().is_some_and(|c| c.is_ascii_lowercase())
        && chars.all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == '-')
}

fn refusal(reply: &Value) -> ClientError {
    let code = reply["code"].as_str().unwrap_or("refused");
    let detail = reply["detail"].as_str().map(str::to_string);
    match (&detail, code) {
        (Some(d), "verb-failed") if use_case_code(d) => ClientError {
            code: d.clone(),
            detail,
        },
        _ => ClientError {
            code: code.to_string(),
            detail,
        },
    }
}

/// Asks for `verb` over the socket at `socket` and returns its `data`. The socket file must belong to this user.
pub fn request_head(
    socket: &Path,
    verb: &str,
    args: &Value,
    id: &str,
    timeout: Duration,
) -> Result<Value, ClientError> {
    let request = json!({ "type": "REQUEST", "id": id, "verb": verb, "args": args });
    if request.to_string().len() > crate::go_channel::MAX_FRAME_BYTES {
        return Err(ClientError::new("request-too-large", None));
    }
    let meta = std::fs::metadata(socket).map_err(|e| {
        ClientError::new(
            "request-socket-unavailable",
            format!("{}: {e}", socket.display()),
        )
    })?;
    // SAFETY: getuid has no preconditions and cannot fail.
    if meta.uid() != unsafe { libc::getuid() } {
        return Err(ClientError::new(
            "request-socket-foreign",
            socket.display().to_string(),
        ));
    }
    let mut stream = UnixStream::connect(socket).map_err(|e| {
        ClientError::new(
            "request-socket-unavailable",
            format!("{}: {e}", socket.display()),
        )
    })?;
    let io = |e: std::io::Error| ClientError::new("request-socket-unavailable", e.to_string());
    stream.set_read_timeout(Some(timeout)).map_err(io)?;
    stream.set_write_timeout(Some(timeout)).map_err(io)?;
    write_frame(&mut stream, &request).map_err(io)?;
    let reply = read_frame(&mut stream).map_err(|e| match e {
        FrameError::Closed => ClientError::new(
            "reply-timeout",
            "no reply: the supervisor closed the connection or the wait ran out".to_string(),
        ),
        FrameError::Protocol => ClientError::new(
            "bad-reply",
            "the reply is not one JSON object within the size limit".to_string(),
        ),
    })?;
    if reply["type"] != "REPLY" || (reply["id"] != id && !reply["id"].is_null()) {
        return Err(ClientError::new(
            "bad-reply",
            format!(
                "unexpected reply {}",
                json!({ "type": reply["type"], "id": reply["id"] })
            ),
        ));
    }
    if reply["result"] == "done" {
        Ok(reply.get("data").cloned().unwrap_or_else(|| json!({})))
    } else {
        Err(refusal(&reply))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::os::unix::net::UnixListener;

    /// Serves one connection: reads the request frame and answers with `reply(request)`.
    fn serve(
        tag: &str,
        reply: impl FnOnce(Value) -> Option<Value> + Send + 'static,
    ) -> (std::path::PathBuf, std::thread::JoinHandle<Value>) {
        let dir = std::env::temp_dir().join(format!("hc-{}-{tag}", std::process::id()));
        std::fs::create_dir_all(&dir).unwrap();
        let path = dir.join("s.sock");
        let _ = std::fs::remove_file(&path);
        let listener = UnixListener::bind(&path).unwrap();
        let handle = std::thread::spawn(move || {
            let (mut conn, _) = listener.accept().unwrap();
            let request = read_frame(&mut conn).unwrap();
            if let Some(frame) = reply(request.clone()) {
                write_frame(&mut conn, &frame).unwrap();
            }
            request
        });
        (path, handle)
    }

    #[test]
    fn a_done_reply_returns_its_data_and_the_request_carries_verb_args_and_id() {
        let (path, server) = serve("done", |r| {
            Some(
                json!({ "type": "REPLY", "id": r["id"], "result": "done", "data": { "started": true } }),
            )
        });
        let data = request_head(
            &path,
            "head rotate",
            &json!({ "persona": "p" }),
            "id1",
            Duration::from_secs(5),
        )
        .unwrap();
        assert_eq!(data, json!({ "started": true }));
        assert_eq!(
            server.join().unwrap(),
            json!({ "type": "REQUEST", "id": "id1", "verb": "head rotate", "args": { "persona": "p" } })
        );
    }

    #[test]
    fn a_refusal_carries_the_supervisors_code_and_a_verb_failure_carries_the_entrys_own_code() {
        let (path, server) = serve("refused", |r| {
            Some(
                json!({ "type": "REPLY", "id": r["id"], "result": "refused", "code": "verb-not-granted" }),
            )
        });
        assert_eq!(
            request_head(&path, "v", &json!({}), "a", Duration::from_secs(5))
                .unwrap_err()
                .code,
            "verb-not-granted"
        );
        server.join().unwrap();
        let (path, server) = serve("failed", |r| {
            Some(
                json!({ "type": "REPLY", "id": r["id"], "result": "refused", "code": "verb-failed", "detail": "answer-mismatch" }),
            )
        });
        let err = request_head(&path, "v", &json!({}), "a", Duration::from_secs(5)).unwrap_err();
        assert_eq!(
            (err.code.as_str(), err.detail.as_deref()),
            ("answer-mismatch", Some("answer-mismatch"))
        );
        server.join().unwrap();
        let (path, server) = serve("crashed", |r| {
            Some(
                json!({ "type": "REPLY", "id": r["id"], "result": "refused", "code": "verb-failed", "detail": "the route ended with exit 1" }),
            )
        });
        assert_eq!(
            request_head(&path, "v", &json!({}), "a", Duration::from_secs(5))
                .unwrap_err()
                .code,
            "verb-failed"
        );
        server.join().unwrap();
    }

    #[test]
    fn a_gone_socket_a_mismatched_reply_and_a_closed_connection_are_named() {
        let gone = std::env::temp_dir().join("hc-none/s.sock");
        assert_eq!(
            request_head(&gone, "v", &json!({}), "a", Duration::from_secs(1))
                .unwrap_err()
                .code,
            "request-socket-unavailable"
        );
        let (path, server) = serve("other", |_| {
            Some(json!({ "type": "REPLY", "id": "other", "result": "done" }))
        });
        assert_eq!(
            request_head(&path, "v", &json!({}), "a", Duration::from_secs(5))
                .unwrap_err()
                .code,
            "bad-reply"
        );
        server.join().unwrap();
        let (path, server) = serve("closed", |_| None);
        assert_eq!(
            request_head(&path, "v", &json!({}), "a", Duration::from_secs(5))
                .unwrap_err()
                .code,
            "reply-timeout"
        );
        server.join().unwrap();
    }

    #[test]
    fn an_oversize_request_is_refused_before_any_connection_is_made() {
        let gone = std::env::temp_dir().join("hc-none/s.sock");
        let big = json!({ "m": "x".repeat(crate::go_channel::MAX_FRAME_BYTES) });
        assert_eq!(
            request_head(&gone, "v", &big, "a", Duration::from_secs(5))
                .unwrap_err()
                .code,
            "request-too-large"
        );
    }
}
