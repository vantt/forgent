//! Placement policy tests: every geometry fixture under
//! `contracts/policy-fixtures`, a generated-geometry property check, and a
//! comparison with the fixed 0.3 down-split used when no policy runs.

use fgos_terminal_control::driver::{Direction, PaneGeometry, Rect, TabGeometry};
use fgos_terminal_control::policy::{
    policy_by_name, GroupPane, Limits, PlaceInput, PlaceRequest, Placement, PlacementPolicy,
    PolicyError, DEFAULT_POLICY,
};
use serde::Deserialize;
use std::path::PathBuf;

#[derive(Deserialize)]
struct Fixture {
    name: String,
    input: PlaceInput,
    expected: Placement,
}

fn measured_split() -> Box<dyn PlacementPolicy> {
    policy_by_name(None).expect("default policy resolves")
}

fn fixtures() -> Vec<(PathBuf, Fixture)> {
    let dir = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../contracts/policy-fixtures");
    let mut paths: Vec<PathBuf> = std::fs::read_dir(&dir)
        .expect("fixture directory exists")
        .map(|entry| entry.expect("readable entry").path())
        .filter(|path| path.extension().is_some_and(|ext| ext == "json"))
        .collect();
    paths.sort();
    paths
        .into_iter()
        .map(|path| {
            let text = std::fs::read_to_string(&path).expect("readable fixture");
            let fixture: Fixture = serde_json::from_str(&text)
                .unwrap_or_else(|err| panic!("{}: {err}", path.display()));
            (path, fixture)
        })
        .collect()
}

#[test]
fn every_fixture_matches_its_expected_placement() {
    let all = fixtures();
    assert!(
        all.len() >= 12,
        "expected the fixture set, found {}",
        all.len()
    );
    let policy = measured_split();
    for (path, fixture) in &all {
        let stem = path.file_stem().and_then(|s| s.to_str()).unwrap();
        assert_eq!(stem, fixture.name, "fixture name matches its file name");
        assert_eq!(
            policy.place(&fixture.input),
            fixture.expected,
            "fixture {}",
            fixture.name
        );
    }
}

#[test]
fn fixtures_are_the_contract_serialization_of_a_placement() {
    let split = Placement::Split {
        anchor_key: "k".into(),
        direction: Direction::Down,
        ratio: 0.5,
    };
    assert_eq!(
        serde_json::to_value(&split).unwrap(),
        serde_json::json!({"split": {"anchorKey": "k", "direction": "down", "ratio": 0.5}})
    );
    assert_eq!(
        serde_json::to_value(Placement::NewTab {}).unwrap(),
        serde_json::json!({"newTab": {}})
    );
}

#[test]
fn registry_resolves_the_default_and_rejects_unknown_names() {
    assert_eq!(policy_by_name(None).unwrap().name(), DEFAULT_POLICY);
    assert_eq!(
        policy_by_name(Some("measured-split")).unwrap().name(),
        "measured-split"
    );
    let err = policy_by_name(Some("golden-ratio"))
        .err()
        .expect("unknown name");
    assert_eq!(
        err,
        PolicyError::Unknown {
            name: "golden-ratio".into()
        }
    );
    assert!(err.to_string().contains("golden-ratio"));
}

// ---- geometry helpers shared by the property and comparison tests ----

const LIMITS: Limits = Limits {
    min_cols: 80,
    min_rows: 20,
    max_panes_per_tab: 8,
};

fn rect(x: u32, y: u32, width: u32, height: u32) -> Rect {
    Rect {
        x,
        y,
        width,
        height,
    }
}

/// One tab filled by one group; every pane belongs to the group.
struct Sim {
    area: Rect,
    panes: Vec<(String, Rect)>,
}

impl Sim {
    fn new(width: u32, height: u32) -> Self {
        Sim {
            area: rect(0, 0, width, height),
            panes: vec![("k0".into(), rect(0, 0, width, height))],
        }
    }

