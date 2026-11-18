//! The rotation hook where a head request socket cannot exist (not unix): a hook call prints nothing and ends with
//! status 0.
use std::ffi::OsString;

pub fn main(_args: &[OsString]) -> ! {
    std::process::exit(0)
}
