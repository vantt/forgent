//! Stage 2: (policy, peers, walk, accountView, launchView) -> Ranked. Pure.
//! Candidates name executor, invocation, model, effort, pool and accounts.
//! Effort comes from the cell or an override, never from rigor.

use crate::model::*;
use crate::tier::{Effort, Rigor};

/// One pre-filter candidate: an executor with one cell entry.
struct Cand<'a> {
    executor: String,
    facts: &'a ExecutorFacts,
    pin: Option<String>,
    invocation: Option<String>,
    source: String,
    from_override: bool,
    entry: Option<CellEntry>,
    leases: bool,
    mechanism: Mechanism,
}

impl Cand<'_> {
    fn family(&self) -> &str {
        &self.facts.family
    }

    fn pool(&self) -> Option<String> {
        self.leases
            .then(|| self.entry.as_ref().and_then(|e| e.pool.clone()).unwrap_or_else(|| self.facts.family.clone()))
    }

    fn model(&self) -> Option<String> {
        self.entry.as_ref().map(|e| e.model.clone())
    }

    fn matches(&self, id: &Identity) -> bool {
        id.executor == self.executor
            && id.invocation == self.invocation
            && id.pool == self.pool()
            && id.model == self.model()
    }
}

struct Base {
    name: String,
    invocation: Option<String>,
    source: String,
    from_override: bool,
}

struct Run {
    survivors: Vec<Candidate>,
    refusal: Option<Refusal>,
    skipped: Vec<Skip>,
    moved_by: Vec<String>,
    shared_with: Vec<String>,
    independent_of: Vec<PeerRef>,
    fallback_families: Vec<String>,
}

fn label(policy: &Policy) -> String {
    let ask = &policy.ask;
    format!("{}/{}", ask.label.as_deref().unwrap_or(&ask.capability), ask.seat)
}

pub fn rank(
    policy: &Policy,
    peers: &[Peer],
    walk: &Walk,
    accounts: &AccountView,
    launch: &LaunchView,
    now: u64,
) -> Ranked {
    let ask = &policy.ask;
    let prefer_bases: Vec<Base> = policy
        .prefer
        .iter()
        .map(|p| Base {
            name: p.executor().to_string(),
            invocation: p.invocation().map(str::to_string),
            source: policy.prefer_source.clone(),
            from_override: false,
        })
        .collect();

    let override_ = ask.override_.as_ref();
    let override_base = override_.and_then(|o| {
        o.executor.as_ref().map(|name| Base {
            name: name.clone(),
            invocation: o.invocation.clone(),
            source: "override".to_string(),
            from_override: true,
        })
    });

    let mut run = match override_base {
        Some(base) => {
            let first = run_bases(policy, vec![base], peers, walk, accounts, launch, now);
            let droppable = override_.is_some_and(|o| o.run_wide)
                && first.survivors.is_empty()
                && first
                    .refusal
                    .as_ref()
                    .is_some_and(|r| matches!(r.reason.as_str(), "pin-unsatisfiable" | "unknown-executor"));
            if droppable {
                let mut second = run_bases(policy, prefer_bases, peers, walk, accounts, launch, now);
                if let Some(why) = first.refusal {
                    second.skipped.push(Skip {
                        executor: override_.and_then(|o| o.executor.clone()).unwrap_or_default(),
                        family: String::new(),
                        reason: why.reason,
                        detail: format!("run-wide override skipped for this seat: {}", why.detail),
                        config: None,
                    });
                }
                second
            } else {
                first
            }
        }
        None => run_bases(policy, prefer_bases, peers, walk, accounts, launch, now),
    };

    if run.survivors.is_empty() && run.refusal.is_none() {
        run.refusal = Some(Refusal::new(
            "no-candidate",
            format!("{}: no candidate executor for capability \"{}\" role \"{}\"", label(policy), ask.capability, ask.role.name()),
        ));
    }
    Ranked {
        candidates: run.survivors,
        skipped: run.skipped,
        moved_by: run.moved_by,
        shared_with: run.shared_with,
        independent_of: run.independent_of,
        fallback_families: run.fallback_families,
        refusal: run.refusal,
    }
}

