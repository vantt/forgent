//! Stage 1: (ask, config) -> Policy. Pure. Tier by the precedence table, the
//! `maxTier` ceiling (a lowering is visible), the ordered `prefer` list and the
//! cells at the final tier. Every value carries its config path as source.

use crate::model::*;
use crate::tier::Tier;
use std::collections::BTreeMap;

const GLOBAL_MAX_TIER_PATH: &str = "maxTier";
const DEFAULTS_TIER_PATH: &str = "defaults.tier";

fn cap_path(key: &str) -> String {
    format!("capabilities.\"{key}\"")
}

/// `<prefix>:*` for a capability containing `:`; capabilities without one have no prefix line.
fn prefix_key(capability: &str) -> Option<String> {
    capability.split_once(':').map(|(prefix, _)| format!("{prefix}:*"))
}

/// The exact entry and the prefix entry of a capability, each with its config path.
fn entries<'a>(config: &'a Config, capability: &str) -> Vec<(String, &'a CapabilityEntry)> {
    let mut found = Vec::new();
    if let Some(entry) = config.capabilities.0.get(capability) {
        found.push((cap_path(capability), entry));
    }
    if let Some(key) = prefix_key(capability) {
        if let Some(entry) = config.capabilities.0.get(&key) {
            found.push((cap_path(&key), entry));
        }
    }
    found
}

fn invalid(path: &str, detail: &str) -> Refusal {
    Refusal::new("invalid-config", format!("{path}: {detail}")).at(path)
}

fn validate(config: &Config) -> Result<(), Refusal> {
    for (key, entry) in &config.capabilities.0 {
        let base = cap_path(key);
        if entry.prefer.as_ref().is_some_and(Vec::is_empty) {
            return Err(invalid(&format!("{base}.prefer"), "prefer must not be empty"));
        }
        for role in entry.roles.0.keys() {
            if !ROLES.contains(&role.as_str()) {
                return Err(invalid(
                    &format!("{base}.roles.{role}"),
                    &format!("unknown role; the roles are {}", ROLES.join(", ")),
                ));
            }
        }
        for (group, scopes) in [("roles", &entry.roles), ("personas", &entry.personas), ("seats", &entry.seats)] {
            for (name, scope) in &scopes.0 {
                if scope.prefer.as_ref().is_some_and(Vec::is_empty) {
                    return Err(invalid(&format!("{base}.{group}.{name}.prefer"), "prefer must not be empty"));
                }
            }
        }
    }
    for key in config.tier_fallback.0.keys() {
        if Tier::parse(key).is_none() {
            return Err(invalid(&format!("tierFallback.{key}"), "unknown tier name"));
        }
    }
    for (family, cells) in &config.model_policies.0 {
        for key in cells.0.keys() {
            if Tier::parse(key).is_none() {
                return Err(invalid(&format!("modelPolicies.{family}.{key}"), "unknown tier name"));
            }
        }
    }
    Ok(())
}

struct Resolved {
    tier: Tier,
    source: String,
}

/// Step 1 of the tier rule: the first declared value of the §6.3 `tier` column.
fn resolve_tier(
    config: &Config,
    capability: &str,
    seat: &str,
    persona: Option<&str>,
    role: Role,
    workflow: Option<&WorkflowTier>,
) -> Resolved {
    let found = entries(config, capability);
    let scoped = |pick: &dyn Fn(&CapabilityEntry) -> Option<&Scope>, group: &str, name: &str| {
        found.iter().find_map(|(path, entry)| {
            pick(entry)
                .and_then(|scope| scope.tier)
                .map(|tier| Resolved { tier, source: format!("{path}.{group}.{name}.tier") })
        })
    };
    if let Some(hit) = scoped(&|e| e.seats.0.get(seat), "seats", seat) {
        return hit;
    }
    if let Some(name) = persona {
        if let Some(hit) = scoped(&|e| e.personas.0.get(name), "personas", name) {
            return hit;
        }
    }
    if let Some(hit) = scoped(&|e| e.roles.0.get(role.name()), "roles", role.name()) {
        return hit;
    }
    if let Some(recommended) = workflow {
        return Resolved { tier: recommended.tier, source: recommended.source.clone() };
    }
    if let Some(hit) = found
        .iter()
        .find_map(|(path, entry)| entry.tier.map(|tier| Resolved { tier, source: format!("{path}.tier") }))
    {
        return hit;
    }
    Resolved { tier: config.defaults.tier, source: DEFAULTS_TIER_PATH.to_string() }
}

/// `maxTier` = `cap.maxTier` ?? `prefix.maxTier` ?? global; absent means no ceiling.
fn resolve_max(config: &Config, capability: &str) -> Option<(Tier, String)> {
    entries(config, capability)
        .into_iter()
        .find_map(|(path, entry)| entry.max_tier.map(|tier| (tier, format!("{path}.maxTier"))))
        .or_else(|| config.max_tier.map(|tier| (tier, GLOBAL_MAX_TIER_PATH.to_string())))
}

