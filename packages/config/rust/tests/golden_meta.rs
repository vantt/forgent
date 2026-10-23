//! Owning proof of the meta-schema rules (`contracts/config-schema.meta.v1.json`): each fixture is
//! a section schema, run through the meta rules of lint, and either passes or breaks exactly the named rule. That the
//! rule id is recovered from the crate's absolute keyword location is proven here too.
mod common;

use common::cases;
use fgos_config::lint::meta;
use fgos_config::schema::Schemas;

#[test]
fn meta_cases() {
    for case in cases("meta.v1.json") {
        let id = case["id"].as_str().unwrap();
        // JSON text is a YAML flow mapping, so the fixture's JSON form is the file as written.
        let bytes = case["schema"].to_string().into_bytes();
        let schemas = Schemas::parse(&[("demo", &bytes)]).unwrap_or_else(|e| panic!("{id}: {e}"));
        let mut ids: Vec<&str> = meta(&schemas).iter().map(|f| f.id).collect();
        ids.dedup();
        let want: Vec<&str> = case["expect"]["rule"].as_str().into_iter().collect();
        assert_eq!(ids, want, "{id}");
    }
}
