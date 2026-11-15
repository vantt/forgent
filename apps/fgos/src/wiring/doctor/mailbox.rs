//! The mailbox doctor rows and the two managed-timer rows and fixes beside them. `mailbox-hook` is a pointer row:
//! it reads the project's opt-in through the packaging layer's one reader and, when the project opted in, the
//! same record verdict `fgos mailbox status` answers (`mailbox_verbs::status_for_root`), in process. The timer
//! rows and fixes call `fgos_distribution::timer`, which owns the unit bytes and the scheduler calls.

use super::{project_root_refusal, Rows};
use crate::wiring::mailbox_verbs;
use fgos_distribution::agent_hooks::{mailbox_opt_in, refused_config_name, MailboxOptIn};
use fgos_distribution::doctor::{FixResult, RowOutcome, RowResult};
use fgos_distribution::timer::{
    check_managed_timer, fix_managed_timer, Check, Fix, Schedule, TimerEnv,
};
use serde_json::Value;
use std::path::Path;

pub const ROWS: &[&str] = &["mailbox-hook", "mailbox-sync-timer", "account-probe-timer"];
pub const FIXES: &[&str] = &["mailbox-sync-timer", "account-probe-timer"];

pub const GROUP: Rows = Rows {
    rows: ROWS,
    fixes: FIXES,
    judge,
    fix,
};

fn judge(root: &Path, ids: &[&str]) -> Vec<RowOutcome> {
    ids.iter()
        .map(|id| match *id {
            "mailbox-hook" => mailbox_hook(root),
            "mailbox-sync-timer" => timer_row(Schedule::MailboxSync, root),
            "account-probe-timer" => timer_row(Schedule::AccountProbe, root),
            other => unreachable!("mailbox group asked for row {other}"),
        })
        .collect()
}

fn fix(root: &Path, ids: &[&str]) -> Vec<FixResult> {
    ids.iter()
        .map(|id| match *id {
            "mailbox-sync-timer" => timer_fix(id, Schedule::MailboxSync, root),
            "account-probe-timer" => timer_fix(id, Schedule::AccountProbe, root),
            other => unreachable!("mailbox group asked for fix {other}"),
        })
        .collect()
}

fn judged(passed: bool, message: String) -> RowOutcome {
    RowOutcome::Judged(RowResult {
        passed,
        status: None,
        message: Some(message),
        fix_command: None,
        detail: None,
    })
}

// The timer rows and fixes ---------------------------------------------------------------------------------

fn timer_row(schedule: Schedule, root: &Path) -> RowOutcome {
    if let Some(refusal) = project_root_refusal(root) {
        return judged(false, refusal.to_owned());
    }
    let Some(env) = TimerEnv::system() else {
        return judged(
            false,
            "no home directory is known, so the managed timers cannot be read".to_owned(),
        );
    };
    match check_managed_timer(schedule, root, &env) {
        Ok(Check { passed, message }) => judged(passed, message),
        // The config door failed: the row fails with the cause, as it always did.
        Err(failure) => judged(false, failure),
    }
}

/// A timer fix answers `{ fixed, message }` and says nothing about `changed`, as its report entry always did.
fn timer_fix(id: &str, schedule: Schedule, root: &Path) -> FixResult {
    if let Some(refusal) = project_root_refusal(root) {
        return FixResult::done(id, false, refusal);
    }
    let Some(env) = TimerEnv::system() else {
        return FixResult::done(
            id,
            false,
            "no home directory is known, so the managed timers cannot be written",
        );
    };
    match fix_managed_timer(schedule, root, &env) {
        Ok(Fix { message, .. }) => FixResult {
            id: id.to_owned(),
            changed: None,
            message: Some(message),
        },
        Err(failure) => FixResult::done(id, false, failure),
    }
}

// mailbox-hook (pointer) -----------------------------------------------------------------------------------

const ENABLED: &str = "enabled: the Claude Code and Codex hook checks require the mailbox rows; limits: fgos config show --path mailbox (the standard is fgos config standard --path mailbox)";

fn mailbox_hook(root: &Path) -> RowOutcome {
    if let Some(refusal) = project_root_refusal(root) {
        return judged(false, refusal.to_owned());
    }
    match mailbox_opt_in(root, &|key| std::env::var(key).ok()) {
        Ok(opt_in) => hook_row(opt_in, || mailbox_verbs::status_for_root(root).data),
        Err(failure) => judged(
            false,
            format!("the mailbox opt-in could not be read: {failure}"),
        ),
    }
}

/// The row for one opt-in; `status` is the record's answer, read only when the project opted in.
fn hook_row(opt_in: MailboxOptIn, status: impl FnOnce() -> Value) -> RowOutcome {
    match opt_in {
        // The config rows already fail and name a refused config; this row only says why it cannot tell.
        MailboxOptIn::Refused { reason, file, .. } => judged(
            true,
            format!(
                "opt-in unknown: {} is refused ({reason}{}); the config rows name it, and fgos doctor --fix leaves the mailbox hook rows as they are",
                refused_config_name(file.as_deref()),
                file.as_deref().map_or(String::new(), |f| format!(" in {f}")),
            ),
        ),
        MailboxOptIn::Off => judged(
            true,
            "not enabled: mailbox.enabled is false in the config; set it to true (fgos config set), then run fgos doctor --fix, to install the mailbox hook rows".to_owned(),
        ),
        MailboxOptIn::On => {
            let (passed, message) = record_verdict(&status());
            judged(passed, message)
        }
    }
}

