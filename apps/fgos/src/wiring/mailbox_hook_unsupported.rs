//! The mailbox hook where the record cannot be served (not unix): a hook call
//! prints nothing and ends with status 0, like a call with no mail.
use std::ffi::OsString;

pub fn main(_args: &[OsString]) -> ! {
    std::process::exit(0)
}
