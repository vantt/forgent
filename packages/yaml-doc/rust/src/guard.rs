//! Panic guard for every public entry point. A panic inside the parser or this crate becomes a
//! named refusal (`yaml-internal-error`) instead of unwinding into the caller: in a synchronous
//! N-API call a panic aborts the Node process (spec section 10). A stack overflow cannot be caught,
//! which is why the pre-scan bounds depth before the parser runs.

use std::panic::{catch_unwind, AssertUnwindSafe};

use crate::model::{rule, Refusal};

/// Runs `f`; a panic inside it comes back as `yaml-internal-error`.
pub fn guard<T>(f: impl FnOnce() -> Result<T, Refusal>) -> Result<T, Refusal> {
    catch_unwind(AssertUnwindSafe(f)).unwrap_or_else(|_| {
        Err(Refusal::new(rule::YAML_INTERNAL_ERROR)
            .with_detail("a panic was caught at the public boundary"))
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn a_panic_inside_the_closure_becomes_yaml_internal_error() {
        let refusal = guard::<()>(|| panic!("secret-value-from-input")).unwrap_err();
        assert_eq!(refusal.rule, rule::YAML_INTERNAL_ERROR);
        assert!(!refusal.to_string().contains("secret-value-from-input"));
    }

    #[test]
    fn a_result_passes_through_unchanged() {
        assert_eq!(guard(|| Ok(7)), Ok(7));
        let refusal = Refusal::new(rule::SYNTAX_ERROR).at(1, 2);
        assert_eq!(guard::<()>(|| Err(refusal.clone())), Err(refusal));
    }
}
