mod common;

use common::{spec_limits, t};
use fgos_mailbox_core::{BoundedCounters, CounterReason};

#[test]
fn the_per_party_counters_keep_at_most_max_keys_entries_and_evict_the_least_recently_bumped_while_the_per_reason_totals_are_never_evicted(
) {
    let limits = spec_limits();
    let max = limits.counters.max_keys as u64;
    let mut counters = BoundedCounters::new();

    for i in 0..max {
        counters.bump(
            CounterReason::NoticeDropped,
            &format!("s{i}"),
            "r",
            t(i),
            &limits,
        );
    }
    // s0 is bumped again, so s1 becomes the least recently bumped.
    counters.bump(CounterReason::NoticeDropped, "s0", "r", t(max), &limits);
    counters.bump(
        CounterReason::NoticeSuppressed,
        "new",
        "r",
        t(max + 1),
        &limits,
    );

    assert_eq!(counters.party_count(), max as usize);
    assert_eq!(
        counters
            .party(CounterReason::NoticeDropped, "s0", "r")
            .map(|p| p.count),
        Some(2)
    );
    assert!(counters
        .party(CounterReason::NoticeDropped, "s1", "r")
        .is_none());
    assert!(counters
        .party(CounterReason::NoticeSuppressed, "new", "r")
        .is_some());
    assert_eq!(counters.total(CounterReason::NoticeDropped), max + 1);
    assert_eq!(counters.total(CounterReason::NoticeSuppressed), 1);
}
