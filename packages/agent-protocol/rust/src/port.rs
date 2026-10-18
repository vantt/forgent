//! Port the supervisor wires to an adapter: the `direct` mode reads a capture
//! file tail, the terminal mode (terminal-control) sends keys and reads the screen.

/// Input for `send`; the contract's `io.send.input`.
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct SendInput {
    pub text: Option<String>,
    pub keys: Option<Vec<String>>,
    pub submit: bool,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum IoError {
    /// The mode behind this port cannot do that (`send` in direct mode).
    Unsupported,
    Io(String),
}

/// The screen detector's verdict (terminal mode): what the multiplexer's own
/// agent detection says about the pane, never what the supervisor guessed.
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct Inspection {
    /// `idle`, `working`, `blocked`, `done`, ...; `None` when the detector has no verdict.
    pub state: Option<String>,
    pub visible_blocker: bool,
    pub visible_idle: bool,
    pub visible_working: bool,
    /// Whether a screen rule vouched for the verdict.
    pub matched_rule: bool,
    /// The composer text the matched rule saw, when it saw one.
    pub prompt_text: String,
}

pub trait AgentIo {
    fn send(&mut self, input: &SendInput) -> Result<(), IoError>;
    /// New lines since the previous read.
    fn read(&mut self) -> Result<Vec<String>, IoError>;
    /// Monotonic counter that increments on anything the idle timer counts.
    fn activity(&self) -> Option<u64>;

    /// The whole visible screen right now (terminal mode only).
    fn screen(&mut self) -> Result<String, IoError> {
        Err(IoError::Unsupported)
    }

    /// The detector's verdict for the pane (terminal mode only).
    fn inspect(&mut self) -> Result<Inspection, IoError> {
        Err(IoError::Unsupported)
    }

    /// Monotonic milliseconds; every wait in an adapter is measured on this clock.
    fn now_ms(&self) -> u64 {
        monotonic_ms()
    }

    /// Wait; the only way an adapter lets time pass.
    fn pause(&mut self, ms: u64) {
        std::thread::sleep(std::time::Duration::from_millis(ms));
    }
}

fn monotonic_ms() -> u64 {
    use std::sync::OnceLock;
    use std::time::Instant;
    static START: OnceLock<Instant> = OnceLock::new();
    START.get_or_init(Instant::now).elapsed().as_millis() as u64
}
