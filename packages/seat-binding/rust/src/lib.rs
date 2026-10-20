//! Seat Binding: the single authority for "which executor, invocation, model,
//! effort, tier and account runs this agent seat, and where it goes on failure".
//!
//! Two pure stages, no I/O, clock, environment or randomness:
//! [`policy`] (ask, config -> tier, ceiling, ordered executors, cells) and
//! [`rank`] (policy, peers, walk, accountView, launchView -> ranked candidates).
//! [`bind`] is `rank(policy(..))` plus an [`explain`] built from the same result.
//! Effective rigor is an input. Contract and shared vectors:
//! `packages/seat-binding/contracts/`.

// A refusal is the error value of both stages and carries its evidence (peers, rendered
// levels, config line); it is built only on the cold refusal path.
#![allow(clippy::result_large_err)]

pub mod explain;
pub mod model;
pub mod policy;
pub mod rank;
pub mod tier;

pub use explain::explain;
pub use model::*;
pub use policy::policy;
pub use rank::rank;
pub use tier::{ladder, Effort, Ladder, Rigor, Tier, TierDefinition, TIER_LADDER};

/// Stage 1 then stage 2, with the explanation of the same result.
pub fn bind(input: &BindInput) -> BindOutput {
    let binding_input = input.binding_input();
    let ask = &input.ask;
    let finish = |policy: Option<Policy>, ranked: Option<Ranked>, refusal: Option<Refusal>| {
        let explain = explain(ask, policy.as_ref(), ranked.as_ref(), refusal.as_ref());
        BindOutput {
            protocol: PROTOCOL,
            ok: refusal.is_none(),
            policy,
            ranked,
            refusal,
            explain,
            binding_input: binding_input.clone(),
        }
    };

    if input.protocol != PROTOCOL {
        return finish(
            None,
            None,
            Some(Refusal::new(
                "protocol-mismatch",
                format!("seat binding speaks protocol {PROTOCOL}, got {}", input.protocol),
            )),
        );
    }
    let policy = match policy(ask, &input.config) {
        Ok(policy) => policy,
        Err(refusal) => return finish(None, None, Some(refusal)),
    };
    let ranked = rank(&policy, &input.peers, &input.walk, &input.account_view, &input.launch_view, input.now);
    let refusal = ranked.refusal.clone();
    finish(Some(policy), Some(ranked), refusal)
}
