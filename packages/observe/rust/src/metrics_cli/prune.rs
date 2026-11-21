//! `fgos metrics prune [--settled <kind:id>,...] [--apply]`: the CLI over the record prune door.
//!
//! Only records of kinds their declaration marks prunable are ever eligible: those older than the kind's retention,
//! and those whose subject a `--settled` reference names. Without `--apply` nothing changes and the answer lists
//! what would go.

use super::{parse_flags, RecordEnvironment};
use crate::contract::ObserveRequest;
use crate::record::store::RecordDoor;
use crate::record::types::SubjectRef;
use serde_json::{json, Value};

fn settled_subjects(references: &[&str]) -> Result<Vec<SubjectRef>, String> {
    references
        .iter()
        .flat_map(|text| text.split(','))
        .filter(|text| !text.is_empty())
        .map(|text| match text.split_once(':') {
            Some((kind, id)) if !kind.is_empty() && !id.is_empty() => Ok(SubjectRef {
                kind: kind.to_owned(),
                id: id.to_owned(),
            }),
            _ => Err(format!(
                "metrics prune: --settled needs <kind>:<id>, got {text}"
            )),
        })
        .collect()
}

pub fn dispatch_prune(req: &ObserveRequest, env: &dyn RecordEnvironment) -> Result<Value, String> {
    let flags = parse_flags("prune", &req.args, &["--settled"], &["--apply"], false)?;
    let settled = settled_subjects(&flags.values("--settled"))?;
    let apply = flags.switch("--apply");
    let door = RecordDoor::new(
        req.root.clone(),
        env.embedded_declarations(),
        env.payload_root(),
    );
    let report = door
        .prune(&settled, apply)
        .map_err(|e| format!("metrics prune: {e}"))?;
    Ok(json!({
        "ok": true,
        "applied": apply,
        "scanned": report.scanned,
        "prunableFound": report.prunable_found,
        "pruned": report.pruned,
        "ids": report.ids,
    }))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn settled_references_split_on_commas_and_need_kind_and_id() {
        let ok = settled_subjects(&["session:a,event:b", "plan:c"]).unwrap();
        assert_eq!(ok.len(), 3);
        assert_eq!(ok[1].kind, "event");
        assert!(settled_subjects(&["nokind"]).is_err());
        assert!(settled_subjects(&["session:"]).is_err());
    }
}
