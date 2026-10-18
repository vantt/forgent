//! What every `fgos internal <route>` of this crate shares: the exit codes of
//! `internal-route.run-supervisor.v1.json`, flag parsing and machine output.

use std::io::Write;

pub const EXIT_USAGE: i32 = 2;
pub const EXIT_VERSION_MISMATCH: i32 = 3;
pub const EXIT_ENVELOPE_INVALID: i32 = 65;
pub const EXIT_PAYLOAD_MISSING: i32 = 66;
pub const EXIT_INTERNAL: i32 = 70;
/// `supervise` refused because the attempt was already handed to a supervisor.
pub const EXIT_ATTEMPT_BOUND: i32 = 71;

/// Why argv was refused; `exit_code` says which code the route ends with.
#[derive(Debug, PartialEq, Eq)]
pub enum ArgsError {
    Usage(String),
    VersionMismatch,
}

/// Flags of one route: `--name value` pairs after the positionals. Every
/// route requires `--protocol 1`.
#[derive(Debug, Default, PartialEq, Eq)]
pub struct Flags {
    pub positional: Vec<String>,
    values: Vec<(String, String)>,
}

impl Flags {
    pub fn parse(args: &[String], allowed: &[&str], positional: usize) -> Result<Flags, ArgsError> {
        Self::parse_with_switches(args, allowed, &[], positional)
    }

    /// [`Flags::parse`] where the names in `switches` take no value; `get`
    /// returns `"true"` for a switch that was given.
    pub fn parse_with_switches(args: &[String], allowed: &[&str], switches: &[&str], positional: usize) -> Result<Flags, ArgsError> {
        let mut flags = Flags::default();
        let mut iter = args.iter();
        while let Some(arg) = iter.next() {
            if let Some(name) = arg.strip_prefix("--") {
                if switches.contains(&name) {
                    flags.values.push((name.to_string(), "true".to_string()));
                    continue;
                }
                if name != "protocol" && !allowed.contains(&name) {
                    return Err(ArgsError::Usage(format!("unknown flag {arg}")));
                }
                let value = iter.next().ok_or_else(|| ArgsError::Usage(format!("{arg} needs a value")))?;
                flags.values.push((name.to_string(), value.clone()));
            } else if flags.positional.len() < positional {
                flags.positional.push(arg.clone());
            } else {
                return Err(ArgsError::Usage(format!("unexpected argument {arg}")));
            }
        }
        if flags.get("protocol") != Some("1") {
            return Err(ArgsError::VersionMismatch);
        }
        Ok(flags)
    }

    pub fn get(&self, name: &str) -> Option<&str> {
        self.values.iter().find(|(n, _)| n == name).map(|(_, v)| v.as_str())
    }

    pub fn require(&self, name: &str) -> Result<&str, ArgsError> {
        self.get(name).ok_or_else(|| ArgsError::Usage(format!("--{name} is required")))
    }
}

/// The exit code of an argv refusal, after printing its output.
pub fn refuse(route: &str, err: ArgsError) -> i32 {
    match err {
        ArgsError::Usage(why) => {
            let _ = writeln!(std::io::stderr(), "fgos internal {route}: usage: {why}");
            EXIT_USAGE
        }
        ArgsError::VersionMismatch => {
            report(route, "host-version-mismatch", "--protocol 1 is required");
            EXIT_VERSION_MISMATCH
        }
    }
}

/// One JSON object on stdout, one line of free text on stderr. A closed
/// stdout or stderr must not turn the named exit code into a panic.
pub fn report(route: &str, code: &str, why: &str) {
    let _ = writeln!(std::io::stdout(), "{}", serde_json::json!({"v": 1, "protocol": 1, "result": "error", "code": code}));
    let _ = writeln!(std::io::stderr(), "fgos internal {route}: {code}: {why}");
}

/// A successful result line: `{"v":1,"protocol":1,...fields}`.
pub fn emit(fields: serde_json::Value) {
    let mut line = serde_json::json!({"v": 1, "protocol": 1});
    if let (Some(base), Some(extra)) = (line.as_object_mut(), fields.as_object()) {
        base.extend(extra.clone());
    }
    let _ = writeln!(std::io::stdout(), "{line}");
}

/// `--probe`: answer that this host binary serves `route` at protocol 1 and
/// name the containment driver it would run here, then do nothing else. Doctor
/// uses it to learn what the installed host can do without starting an attempt.
fn probe(route: &str, args: &[String]) -> i32 {
    if let Err(err) = Flags::parse_with_switches(args, &[], &["probe"], 0) {
        return refuse(route, err);
    }
    let containment = match fgos_process::containment::select(&fgos_process::containment::SelectEnv::default()) {
        Ok(driver) => {
            let guarantee = driver.guarantee();
            let level = match guarantee.level {
                fgos_process::containment::GuaranteeLevel::Kernel => "kernel",
                fgos_process::containment::GuaranteeLevel::BestEffort => "best-effort",
                fgos_process::containment::GuaranteeLevel::Unsupported => "unsupported",
            };
            serde_json::json!({"driver": guarantee.driver, "level": level, "escapes": guarantee.escapes})
        }
        Err(err) => serde_json::json!({"driver": null, "level": "unsupported", "escapes": [], "error": err.name()}),
    };
    emit(serde_json::json!({"result": "ok", "route": route, "containment": containment}));
    0
}

/// Dispatch `fgos internal <route> ...` for the routes this crate owns.
/// `None`: the route is not one of ours.
pub fn main(route: &str, args: &[String]) -> Option<i32> {
    if !matches!(route, "supervise" | "gate" | "adopt" | "attempt-step") {
        return None;
    }
    if args.iter().any(|arg| arg == "--probe") {
        return Some(probe(route, args));
    }
    Some(match route {
        "supervise" => crate::supervise::run(args),
        "gate" => crate::gate::run(args),
        "adopt" => crate::adopt::run(args),
        _ => crate::attempt_step::run(args),
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    fn argv(items: &[&str]) -> Vec<String> {
        items.iter().map(|s| s.to_string()).collect()
    }

    #[test]
    fn probe_needs_protocol_one() {
        assert_eq!(probe("supervise", &argv(&["--probe"])), EXIT_VERSION_MISMATCH);
        assert_eq!(probe("supervise", &argv(&["--probe", "--protocol", "1"])), 0);
    }

    #[test]
    fn probe_refuses_a_stray_flag() {
        assert_eq!(probe("adopt", &argv(&["--probe", "--protocol", "1", "--nope", "x"])), EXIT_USAGE);
    }

    #[test]
    fn other_routes_are_not_ours() {
        assert_eq!(main("lock-fd", &argv(&["--probe"])), None);
    }
}
