//! The mailbox sync child where the record cannot be served (not unix): the
//! hook never starts it there, and a manual call prints nothing and ends with
//! status 0.
use std::ffi::OsString;

pub fn main(_args: &[OsString]) -> ! {
    std::process::exit(0)
}
