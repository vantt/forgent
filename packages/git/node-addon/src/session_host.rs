//! Mechanical JSON binding of the head permission table's cage size: one door, `sessionHost`, until the launch
//! of a head is ported and nothing in Node needs to read it.
//!
//! `grantOf(persona)` answers `{writes, mailbox, peers}` for a persona a head can hold and `null` for any other
//! name; `personas()` lists the personas a head can hold. Both read `fgos_session_host::permissions`, the one
//! reader of `packages/session-host/contracts/head-permissions.v1.json`; this adds no rule of its own.
use crate::check;
use napi::Result;
use napi_derive::napi;
use serde_json::{json, Value};

fn cage(persona: &str) -> Value {
    if !fgos_session_host::permissions::personas().contains(&persona) {
        return Value::Null;
    }
    match fgos_session_host::permissions::cage_of(persona) {
        Some(c) => json!({"writes": c.writes, "mailbox": c.mailbox, "peers": c.peers}),
        None => Value::Null,
    }
}

#[allow(dead_code)] // exported through N-API
#[napi(namespace = "sessionHost", js_name = "grantOf")]
pub fn grant_of(persona: String) -> Result<Value> {
    check()?;
    Ok(cage(&persona))
}

#[allow(dead_code)] // exported through N-API
#[napi(namespace = "sessionHost", js_name = "personas")]
pub fn personas() -> Result<Value> {
    check()?;
    Ok(json!(fgos_session_host::permissions::personas()))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn a_head_persona_answers_its_cage_and_any_other_name_answers_null() {
        let secretary = cage("secretary");
        assert_eq!(secretary["mailbox"], true);
        assert_eq!(secretary["writes"][0], "plans");
        assert_eq!(cage("planner")["mailbox"], false);
        assert_eq!(cage("nobody"), Value::Null);
        // The shared base of the table is not a persona a role can name.
        assert_eq!(cage("head"), Value::Null);
    }
}
