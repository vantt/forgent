mod common;
use common::*;
use fgos_terminal_control::core::Core;
use fgos_terminal_control::driver::{Direction, CAPABILITIES};
use fgos_terminal_control::policy::{PlaceInput, Placement, PlacementPolicy};
use fgos_terminal_control::policy::measured_split::MeasuredSplit;
use fgos_terminal_control::port::*;

#[test]
fn same_group_shares_a_tab_and_other_groups_do_not() {
    let driver = MemDriver::new(352, 69);
    let core = core(&driver, &MeasuredSplit, state_dir("group"));
    let a1 = core.allocate(&request("a1", "g1")).unwrap();
    let a2 = core.allocate(&request("a2", "g1")).unwrap();
    let b1 = core.allocate(&request("b1", "g2")).unwrap();
    assert_eq!(a1.slot.tab_id, a2.slot.tab_id);
    assert_ne!(a1.slot.pane_id, a2.slot.pane_id);
    assert_ne!(a1.slot.tab_id, b1.slot.tab_id);
    assert_eq!(driver.tab_count(), 2);
}

#[test]
fn a_new_tab_uses_its_own_first_pane_and_leaves_no_empty_root() {
    let driver = MemDriver::new(352, 69);
    let core = core(&driver, &MeasuredSplit, state_dir("root-pane"));
    let slot = core.allocate(&request("a", "g")).unwrap().slot;
    assert_eq!(driver.pane_count(), 1);
    assert_eq!(driver.tab_of(&slot.pane_id), slot.tab_id);
    assert!(driver.calls("pane.split").is_empty());
    assert!(driver.calls("pane.close").is_empty());
}

#[test]
fn a_closed_anchor_continues_the_group_in_a_new_tab_with_the_same_label() {
    let driver = MemDriver::new(352, 69);
    let core = core(&driver, &MeasuredSplit, state_dir("dead-anchor"));
    let first = core.allocate(&request("a", "g")).unwrap().slot;
    driver.kill_pane(&first.pane_id);
    let next = core.allocate(&request("b", "g")).unwrap().slot;
    assert_ne!(next.tab_id, first.tab_id);
    let labels: Vec<_> = driver.tabs.borrow().iter().map(|t| t.1.clone()).collect();
    assert_eq!(labels, vec!["label-g", "label-g"]);
}

#[test]
fn a_pane_released_while_the_group_is_measured_does_not_stop_the_allocation() {
    let driver = MemDriver::new(352, 69);
    let core = core(&driver, &MeasuredSplit, state_dir("vanish-while-measured"));
    let a = core.allocate(&request("a", "g")).unwrap().slot;
    let b = core.allocate(&request("b", "g")).unwrap().slot;
    // Another process closes `a` after the group was found live and before its geometry is read.
    *driver.vanish_on_layout.borrow_mut() = Some(a.pane_id.clone());
    let c = core.allocate(&request("c", "g")).expect("a vanished pane is no error");
    assert!(driver.panes.borrow().contains_key(&c.slot.pane_id));
    let anchor = driver.calls("pane.split").last().cloned().unwrap_or_default();
    assert!(!anchor.contains(&a.pane_id), "no split starts from the vanished pane: {anchor}");
    assert!(driver.panes.borrow().contains_key(&b.pane_id));
}

#[test]
fn every_pane_of_the_group_vanishing_while_it_is_measured_continues_in_a_new_tab() {
    let driver = MemDriver::new(352, 69);
    let core = core(&driver, &MeasuredSplit, state_dir("all-vanish-while-measured"));
    let a = core.allocate(&request("a", "g")).unwrap().slot;
    *driver.vanish_on_layout.borrow_mut() = Some(a.pane_id.clone());
    let b = core.allocate(&request("b", "g")).expect("a vanished pane is no error").slot;
    assert_ne!(b.tab_id, a.tab_id);
    let labels: Vec<_> = driver.tabs.borrow().iter().map(|t| t.1.clone()).collect();
    assert_eq!(labels, vec!["label-g", "label-g"]);
}

