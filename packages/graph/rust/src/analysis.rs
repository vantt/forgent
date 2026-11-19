//! The algorithms. Everything is iterative and linear apart from the sorts that fix the output order.

use std::collections::{HashMap, VecDeque};

use crate::input::{Graph, Refusal, EDGE_KINDS};
use crate::output::{
    Analysis, CriticalPath, CycleEntry, CycleStep, DeferralEntry, DeferralReason, Edge, Group,
    Groups, Layer,
};

/// Adjacency of the ordering edges: `(neighbour, kind)` in link input order.
type Adjacency = Vec<Vec<(usize, usize)>>;

impl Graph {
    /// Compute every fact about the graph.
    pub fn analyze(&self) -> Analysis {
        let (waits_for, waited_on_by) = self.ordering_adjacency();
        let cycles = self.cycles(&waits_for, &waited_on_by);
        let (layers, deferrals, critical_path) = if cycles.is_empty() {
            let order = self.topological_order(&waits_for, &waited_on_by);
            let earliest = self.earliest_layers(&order, &waits_for, &waited_on_by);
            let (layers, deferrals) =
                self.layers_under_exclusions(&earliest, &waits_for, &waited_on_by);
            (
                Some(layers),
                Some(deferrals),
                Some(self.critical_path(&order, &waits_for)),
            )
        } else {
            (None, None, None)
        };
        Analysis {
            cycles,
            dangling: self.dangling.clone(),
            layers,
            deferrals,
            critical_path,
            groups: self.groups(),
        }
    }

    /// The shortest cycle through `id`, canonical by the same rule as the cycle report, or `None` when `id` is
    /// on no cycle. Each call costs O(V+E): it builds the ordering adjacency of the whole graph, then searches only
    /// what is reachable from `id`.
    pub fn cycle_through(&self, id: &str) -> Result<Option<Vec<CycleStep>>, Refusal> {
        let root = *self.index.get(id).ok_or(Refusal {
            code: "cycle-through-unknown-id",
            field: "id".into(),
            index: None,
        })?;
        let (waits_for, waited_on_by) = self.ordering_adjacency();
        // The component of `root` is what is reachable from it and reaches it: restrict the backward search to
        // the forward-reachable set, so nothing outside the component is explored for long.
        let mut reach = vec![root];
        let mut seen: std::collections::HashSet<usize> = [root].into();
        let mut head = 0;
        while head < reach.len() {
            let u = reach[head];
            head += 1;
            for &(v, _) in &waits_for[u] {
                if seen.insert(v) {
                    reach.push(v);
                }
            }
        }
        Ok(self.shortest_cycle(root, &|v| seen.contains(&v), &waits_for, &waited_on_by))
    }

    fn ordering_adjacency(&self) -> (Adjacency, Adjacency) {
        let n = self.ids.len();
        let mut waits_for: Adjacency = vec![Vec::new(); n];
        let mut waited_on_by: Adjacency = vec![Vec::new(); n];
        for link in self.links.iter().filter(|l| EDGE_KINDS[l.kind].1) {
            waits_for[link.from].push((link.to, link.kind));
            waited_on_by[link.to].push((link.from, link.kind));
        }
        (waits_for, waited_on_by)
    }

    // ---- cycles -----------------------------------------------------------------------------------------

    fn cycles(&self, waits_for: &Adjacency, waited_on_by: &Adjacency) -> Vec<CycleEntry> {
        let (component, count) = strongly_connected(waits_for);
        let mut members: Vec<Vec<usize>> = vec![Vec::new(); count];
        for (node, &c) in component.iter().enumerate() {
            members[c].push(node);
        }
        // One pass over the links gives every component its induced ordering edges.
        let mut induced: Vec<Vec<Edge>> = vec![Vec::new(); count];
        for l in self.links.iter().filter(|l| EDGE_KINDS[l.kind].1) {
            if component[l.from] == component[l.to] {
                induced[component[l.from]].push(Edge {
                    from: self.ids[l.from].clone(),
                    to: self.ids[l.to].clone(),
                    kind: EDGE_KINDS[l.kind].0.into(),
                });
            }
        }
        let mut entries = Vec::new();
        for (comp, mut nodes) in members.into_iter().enumerate() {
            let self_edge =
                nodes.len() == 1 && waits_for[nodes[0]].iter().any(|&(to, _)| to == nodes[0]);
            if nodes.len() < 2 && !self_edge {
                continue;
            }
            nodes.sort_by(|&a, &b| self.ids[a].cmp(&self.ids[b]));
            let root = nodes[0];
            let cycle = self
                .shortest_cycle(root, &|v| component[v] == comp, waits_for, waited_on_by)
                .expect("a non-trivial component has a cycle through each member");
            let mut edges = std::mem::take(&mut induced[comp]);
            edges.sort_by(|a, b| (&a.from, &a.to, &a.kind).cmp(&(&b.from, &b.to, &b.kind)));
            entries.push(CycleEntry {
                members: nodes.iter().map(|&v| self.ids[v].clone()).collect(),
                edges,
                cycle: cycle.iter().map(|s| s.id.clone()).collect(),
                cycle_kinds: cycle.iter().map(|s| s.kind.clone()).collect(),
            });
        }
        entries.sort_by(|a, b| a.members[0].cmp(&b.members[0]));
        entries
    }

