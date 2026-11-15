//! The Observe verbs' flags, read from the shared CLI parser (`fgos_host_runtime::cli_args`): `--key value`,
//! boolean switches and at most one positional. `--dir` (the target root, which the host resolves before the
//! verb runs) is skipped and `--json` is accepted as a no-op. An unknown flag, a missing value, a value given to
//! a switch or a bad number is an error, never a silent drop.

use fgos_host_runtime::cli_args::{parse_args, FlagScalar, FlagValue};
use std::ffi::OsString;
use std::str::FromStr;

#[derive(Debug, Default)]
pub struct Flags {
    values: Vec<(String, String)>,
    switches: Vec<String>,
    positional: Option<String>,
}

impl Flags {
    /// Reads `args` against the flags the verb takes. Each verb passes its own `"--flag"` literals so the
    /// flag-drift test can read them from the verb.
    pub fn parse(
        args: &[String],
        value_flags: &[&str],
        switch_flags: &[&str],
        takes_positional: bool,
    ) -> Result<Self, String> {
        let tokens: Vec<OsString> = args.iter().map(OsString::from).collect();
        let parsed = parse_args(&tokens).map_err(|error| error.to_string())?;
        let mut flags = Self::default();
        let mut words = parsed.positional.clone();
        for (key, value) in &parsed.flags {
            let name = format!("--{key}");
            if name == "--json" {
                // `--json` takes no value: a word the parser handed it is a word of the call.
                if let FlagValue::One(FlagScalar::Str(word)) = value {
                    words.push(word.clone());
                }
                continue;
            }
            if name == "--dir" {
                continue;
            }
            let FlagValue::One(scalar) = value else {
                return Err(format!("unknown option {name}"));
            };
            if value_flags.contains(&name.as_str()) {
                match scalar {
                    FlagScalar::Str(text) => flags.values.push((name, text.clone())),
                    FlagScalar::Bool => return Err(format!("missing value for {name}")),
                }
            } else if switch_flags.contains(&name.as_str()) {
                match scalar {
                    FlagScalar::Bool => flags.switches.push(name),
                    FlagScalar::Str(_) => return Err(format!("{name} takes no value")),
                }
            } else {
                return Err(format!("unknown option {name}"));
            }
        }
        for word in words {
            if !takes_positional || flags.positional.replace(word.clone()).is_some() {
                return Err(format!("unexpected argument {word}"));
            }
        }
        Ok(flags)
    }

    pub fn value(&self, flag: &str) -> Option<&str> {
        self.values
            .iter()
            .find(|(name, _)| name == flag)
            .map(|(_, value)| value.as_str())
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
            .map(|raw| {
                raw.parse::<T>()
                    .map_err(|_| format!("invalid value for {flag}: {raw}"))
            })
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
    fn values_switches_positional_and_global_flags_parse_one_way() {
        let flags = Flags::parse(
            &args(&[
                "--layer",
                "state",
                "--limit",
                "3",
                "--detail-stdin",
                "--dir",
                "/x",
                "--json",
                "work:a",
            ]),
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
        let parse = |list: &[&str], positional| {
            Flags::parse(&args(list), &["--limit"], &["--on"], positional)
        };
        assert_eq!(
            parse(&["--nope"], false).unwrap_err(),
            "unknown option --nope"
        );
        assert_eq!(
            parse(&["--limit"], false).unwrap_err(),
            "missing value for --limit"
        );
        assert_eq!(
            parse(&["--on=1"], false).unwrap_err(),
            "unknown option --on=1"
        );
        assert_eq!(
            parse(&["--limit=3"], false).unwrap_err(),
            "unknown option --limit=3"
        );
        assert_eq!(
            parse(&["--on", "1"], false).unwrap_err(),
            "--on takes no value"
        );
        assert_eq!(
            parse(&["stray"], false).unwrap_err(),
            "unexpected argument stray"
        );
        assert_eq!(
            parse(&["a", "b"], true).unwrap_err(),
            "unexpected argument b"
        );
        let bad = parse(&["--limit", "abc"], false).unwrap();
        assert_eq!(
            bad.number::<usize>("--limit").unwrap_err(),
            "invalid value for --limit: abc"
        );
    }
}
