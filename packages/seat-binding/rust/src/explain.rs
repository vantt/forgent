//! `explain`: the one-sentence-per-seat text, built from the same result the
//! binding used (spec section 10.2 format). No second computation.

use crate::model::*;

pub fn explain(ask: &Ask, policy: Option<&Policy>, ranked: Option<&Ranked>, refusal: Option<&Refusal>) -> Explain {
    let mut lines = vec![format!(
        "{} / {}  (role {}, capability {})",
        ask.label.as_deref().unwrap_or("-"),
        ask.seat,
        ask.role.name(),
        ask.capability
    )];

    if let Some(policy) = policy {
        lines.push(format!("  tier definition: {}", policy.definition));
    }

    if let (Some(policy), Some(ranked), None) = (policy, ranked, refusal) {
        if let Some(chosen) = ranked.candidates.first() {
            let effort = match chosen.effort {
                Some(e) => format!("{} ({})", e.name(), chosen.effort_source),
                None => "invocation default".to_string(),
            };
            let account = match (&chosen.pool, &chosen.account) {
                (Some(pool), Some(account)) => format!(", account {pool}/{account}"),
                (Some(pool), None) => format!(", pool {pool} (own login)"),
                _ => String::new(),
            };
            lines.push(format!(
                "  -> {} {} @ {}, effort: {}{}",
                chosen.executor,
                chosen.model.as_deref().unwrap_or("default"),
                policy.tier.name(),
                effort,
                account
            ));
        }
        lines.push(format!("    {}", tier_line(policy)));
        let list: Vec<&str> = policy.prefer.iter().map(|p| p.executor()).collect();
        let mut prefer = format!("    prefer: {} = [{}]", policy.prefer_source, list.join(", "));
        if ranked.independent_of.is_empty() {
            prefer.push_str("; independence: none required");
        } else {
            let peers: Vec<String> = ranked.independent_of.iter().map(|p| format!("!= {}({}) ok", p.seat, p.family)).collect();
            prefer.push_str(&format!("; independence: {}", peers.join(", ")));
        }
        if !ranked.moved_by.is_empty() {
            prefer.push_str(&format!("; moved by: {}", ranked.moved_by.join(", ")));
        }
        if !ranked.shared_with.is_empty() {
            prefer.push_str(&format!("; shares a family with: {}", ranked.shared_with.join(", ")));
        }
        lines.push(prefer);
        let chosen_pool = ranked.candidates.first().and_then(|c| c.pool.clone()).unwrap_or_default();
        let next = if ranked.fallback_families.is_empty() {
            "none left: refuse".to_string()
        } else {
            ranked.fallback_families.join(", ")
        };
        lines.push(format!(
            "    on failure: rotate {chosen_pool} accounts -> tierFallback.{} -> {next}",
            policy.tier.name()
        ));
        for skipped in &ranked.skipped {
            lines.push(format!("    skipped {} ({}): {}", skipped.executor, skipped.reason, skipped.detail));
        }
    } else if let Some(refusal) = refusal {
        if let Some(policy) = policy {
            lines.push(format!("    {}", tier_line(policy)));
        }
        lines.push(format!("  refused {}: {}", refusal.reason, refusal.detail));
        if let Some(config) = &refusal.config {
            lines.push(format!("    config line to change: {config}"));
        }
        if let Some(ranked) = ranked {
            for skipped in &ranked.skipped {
                lines.push(format!("    skipped {} ({}): {}", skipped.executor, skipped.reason, skipped.detail));
            }
        }
    }
    Explain { lines }
}

fn tier_line(policy: &Policy) -> String {
    let mut line = match &policy.lowered_from {
        Some(lowered) => format!(
            "tier: {} ({}: {} = {}), lowered from {} ({})",
            policy.tier.name(),
            lowered.reason,
            policy.tier_source,
            policy.max_tier.as_ref().map_or("-", |m| m.value.name()),
            lowered.from.name(),
            lowered.from_source
        ),
        None => {
            let mut text = format!("tier: {} = {}", policy.tier_source, policy.tier.name());
            if let Some(max) = &policy.max_tier {
                text.push_str(&format!(
                    "; maxTier: {} = {}{}",
                    max.source,
                    max.value.name(),
                    if max.applied { "" } else { " (not applied)" }
                ));
            }
            text
        }
    };
    if let Some(recommended) = &policy.recommendation {
        line.push_str(&format!("; workflow recommends {} ({})", recommended.tier.name(), recommended.source));
    }
    if let Some(by) = &policy.raised_by {
        line.push_str(&format!("; raised by {by}"));
    }
    line
}
