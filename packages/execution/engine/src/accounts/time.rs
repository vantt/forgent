//! Epoch milliseconds and the ISO-8601 text the lease state keeps: `Date#toISOString` and `Date.parse` of the
//! forms the state writes, so a record written by either tier reads in the other. Both go through their doors:
//! the civil-time formatter of `fgos-host-runtime` and the `Date.parse` reading of `fgos-execution`.

/// `new Date(ms).toISOString()`: `YYYY-MM-DDTHH:MM:SS.mmmZ`.
pub fn iso_from_ms(ms: i64) -> String {
    fgos_host_runtime::civil_time::format_unix_millis_rfc3339(ms, 0).unwrap_or_default()
}

/// `Date.parse` of an ISO-8601 timestamp; `None` where `Date.parse` gives NaN or the text names no zone.
pub fn ms_from_iso(text: &str) -> Option<i64> {
    fgos_execution::unit_record::parse_timestamp_ms(text.trim())
}