/// What JavaScript prints for a value in a template: the word for a missing one, the text of a string, a number
/// as written.
fn shown(value: Option<&Value>) -> String {
    match value {
        None => "undefined".to_owned(),
        Some(Value::String(text)) => text.clone(),
        Some(other) => other.to_string(),
    }
}

/// A value the way JavaScript tests it for truth: not absent, null, false, zero or an empty string.
fn truthy(value: Option<&Value>) -> bool {
    match value {
        None | Some(Value::Null) | Some(Value::Bool(false)) => false,
        Some(Value::String(text)) => !text.is_empty(),
        Some(Value::Number(number)) => number.as_f64().is_some_and(|n| n != 0.0),
        Some(_) => true,
    }
}

/// The row for a project that opted in, from the data `mailbox status --json` carries. An unreadable or untrusted
/// record stops send, inbox and hook delivery: readiness, so the row fails and names the verb.
fn record_verdict(data: &Value) -> (bool, String) {
    let record = data.get("record");
    // No record field: the verb found no record directory to read here (not a repository, no .fgos), and says
    // so in its text.
    if !truthy(record) {
        let text = data.get("text").filter(|text| !text.is_null());
        return (
            true,
            format!(
                "{ENABLED}; record not checked: {}",
                text.map_or("no answer".to_owned(), |text| shown(Some(text)))
            ),
        );
    }
    let record = shown(record);
    match record.as_str() {
        "none" => (
            true,
            format!("{ENABLED}; record: none yet (no hook has run in this project)"),
        ),
        "ok" => {
            let outcome = data
                .pointer("/hookOutcome/reason")
                .filter(|reason| truthy(Some(reason)))
                .map_or(String::new(), |reason| {
                    format!(", last hook outcome {}", shown(Some(reason)))
                });
            let pending = data
                .pointer("/signals/queue/pending")
                .filter(|pending| !pending.is_null());
            (
                true,
                format!(
                    "{ENABLED}; record: ok ({} head(s), {} pending{outcome}){}",
                    shown(data.get("heads")),
                    pending.map_or("0".to_owned(), |pending| shown(Some(pending))),
                    cross_machine_note(data.get("crossMachine")),
                ),
            )
        }
        other => (
            false,
            format!("enabled, but the mailbox record cannot be read: {other}; run `fgos mailbox status`"),
        ),
    }
}

