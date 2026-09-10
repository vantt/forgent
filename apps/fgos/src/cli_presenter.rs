//! CLI presenter for `apps/fgos`.
//!
//! Formats native kernel outcomes and errors for presentation to stdout/stderr.

use fgos_host_runtime::{ProviderError, ProviderOutcome};

/// Presents a provider invocation failure on stderr and returns the process exit code.
pub fn present_error(err: &ProviderError) -> i32 {
    match err {
        ProviderError::NoBinding(refuse) => {
            eprintln!("fgos: error: selection refused (no binding): {}", refuse);
            1
        }
        ProviderError::CallerAdmissionDenied(refuse) => {
            eprintln!("fgos: error: admission refused: {}", refuse);
            1
        }
        ProviderError::SelectedProviderCapabilityDenied(refuse) => {
            eprintln!("fgos: error: grant refused: {}", refuse);
            1
        }
        _ => {
            eprintln!("fgos: error: invocation failed: {}", err);
            1
        }
    }
}

/// Presents a successful provider outcome and returns the process exit code.
pub fn present_outcome(_outcome: &ProviderOutcome) -> i32 {
    0
}
