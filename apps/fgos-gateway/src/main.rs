use std::io;

use herdr_fgos_common::fgos;

fn main() -> io::Result<()> {
    let root = fgos::repo_root()?;
    fgos_gateway::gateway::run(root)
}