/// The first declared `prefer` list of the §6.3 `prefer` column; `tierFallback.<tier>` last.
fn resolve_prefer(
    config: &Config,
    capability: &str,
    seat: &str,
    persona: Option<&str>,
    role: Role,
    tier: Tier,
) -> (Vec<Prefer>, String) {
    let found = entries(config, capability);
    let scoped = |pick: &dyn Fn(&CapabilityEntry) -> Option<&Scope>, group: &str, name: &str| {
        found.iter().find_map(|(path, entry)| {
            pick(entry)
                .and_then(|scope| scope.prefer.clone())
                .map(|list| (list, format!("{path}.{group}.{name}.prefer")))
        })
    };
    if let Some(hit) = scoped(&|e| e.seats.0.get(seat), "seats", seat) {
        return hit;
    }
    if let Some(name) = persona {
        if let Some(hit) = scoped(&|e| e.personas.0.get(name), "personas", name) {
            return hit;
        }
    }
    if let Some(hit) = scoped(&|e| e.roles.0.get(role.name()), "roles", role.name()) {
        return hit;
    }
    if let Some(hit) = found
        .iter()
        .find_map(|(path, entry)| entry.prefer.clone().map(|list| (list, format!("{path}.prefer"))))
    {
        return hit;
    }
    let fallback = config.tier_fallback.0.get(tier.name()).cloned().unwrap_or_default();
    (
        fallback.into_iter().map(Prefer::Executor).collect(),
        format!("tierFallback.{}", tier.name()),
    )
}

struct Capped {
    tier: Tier,
    source: String,
    lowered: Option<Lowered>,
}

fn apply_cap(tier: Tier, source: &str, max: &Option<(Tier, String)>) -> Capped {
    match max {
        Some((ceiling, ceiling_source)) if tier > *ceiling => Capped {
            tier: *ceiling,
            source: ceiling_source.clone(),
            lowered: Some(Lowered {
                from: tier,
                from_source: source.to_string(),
                reason: "max-tier-cap".to_string(),
            }),
        },
        _ => Capped { tier, source: source.to_string(), lowered: None },
    }
}

pub fn policy(ask: &Ask, config: &Config) -> Result<Policy, Refusal> {
    validate(config)?;

    let capability = ask.capability.as_str();
    let seat = ask.seat.as_str();
    let persona = ask.selectors.persona.as_deref().or(ask.persona.as_deref());

    let resolved = resolve_tier(config, capability, seat, persona, ask.role, ask.workflow.as_ref());
    let max = resolve_max(config, capability);

    // A persona an override names that lifts the tier above the answer without it is a raise.
    let mut raised_by = None;
    if !ask.selectors.is_empty() {
        let base = resolve_tier(
            config,
            &ask.capability,
            &ask.seat,
            ask.persona.as_deref(),
            ask.role,
            ask.workflow.as_ref(),
        );
        let without = apply_cap(base.tier, &base.source, &resolve_max(config, &ask.capability)).tier;
        let with = apply_cap(resolved.tier, &resolved.source, &max).tier;
        if with > without {
            if !ask.raise_authorized {
                return Err(Refusal::new(
                    "tier-escalation-unauthorized",
                    format!(
                        "{}/{}: the persona the door chose resolves to {} where the workflow's own seat resolves to {}; only an authorized door may raise a tier",
                        ask.label.as_deref().unwrap_or(&ask.capability),
                        ask.seat,
                        with.name(),
                        without.name()
                    ),
                ));
            }
            raised_by = Some("selector:persona".to_string());
        }
    }

    // Override at or below the resolved tier is accepted; above needs an authorized door.
    let mut tier = resolved.tier;
    let mut source = resolved.source.clone();
    if let Some(requested) = ask.override_.as_ref().and_then(|o| o.tier) {
        if requested > resolved.tier && !ask.raise_authorized {
            return Err(Refusal::new(
                "tier-escalation-unauthorized",
                format!(
                    "{}/{}: override asks for {} above the resolved {} ({}); an override may only keep or lower the tier",
                    ask.label.as_deref().unwrap_or(&ask.capability),
                    ask.seat,
                    requested.name(),
                    resolved.tier.name(),
                    resolved.source
                ),
            ));
        }
        tier = requested;
        source = "override".to_string();
    }

    let capped = apply_cap(tier, &source, &max);
    let final_tier = capped.tier;
    let max_tier = max.map(|(value, path)| MaxTier { value, source: path, applied: capped.lowered.is_some() });

    let recommendation = ask
        .workflow
        .as_ref()
        .filter(|workflow| workflow.source != resolved.source)
        .cloned();

    let (prefer, prefer_source) = resolve_prefer(config, capability, seat, persona, ask.role, final_tier);

    let tier_fallback = config.tier_fallback.0.get(final_tier.name()).cloned().unwrap_or_default();

    let mut cells = BTreeMap::new();
    for (family, by_tier) in &config.model_policies.0 {
        if let Some(cell) = by_tier.0.get(final_tier.name()) {
            let path = format!("modelPolicies.{family}.{}", final_tier.name());
            let entries = cell.entries().map_err(|detail| invalid(&path, &detail))?;
            cells.insert(family.clone(), entries);
        }
    }

    let definition = final_tier.definition();
    Ok(Policy {
        tier: final_tier,
        tier_source: capped.source,
        raised_by,
        recommendation,
        lowered_from: capped.lowered,
        max_tier,
        definition: format!("{}: {}; self-check: {}", definition.name, definition.work, definition.self_check),
        prefer,
        prefer_source,
        tier_fallback,
        cells,
        seat_tier_path: format!("{}.seats.{seat}.tier", cap_path(capability)),
        effective_rigor: ask.effective_rigor,
        ask: ask.clone(),
    })
}
