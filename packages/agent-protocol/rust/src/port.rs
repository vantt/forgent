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

pub trait AgentIo {
    fn send(&mut self, input: &SendInput) -> Result<(), IoError>;
    /// New lines since the previous read.
    fn read(&mut self) -> Result<Vec<String>, IoError>;
    /// Monotonic counter that increments on anything the idle timer counts.
    fn activity(&self) -> Option<u64>;
}
