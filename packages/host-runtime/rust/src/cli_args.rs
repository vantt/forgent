//! The CLI argument parser, the Rust twin of `src/cli/parse-args.mjs`.
//!
//! Both read a call the same way: `--name value` takes the next token unless it starts with `--`, a bare
//! `--name` is `true`, everything else is positional in order. There is no `--name=value` form and no short
//! flag; `-h` is a positional here, as in Node. A repeated flag keeps its last use, except the repeatable
//! flags, which collect every use. The rows of `test/rust-host/fixtures/parse-args-vectors.json` are the shared
//! contract; Node reads the same file in `test/cli/parse-args-vectors.test.mjs`.

use std::ffi::OsString;

/// Flags given more than once collect every use into a list (`REPEATABLE_FLAGS` in `parse-args.mjs`).
pub const REPEATABLE_FLAGS: [&str; 2] = ["context-ref", "param"];

/// One use of a flag: bare, or with a value.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum FlagScalar {
    Bool,
    Str(String),
}

/// What a flag name maps to: its last use, or every use for a repeatable flag.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum FlagValue {
    One(FlagScalar),
    Many(Vec<FlagScalar>),
}

/// The flags in order of first appearance, and the positionals in order.
#[derive(Debug, Clone, Default, PartialEq, Eq)]
pub struct ParsedArgs {
    pub flags: Vec<(String, FlagValue)>,
    pub positional: Vec<String>,
}

impl ParsedArgs {
    pub fn flag(&self, name: &str) -> Option<&FlagValue> {
        self.flags
            .iter()
            .find(|(key, _)| key == name)
            .map(|(_, value)| value)
    }
}

#[derive(Debug, thiserror::Error, PartialEq, Eq)]
pub enum ParseArgsError {
    #[error("argument {index} is not valid UTF-8: {lossy:?}")]
    NonUtf8 { index: usize, lossy: String },
}

/// Reads `args` (the tokens after the verb, Node's `rest`) with Node's rules. A token that is not UTF-8 is refused by
/// position, never lossily converted.
pub fn parse_args(args: &[OsString]) -> Result<ParsedArgs, ParseArgsError> {
    let tokens = args
        .iter()
        .enumerate()
        .map(|(index, token)| {
            token.to_str().ok_or_else(|| ParseArgsError::NonUtf8 {
                index,
                lossy: token.to_string_lossy().into_owned(),
            })
        })
        .collect::<Result<Vec<&str>, _>>()?;
    let mut parsed = ParsedArgs::default();
    let mut i = 0;
    while i < tokens.len() {
        let Some(key) = tokens[i].strip_prefix("--") else {
            parsed.positional.push(tokens[i].to_owned());
            i += 1;
            continue;
        };
        let scalar = match tokens.get(i + 1) {
            Some(next) if !next.starts_with("--") => {
                i += 1;
                FlagScalar::Str((*next).to_owned())
            }
            _ => FlagScalar::Bool,
        };
        i += 1;
        record(&mut parsed.flags, key, scalar);
    }
    Ok(parsed)
}

fn record(flags: &mut Vec<(String, FlagValue)>, key: &str, scalar: FlagScalar) {
    // Assigning a non-object to `__proto__` is a no-op in JavaScript, so Node never records that flag.
    if key == "__proto__" {
        return;
    }
    let slot = flags.iter().position(|(name, _)| name == key);
    if REPEATABLE_FLAGS.contains(&key) {
        match slot.map(|at| &mut flags[at].1) {
            Some(FlagValue::Many(all)) => all.push(scalar),
            _ => flags.push((key.to_owned(), FlagValue::Many(vec![scalar]))),
        }
    } else if let Some(at) = slot {
        flags[at].1 = FlagValue::One(scalar);
    } else {
        flags.push((key.to_owned(), FlagValue::One(scalar)));
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::{json, Value};

    const VECTORS: &str =
        include_str!("../../../../test/rust-host/fixtures/parse-args-vectors.json");

    fn scalar_json(scalar: &FlagScalar) -> Value {
        match scalar {
            FlagScalar::Bool => json!(true),
            FlagScalar::Str(text) => json!(text),
        }
    }

    fn flags_json(parsed: &ParsedArgs) -> Value {
        let mut map = serde_json::Map::new();
        for (key, value) in &parsed.flags {
            map.insert(
                key.clone(),
                match value {
                    FlagValue::One(one) => scalar_json(one),
                    FlagValue::Many(many) => Value::Array(many.iter().map(scalar_json).collect()),
                },
            );
        }
        Value::Object(map)
    }

    #[test]
    fn every_shared_vector_row_parses_as_node_parses_it() {
        let doc: Value = serde_json::from_str(VECTORS).expect("vector file is JSON");
        let rows = doc["rows"].as_array().expect("rows array");
        assert!(!rows.is_empty());
        for row in rows {
            let name = row["name"].as_str().expect("row name");
            let argv: Vec<OsString> = row["argv"]
                .as_array()
                .expect("row argv")
                .iter()
                .map(|token| OsString::from(token.as_str().expect("argv token")))
                .collect();
            let parsed =
                parse_args(&argv).unwrap_or_else(|err| panic!("row {name:?} refused: {err}"));
            assert_eq!(flags_json(&parsed), row["flags"], "row {name:?} flags");
            assert_eq!(
                json!(parsed.positional),
                row["positional"],
                "row {name:?} positional"
            );
        }
    }

    #[test]
    fn flags_keep_first_appearance_order_when_a_flag_repeats() {
        let argv: Vec<OsString> = ["--a", "1", "--b", "2", "--a", "3"]
            .iter()
            .map(OsString::from)
            .collect();
        let parsed = parse_args(&argv).unwrap();
        let names: Vec<&str> = parsed.flags.iter().map(|(key, _)| key.as_str()).collect();
        assert_eq!(names, ["a", "b"]);
        assert_eq!(
            parsed.flag("a"),
            Some(&FlagValue::One(FlagScalar::Str("3".into())))
        );
    }

    #[cfg(unix)]
    #[test]
    fn a_token_that_is_not_utf8_is_refused_by_position() {
        use std::os::unix::ffi::OsStringExt;
        let argv = vec![
            OsString::from("start"),
            OsString::from_vec(vec![b'-', b'-', 0xff]),
        ];
        let err = parse_args(&argv).unwrap_err();
        assert_eq!(
            err,
            ParseArgsError::NonUtf8 {
                index: 1,
                lossy: "--\u{fffd}".into()
            }
        );
    }
}
