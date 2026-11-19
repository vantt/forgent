//! Which executors filled which seat in one unit run: pure bookkeeping, no I/O. `independentOf` names seats;
//! Seat Binding compares provider families, so a seat id has to be turned into the executor(s) that filled it
//! before it can exclude anything. A seat not bound yet stays an id and excludes nothing. The serialising of
//! binds and the barrier's waiting belong to the engine; this is the state they read.

use std::collections::BTreeMap;

/// Executors bound to each seat, and which seats must differ from a seat. Insertion order is kept.
#[derive(Debug, Default, Clone)]
pub struct SeatLedger {
    executors_by_seat: Vec<(String, Vec<String>)>,
    dependents_by_seat: Vec<(String, Vec<String>)>,
}

fn entry<'a>(list: &'a mut Vec<(String, Vec<String>)>, key: &str) -> &'a mut Vec<String> {
    if let Some(i) = list.iter().position(|(k, _)| k == key) {
        return &mut list[i].1;
    }
    list.push((key.to_string(), Vec::new()));
    &mut list.last_mut().expect("just pushed").1
}

fn lookup<'a>(list: &'a [(String, Vec<String>)], key: &str) -> Option<&'a Vec<String>> {
    list.iter().find(|(k, _)| k == key).map(|(_, v)| v)
}

impl SeatLedger {
    pub fn new() -> Self {
        Self::default()
    }

    /// `seat` must differ from each seat of `independent_of` (independence is symmetric).
    pub fn note_dependence(&mut self, seat: &str, independent_of: &[String]) {
        for id in independent_of {
            let list = entry(&mut self.dependents_by_seat, id);
            if !list.iter().any(|s| s == seat) {
                list.push(seat.to_string());
            }
        }
    }

    /// The executors of every seat bound earlier that must differ from `seat`.
    pub fn dependent_executors(&self, seat: &str) -> Vec<String> {
        lookup(&self.dependents_by_seat, seat)
            .into_iter()
            .flatten()
            .flat_map(|dep| {
                lookup(&self.executors_by_seat, dep)
                    .cloned()
                    .unwrap_or_default()
            })
            .collect()
    }

    /// Record that `executor` filled `seat`; an empty executor is ignored.
    pub fn note(&mut self, seat: &str, executor: &str) {
        if executor.is_empty() {
            return;
        }
        let list = entry(&mut self.executors_by_seat, seat);
        if !list.iter().any(|e| e == executor) {
            list.push(executor.to_string());
        }
    }

    /// The `(seat, executor)` pairs of the given seats, for a soft preference.
    pub fn seats(&self, ids: &[String]) -> Vec<(String, String)> {
        ids.iter()
            .flat_map(|id| {
                lookup(&self.executors_by_seat, id)
                    .into_iter()
                    .flatten()
                    .map(|e| (id.clone(), e.clone()))
            })
            .collect()
    }

    /// Each seat id as the executors that filled it; a seat not bound yet stays its id.
    pub fn resolve(&self, ids: &[String]) -> Vec<String> {
        ids.iter()
            .flat_map(|id| match lookup(&self.executors_by_seat, id) {
                Some(list) => list.clone(),
                None => vec![id.clone()],
            })
            .collect()
    }

    /// The seat-to-executors table as the ledger holds it.
    pub fn table(&self) -> BTreeMap<String, Vec<String>> {
        self.executors_by_seat.iter().cloned().collect()
    }
}

/// A group of `size` seats started together: each calls [`BindBarrier::arrive`] once bound (or ended without
/// binding); the group may launch when [`BindBarrier::released`] is true. The seats' panes are laid out as
/// `size` equal parts.
#[derive(Debug, Clone)]
pub struct BindBarrier {
    pub size: usize,
    pending: usize,
}

impl BindBarrier {
    pub fn new(size: usize) -> Self {
        BindBarrier {
            size,
            pending: size,
        }
    }

    pub fn arrive(&mut self) {
        self.pending = self.pending.saturating_sub(1);
    }

    pub fn released(&self) -> bool {
        self.pending == 0
    }
}
