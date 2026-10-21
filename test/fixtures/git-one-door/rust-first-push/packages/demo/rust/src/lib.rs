use std::process::Command;

pub struct Spec {
    pub argv: Vec<String>,
}

fn shaped(argv: &[String]) -> Vec<String> {
    let mut out = Vec::new();
    if let Some((program, rest)) = argv.split_first() {
        out.push(program.clone());
        out.extend(rest.iter().cloned());
    }
    out
}

fn run(spec: &Spec) -> std::io::Result<std::process::Child> {
    let argv = shaped(&spec.argv);
    Command::new(&argv[0]).args(&argv[1..]).spawn()
}

pub fn reset() -> std::io::Result<std::process::Child> {
    run(&Spec { argv: vec!["git".into(), "reset".into(), "--hard".into()] })
}