#[test]
fn release_close_closes_only_its_own_pane_and_never_a_tab() {
    let driver = MemDriver::new(352, 69);
    let core = core(&driver, &MeasuredSplit, state_dir("release"));
    let a = core.allocate(&request("a", "g")).unwrap().slot;
    let b = core.allocate(&request("b", "g")).unwrap().slot;
    let out = core.release("a", Disposition::Close, None).unwrap();
    assert_eq!(out, ReleaseOutcome::Released { disposition: Disposition::Close });
    assert_eq!(driver.calls("pane.close"), vec![format!("pane.close {}", a.pane_id)]);
    assert!(driver.panes.borrow().contains_key(&b.pane_id));
    assert!(driver.log.borrow().iter().all(|l| !l.contains("tab.close")));
    // releasing again is idempotent and closes nothing more
    core.release("a", Disposition::Close, None).unwrap();
    assert_eq!(driver.calls("pane.close").len(), 1);
}

#[test]
fn allocate_is_idempotent_per_key() {
    let driver = MemDriver::new(352, 69);
    let core = core(&driver, &MeasuredSplit, state_dir("idempotent"));
    core.allocate(&request("a", "g")).unwrap();
    let first = core.allocate(&request("b", "g")).unwrap();
    let again = core.allocate(&request("b", "g")).unwrap();
    assert_eq!(first, again);
    assert_eq!(driver.pane_count(), 2);
    assert_eq!(driver.calls("pane.split").len(), 1);
}

#[test]
fn the_policy_opens_a_new_tab_when_no_split_keeps_the_minimum() {
    // 100x20: any split is below 60x15, so measured-split chooses a new tab.
    let driver = MemDriver::new(100, 20);
    let core = core(&driver, &MeasuredSplit, state_dir("below-min-policy"));
    let first = core.allocate(&request("a", "g")).unwrap().slot;
    let second = core.allocate(&request("b", "g")).unwrap().slot;
    assert_ne!(first.tab_id, second.tab_id);
    assert!(driver.calls("pane.split").is_empty());
    assert!(driver.calls("pane.close").is_empty());
}

/// A policy that always splits, so the core's own re-measure is what protects
/// the minimum.
struct AlwaysSplit;
impl PlacementPolicy for AlwaysSplit {
    fn name(&self) -> &'static str {
        "always-split"
    }
    fn place(&self, input: &PlaceInput) -> Placement {
        Placement::Split {
            anchor_key: input.group_panes[0].key.clone(),
            direction: Direction::Right,
            ratio: 0.5,
        }
    }
}

#[test]
fn a_split_measured_below_the_minimum_is_closed_and_a_new_tab_opens() {
    let driver = MemDriver::new(100, 20);
    let core = Core::new(&driver, &AlwaysSplit, config(state_dir("below-min-remeasure")));
    let first = core.allocate(&request("a", "g")).unwrap().slot;
    let second = core.allocate(&request("b", "g")).unwrap().slot;
    assert_ne!(first.tab_id, second.tab_id);
    assert_eq!(driver.pane_count(), 2, "the empty pane the split made is gone");
    assert_eq!(driver.tab_count(), 2);
    assert_eq!(driver.calls("pane.split").len(), 1);
    assert_eq!(driver.calls("pane.close").len(), 1);
    assert!(driver.log.borrow().iter().all(|l| !l.contains("tab.close")));
    for pane in driver.panes.borrow().values() {
        assert!(pane.rect.width >= 60 && pane.rect.height >= 15, "{:?}", pane.rect);
    }
}

#[test]
fn without_geometry_the_newest_pane_splits_down_and_the_tab_fills_by_count() {
    let caps: Vec<_> = CAPABILITIES.iter().copied().filter(|c| *c != "layout.geometry").collect();
    let driver = MemDriver::with_caps(352, 69, caps);
    let core = core(&driver, &MeasuredSplit, state_dir("no-geometry"));
    let mut tabs = std::collections::BTreeSet::new();
    for i in 0..5 {
        tabs.insert(core.allocate(&request(&format!("k{i}"), "g")).unwrap().slot.tab_id);
    }
    // maxPanesPerTab is 4: the fifth pane opens a second tab.
    assert_eq!(tabs.len(), 2);
    let splits = driver.calls("pane.split");
    assert_eq!(splits.len(), 3);
    assert!(splits.iter().all(|s| s.contains("Down 0.3")), "{splits:?}");
}

