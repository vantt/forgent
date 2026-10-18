//! `measured-split`: keep filling live tabs while every pane stays at least
//! `minCols x minRows`, then open a new tab. Pure and deterministic: it reads
//! only the measured geometry and the limits, never labels or role hints.

use super::{GroupPane, PlaceInput, Placement, PlacementPolicy};
use crate::driver::Direction;

pub const NAME: &str = "measured-split";

/// Both children are measured at an even split; herdr gives the odd cell to
/// the first child, so the smaller child is always `floor(size / 2)`.
const RATIO: f64 = 0.5;

pub struct MeasuredSplit;

/// One way to split one group pane. `score` is the smaller child divided by
/// the minimum along the split axis, kept as a fraction so ties are exact.
struct Candidate<'a> {
    anchor: &'a GroupPane,
    direction: Direction,
    smaller: u64,
    minimum: u64,
}

impl Candidate<'_> {
    /// True when `self` scores strictly higher than `other`.
    fn scores_above(&self, other: &Candidate<'_>) -> bool {
        self.smaller * other.minimum > other.smaller * self.minimum
    }

    fn ties_with(&self, other: &Candidate<'_>) -> bool {
        self.smaller * other.minimum == other.smaller * self.minimum
    }
}

impl PlacementPolicy for MeasuredSplit {
    fn name(&self) -> &'static str {
        NAME
    }

    fn place(&self, input: &PlaceInput) -> Placement {
        let limits = &input.limits;
        let min_cols = u64::from(limits.min_cols);
        let min_rows = u64::from(limits.min_rows);
        let mut best: Option<Candidate<'_>> = None;

        // Order of preference: higher score, then right before down, then the
        // anchor earlier in groupPanes. Visiting in groupPanes order and
        // replacing only on a higher score, or on a tie that moves from down
        // to right, yields exactly that.
        for anchor in &input.group_panes {
            if tab_pane_count(input, &anchor.tab_id) >= limits.max_panes_per_tab as usize {
                continue;
            }
            let width = u64::from(anchor.rect.width);
            let height = u64::from(anchor.rect.height);
            let right = (
                width / 2,
                min_cols,
                width / 2 >= min_cols && height >= min_rows,
            );
            let down = (
                height / 2,
                min_rows,
                height / 2 >= min_rows && width >= min_cols,
            );
            for (direction, (smaller, minimum, fits)) in
                [(Direction::Right, right), (Direction::Down, down)]
            {
                if !fits {
                    continue;
                }
                let candidate = Candidate {
                    anchor,
                    direction,
                    smaller,
                    minimum,
                };
                let better = match &best {
                    None => true,
                    Some(current) => {
                        candidate.scores_above(current)
                            || (candidate.ties_with(current)
                                && candidate.direction == Direction::Right
                                && current.direction == Direction::Down)
                    }
                };
                if better {
                    best = Some(candidate);
                }
            }
        }

        match best {
            Some(chosen) => Placement::Split {
                anchor_key: chosen.anchor.key.clone(),
                direction: chosen.direction,
                ratio: RATIO,
            },
            None => Placement::NewTab {},
        }
    }
}

/// Panes the tab holds in its measured geometry, every owner included.
fn tab_pane_count(input: &PlaceInput, tab_id: &str) -> usize {
    input
        .tabs
        .iter()
        .find(|tab| tab.tab_id == tab_id)
        .map_or(0, |tab| tab.panes.len())
}
