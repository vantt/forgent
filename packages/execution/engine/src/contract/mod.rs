//! Execution contract: the contract an assignment runs under, from the inline contract an agent proposes to the
//! effective contract persisted before the worker launches, and the operation prompt templates its brief renders.
//!
//! One door per decision. Write-scope grammar is `fgos-write-scope`'s; canonical JSON bytes are
//! `fgos-canonical-json`'s; the tier names are `fgos-seat-binding`'s; the claim contract id is `run_result::claim`'s;
//! the default seat timeout is `confinement::policy`'s; the Work-checkout facts a mutating dispatch is judged on are
//! the host Git door's, handed in through [`validate::CheckoutFacts`] so this module reads no repository.
//!
//! - [`validate`]: the inline contract validator, the protocol-operation stamp and the mutating-cwd posture.
//! - [`templates`]: operation prompt templates, their discovery over project, domain and core, and their rendering.
//! - [`effective`]: the secret-free effective execution contract, its digest and its summary.
//!
//! Golden vectors: `packages/execution/contracts/execution-contract/`, replayed by `tests/contract.rs`.

pub mod effective;
pub mod templates;
pub mod validate;
