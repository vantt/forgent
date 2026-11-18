//! The receipt hook where the Identity caller cannot be resolved (not unix): a hook call prints nothing and ends
//! with status 0.
use std::ffi::OsString;

pub fn main(_args: &[OsString]) -> ! {
    std::process::exit(0)
}
