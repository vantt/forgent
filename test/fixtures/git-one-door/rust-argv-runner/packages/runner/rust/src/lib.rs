use std::process::Command;

pub struct Spec {
    pub argv: Vec<String>,
}

pub fn spawn(spec: &Spec) -> std::io::Result<std::process::Child> {
    Command::new(&spec.argv[0]).args(&spec.argv[1..]).spawn()
}