fn run_bases(
    policy: &Policy,
    bases: Vec<Base>,
    peers: &[Peer],
    walk: &Walk,
    accounts: &AccountView,
    launch: &LaunchView,
    now: u64,
) -> Run {
    let ask = &policy.ask;
    let configured = bases.len();
    let mut run = Run {
        survivors: Vec::new(),
        refusal: None,
        skipped: Vec::new(),
        moved_by: Vec::new(),
        shared_with: Vec::new(),
        independent_of: Vec::new(),
        fallback_families: Vec::new(),
    };
    let refuse = |run: &mut Run, mut refusal: Refusal| {
        refusal.configured = configured;
        run.refusal = Some(refusal);
    };

    // Resolve executors; a seat whose candidates are all tools is not an agent seat.
    let mut resolved: Vec<(&Base, &String, &ExecutorFacts)> = Vec::new();
    let mut last_unknown = None;
    for base in &bases {
        match launch.find(&base.name) {
            Some((id, facts)) => resolved.push((base, id, facts)),
            None => {
                last_unknown = Some(Refusal::new(
                    "unknown-executor",
                    format!("{}: executor \"{}\" is not registered", label(policy), base.name),
                ));
            }
        }
    }
    if !resolved.is_empty() && last_unknown.is_none() && resolved.iter().all(|(_, _, f)| f.kind == ExecutorKind::Tool) {
        refuse(
            &mut run,
            Refusal::new(
                "not-an-agent-seat",
                format!("{}: every candidate is a tool executor; Seat Binding chooses agent seats only", label(policy)),
            ),
        );
        return run;
    }

    // Candidates: one per cell entry for a seat that leases an account; a family with no cell is dropped.
    let mut cands: Vec<Cand> = Vec::new();
    let mut dropped_for_cell = false;
    for (base, id, facts) in resolved {
        if facts.kind == ExecutorKind::Tool {
            run.skipped.push(skip(id, facts, "not-an-agent-seat", "a tool executor serves no agent seat".into(), None));
            continue;
        }
        let mechanism = if ask.posture.force_out_of_process { Mechanism::OutOfProcess } else { facts.mechanism };
        let leases = mechanism == Mechanism::OutOfProcess;
        let invocation = base.invocation.clone().or_else(|| facts.default_invocation.clone());
        let cell = policy.cells.get(&facts.family);
        let make = |entry: Option<CellEntry>| Cand {
            executor: id.clone(),
            facts,
            pin: base.invocation.clone(),
            invocation: invocation.clone(),
            source: base.source.clone(),
            from_override: base.from_override,
            entry,
            leases,
            mechanism,
        };
        match (leases, cell) {
            (true, None) => {
                dropped_for_cell = true;
                run.skipped.push(skip(
                    id,
                    facts,
                    "tier-cell-missing",
                    format!("family \"{}\" has no cell at {}", facts.family, policy.tier.name()),
                    Some(format!("modelPolicies.{}.{}", facts.family, policy.tier.name())),
                ));
            }
            (true, Some(entries)) => cands.extend(entries.iter().cloned().map(|e| make(Some(e)))),
            (false, cell) => cands.push(make(cell.and_then(|e| e.first().cloned()))),
        }
    }
    if cands.is_empty() {
        let refusal = if dropped_for_cell {
            let mut r = Refusal::new(
                "tier-cell-missing",
                format!(
                    "{} {} — no allowed executor has a cell; change {} or set {}",
                    label(policy),
                    policy.tier.name(),
                    policy.prefer_source,
                    policy.seat_tier_path
                ),
            );
            r.config = Some(policy.prefer_source.clone());
            r
        } else {
            last_unknown.unwrap_or_else(|| Refusal::new("no-candidate", format!("{}: nothing is configured for this seat", label(policy))))
        };
        refuse(&mut run, refusal);
        return run;
    }

    // Order: continuity keeps one identity; a walk follows the failed family, then the tier list.
    if let Some(keep) = &walk.continuity {
        cands.retain(|c| {
            c.executor == keep.executor
                && keep.model == c.model()
                && keep.pool == c.pool()
                && keep.invocation.as_ref().is_none_or(|i| c.invocation.as_ref() == Some(i))
                && keep.effort.is_none_or(|e| c.entry.as_ref().and_then(|x| x.effort) == Some(e) || ask.override_.as_ref().and_then(|o| o.effort) == Some(e))
        });
        if cands.is_empty() {
            refuse(
                &mut run,
                Refusal::new(
                    "seat-continuity-unavailable",
                    format!("{}: the executor, model and effort this seat kept ({} {}) are no longer available", label(policy), keep.executor, keep.model.clone().unwrap_or_default()),
                ),
            );
            return run;
        }
    } else if !walk.tried.is_empty() {
        cands = walk_order(cands, &walk.tried, policy);
    }

    // Independence at this effective rigor.
    let hard_checkers_are_hard = policy.effective_rigor >= Rigor::High;
    let mut hard_names: Vec<&String> = ask.independence.hard.iter().collect();
    let mut soft_names: Vec<&String> = ask.independence.soft.iter().collect();
    if hard_checkers_are_hard {
        hard_names.extend(ask.independence.hard_checkers.iter());
    } else {
        soft_names.extend(ask.independence.hard_checkers.iter());
    }
    let peer_family = |name: &str| -> (String, Option<String>) {
        match peers.iter().find(|p| p.seat == name) {
            Some(p) => (p.family.to_lowercase(), Some(p.seat.clone())),
            None => (name.to_lowercase(), None),
        }
    };
    let hard: Vec<(String, String)> = hard_names
        .iter()
        .map(|n| {
            let (family, seat) = peer_family(n);
            (seat.unwrap_or_else(|| n.to_string()), family)
        })
        .collect();
    run.independent_of = hard.iter().map(|(seat, family)| PeerRef { seat: seat.clone(), family: family.clone() }).collect();
    let soft_families: Vec<(String, String)> = soft_names
        .iter()
        .map(|n| {
            let (family, seat) = peer_family(n);
            (seat.unwrap_or_else(|| n.to_string()), family)
        })
        .collect();

    let pin = match override_pin(ask) {
        Ok(pin) => pin,
        Err(refusal) => {
            refuse(&mut run, refusal);
            return run;
        }
    };

    let ctx = Ctx { policy, walk, accounts, now, hard: &hard };
    let mut survivors: Vec<(Candidate, usize)> = Vec::new();
    let mut natural_first: Option<String> = None;
    let mut last_rejection: Option<Refusal> = None;
    for cand in &cands {
        match judge(&ctx, cand, false) {
            Ok(done) => {
                survivors.push((done, 0));
                if natural_first.is_none() {
                    natural_first = Some(survivors[0].0.executor.clone());
                }
            }
            Err(rejection) => {
                if rejection.reason == "independence-unsatisfiable" && natural_first.is_none() && judge(&ctx, cand, true).is_ok() {
                    natural_first = Some(cand.executor.clone());
                }
                run.skipped.push(skip(&cand.executor, cand.facts, &rejection.reason, rejection.detail.clone(), rejection.config.clone()));
                last_rejection = Some(rejection);
            }
        }
    }
    if let (Some(natural), Some((first, _))) = (&natural_first, survivors.first()) {
        if natural != &first.executor {
            run.moved_by.push("independence".to_string());
        }
    }

    // A pinned account selects the survivors of its pool; a seat the pool does not serve runs unpinned.
    if let Some((pool, account)) = &pin {
        if survivors.iter().any(|(c, _)| c.pool.as_deref() == Some(pool)) {
            survivors.retain(|(c, _)| c.pool.as_deref() == Some(pool));
            for (c, _) in &mut survivors {
                let pool_accounts = accounts.pools.get(pool).map(Vec::as_slice).unwrap_or(&[]);
                match pool_accounts.iter().find(|a| &a.id == account) {
                    None => {
                        let known: Vec<&str> = pool_accounts.iter().map(|a| a.id.as_str()).collect();
                        refuse(
                            &mut run,
                            Refusal::new("account-pin-unknown", format!("account \"{pool}/{account}\" does not exist; the accounts of pool \"{pool}\" are: {}", known.join(", "))),
                        );
                        return run;
                    }
                    Some(a) if a.disabled => {
                        refuse(&mut run, Refusal::new("account-pin-disabled", format!("account \"{pool}/{account}\" is disabled in the config, so it cannot be pinned")));
                        return run;
                    }
                    Some(_) => {
                        c.accounts = vec![account.clone()];
                        c.account = Some(account.clone());
                    }
                }
            }
        } else if !survivors.is_empty() {
            run.skipped.push(Skip {
                executor: survivors[0].0.executor.clone(),
                family: survivors[0].0.family.clone(),
                reason: "account-pin-other-pool".to_string(),
                detail: format!("account \"{pool}/{account}\" cannot be pinned: no usable entry of this seat is served by pool \"{pool}\""),
                config: None,
            });
        }
    }

    // Soft spread: the family used by the fewest listed peers first; order breaks ties.
    if !soft_families.is_empty() {
        for (c, use_count) in &mut survivors {
            *use_count = soft_families.iter().filter(|(_, f)| f == &c.family.to_lowercase()).count();
        }
        let before = survivors.first().map(|(c, _)| c.executor.clone());
        survivors.sort_by_key(|(_, use_count)| *use_count);
        if before != survivors.first().map(|(c, _)| c.executor.clone()) {
            run.moved_by.push("spread".to_string());
        }
        if let Some((chosen, _)) = survivors.first() {
            run.shared_with = soft_families
                .iter()
                .filter(|(_, f)| f == &chosen.family.to_lowercase())
                .map(|(seat, _)| seat.clone())
                .collect();
        }
    }

    run.survivors = survivors.into_iter().map(|(c, _)| c).collect();
    if run.survivors.is_empty() {
        let mut refusal = last_rejection.unwrap_or_else(|| Refusal::new("no-candidate", format!("{}: no candidate passed the filters", label(policy))));
        if refusal.reason == "independence-unsatisfiable" {
            refusal.peers = run.independent_of.clone();
        }
        if walk.continuity.is_some() {
            refusal = Refusal::new("seat-continuity-unavailable", format!("{}: the kept executor/model/effort has no usable account left ({})", label(policy), refusal.detail));
        }
        refuse(&mut run, refusal);
        return run;
    }

    // What a failure walks to after this seat's first candidate.
    let chosen_family = run.survivors[0].family.clone();
    let allowed: Vec<String> = cands.iter().map(|c| c.family().to_string()).collect();
    run.fallback_families = policy
        .tier_fallback
        .iter()
        .filter(|f| **f != chosen_family && allowed.contains(f))
        .cloned()
        .collect();
    run
}

