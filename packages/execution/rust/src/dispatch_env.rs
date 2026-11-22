//! The dispatch environment of a process: how deep in a chain of dispatches it runs (`FGOS_DISPATCH_DEPTH`) and
//! the case a worker was launched into (`FGOS_CASE_ID`, `FGOS_CASE_RESERVATION`).

pub const DISPATCH_DEPTH_ENV: &str = "FGOS_DISPATCH_DEPTH";
pub const MAX_DISPATCH_DEPTH: u32 = 3;
/// The case a worker was launched into. Only the door sets these, from the reservation it admitted.
pub const CASE_ID_ENV: &str = "FGOS_CASE_ID";
pub const CASE_RESERVATION_ENV: &str = "FGOS_CASE_RESERVATION";

/// The two variables a worker admitted into a case carries.
pub fn case_context_env(case_id: &str, reservation_id: &str) -> [(&'static str, String); 2] {
    [
        (CASE_ID_ENV, case_id.to_string()),
        (CASE_RESERVATION_ENV, reservation_id.to_string()),
    ]
}

/// The dispatch depth `raw` (the value of [`DISPATCH_DEPTH_ENV`]) names: a finite number of at least zero, else
/// zero. Read as `Number(raw)` reads it, so a fractional depth is kept.
pub fn dispatch_depth_of(raw: Option<&str>) -> f64 {
    let Some(raw) = raw.filter(|text| !text.is_empty()) else {
        return 0.0;
    };
    let trimmed = raw.trim();
    if trimmed.is_empty() {
        return 0.0;
    }
    match trimmed.parse::<f64>() {
        Ok(n) if n.is_finite() && n >= 0.0 => n,
        _ => 0.0,
    }
}

pub fn current_dispatch_depth() -> f64 {
    dispatch_depth_of(std::env::var(DISPATCH_DEPTH_ENV).ok().as_deref())
}
