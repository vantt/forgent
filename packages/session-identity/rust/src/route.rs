//! `fgos internal identity <op>`: the Node payload's door to the writer-id
//! rules it must not copy. One operation: `mint-attempt --attempt <id>
//! --protocol 1`, which prints `{"writerId":"att-<id>"}`.

use crate::attempt::{mint_attempt_writer_id, InvalidAttemptId};
use serde_json::json;

pub const EXIT_USAGE: i32 = 2;
pub const EXIT_VERSION_MISMATCH: i32 = 3;
/// The attempt id fails the contract; stderr carries `invalid-attempt-id`.
pub const EXIT_INVALID_ATTEMPT_ID: i32 = 65;

/// Run the route with the args after `identity`; returns the exit code.
pub fn main(args: &[String]) -> i32 {
    match args.first().map(String::as_str) {
        Some("mint-attempt") => mint_attempt(&args[1..]),
        other => {
            eprintln!("fgos internal identity: unknown operation {:?}; expected mint-attempt", other.unwrap_or(""));
            EXIT_USAGE
        }
    }
}

fn mint_attempt(args: &[String]) -> i32 {
    let mut attempt: Option<&str> = None;
    let mut protocol: Option<&str> = None;
    let mut iter = args.iter();
    while let Some(arg) = iter.next() {
        let slot = match arg.as_str() {
            "--attempt" => &mut attempt,
            "--protocol" => &mut protocol,
            other => {
                eprintln!("fgos internal identity mint-attempt: unknown argument {other}");
                return EXIT_USAGE;
            }
        };
        match iter.next() {
            Some(value) => *slot = Some(value),
            None => {
                eprintln!("fgos internal identity mint-attempt: {arg} needs a value");
                return EXIT_USAGE;
            }
        }
    }
    if protocol != Some("1") {
        eprintln!("fgos internal identity mint-attempt: needs --protocol 1");
        return EXIT_VERSION_MISMATCH;
    }
    let Some(attempt) = attempt else {
        eprintln!("fgos internal identity mint-attempt: needs --attempt <id>");
        return EXIT_USAGE;
    };
    match mint_attempt_writer_id(attempt) {
        Ok(writer_id) => {
            println!("{}", json!({ "writerId": writer_id }));
            0
        }
        Err(InvalidAttemptId) => {
            eprintln!("{}", InvalidAttemptId::NAME);
            EXIT_INVALID_ATTEMPT_ID
        }
    }
}
