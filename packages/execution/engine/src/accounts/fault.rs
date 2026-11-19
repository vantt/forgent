//! What a provider stop means for an account: how long a quota stop holds it out, and whether a stop quarantines
//! it at all. Pure over the supervisor's verdict (`stopCause`) and the provider's own signal; no agent text is read.

use serde_json::{json, Map, Value};

/// A quota quarantine always ends: when no wait or reset is named, the account is held out for an hour.
pub const DEFAULT_QUOTA_QUARANTINE_TTL_MS: i64 = 60 * 60 * 1000;
/// The longest a quota stop holds an account out, so a forged wait cannot lock an account for years.
pub const MAX_QUOTA_QUARANTINE_MS: i64 = 24 * 60 * 60 * 1000;

/// `resets? in <n><h|m|s>...`, case-insensitive: the window in milliseconds, `None` when none is named.
pub fn parse_quota_reset_window_ms(text: &str) -> Option<i64> {
    let lower = text.to_lowercase();
    let bytes = lower.as_bytes();
    let mut from = 0;
    while let Some(found) = lower[from..].find("reset") {
        let mut at = from + found + 5;
        from = at;
        if bytes.get(at) == Some(&b's') {
            at += 1;
        }
        let spaces = lower[at..].len() - lower[at..].trim_start().len();
        if spaces == 0 || !lower[at + spaces..].starts_with("in") {
            continue;
        }
        at += spaces + 2;
        let spaces = lower[at..].len() - lower[at..].trim_start().len();
        if spaces == 0 {
            continue;
        }
        at += spaces;
        let mut total = 0;
        let mut matched = false;
        let mut cursor = at;
        loop {
            let digits = lower[cursor..]
                .bytes()
                .take_while(u8::is_ascii_digit)
                .count();
            if digits == 0 {
                break;
            }
            let amount: i64 = lower[cursor..cursor + digits].parse().ok()?;
            let mut after = cursor + digits;
            after += lower[after..].len() - lower[after..].trim_start().len();
            let Some(unit) = bytes
                .get(after)
                .copied()
                .filter(|u| matches!(u, b'h' | b'm' | b's'))
            else {
                break;
            };
            if bytes.get(after + 1).is_some_and(u8::is_ascii_lowercase) {
                break;
            }
            total += amount
                * match unit {
                    b'h' => 3_600_000,
                    b'm' => 60_000,
                    _ => 1000,
                };
            matched = true;
            cursor = after + 1;
            cursor += lower[cursor..].len() - lower[cursor..].trim_start().len();
        }
        if matched {
            return (total > 0).then_some(total);
        }
    }
    None
}

/// The reset moment codex prints as a local clock time ("... or try again at 6:02 PM."): the next such time after
/// `now_ms`, in epoch milliseconds, when the host's UTC offset is `offset_min`; `None` when the text names none.
pub fn parse_quota_reset_clock_time(text: &str, now_ms: i64, offset_min: i64) -> Option<i64> {
    let lower = text.to_lowercase();
    let rest = lower[lower.find("try again at")? + 12..].trim_start();
    let (hour, rest) = take_digits(rest, 2)?;
    let rest = rest.strip_prefix(':')?;
    let (minute, rest) = take_digits(rest, 2)?;
    if minute.len() != 2 {
        return None;
    }
    let rest = rest.trim_start();
    let pm = match rest.get(..2)? {
        "pm" => true,
        "am" => false,
        _ => return None,
    };
    let hour = hour.parse::<i64>().ok()? % 12 + if pm { 12 } else { 0 };
    let minute = minute.parse::<i64>().ok()?;
    let local_now = now_ms + offset_min * 60_000;
    let day_start = local_now.div_euclid(86_400_000) * 86_400_000;
    let mut reset = day_start + (hour * 60 + minute) * 60_000;
    if reset <= local_now {
        reset += 86_400_000;
    }
    Some(reset - offset_min * 60_000)
}

fn take_digits(text: &str, most: usize) -> Option<(&str, &str)> {
    let count = text
        .bytes()
        .take_while(u8::is_ascii_digit)
        .count()
        .min(most);
    (count > 0).then(|| text.split_at(count))
}

