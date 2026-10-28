use std::{env, fs, path::PathBuf};
fn main() {
    let out = PathBuf::from(env::var_os("OUT_DIR").unwrap());
    result_codes(&out);
    consumer_contracts(&out);
}
fn result_codes(out: &std::path::Path) {
    let source = "../contracts/result-codes.v1.json";
    println!("cargo:rerun-if-changed={source}");
    let registry: serde_json::Value =
        serde_json::from_str(&fs::read_to_string(source).unwrap()).unwrap();
    let codes = registry["codes"].as_array().unwrap();
    let mut variants = String::new();
    let mut arms = String::new();
    for code in codes {
        let code = code.as_str().unwrap();
        let variant: String = code
            .split('-')
            .map(|part| {
                let mut c = part.chars();
                c.next().unwrap().to_uppercase().collect::<String>() + c.as_str()
            })
            .collect();
        variants.push_str(&format!("{variant},\n"));
        arms.push_str(&format!("Self::{variant} => {code:?},\n"));
    }
    let output = format!("#[derive(Debug, Clone, Copy, PartialEq, Eq)]\npub enum ErrorCode {{ {variants} }}\nimpl ErrorCode {{ pub fn as_str(self) -> &'static str {{ match self {{ {arms} }} }} }}\nimpl std::fmt::Display for ErrorCode {{ fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {{ f.write_str(self.as_str()) }} }}");
    fs::write(out.join("result_codes.rs"), output).unwrap();
}
/// Embeds every contract the consumer manifest lists, so a Rust caller registers the same
/// consumers the Node payload reads from that manifest at runtime, without a release layout.
fn consumer_contracts(out: &std::path::Path) {
    let source = "../contracts/consumers.v1.json";
    println!("cargo:rerun-if-changed={source}");
    let manifest: serde_json::Value =
        serde_json::from_str(&fs::read_to_string(source).unwrap()).unwrap();
    assert_eq!(manifest["v"], 1, "{source}: unsupported manifest");
    let repo = PathBuf::from(env::var_os("CARGO_MANIFEST_DIR").unwrap()).join("../../..");
    let mut items = String::new();
    for entry in manifest["consumers"].as_array().unwrap() {
        let file = entry["contractFile"].as_str().unwrap();
        assert!(
            !file.is_empty()
                && !file.starts_with('/')
                && !file.contains('\\')
                && file.split('/').all(|part| !part.is_empty() && part != "." && part != ".."),
            "{source}: contractFile must be a relative path inside the repository: {file}"
        );
        let path = repo.join(file);
        println!("cargo:rerun-if-changed={}", path.display());
        let path = path.to_str().unwrap();
        items.push_str(&format!("include_str!({path:?}),\n"));
    }
    fs::write(
        out.join("consumer_contracts.rs"),
        format!("pub(crate) const CONSUMER_CONTRACTS: &[&str] = &[\n{items}];\n"),
    )
    .unwrap();
}