    fn input(&self, limits: Limits) -> PlaceInput {
        PlaceInput {
            group_key: "g".into(),
            tabs: vec![TabGeometry {
                tab_id: "t".into(),
                area: self.area,
                panes: self
                    .panes
                    .iter()
                    .map(|(key, r)| PaneGeometry {
                        pane_id: format!("p-{key}"),
                        rect: *r,
                        pty: None,
                    })
                    .collect(),
            }],
            group_panes: self
                .panes
                .iter()
                .map(|(key, r)| GroupPane {
                    key: key.clone(),
                    tab_id: "t".into(),
                    pane_id: format!("p-{key}"),
                    rect: *r,
                })
                .collect(),
            request: PlaceRequest {
                label: "w".into(),
            },
            limits,
        }
    }

    /// Split like herdr: `first` keeps `ratio`, rounded up, the new pane gets
    /// the rest (352 -> 176+176, 69 -> 35+34).
    fn apply(&mut self, anchor_key: &str, direction: Direction, ratio: f64) {
        let at = self
            .panes
            .iter()
            .position(|(key, _)| key == anchor_key)
            .expect("anchor exists");
        let old = self.panes[at].1;
        let (first, second) = match direction {
            Direction::Right => {
                let w = (f64::from(old.width) * ratio).ceil() as u32;
                (
                    rect(old.x, old.y, w, old.height),
                    rect(old.x + w, old.y, old.width - w, old.height),
                )
            }
            Direction::Down => {
                let h = (f64::from(old.height) * ratio).ceil() as u32;
                (
                    rect(old.x, old.y, old.width, h),
                    rect(old.x, old.y + h, old.width, old.height - h),
                )
            }
        };
        self.panes[at].1 = first;
        let key = format!("k{}", self.panes.len());
        self.panes.push((key, second));
    }
}

fn assert_covers_minimum(sim: &Sim, limits: Limits) {
    for (key, r) in &sim.panes {
        assert!(
            r.width >= limits.min_cols && r.height >= limits.min_rows,
            "pane {key} is {}x{}",
            r.width,
            r.height
        );
    }
}

/// Small deterministic generator; no external crate.
struct Lcg(u64);

impl Lcg {
    fn next_u64(&mut self) -> u64 {
        self.0 = self
            .0
            .wrapping_mul(6364136223846793005)
            .wrapping_add(1442695040888963407);
        self.0 >> 33
    }

    fn range(&mut self, low: u32, high: u32) -> u32 {
        low + (self.next_u64() % u64::from(high - low + 1)) as u32
    }
}

