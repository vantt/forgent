//! The terminal outcome a pattern's settled history establishes, without dispatching anything. Incomplete
//! history cannot establish completion and stays unknown (`None`). Read from the seats a unit record lists (or,
//! for a pre-fence record, the seats the legacy read derives), by seat id.

use super::reviewed::reviewed_history_outcome;
use super::verify::verify_command_of;
use super::{outcome_of, round_is, seat_id, seat_is};
use crate::outcome::is_error_outcome;
use crate::seat_resolver::value::truthy;
use crate::seat_resolver::{SeatResolutionError, VERIFY_SEAT};
use serde_json::Value;

fn seat_result<'a>(history: &'a [Value], seat: &str, round: u64) -> Option<&'a Value> {
    history
        .iter()
        .find(|h| seat_is(h, seat) && round_is(h, round))
}

fn role_is(seat: &Value, role: &str) -> bool {
    seat.get("role").and_then(Value::as_str) == Some(role)
}

fn debate_outcome(params: &Value, seats: &[Value], history: &[Value]) -> Option<String> {
    let sides: Vec<String> = seats
        .iter()
        .filter(|s| role_is(s, "producer"))
        .map(seat_id)
        .collect();
    let judge = seats.iter().find(|s| role_is(s, "judge")).map(seat_id);
    let rounds: &[u64] = if params.get("rebuttal") == Some(&Value::Bool(false)) {
        &[1]
    } else {
        &[1, 2]
    };
    let side_results: Vec<Option<&Value>> = rounds
        .iter()
        .flat_map(|round| sides.iter().map(move |side| (side, *round)))
        .map(|(side, round)| seat_result(history, side, round))
        .collect();
    if side_results.iter().any(Option::is_none) {
        // A side that ended in error ends the debate at that round.
        return side_results
            .iter()
            .flatten()
            .find(|r| is_error_outcome(outcome_of(r)))
            .map(|r| outcome_of(r).to_string());
    }
    if let Some(error) = side_results
        .iter()
        .flatten()
        .find(|r| is_error_outcome(outcome_of(r)))
    {
        return Some(outcome_of(error).to_string());
    }
    judge
        .and_then(|j| seat_result(history, &j, 1))
        .map(|r| outcome_of(r).to_string())
}

fn panel_outcome(seats: &[Value], history: &[Value]) -> Option<String> {
    let members: Vec<Option<&Value>> = seats
        .iter()
        .filter(|s| {
            s.get("posture")
                .and_then(|p| p.get("stance"))
                .is_some_and(truthy)
        })
        .map(|s| history.iter().find(|h| seat_is(h, &seat_id(s))))
        .collect();
    if members.iter().any(Option::is_none) {
        return None;
    }
    if let Some(error) = members
        .iter()
        .flatten()
        .find(|r| is_error_outcome(outcome_of(r)))
    {
        return Some(outcome_of(error).to_string());
    }
    let synthesizer = seats.iter().find(|s| role_is(s, "synthesizer"))?;
    let id = seat_id(synthesizer);
    history
        .iter()
        .find(|h| seat_is(h, &id))
        .map(|r| outcome_of(r).to_string())
}

fn solo_outcome(unit: &Value, cfg: &Value, seats: &[Value], history: &[Value]) -> Option<String> {
    let producer = seats
        .first()
        .map_or_else(|| "producer".to_string(), seat_id);
    let prod = seat_result(history, &producer, 1)
        .or_else(|| history.iter().find(|h| seat_is(h, &producer)));
    if verify_command_of(unit, cfg).is_none() {
        return prod.map(|p| outcome_of(p).to_string());
    }
    let prod = prod?;
    if outcome_of(prod) != "pass" {
        return Some(outcome_of(prod).to_string());
    }
    let ver = seat_result(history, VERIFY_SEAT, 1)
        .or_else(|| history.iter().find(|h| seat_is(h, VERIFY_SEAT)));
    ver.map(|v| outcome_of(v).to_string())
}

/// What a pattern's settled history establishes: `loop_name` is solo, reviewed, panel or debate; `history` is the
/// final settled record per seat and round; `seats` the seats the unit had.
pub fn pattern_history_outcome(
    loop_name: &str,
    params: &Value,
    unit: &Value,
    cfg: &Value,
    seats: &[Value],
    history: &[Value],
) -> Result<Option<String>, SeatResolutionError> {
    Ok(match loop_name {
        "reviewed" => reviewed_history_outcome(unit, cfg, history, params, seats)?,
        "solo" => solo_outcome(unit, cfg, seats, history),
        "debate" => debate_outcome(params, seats, history),
        "panel" => panel_outcome(seats, history),
        _ => None,
    })
}