#[test]
fn a_driver_without_the_capability_is_unsupported() {
    let driver = MemDriver::with_caps(352, 69, vec![]);
    let core = core(&driver, &MeasuredSplit, state_dir("unsupported"));
    assert!(matches!(core.allocate(&request("a", "g")), Err(Refusal::Unsupported { .. })));
}

#[test]
fn invalid_keys_are_refused() {
    let driver = MemDriver::new(352, 69);
    let core = core(&driver, &MeasuredSplit, state_dir("keys"));
    for key in ["", "../x", "a/b", "a.launched", "-a"] {
        assert!(core.allocate(&request(key, "g")).is_err(), "{key}");
    }
}

#[test]
fn the_core_never_reads_labels_or_lists_to_decide() {
    let source = include_str!("../src/core.rs");
    for forbidden in ["pane list", "tab list", "tab_list", "pane_list", "list_panes", ".display.label ==", "label =="] {
        assert!(!source.contains(forbidden), "core.rs must not use `{forbidden}`");
    }
    assert!(!source.contains("cfg(target_os"), "core has no OS branches");
}

#[test]
fn attach_records_the_pane_and_release_never_closes_it() {
    let driver = MemDriver::new(352, 69);
    let core = core(&driver, &MeasuredSplit, state_dir("attach"));
    let own = core.allocate(&request("own", "g")).unwrap().slot;
    let attached = core.attach("att", &own.pane_id, None, None).unwrap();
    assert_eq!(attached.origin, Origin::Attached);
    let out = core.release("att", Disposition::Close, None).unwrap();
    assert_eq!(out, ReleaseOutcome::Released { disposition: Disposition::Close });
    assert!(driver.calls("pane.close").is_empty());
    assert!(driver.panes.borrow().contains_key(&own.pane_id));
}

#[test]
fn a_caller_closes_its_own_attached_pane_and_no_other() {
    let driver = MemDriver::new(352, 69);
    let core = core(&driver, &MeasuredSplit, state_dir("attach-close-own"));
    let mine = core.allocate(&request("mine", "g")).unwrap().slot;
    let other = core.allocate(&request("other", "g")).unwrap().slot;
    core.attach("att-mine", &mine.pane_id, None, None).unwrap();
    core.attach("att-other", &other.pane_id, None, None).unwrap();

    // Naming a different pane as the caller's own, or none, never closes.
    core.release_as("att-other", Disposition::Close, None, Some(&mine.pane_id)).unwrap();
    assert!(driver.calls("pane.close").is_empty());

    let out = core.release_as("att-mine", Disposition::Close, None, Some(&mine.pane_id)).unwrap();
    assert_eq!(out, ReleaseOutcome::Released { disposition: Disposition::Close });
    assert_eq!(driver.calls("pane.close").len(), 1);
    assert!(!driver.panes.borrow().contains_key(&mine.pane_id));
    assert!(driver.panes.borrow().contains_key(&other.pane_id));
}

#[test]
fn cwd_and_env_reach_the_driver_for_a_new_tab_and_for_a_split() {
    let driver = MemDriver::new(352, 69);
    let core = core(&driver, &MeasuredSplit, state_dir("spawn-env"));
    let mut first = request("a", "g");
    first.cwd = Some("/work".into());
    first.env.insert("K".into(), "v".into());
    core.allocate(&first).unwrap();
    let mut second = request("b", "g");
    second.cwd = Some("/other".into());
    core.allocate(&second).unwrap();
    assert!(driver.calls("tab.create")[0].contains("cwd=/work env=1"));
    assert!(driver.calls("pane.split")[0].contains("cwd=/other env=0"));
}

#[test]
fn an_attached_pane_joins_the_group_it_names_and_the_next_pane_opens_beside_it() {
    let driver = MemDriver::new(352, 69);
    let core = core(&driver, &MeasuredSplit, state_dir("attach-group"));
    let own = core.allocate(&request("own", "other")).unwrap().slot;
    let attached = core.attach("anchor", &own.pane_id, Some("batch"), None).unwrap();
    assert_eq!(attached.origin, Origin::Attached);
    let next = core.allocate(&request("seat", "batch")).unwrap().slot;
    assert_eq!(next.tab_id, own.tab_id, "the batch continues in the tab of its attached pane");
    assert_eq!(driver.tab_count(), 1);
    assert_eq!(driver.calls("pane.split").len(), 1);
}
