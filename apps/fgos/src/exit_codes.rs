//! The host's exit statuses, read from the one table the Node shell also reads
//! (`packages/host-runtime/contracts/exit-codes.v1.json`). The host names no literal error status of
//! its own: a category is looked up here, so the two doors cannot drift.

use serde::Deserialize;
use std::collections::HashMap;
use std::sync::OnceLock;

const TABLE_JSON: &str =
    include_str!("../../../packages/host-runtime/contracts/exit-codes.v1.json");

#[derive(Deserialize)]
struct Table {
    ok: i32,
    unexpected: i32,
    categories: HashMap<String, i32>,
}

fn table() -> &'static Table {
    static TABLE: OnceLock<Table> = OnceLock::new();
    TABLE.get_or_init(|| {
        serde_json::from_str(TABLE_JSON).expect("embedded exit-codes.v1.json must be valid JSON")
    })
}

/// The exit status of an error category the table names.
pub fn code_of(category: &str) -> i32 {
    *table()
        .categories
        .get(category)
        .unwrap_or_else(|| panic!("exit-codes.v1.json names no category \"{category}\""))
}

/// Success.
pub fn ok() -> i32 {
    table().ok
}

/// A failure with no recognized category.
pub fn unexpected() -> i32 {
    table().unexpected
}

/// A usage error: an unknown verb, sub-command or flag, or an oversized stdin payload.
pub fn validation() -> i32 {
    code_of("validation")
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::BTreeMap;

    /// The table file read from disk at test time, independently of the
    /// embedded copy the reader parses.
    fn table_on_disk() -> serde_json::Value {
        let path = concat!(
            env!("CARGO_MANIFEST_DIR"),
            "/../../packages/host-runtime/contracts/exit-codes.v1.json"
        );
        serde_json::from_str(&std::fs::read_to_string(path).expect("table file"))
            .expect("table json")
    }

    #[test]
    fn the_reader_agrees_with_the_table_on_every_category() {
        let table = table_on_disk();
        assert_eq!(table["version"], 1);
        let categories: BTreeMap<String, i64> =
            serde_json::from_value(table["categories"].clone()).expect("categories");
        assert!(!categories.is_empty());
        for (name, code) in &categories {
            assert_eq!(i64::from(code_of(name)), *code, "category {name}");
        }
        assert_eq!(i64::from(ok()), table["ok"].as_i64().unwrap());
        assert_eq!(
            i64::from(unexpected()),
            table["unexpected"].as_i64().unwrap()
        );
        assert_eq!(validation(), code_of("validation"));
    }
}
