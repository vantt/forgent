use fgos_event_store::{
    layout::Layout,
    locks::{lock_path, APPEND_NAME, APPEND_RANK, SEAL_NAME, SEAL_RANK},
};
use serde_json::Value;
#[test]
fn rust_paths_names_and_ranks_match_shared_registry() {
    let v: Value = serde_json::from_str(include_str!(
        "../../../holder-lock/contracts/lock-registry.v1.json"
    ))
    .unwrap();
    let tmp = std::env::temp_dir();
    let layout = Layout::from_common_dir(Some(&tmp)).unwrap();
    for (name, rank, seal) in [
        (APPEND_NAME, APPEND_RANK, false),
        (SEAL_NAME, SEAL_RANK, true),
    ] {
        let row = v["locks"]
            .as_array()
            .unwrap()
            .iter()
            .find(|r| r["name"] == name)
            .unwrap();
        assert_eq!(row["rank"], rank);
        assert_eq!(row["kind"], "mutex");
        assert_eq!(row["scope"], "repo");
        assert_eq!(row["owner"], "event-store");
        assert_eq!(
            row["v3Path"]
                .as_str()
                .unwrap()
                .replace("<eventOpenRoot>", layout.root.to_str().unwrap()),
            lock_path(&layout, seal).to_str().unwrap()
        );
        assert!(v["ranks"][rank.to_string()]["kinds"]
            .as_array()
            .unwrap()
            .iter()
            .any(|k| k == "mutex"));
    }
}
