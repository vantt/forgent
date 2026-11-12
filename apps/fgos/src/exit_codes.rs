//! The host's exit statuses, read from the one table the Node shell also reads.

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::BTreeMap;

    /// The table file read from disk at test time, independently of the
    /// embedded copy the reader parses.
    fn table_on_disk() -> serde_json::Value {
        let path = concat!(env!("CARGO_MANIFEST_DIR"), "/../../src/cli/exit-codes.v1.json");
        serde_json::from_str(&std::fs::read_to_string(path).expect("table file")).expect("table json")
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
        assert_eq!(i64::from(unexpected()), table["unexpected"].as_i64().unwrap());
        assert_eq!(validation(), code_of("validation"));
    }
}
