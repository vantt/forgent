//! The one argument grammar of the Observe verbs: `--key value`, `--key=value`,
//! boolean switches and at most one positional. `--dir` (the target root, which
//! the host resolves before the verb runs) is skipped and `--json` is accepted
//! as a no-op. An unknown flag, a missing value or a bad number is an error,
//! never a silent drop.

use std::str::FromStr;

#[derive(Debug, Default)]
pub struct Flags {
    values: Vec<(String, String)>,
    switches: Vec<String>,
    positional: Option<String>,
}

impl Flags {
    /// Parses `args` against the flags the verb reads. Each verb passes its own
    /// `"--flag"` literals so the flag-drift test can read them from the verb.
    pub fn parse(
        args: &[String],
        value_flags: &[&str],
        switch_flags: &[&str],
        takes_positional: bool,
    ) -> Result<Self, String> {
        let mut flags = Self::default();
        let mut i = 0;
        while i < args.len() {
            let arg = args[i].as_str();
            i += 1;
            if !arg.starts_with("--") {
                if !takes_positional || flags.positional.replace(arg.to_string()).is_some() {
                    return Err(format!("unexpected argument {arg}"));
                }
                continue;
            }
            let (name, inline) = match arg.split_once('=') {
                Some((name, value)) => (name, Some(value)),
                None => (arg, None),
            };
            if name == "--json" && inline.is_none() {
                continue;
            }
            if name == "--dir" || value_flags.contains(&name) {
                let value = match inline {
                    Some(value) => value.to_string(),
                    None => {
                        let value = args.get(i).ok_or_else(|| format!("missing value for {name}"))?;
                        i += 1;
                        value.clone()
                    }
                };
                if name != "--dir" {
                    flags.values.push((name.to_string(), value));
                }
            } else if switch_flags.contains(&name) && inline.is_none() {
                flags.switches.push(name.to_string());
            } else {
                return Err(format!("unknown option {arg}"));
            }
        }
        Ok(flags)
    }

    pub fn value(&self, flag: &str) -> Option<&str> {
        self.values.iter().find(|(name, _)| name == flag).map(|(_, value)| value.as_str())
    }

    pub fn switch(&self, flag: &str) -> bool {
        self.switches.iter().any(|name| name == flag)
    }

    pub fn positional(&self) -> Option<&str> {
        self.positional.as_deref()
    }

    /// The flag's value as a number; absent is `None`, unparsable is an error.
    pub fn number<T: FromStr>(&self, flag: &str) -> Result<Option<T>, String> {
        self.value(flag)
            .map(|raw| raw.parse::<T>().map_err(|_| format!("invalid value for {flag}: {raw}")))
            .transpose()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn args(list: &[&str]) -> Vec<String> {
        list.iter().map(|s| s.to_string()).collect()
    }

    #[test]
    fn spaced_and_equals_values_switches_positional_and_global_flags_parse_one_way() {
        let flags = Flags::parse(
            &args(&["--layer", "state", "--limit=3", "--detail-stdin", "--dir", "/x", "--json", "work:a"]),
            &["--layer", "--limit"],
            &["--detail-stdin"],
            true,
        )
        .unwrap();
        assert_eq!(flags.value("--layer"), Some("state"));
        assert_eq!(flags.number::<usize>("--limit").unwrap(), Some(3));
        assert!(flags.switch("--detail-stdin"));
        assert_eq!(flags.positional(), Some("work:a"));
        assert_eq!(flags.value("--dir"), None);
    }

    #[test]
    fn unknown_flags_missing_values_bad_numbers_and_stray_positionals_are_named_errors() {
        let parse = |list: &[&str], positional| Flags::parse(&args(list), &["--limit"], &["--on"], positional);
        assert_eq!(parse(&["--nope"], false).unwrap_err(), "unknown option --nope");
        assert_eq!(parse(&["--limit"], false).unwrap_err(), "missing value for --limit");
        assert_eq!(parse(&["--on=1"], false).unwrap_err(), "unknown option --on=1");
        assert_eq!(parse(&["stray"], false).unwrap_err(), "unexpected argument stray");
        assert_eq!(parse(&["a", "b"], true).unwrap_err(), "unexpected argument b");
        let bad = parse(&["--limit", "abc"], false).unwrap();
        assert_eq!(bad.number::<usize>("--limit").unwrap_err(), "invalid value for --limit: abc");
    }
}
