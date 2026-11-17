//! The Terminal Control surface the terminal adapter needs, by key. `Core` is the real one; a test
//! gives a fake. Nothing here decides: every method is one core operation.

use fgos_terminal_control::core::{Core, Want};
use fgos_terminal_control::port::{
    AllocateRequest, Allocation, Disposition, Inspection, LaunchOutcome, LaunchSpec, Refusal,
    ReleaseOutcome, SendOutcome,
};

pub trait Panes {
    fn allocate(&self, request: &AllocateRequest) -> Result<Allocation, Refusal>;
    fn launch(&self, key: &str, spec: &LaunchSpec) -> Result<LaunchOutcome, Refusal>;
    fn send(
        &self,
        key: &str,
        text: Option<&str>,
        keys: Option<&[String]>,
        submit: bool,
    ) -> Result<SendOutcome, Refusal>;
    fn read(&self, key: &str, source: Option<&str>) -> Result<String, Refusal>;
    fn inspect(&self, key: &str, want: Want) -> Inspection;
    fn focus(&self, key: &str) -> Result<(), Refusal>;
    fn release(&self, key: &str, disposition: Disposition) -> Result<ReleaseOutcome, Refusal>;
}

impl Panes for Core<'_> {
    fn allocate(&self, request: &AllocateRequest) -> Result<Allocation, Refusal> {
        Core::allocate(self, request)
    }

    fn launch(&self, key: &str, spec: &LaunchSpec) -> Result<LaunchOutcome, Refusal> {
        Core::launch(self, key, spec)
    }

    fn send(
        &self,
        key: &str,
        text: Option<&str>,
        keys: Option<&[String]>,
        submit: bool,
    ) -> Result<SendOutcome, Refusal> {
        Core::send(self, key, text, keys, submit)
    }

    fn read(&self, key: &str, source: Option<&str>) -> Result<String, Refusal> {
        Core::read(self, key, None, source)
    }

    fn inspect(&self, key: &str, want: Want) -> Inspection {
        Core::inspect_parts(self, key, want)
    }

    fn focus(&self, key: &str) -> Result<(), Refusal> {
        Core::focus(self, key)
    }

    fn release(&self, key: &str, disposition: Disposition) -> Result<ReleaseOutcome, Refusal> {
        Core::release(self, key, disposition, None)
    }
}