fn skip(executor: &str, facts: &ExecutorFacts, reason: &str, detail: String, config: Option<String>) -> Skip {
    Skip { executor: executor.to_string(), family: facts.family.clone(), reason: reason.to_string(), detail, config }
}

fn override_pin(ask: &Ask) -> Result<Option<(String, String)>, Refusal> {
    let Some(text) = ask.override_.as_ref().and_then(|o| o.account.as_ref()) else {
        return Ok(None);
    };
    match text.trim().split_once('/') {
        Some((pool, id)) if !pool.is_empty() && !id.is_empty() => Ok(Some((pool.to_string(), id.to_string()))),
        _ => Err(Refusal::new(
            "account-pin-invalid",
            format!("a pinned account must be written pool/account (for example openai/work), got \"{text}\""),
        )),
    }
}

/// After a failure: the rest of the failed family in cell order, then `tierFallback.<tier>`
/// restricted to the seat's own families (a list narrows, never widens); with no list, the
/// rest of the prefer order. Candidates already tried never come back.
fn walk_order<'a>(cands: Vec<Cand<'a>>, tried: &[Identity], policy: &Policy) -> Vec<Cand<'a>> {
    let Some(last) = tried.last() else { return cands };
    let last_index = cands.iter().position(|c| c.matches(last));
    let last_family = last_index
        .map(|i| cands[i].family().to_string())
        .or_else(|| cands.iter().find(|c| c.executor == last.executor).map(|c| c.family().to_string()));
    let mut order: Vec<usize> = Vec::new();
    if let Some(family) = &last_family {
        order.extend((0..cands.len()).filter(|&i| cands[i].family() == family));
    }
    if policy.tier_fallback.is_empty() {
        order.extend(last_index.map_or(0, |i| i + 1)..cands.len());
    } else {
        for family in &policy.tier_fallback {
            order.extend((0..cands.len()).filter(|&i| cands[i].family() == family));
        }
    }
    let mut seen = Vec::new();
    let mut cands: Vec<Option<Cand>> = cands.into_iter().map(Some).collect();
    let mut out = Vec::new();
    for i in order {
        if seen.contains(&i) {
            continue;
        }
        seen.push(i);
        if let Some(c) = cands[i].take() {
            if !tried.iter().any(|t| c.matches(t)) {
                out.push(c);
            }
        }
    }
    out
}

