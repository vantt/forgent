use runner::{spawn, Spec};

pub fn reset() -> std::io::Result<std::process::Child> {
    spawn(&Spec { argv: vec!["git".into(), "reset".into(), "--hard".into()] })
}