    /// Distances back to `root` by breadth-first search over the reversed edges, then a greedy walk that takes
    /// the smallest successor id staying on a shortest path (see spec section 5).
    fn shortest_cycle(
        &self,
        root: usize,
        allow: &dyn Fn(usize) -> bool,
        waits_for: &Adjacency,
        waited_on_by: &Adjacency,
    ) -> Option<Vec<CycleStep>> {
        let mut dist: HashMap<usize, usize> = HashMap::from([(root, 0)]);
        let mut queue = VecDeque::from([root]);
        while let Some(u) = queue.pop_front() {
            let d = dist[&u];
            for &(p, _) in &waited_on_by[u] {
                if allow(p) && !dist.contains_key(&p) {
                    dist.insert(p, d + 1);
                    queue.push_back(p);
                }
            }
        }
        let mut steps = Vec::new();
        let mut current = root;
        loop {
            let want = if current == root {
                waits_for[current]
                    .iter()
                    .filter(|&&(s, _)| allow(s))
                    .filter_map(|&(s, _)| dist.get(&s))
                    .min()
                    .copied()?
            } else {
                dist[&current] - 1
            };
            let next = waits_for[current]
                .iter()
                .filter(|&&(s, _)| allow(s) && dist.get(&s) == Some(&want))
                .map(|&(s, _)| s)
                .min_by(|&a, &b| self.ids[a].cmp(&self.ids[b]))?;
            // Several edges may join the same two nodes: the first declared one names the step.
            let kind = waits_for[current]
                .iter()
                .find(|&&(s, _)| s == next)
                .map(|&(_, k)| EDGE_KINDS[k].0)
                .expect("the successor was found among these edges");
            steps.push(CycleStep {
                id: self.ids[current].clone(),
                kind: kind.into(),
            });
            current = next;
            if current == root {
                return Some(steps);
            }
        }
    }

    // ---- layers -----------------------------------------------------------------------------------------

    /// Dependencies first. Only called on an acyclic graph.
    fn topological_order(&self, waits_for: &Adjacency, waited_on_by: &Adjacency) -> Vec<usize> {
        let mut remaining: Vec<usize> = waits_for.iter().map(Vec::len).collect();
        let mut order: Vec<usize> = (0..self.ids.len()).filter(|&v| remaining[v] == 0).collect();
        let mut head = 0;
        while head < order.len() {
            let u = order[head];
            head += 1;
            for &(p, _) in &waited_on_by[u] {
                remaining[p] -= 1;
                if remaining[p] == 0 {
                    order.push(p);
                }
            }
        }
        order
    }

    fn earliest_layers(
        &self,
        order: &[usize],
        waits_for: &Adjacency,
        _waited_on_by: &Adjacency,
    ) -> Vec<usize> {
        let mut earliest = vec![0; self.ids.len()];
        for &v in order {
            earliest[v] = waits_for[v]
                .iter()
                .map(|&(d, _)| earliest[d] + 1)
                .max()
                .unwrap_or(0);
        }
        earliest
    }

    fn layers_under_exclusions(
        &self,
        earliest: &[usize],
        waits_for: &Adjacency,
        waited_on_by: &Adjacency,
    ) -> (Vec<Layer>, Vec<DeferralEntry>) {
        let n = self.ids.len();
        let mut excluded: Vec<Vec<usize>> = vec![Vec::new(); n];
        for &(a, b) in &self.exclusions {
            excluded[a].push(b);
            excluded[b].push(a);
        }
        let mut remaining: Vec<usize> = waits_for.iter().map(Vec::len).collect();
        let mut ready: Vec<usize> = (0..n).filter(|&v| remaining[v] == 0).collect();
        let mut placed_at: Vec<Option<usize>> = vec![None; n];
        // The first node placed in a layer that is excluded with this one, stamped with that layer.
        let mut held_by: Vec<Option<(usize, usize)>> = vec![None; n]; // (layer, partner)
        let mut reasons: Vec<Vec<DeferralReason>> = vec![Vec::new(); n];
        let mut layers = Vec::new();
        while !ready.is_empty() {
            let layer = layers.len();
            ready.sort_by_key(|&v| self.rank[v]);
            let mut here: Vec<usize> = Vec::new();
            let mut deferred = Vec::new();
            for &v in &ready {
                match held_by[v].filter(|&(l, _)| l == layer) {
                    Some((_, partner)) => {
                        reasons[v].push(DeferralReason {
                            layer,
                            partner: self.ids[partner].clone(),
                        });
                        deferred.push(v);
                    }
                    None => {
                        placed_at[v] = Some(layer);
                        here.push(v);
                        for &p in &excluded[v] {
                            if held_by[p].is_none_or(|(l, _)| l != layer) {
                                held_by[p] = Some((layer, v));
                            }
                        }
                    }
                }
            }
            let mut next = deferred;
            for &u in &here {
                for &(p, _) in &waited_on_by[u] {
                    remaining[p] -= 1;
                    if remaining[p] == 0 {
                        next.push(p);
                    }
                }
            }
            layers.push(Layer {
                index: layer,
                nodes: here.iter().map(|&v| self.ids[v].clone()).collect(),
            });
            ready = next;
        }
        let deferrals = (0..n)
            .filter_map(|v| {
                let at = placed_at[v].expect("an acyclic graph places every node");
                (at > earliest[v]).then(|| DeferralEntry {
                    node: self.ids[v].clone(),
                    earliest: earliest[v],
                    placed_at: at,
                    reasons: std::mem::take(&mut reasons[v]),
                })
            })
            .collect();
        (layers, deferrals)
    }

