use std::{env, fs, path::PathBuf};
fn main() {
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
    fs::write(
        PathBuf::from(env::var_os("OUT_DIR").unwrap()).join("result_codes.rs"),
        output,
    )
    .unwrap();
}
