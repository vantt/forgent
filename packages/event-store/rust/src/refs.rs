//! Literal own-ref naming shared by seal, promote and synchronization.
use crate::{
    envelope::Scope,
    errors::{invalid, Error},
    identity::valid_machine_id,
    layout::StreamId,
};
use fgos_git::RefName;
pub fn own_ref(machine: &str, stream: &StreamId) -> Result<RefName, Error> {
    if !valid_machine_id(machine) {
        return Err(invalid("invalid ref machine"));
    }
    let name = match stream.scope() {
        Scope::Project => format!("refs/fgos/events/{machine}"),
        Scope::Local => format!("refs/fgos/local-events/{machine}"),
        Scope::Branch => format!(
            "refs/fgos/branch-events/{machine}/{}",
            stream.as_str().strip_prefix("branch:").unwrap()
        ),
    };
    RefName::parse(&name).map_err(|e| invalid(e.to_string()))
}