    // ---- critical path and groups -------------------------------------------------------------------------

    fn critical_path(&self, order: &[usize], waits_for: &Adjacency) -> CriticalPath {
        let n = self.ids.len();
        let mut depth = vec![1usize; n];
        let mut via: Vec<Option<usize>> = vec![None; n];
        for &v in order {
            for &(d, _) in &waits_for[v] {
                if depth[d] + 1 > depth[v] {
                    depth[v] = depth[d] + 1;
                    via[v] = Some(d);
                }
            }
        }
        let mut best: Option<usize> = None;
        for v in 0..n {
            if best.is_none_or(|b| depth[v] > depth[b]) {
                best = Some(v);
            }
        }
        let mut path = Vec::new();
        let mut cursor = best;
        while let Some(v) = cursor {
            path.push(self.ids[v].clone());
            cursor = via[v];
        }
        CriticalPath {
            depth: path.len(),
            path,
        }
    }

    fn groups(&self) -> Groups {
        let n = self.ids.len();
        let mut parent: Vec<usize> = (0..n).collect();
        let find = |parent: &mut Vec<usize>, mut x: usize| {
            let mut root = x;
            while parent[root] != root {
                root = parent[root];
            }
            while parent[x] != root {
                let next = parent[x];
                parent[x] = root;
                x = next;
            }
            root
        };
        let joins = self
            .links
            .iter()
            .filter(|l| EDGE_KINDS[l.kind].2)
            .map(|l| (l.from, l.to))
            .chain(self.exclusions.iter().copied());
        for (a, b) in joins {
            let (ra, rb) = (find(&mut parent, a), find(&mut parent, b));
            if ra != rb {
                parent[ra.max(rb)] = ra.min(rb);
            }
        }
        let mut slot: HashMap<usize, usize> = HashMap::new();
        let mut groups: Vec<Group> = Vec::new();
        for v in 0..n {
            let root = find(&mut parent, v);
            let at = *slot.entry(root).or_insert_with(|| {
                groups.push(Group {
                    size: 0,
                    nodes: Vec::new(),
                });
                groups.len() - 1
            });
            groups[at].size += 1;
            groups[at].nodes.push(self.ids[v].clone());
        }
        Groups {
            group_count: groups.len(),
            groups,
        }
    }
}

/// Iterative Tarjan: the component number of each node and the number of components.
fn strongly_connected(out: &Adjacency) -> (Vec<usize>, usize) {
    const NONE: usize = usize::MAX;
    let n = out.len();
    let mut index = vec![NONE; n];
    let mut low = vec![0; n];
    let mut on_stack = vec![false; n];
    let mut component = vec![NONE; n];
    let mut stack = Vec::new();
    let mut counter = 0;
    let mut count = 0;
    for start in 0..n {
        if index[start] != NONE {
            continue;
        }
        let mut calls: Vec<(usize, usize)> = vec![(start, 0)];
        index[start] = counter;
        low[start] = counter;
        counter += 1;
        stack.push(start);
        on_stack[start] = true;
        while let Some(&mut (v, ref mut pos)) = calls.last_mut() {
            if let Some(&(w, _)) = out[v].get(*pos) {
                *pos += 1;
                if index[w] == NONE {
                    index[w] = counter;
                    low[w] = counter;
                    counter += 1;
                    stack.push(w);
                    on_stack[w] = true;
                    calls.push((w, 0));
                } else if on_stack[w] {
                    low[v] = low[v].min(index[w]);
                }
            } else {
                calls.pop();
                if let Some(&(parent, _)) = calls.last() {
                    low[parent] = low[parent].min(low[v]);
                }
                if low[v] == index[v] {
                    while let Some(w) = stack.pop() {
                        on_stack[w] = false;
                        component[w] = count;
                        if w == v {
                            break;
                        }
                    }
                    count += 1;
                }
            }
        }
    }
    (component, count)
}