/// What the provider itself said, as one short phrase; `None` when the signal carries nothing.
pub fn describe_provider_signal(signal: &Value) -> Option<String> {
    let fields = signal.as_object()?;
    let mut parts = Vec::new();
    if let Some(status) = fields.get("status").filter(|v| !v.is_null()) {
        parts.push(format!("HTTP {}", scalar(status)));
    }
    if let Some(word) = fields
        .get("statusWord")
        .and_then(Value::as_str)
        .filter(|w| !w.is_empty())
    {
        parts.push(word.to_string());
    }
    if let Some(wait) = fields.get("requestedWaitMs").and_then(Value::as_f64) {
        parts.push(format!("wait {}s", (wait / 1000.0).ceil() as i64));
    }
    if let Some(hint) = fields
        .get("resetHint")
        .and_then(Value::as_str)
        .filter(|h| !h.is_empty())
    {
        parts.push(hint.to_string());
    }
    (!parts.is_empty()).then(|| parts.join(", "))
}

fn scalar(value: &Value) -> String {
    match value {
        Value::String(text) => text.clone(),
        other => other.to_string(),
    }
}

/// When a quota stop's quarantine ends: the wait the provider requested, else the reset its hint names, else the
/// one-hour default, never past [`MAX_QUOTA_QUARANTINE_MS`]. `resetKnown` is false only for the default.
fn quota_quarantine_until(signal: &Value, now_ms: i64, offset_min: i64) -> (String, bool) {
    let requested = signal
        .get("requestedWaitMs")
        .and_then(Value::as_f64)
        .filter(|w| *w > 0.0)
        .map(|w| w as i64);
    let hint = signal
        .get("resetHint")
        .and_then(Value::as_str)
        .unwrap_or_default();
    let named = requested
        .or_else(|| parse_quota_reset_window_ms(hint))
        .or_else(|| parse_quota_reset_clock_time(hint, now_ms, offset_min).map(|at| at - now_ms));
    let wait = named.unwrap_or(DEFAULT_QUOTA_QUARANTINE_TTL_MS);
    (
        super::time::iso_from_ms(now_ms + wait.min(MAX_QUOTA_QUARANTINE_MS)),
        named.is_some(),
    )
}

/// The input of [`classify_fault`].
#[derive(Debug, Clone, Default)]
pub struct FaultInput<'a> {
    pub provider: &'a str,
    pub adapter_outcome: Option<&'a str>,
    pub structured_stop_reason: Option<&'a str>,
    /// The supervisor's verdict on why the provider stopped the agent: `credential`, `quota` or `provider`.
    pub stop_cause: Option<&'a str>,
    pub provider_signal: Value,
    pub now_ms: i64,
    pub utc_offset_min: i64,
}

/// `{action, reasonCode, quarantineKind?, until?, resetKnown?}`: a dead credential is a manual-clear lock, a quota
/// stop a temporary one, a provider-side error says nothing against the account.
pub fn classify_fault(input: &FaultInput) -> Value {
    if input.provider.is_empty() {
        return json!({ "action": "evidence-only", "reasonCode": "provider-unknown" });
    }
    let limit = |s: Option<&str>| matches!(s, Some("paused-limit" | "provider-limit"));
    if limit(input.adapter_outcome) || limit(input.structured_stop_reason) {
        return match input.stop_cause {
            Some("credential") => {
                json!({ "action": "quarantine", "reasonCode": "auth-token", "quarantineKind": "manual-clear" })
            }
            Some("provider") => {
                json!({ "action": "evidence-only", "reasonCode": "provider-error" })
            }
            _ => {
                let (until, known) = quota_quarantine_until(
                    &input.provider_signal,
                    input.now_ms,
                    input.utc_offset_min,
                );
                let mut out = Map::new();
                out.insert("action".into(), json!("quarantine"));
                out.insert("reasonCode".into(), json!("quota-limit"));
                out.insert("quarantineKind".into(), json!("temporary"));
                out.insert("until".into(), json!(until));
                out.insert("resetKnown".into(), json!(known));
                Value::Object(out)
            }
        };
    }
    json!({ "action": "evidence-only", "reasonCode": "unknown-or-low-confidence" })
}