struct Ctx<'a> {
    policy: &'a Policy,
    walk: &'a Walk,
    accounts: &'a AccountView,
    now: u64,
    hard: &'a [(String, String)],
}

fn rejection(reason: &str, detail: String) -> Refusal {
    Refusal::new(reason, detail)
}

/// Accept a candidate or say why it is out. `ignore_independence` finds the pre-filter first choice.
fn judge(ctx: &Ctx, cand: &Cand, ignore_independence: bool) -> Result<Candidate, Refusal> {
    let policy = ctx.policy;
    let ask = &policy.ask;
    let facts = cand.facts;
    let id = &cand.executor;
    let pool = cand.pool();

    if let Some(detail) = &facts.disallowed {
        return Err(rejection("governance", format!("governance rejected executor \"{id}\": {detail}")));
    }
    if !ask.required_skills.is_empty() {
        let missing: Vec<&String> = ask.required_skills.iter().filter(|s| !facts.skills.contains(s)).collect();
        if !missing.is_empty() {
            return Err(rejection(
                "skills-unavailable",
                format!("executor \"{id}\" does not declare skills [{}]", missing.iter().map(|s| s.as_str()).collect::<Vec<_>>().join(", ")),
            ));
        }
    }
    if pool.as_ref().is_some_and(|p| ctx.walk.exclude_pools.contains(p)) {
        return Err(rejection("pool-excluded", format!("executor \"{id}\" pool \"{}\" is excluded because its credential just failed", pool.clone().unwrap_or_default())));
    }

    if !ignore_independence && !ctx.hard.is_empty() {
        let family = facts.family.to_lowercase();
        let accepted = cand.from_override
            && ask.raise_authorized
            && ask.override_.as_ref().is_some_and(|o| o.accept_dependence);
        if !accepted && ctx.hard.iter().any(|(_, f)| *f == family) {
            let names: Vec<String> = ctx.hard.iter().map(|(seat, f)| format!("{seat}({f})")).collect();
            return Err(rejection(
                "independence-unsatisfiable",
                format!("{}: executor \"{id}\" (family \"{}\") is not independent of {}", label(policy), facts.family, names.join(", ")),
            ));
        }
    }

    // The invocation: a pin must exist and carry the posture; otherwise the transport's choice.
    let invocation_facts = match (&cand.pin, &cand.invocation) {
        (Some(pinned), _) => match facts.invocations.iter().find(|i| &i.id == pinned && i.carries_posture) {
            Some(found) => Some(found),
            None => {
                return Err(rejection(
                    "pin-unsatisfiable",
                    format!("{}: invocation \"{pinned}\" of \"{id}\" is not available for this seat, and a pinned invocation is never swapped", label(policy)),
                ))
            }
        },
        (None, Some(chosen)) => facts.invocations.iter().find(|i| &i.id == chosen),
        (None, None) => {
            return Err(rejection("posture-unavailable", format!("executor \"{id}\" has no invocation that can carry this seat's posture")));
        }
    };

    if ask.posture.blind && !cand.leases {
        return Err(rejection("blind-in-process", format!("executor \"{id}\" would run in-process, where no sandbox can keep a blind role blind")));
    }

    // Effort: the cell's promise, raised (never lowered) by an override, rendered by the CLI.
    let cell_effort = cand.entry.as_ref().and_then(|e| e.effort);
    let override_effort = ask.override_.as_ref().and_then(|o| o.effort);
    if let (Some(over), Some(cell)) = (override_effort, cell_effort) {
        if over < cell {
            return Err(rejection(
                "effort-below-cell",
                format!("{}: override effort {} is below the cell's {}; an override may only keep or raise it", label(policy), over.name(), cell.name()),
            ));
        }
    }
    let (effort, effort_source) = match (override_effort, cell_effort) {
        (Some(over), _) => (Some(over), "override"),
        (None, Some(cell)) => (Some(cell), "cell"),
        (None, None) => (None, "invocation-default"),
    };
    if let Some(want) = effort {
        let rendered: Vec<Effort> = invocation_facts.map(|i| i.efforts.clone()).unwrap_or_default();
        if !rendered.contains(&want) {
            let mut refusal = rejection(
                "effort-unsupported",
                format!(
                    "{}: invocation \"{}\" cannot render effort {}; it renders [{}]",
                    label(policy),
                    invocation_facts.map(|i| i.id.as_str()).unwrap_or("none"),
                    want.name(),
                    rendered.iter().map(|e| e.name()).collect::<Vec<_>>().join(", ")
                ),
            );
            refusal.rendered = rendered;
            return Err(refusal);
        }
    }

    let account_ids = match &pool {
        Some(p) => order_accounts(ctx, p, &facts.family, invocation_facts.and_then(|i| i.cli.as_deref()), id, cand.entry.as_ref().map(|e| e.model.as_str()))?,
        None => Vec::new(),
    };

    Ok(Candidate {
        executor: id.clone(),
        family: facts.family.clone(),
        invocation: invocation_facts.map(|i| i.id.clone()).or_else(|| cand.invocation.clone()),
        model: cand.model(),
        model_source: match (&cand.entry, cand.leases) {
            (Some(_), true) => format!("modelPolicies.{}.{}", facts.family, policy.tier.name()),
            _ => "no-model-needed".to_string(),
        },
        effort,
        effort_source: effort_source.to_string(),
        pool,
        account: account_ids.first().cloned(),
        accounts: account_ids,
        mechanism: cand.mechanism,
        source: cand.source.clone(),
        pinned: cand.pin.is_some(),
    })
}

