//! Replays the scripted pair of the loop test with no model
//! (plans/reports/research-261020-1814-mailbox-real-agent-loop-test.md,
//! "Self-test cặp kịch bản", and its method): two heads always answer
//! "thanks" with wake; one turn advances the clock 20 s; one message per
//! turn. Measured there: the wake quota fires at message 6, chain depth at
//! message 8, the wake lifetime cap at message 101.
mod common;

use common::{plain, t, Pair, A_NAME, B_NAME};
use fgos_mailbox_core::{CounterReason, Limits, Refusal, SendOutcome, WakeDrop};

/// Seconds the simulated clock advances per turn in the measurement.
const TURN_SECS: u64 = 20;

#[derive(Clone, Copy, PartialEq)]
enum Turns {
    /// The recipient gets a turn only when the last message woke it.
    WhenWoken,
    /// Both heads are busy and drain at every step.
    Always,
}

/// Runs the pair until `stop` says so; returns every send's result.
fn replay(
    limits: Limits,
    turns: Turns,
    stop: impl Fn(&Result<SendOutcome, Refusal>) -> bool,
) -> (Pair, Vec<Result<SendOutcome, Refusal>>) {
    let mut pair = Pair::new(t(0));
    pair.limits = limits;
    let mut results: Vec<Result<SendOutcome, Refusal>> = Vec::new();
    for i in 1u64.. {
        if let Some(Ok(last)) = results.last() {
            if turns == Turns::WhenWoken && !last.effective_wake {
                break;
            }
        }
        let now = t(TURN_SECS * (i - 1));
        let (from, to) = if i % 2 == 1 {
            ("a", B_NAME)
        } else {
            ("b", A_NAME)
        };
        pair.deliver(from, now);
        let mut req = plain(from, to, "thanks");
        req.wake = true;
        let result = pair.try_send(req, now);
        let done = stop(&result) || result.is_err();
        results.push(result);
        if done {
            break;
        }
    }
    (pair, results)
}

#[test]
fn with_the_spec_values_a_woken_thanks_loop_loses_its_wake_at_message_6_and_then_stops() {
    let (pair, results) = replay(common::spec_limits(), Turns::WhenWoken, |_| false);

    assert_eq!(results.len(), 6);
    let sent: Vec<&SendOutcome> = results.iter().map(|r| r.as_ref().unwrap()).collect();
    assert!(sent[..5].iter().all(|s| s.effective_wake));
    assert_eq!(sent[5].wake_dropped, Some(WakeDrop::ExchangeQuota));
    assert_eq!(pair.state.counters().total(CounterReason::SessionBudget), 0);
}

#[test]
fn with_the_spec_values_a_busy_thanks_loop_is_refused_for_depth_at_message_8() {
    let (_, results) = replay(common::spec_limits(), Turns::Always, |_| false);

    assert_eq!(results.len(), 8);
    let depths: Vec<u32> = results[..7]
        .iter()
        .map(|r| r.as_ref().unwrap().depth)
        .collect();
    assert_eq!(depths, (0..=6).collect::<Vec<u32>>());
    assert!(
        matches!(results[7], Err(Refusal::TooDeep { .. })),
        "{:?}",
        results[7]
    );
}

#[test]
fn the_wake_lifetime_cap_first_fires_at_message_101() {
    // The measurement's configuration: it did not enforce depth or the
    // exchange quota while counting the lifetime cap, and did not model the
    // loop guard. Ordinary configuration, through the production path.
    let mut limits = common::spec_limits();
    limits.chain.max_depth = u32::MAX;
    limits.wake.max_per_exchange = u32::MAX;
    limits.loop_guard.max_per_window = u32::MAX;

    let (_, results) = replay(
        limits,
        Turns::Always,
        |r| matches!(r, Ok(s) if s.wake_dropped.is_some()),
    );

    assert_eq!(results.len(), 101);
    let sent: Vec<&SendOutcome> = results.iter().map(|r| r.as_ref().unwrap()).collect();
    assert!(sent[..100].iter().all(|s| s.effective_wake));
    assert_eq!(sent[100].wake_dropped, Some(WakeDrop::LifetimeCap));
}
