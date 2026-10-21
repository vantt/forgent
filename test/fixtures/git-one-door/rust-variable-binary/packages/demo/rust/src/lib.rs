use std::process::Command;

fn run(program: &str, dir: &str) -> std::io::Result<std::process::Output> {
    Command::new(program).arg("-C").arg(dir).arg("checkout").arg("main").output()
}

pub fn switch_main(dir: &str) -> std::io::Result<std::process::Output> {
    let program = "git";
    run(program, dir)
}