/// Accounts of `pool` in lease order for a launch through `cli`. A pool with no account runs on the
/// executor's own login, which only the pool named after the family may do.
fn order_accounts(ctx: &Ctx, pool: &str, family: &str, cli: Option<&str>, executor: &str, model: Option<&str>) -> Result<Vec<String>, Refusal> {
    let all = ctx.accounts.pools.get(pool).map(Vec::as_slice).unwrap_or(&[]);
    if all.is_empty() {
        return if pool == family {
            Ok(Vec::new())
        } else {
            Err(rejection("pool-unusable", format!("executor \"{executor}\" with model \"{}\" is not served: pool \"{pool}\" has no account, so nothing can pay for the call", model.unwrap_or(""))))
        };
    }
    let holds_login = |a: &&AccountFacts| !a.disabled && cli.is_none_or(|c| a.clis.iter().any(|x| x == c));
    let usable: Vec<&AccountFacts> = all.iter().filter(holds_login).collect();
    if usable.is_empty() {
        return Err(rejection(
            "pool-unusable",
            format!("executor \"{executor}\" is not served: no enabled account of pool \"{pool}\" holds a \"{}\" login store", cli.unwrap_or("")),
        ));
    }
    let mut ready: Vec<&AccountFacts> = usable
        .iter()
        .copied()
        .filter(|a| {
            a.quarantined_until.is_none_or(|until| until <= ctx.now)
                && a.probe != Probe::Failed
                && !ctx.walk.failed_accounts.iter().any(|f| f.pool == pool && f.account == a.id)
        })
        .collect();
    if ready.is_empty() {
        return Err(rejection(
            "no-account-available",
            format!("every usable account of pool \"{pool}\" is quarantined, failed its probe or failed earlier in this walk"),
        ));
    }
    let rank = |a: &AccountFacts| (!a.sticky, a.probe != Probe::Ok);
    ready.sort_by_key(|a| rank(a));
    Ok(ready.into_iter().map(|a| a.id.clone()).collect())
}
