//! Read-only rotation pointer. Process owns executor liveness; the lineage's normal rotate/answer path repairs it.
use super::{judged, Rows};
use fgos_distribution::doctor::{timed, RowOutcome};
use fgos_process::facts::{judge_here, Record, Verdict};
use serde_json::Value;
use std::path::Path;
use std::time::{Duration, Instant};

pub const GROUP: Rows = Rows {
    rows: &["session-rotation-orphans"],
    fixes: &[],
    judge: |root, ids| ids.iter().map(|_| timed(|| pointer(root))).collect(),
    fix: |_, _| Vec::new(),
};

fn pointer(root: &Path) -> RowOutcome {
    let dir = std::path::PathBuf::from(fgos_execution::runner_config::fgos_dir_from_root(
        &root.to_string_lossy(),
    ))
    .join("runtime/session-rotation");
    let next = "resolved on the lineage's next `fgos session rotate` or `session answered`";
    let scan = || -> Result<usize, String> {
        let started = Instant::now();
        let entries = match std::fs::read_dir(&dir) {
            Ok(entries) => entries,
            Err(e) if e.kind() == std::io::ErrorKind::NotFound => return Ok(0),
            Err(e) => return Err(e.to_string()),
        };
        let mut count = 0;
        for entry in entries {
            if started.elapsed() >= Duration::from_millis(250) {
                return Err("count exceeds the pointer's 250 ms budget".into());
            }
            let entry = entry.map_err(|e| e.to_string())?;
            if !entry.file_type().map_err(|e| e.to_string())?.is_dir() {
                continue;
            }
            let file = entry.path().join("rotation.json");
            let meta = match std::fs::symlink_metadata(&file) {
                Ok(meta) => meta,
                Err(e) if e.kind() == std::io::ErrorKind::NotFound => continue,
                Err(e) => return Err(e.to_string()),
            };
            if !meta.is_file() || meta.len() > 64 * 1024 {
                return Err("a pending rotation is not a bounded regular file".into());
            }
            let pending: Value =
                serde_json::from_slice(&std::fs::read(file).map_err(|e| e.to_string())?)
                    .map_err(|e| e.to_string())?;
            if pending
                .get("executor")
                .is_some_and(|r| judge_here(&Record::from_json(r)) == Verdict::Dead)
            {
                count += 1;
            }
        }
        Ok(count)
    };
    match scan() {
        Ok(0) => judged(true, "no pending rotations with a proven-dead executor"),
        Ok(n) => judged(
            true,
            format!("warning: {n} pending rotation(s) with a dead executor; {next}"),
        ),
        Err(why) => judged(
            true,
            format!("warning: pending rotation count unavailable ({why}); {next}"),
        ),
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::wiring::doctor::testkit::Fixture;
    use serde_json::json;

    fn message(root: &Path) -> String {
        let RowOutcome::Judged(row) = pointer(root) else {
            panic!("pointer must always be judged")
        };
        assert!(row.passed);
        row.message.unwrap()
    }

    #[test]
    fn the_pointer_counts_only_proven_dead_executors_warns_never_repairs_and_never_fails() {
        let fixture = Fixture::plain("rotation-pointer");
        assert_eq!(
            message(&fixture.repo),
            "no pending rotations with a proven-dead executor"
        );
        let base = fixture.repo.join(".fgos/runtime/session-rotation");
        let live = fgos_process::facts::self_identity()
            .unwrap()
            .to_record()
            .to_json();
        let mut dead = live.clone();
        dead["startTime"] = json!("not-this-process-start");
        for (name, record) in [
            ("dead", json!({"executor": dead})),
            ("live", json!({"executor": live})),
            ("unknown", json!({"executor": {}})),
            ("legacy", json!({"gen": 1})),
        ] {
            let dir = base.join(name);
            std::fs::create_dir_all(&dir).unwrap();
            std::fs::write(dir.join("rotation.json"), record.to_string()).unwrap();
        }
        let file = base.join("dead/rotation.json");
        let before = std::fs::read(&file).unwrap();
        let text = message(&fixture.repo);
        assert!(
            text.starts_with("warning: 1 pending rotation(s) with a dead executor"),
            "{text}"
        );
        assert!(text.contains("next `fgos session rotate` or `session answered`"));
        assert_eq!(std::fs::read(&file).unwrap(), before);
        assert_eq!(std::fs::read_dir(base.join("dead")).unwrap().count(), 1);
        std::fs::write(file, "{broken").unwrap();
        assert!(message(&fixture.repo).starts_with("warning: pending rotation count unavailable"));
        assert!(GROUP.fixes.is_empty());
    }
}
