//! Frozen pre-cutover ordering and identity rule from state/replay.mjs.
//! Raw lines survive unchanged; provenance belongs to the reader, not the event.
use crate::errors::{Error, ErrorCode};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::HashSet;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct Provenance {
    pub file: String,
    pub line: usize,
}
#[derive(Debug, Clone, PartialEq)]
pub struct LegacyEvent {
    pub event: Value,
    pub raw: String,
    pub provenance: Provenance,
    timestamp: String,
    sort_file: String,
}
impl LegacyEvent {
    /// Verify the raw historical suffix without re-encoding the event.
    pub fn verify(&self) -> Result<(), Error> {
        if let Some(h) = self
            .event
            .get("h")
            .and_then(Value::as_str)
            .filter(|h| !h.is_empty())
        {
            let suffix = format!(",\"h\":\"{h}\"}}");
            let raw = self.raw.strip_suffix('\r').unwrap_or(&self.raw);
            let prefix = raw
                .strip_suffix(&suffix)
                .ok_or_else(|| crate::errors::invalid("legacy hash suffix missing"))?;
            if !crate::validation::lowercase_hex(h, 16)
                || crate::envelope::sha256(format!("{prefix}}}").as_bytes())[..16] != *h
            {
                return Err(crate::errors::invalid("legacy hash mismatch"));
            }
        }
        Ok(())
    }
    /// Historical `h` remains the identity; absent or empty `h` uses the raw line.
    pub fn identity(&self) -> String {
        match self
            .event
            .get("h")
            .and_then(Value::as_str)
            .filter(|h| !h.is_empty())
        {
            Some(h) => format!("h:{h}"),
            None => format!("line:{}", self.raw),
        }
    }
}
pub fn parse_file(file: &str, raw: &str) -> Result<Vec<LegacyEvent>, Error> {
    if raw.is_empty() {
        return Ok(Vec::new());
    }
    let mut lines: Vec<_> = raw.split('\n').collect();
    if lines.last() == Some(&"") {
        lines.pop();
    }
    lines
        .into_iter()
        .enumerate()
        .map(|(index, line)| {
            let event: Value = serde_json::from_str(line).map_err(|e| {
                Error::new(
                    ErrorCode::EventStoreIntegrity,
                    format!("{file}:{}: {e}", index + 1),
                )
            })?;
            if !event.is_object()
                || !event["ts"].is_string()
                || event
                    .get("seq")
                    .is_some_and(|seq| !seq.is_null() && !seq.is_number())
            {
                return Err(Error::new(
                    ErrorCode::EventStoreIntegrity,
                    format!("invalid legacy event {file}:{}", index + 1),
                ));
            }
            let parsed = LegacyEvent {
                timestamp: event["ts"].as_str().unwrap().to_owned(),
                sort_file: file.to_owned(),
                event,
                raw: line.to_owned(),
                provenance: Provenance {
                    file: file.to_owned(),
                    line: index + 1,
                },
            };
            parsed.verify()?;
            Ok(parsed)
        })
        .collect()
}
/// Stable `(ts, file, seq ?? 0)` sort, followed by first-identity-wins dedupe.
/// Baseline uses file tag "". Caller supplies files in discovery order.
pub fn order(mut events: Vec<LegacyEvent>) -> Vec<LegacyEvent> {
    events.sort_by(|a, b| {
        a.timestamp
            .encode_utf16()
            .cmp(b.timestamp.encode_utf16())
            .then_with(|| a.sort_file.encode_utf16().cmp(b.sort_file.encode_utf16()))
            .then_with(|| {
                let seq =
                    |e: &LegacyEvent| e.event.get("seq").and_then(Value::as_f64).unwrap_or(0.0);
                seq(a)
                    .partial_cmp(&seq(b))
                    .unwrap_or(std::cmp::Ordering::Equal)
            })
    });
    let mut seen = HashSet::new();
    events
        .into_iter()
        .filter(|e| seen.insert(e.identity()))
        .collect()
}