/// What the row says about cross-machine mail, from the `crossMachine` object of `mailbox status --json` (present
/// only when `mailbox.crossMachine.enabled`): the counts, and a warning that names the key to confirm.
fn cross_machine_note(cross: Option<&Value>) -> String {
    let Some(cross) = cross.filter(|cross| truthy(Some(cross))) else {
        return String::new();
    };
    let refused: f64 = cross
        .get("refused")
        .and_then(Value::as_object)
        .map_or(0.0, |counts| {
            counts.values().filter_map(Value::as_f64).sum::<f64>()
        });
    let counts = format!(
        "cross-machine: {} sent, {} offered, {} with no answer yet, {refused} refused",
        shown(cross.get("sent")),
        shown(cross.get("offered")),
        shown(cross.get("waiting")),
    );
    let unconfirmed: Vec<&str> = cross
        .get("unconfirmedMachines")
        .and_then(Value::as_array)
        .map_or(Vec::new(), |machines| {
            machines.iter().filter_map(Value::as_str).collect()
        });
    if unconfirmed.is_empty() {
        return format!("; {counts}");
    }
    format!(
        "; {counts}; warning: mail from {} is held until you confirm its key (fgos identity pins --confirm <machine-id> --fingerprint <fingerprint>)",
        unconfirmed.join(", ")
    )
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn the_row_says_why_it_cannot_tell_when_the_config_is_refused_and_reads_no_record_when_the_project_opted_out(
    ) {
        let never = || -> Value { panic!("the record is read only for a project that opted in") };
        let refused = |file: Option<&str>| MailboxOptIn::Refused {
            reason: "config:config-schema".to_owned(),
            code: "config-schema".to_owned(),
            file: file.map(str::to_owned),
        };
        let say = |outcome: RowOutcome| match outcome {
            RowOutcome::Judged(row) => {
                assert!(row.passed);
                row.message.unwrap()
            }
            RowOutcome::Unavailable { message, .. } => panic!("{message}"),
        };
        assert_eq!(
            say(hook_row(refused(Some("project:config.yaml")), never)),
            "opt-in unknown: the project config is refused (config:config-schema in project:config.yaml); the config rows name it, and fgos doctor --fix leaves the mailbox hook rows as they are"
        );
        assert!(say(hook_row(refused(Some("global:config.yaml")), never)).starts_with("opt-in unknown: the global config is refused (config:config-schema in global:config.yaml)"));
        assert!(say(hook_row(refused(None), never))
            .starts_with("opt-in unknown: a config file is refused (config:config-schema)"));
        let off = say(hook_row(MailboxOptIn::Off, never));
        assert!(
            off.starts_with("not enabled: mailbox.enabled is false in the config;"),
            "{off}"
        );
        let on = say(hook_row(MailboxOptIn::On, || json!({ "record": "none" })));
        assert!(
            on.starts_with(
                "enabled: the Claude Code and Codex hook checks require the mailbox rows;"
            ),
            "{on}"
        );
    }

    #[test]
    fn cross_machine_mail_is_worded_with_counts_and_names_every_unconfirmed_key() {
        assert_eq!(cross_machine_note(None), "");
        assert_eq!(
            cross_machine_note(Some(&json!({
                "sent": 2, "offered": 1, "waiting": 1, "refused": { "unknown-name": 1 }, "unconfirmedMachines": []
            }))),
            "; cross-machine: 2 sent, 1 offered, 1 with no answer yet, 1 refused"
        );
        let held = cross_machine_note(Some(&json!({
            "sent": 0, "offered": 0, "waiting": 0, "refused": {}, "unconfirmedMachines": ["fg-server-sqs7es"]
        })));
        assert!(
            held.contains("0 refused; warning: mail from fg-server-sqs7es is held until you confirm its key (fgos identity pins --confirm <machine-id> --fingerprint <fingerprint>)"),
            "{held}"
        );
    }

    #[test]
    fn a_record_that_cannot_be_read_fails_the_row_and_names_the_verb() {
        let (passed, text) = record_verdict(&json!({ "record": "untrusted-dir" }));
        assert!(!passed);
        assert_eq!(
            text,
            "enabled, but the mailbox record cannot be read: untrusted-dir; run `fgos mailbox status`"
        );
    }

    #[test]
    fn an_answer_with_no_record_says_the_record_was_not_checked_and_why() {
        let (passed, text) = record_verdict(&json!({ "ok": false, "text": "no repository here" }));
        assert!(passed);
        assert!(
            text.ends_with("; record not checked: no repository here"),
            "{text}"
        );
        let (_, unexplained) = record_verdict(&json!({ "ok": false }));
        assert!(
            unexplained.ends_with("; record not checked: no answer"),
            "{unexplained}"
        );
        let (_, empty) = record_verdict(&json!({ "record": "", "text": null }));
        assert!(
            empty.ends_with("; record not checked: no answer"),
            "{empty}"
        );
    }

    #[test]
    fn a_record_with_no_hook_yet_passes_and_a_good_one_counts_heads_pending_and_the_last_outcome() {
        let (passed, none) = record_verdict(&json!({ "record": "none" }));
        assert!(passed);
        assert!(none.ends_with("; record: none yet (no hook has run in this project)"));
        let (passed, ok) = record_verdict(&json!({
            "record": "ok", "heads": 3, "signals": { "queue": { "pending": 2 } },
            "hookOutcome": { "reason": "delivered" }
        }));
        assert!(passed);
        assert!(
            ok.ends_with("; record: ok (3 head(s), 2 pending, last hook outcome delivered)"),
            "{ok}"
        );
        let (_, bare) = record_verdict(&json!({ "record": "ok", "heads": 0, "hookOutcome": null }));
        assert!(
            bare.ends_with("; record: ok (0 head(s), 0 pending)"),
            "{bare}"
        );
    }

    #[test]
    fn a_project_the_mailbox_cannot_find_a_record_directory_for_is_not_checked_and_still_passes() {
        let dir = std::env::temp_dir().join(format!("fgos-doctor-mailbox-{}", std::process::id()));
        std::fs::create_dir_all(&dir).unwrap();
        let answer = mailbox_verbs::status_for_root(&dir);
        let (passed, text) = record_verdict(&answer.data);
        assert!(passed, "{text}");
        assert!(text.contains("; record not checked: "), "{text}");
        std::fs::remove_dir_all(&dir).unwrap();
    }

    #[test]
    fn the_group_names_exactly_the_rows_and_fixes_the_registry_gives_to_the_mailbox_and_its_timers()
    {
        let registry = crate::wiring::doctor::registry().unwrap();
        let mine =
            |id: &str| ["mailbox-hook", "mailbox-sync-timer", "account-probe-timer"].contains(&id);
        let mut rows: Vec<&str> = registry
            .rows
            .iter()
            .map(|r| r.id.as_str())
            .filter(|id| mine(id))
            .collect();
        rows.sort_unstable();
        let mut asked = ROWS.to_vec();
        asked.sort_unstable();
        assert_eq!(rows, asked);
        let mut fixes: Vec<&str> = registry
            .fixes
            .iter()
            .map(|f| f.id.as_str())
            .filter(|id| mine(id))
            .collect();
        fixes.sort_unstable();
        let mut run = FIXES.to_vec();
        run.sort_unstable();
        assert_eq!(fixes, run);
        // A pointer row stays one.
        assert!(
            registry
                .rows
                .iter()
                .find(|r| r.id == "mailbox-hook")
                .unwrap()
                .pointer
        );
    }
}