#[test]
fn property_every_split_keeps_both_children_at_or_above_the_minimum() {
    let policy = measured_split();
    let mut rng = Lcg(0x5eed);
    for _ in 0..2000 {
        let limits = Limits {
            min_cols: rng.range(1, 120),
            min_rows: rng.range(1, 40),
            max_panes_per_tab: rng.range(1, 12),
        };
        let tab_count = rng.range(1, 3);
        let mut tabs = Vec::new();
        let mut group_panes = Vec::new();
        for t in 0..tab_count {
            let area = rect(0, 0, rng.range(1, 500), rng.range(1, 120));
            let pane_count = rng.range(0, 6);
            let mut panes = Vec::new();
            for p in 0..pane_count {
                let r = rect(
                    rng.range(0, area.width),
                    rng.range(0, area.height),
                    rng.range(1, area.width),
                    rng.range(1, area.height),
                );
                let pane_id = format!("p{t}-{p}");
                panes.push(PaneGeometry {
                    pane_id: pane_id.clone(),
                    rect: r,
                    pty: None,
                });
                if !rng.next_u64().is_multiple_of(3) {
                    group_panes.push(GroupPane {
                        key: format!("k{t}-{p}"),
                        tab_id: format!("t{t}"),
                        pane_id,
                        rect: r,
                    });
                }
            }
            tabs.push(TabGeometry {
                tab_id: format!("t{t}"),
                area,
                panes,
            });
        }
        let input = PlaceInput {
            group_key: "g".into(),
            tabs,
            group_panes,
            request: PlaceRequest {
                label: "w".into(),
            },
            limits,
        };
        match policy.place(&input) {
            Placement::Split {
                anchor_key,
                direction,
                ratio,
            } => {
                assert_eq!(ratio, 0.5);
                let anchor = input
                    .group_panes
                    .iter()
                    .find(|g| g.key == anchor_key)
                    .expect("anchorKey names a pane of the group");
                let (a, b) = match direction {
                    Direction::Right => {
                        let first = anchor.rect.width - anchor.rect.width / 2;
                        (first, anchor.rect.width / 2)
                    }
                    Direction::Down => {
                        let first = anchor.rect.height - anchor.rect.height / 2;
                        (first, anchor.rect.height / 2)
                    }
                };
                let (along_min, across, across_min) = match direction {
                    Direction::Right => (limits.min_cols, anchor.rect.height, limits.min_rows),
                    Direction::Down => (limits.min_rows, anchor.rect.width, limits.min_cols),
                };
                assert!(a >= along_min && b >= along_min, "{input:?}");
                assert!(across >= across_min, "{input:?}");
                let held = input
                    .tabs
                    .iter()
                    .find(|t| t.tab_id == anchor.tab_id)
                    .map_or(0, |t| t.panes.len());
                assert!(held < limits.max_panes_per_tab as usize, "{input:?}");
            }
            Placement::NewTab {} => {}
            Placement::Unsupported { reason } => panic!("unexpected unsupported: {reason}"),
        }
    }
}

#[test]
fn property_filling_a_tab_never_leaves_a_pane_below_the_minimum() {
    let policy = measured_split();
    let mut rng = Lcg(0xf111);
    for _ in 0..300 {
        let limits = Limits {
            min_cols: rng.range(10, 100),
            min_rows: rng.range(4, 30),
            max_panes_per_tab: rng.range(2, 12),
        };
        let mut sim = Sim::new(
            rng.range(limits.min_cols, 400),
            rng.range(limits.min_rows, 100),
        );
        loop {
            match policy.place(&sim.input(limits)) {
                Placement::Split {
                    anchor_key,
                    direction,
                    ratio,
                } => sim.apply(&anchor_key, direction, ratio),
                Placement::NewTab {} => break,
                Placement::Unsupported { reason } => panic!("unsupported: {reason}"),
            }
            assert_covers_minimum(&sim, limits);
            assert!(sim.panes.len() <= limits.max_panes_per_tab as usize);
        }
    }
}

#[test]
fn measured_split_fills_352x69_where_the_fixed_down_split_breaks_the_minimum() {
    // Fixed rule used without geometry: split the newest pane down, keeping
    // 0.3 of its height for the old pane. Six workers on a 352x69 tab.
    let mut heights = vec![69u32];
    for _ in 0..5 {
        let newest = heights.pop().unwrap();
        let kept = (f64::from(newest) * 0.3).floor() as u32;
        heights.push(kept);
        heights.push(newest - kept);
    }
    assert_eq!(heights.len(), 6);
    assert!(
        heights.iter().any(|h| *h < LIMITS.min_rows),
        "fixed rule leaves a pane under {} rows: {heights:?}",
        LIMITS.min_rows
    );

    // Measured split fills the same tab and never goes below the minimum.
    let policy = measured_split();
    let mut sim = Sim::new(352, 69);
    let mut placed = 1;
    while let Placement::Split {
        anchor_key,
        direction,
        ratio,
    } = policy.place(&sim.input(LIMITS))
    {
        sim.apply(&anchor_key, direction, ratio);
        placed += 1;
        assert_covers_minimum(&sim, LIMITS);
    }
    assert!(
        placed >= 6,
        "measured split holds at least six workers, got {placed}"
    );
}
