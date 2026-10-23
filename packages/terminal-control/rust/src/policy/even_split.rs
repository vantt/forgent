//! `even-split`: lay a tab out as columns first, as many as keep every column
//! at least `minCols` wide, and stack panes into the shortest column once the
//! columns are used up. It reads the measured width per cell, never a screen
//! ratio. When the request names the batch size (`groupSize`) every split is
//! planned so the final panes are equal; without it each split halves.

use super::{GroupPane, Limits, PlaceInput, Placement, PlacementPolicy};
use crate::driver::{Direction, Rect, TabGeometry};

pub const NAME: &str = "even-split";

pub struct EvenSplit;

impl PlacementPolicy for EvenSplit {
    fn name(&self) -> &'static str {
        NAME
    }

    fn place(&self, input: &PlaceInput) -> Placement {
        let mut tried: Vec<&str> = Vec::new();
        for pane in &input.group_panes {
            if tried.contains(&pane.tab_id.as_str()) {
                continue;
            }
            tried.push(&pane.tab_id);
            let tab = input.tabs.iter().find(|tab| tab.tab_id == pane.tab_id);
            if let Some(placement) = tab.and_then(|tab| place_in_tab(input, tab)) {
                return placement;
            }
        }
        Placement::NewTab {}
    }
}

/// Columns and rows for `count` panes in `area`: the most columns that stay
/// `minCols` wide, then the fewest columns that still fit that many rows.
/// `None` when the rows would be shorter than `minRows`.
fn shape(area: Rect, count: u32, limits: &Limits) -> Option<(u32, u32)> {
    let cols = (1..=count)
        .rev()
        .find(|c| area.width / c >= limits.min_cols)?;
    let rows = count.div_ceil(cols);
    (area.height / rows >= limits.min_rows).then(|| (count.div_ceil(rows), rows))
}

/// True when splitting `rect` so the old pane keeps `1/q` leaves both children
/// at the minimum whichever way herdr rounds the cut: the first child is at
/// least `size / q`, the second at least `size - ceil(size / q)`.
fn fits(direction: Direction, rect: Rect, q: u32, limits: &Limits) -> bool {
    let (size, across, minimum, across_minimum) = match direction {
        Direction::Right => (rect.width, rect.height, limits.min_cols, limits.min_rows),
        Direction::Down => (rect.height, rect.width, limits.min_rows, limits.min_cols),
    };
    size / q >= minimum && size - size.div_ceil(q) >= minimum && across >= across_minimum
}

fn split(anchor: &GroupPane, direction: Direction, q: u32) -> Placement {
    Placement::Split {
        anchor_key: anchor.key.clone(),
        direction,
        ratio: 1.0 / f64::from(q),
    }
}

fn place_in_tab(input: &PlaceInput, tab: &TabGeometry) -> Option<Placement> {
    let limits = &input.limits;
    let held = tab.panes.len() as u32;
    if held >= limits.max_panes_per_tab {
        return None;
    }
    // Panes this tab will hold once the batch is placed, capped to what fits;
    // the next pane must fit or the tab is full.
    let live = input.group_panes.len() as u32;
    let coming = input
        .request
        .group_size
        .map_or(1, |size| size.saturating_sub(live).max(1));
    let wanted = (held + coming).min(limits.max_panes_per_tab);
    let (total, (cols, _)) = (held + 1..=wanted)
        .rev()
        .find_map(|count| shape(tab.area, count, limits).map(|found| (count, found)))?;
    let equal = input.request.group_size.is_some();

    let group: Vec<&GroupPane> = input
        .group_panes
        .iter()
        .filter(|pane| pane.tab_id == tab.tab_id)
        .collect();
    let mut lefts: Vec<u32> = tab.panes.iter().map(|pane| pane.rect.x).collect();
    lefts.sort_unstable();
    lefts.dedup();
    let existing = lefts.len() as u32;

    // A column is still missing: open it beside the last one.
    if existing < cols {
        let q = if equal { cols - existing + 1 } else { 2 };
        let anchor = group
            .iter()
            .max_by_key(|pane| (pane.rect.x, pane.rect.height))
            .filter(|pane| fits(Direction::Right, pane.rect, q, limits));
        if let Some(anchor) = anchor {
            return Some(split(anchor, Direction::Right, q));
        }
    }

    // Otherwise stack into the shortest column, splitting its largest pane.
    let panes_at = |left: u32| tab.panes.iter().filter(|pane| pane.rect.x == left).count() as u32;
    let mut columns: Vec<(usize, u32)> = lefts.iter().copied().enumerate().collect();
    columns.sort_by_key(|&(_, left)| panes_at(left));
    for (index, left) in columns {
        let share = total / cols + u32::from((index as u32) < total % cols);
        let q = if equal {
            (share + 1).saturating_sub(panes_at(left)).max(2)
        } else {
            2
        };
        let anchor = group
            .iter()
            .filter(|pane| pane.rect.x == left)
            .max_by_key(|pane| (pane.rect.height, pane.rect.y))
            .filter(|pane| fits(Direction::Down, pane.rect, q, limits));
        if let Some(anchor) = anchor {
            return Some(split(anchor, Direction::Down, q));
        }
    }
    None
}
