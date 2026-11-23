//! The release carries pkm's third-party licence list and pkm's licence with its grant to fgOS
//! (`packages/documentation/third-party/pkm/`). Both are byte copies of the pinned pkm tag: the list must equal what
//! the linked pkm-cli embeds, and the licence must be the one recorded here. Raising the pkm pin fails this test until
//! both copies and the hash are refreshed.

use sha2::{Digest, Sha256};
use std::path::PathBuf;

/// sha256 of pkm's root `LICENSE` at tag v0.7.0.
const PKM_LICENSE_SHA256: &str = "ba86d89cfac41193b210ec60b2dd0abbfb7281880490611ab32dc24b97a7501a";

fn copy(name: &str) -> Vec<u8> {
    let path = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("../third-party/pkm")
        .join(name);
    std::fs::read(&path).unwrap_or_else(|e| panic!("{}: {e}", path.display()))
}

#[test]
fn the_committed_licence_list_is_the_one_the_linked_pkm_embeds() {
    assert!(
        copy("third-party.json") == pkm_cli::third_party_json().as_bytes(),
        "packages/documentation/third-party/pkm/third-party.json differs from pkm-cli's; copy it again"
    );
}

#[test]
fn the_committed_pkm_licence_is_the_pinned_one_and_carries_the_grant_to_fgos() {
    let licence = copy("LICENSE");
    let digest: String = Sha256::digest(&licence)
        .iter()
        .map(|b| format!("{b:02x}"))
        .collect();
    assert_eq!(
        digest, PKM_LICENSE_SHA256,
        "pkm's LICENSE changed; copy it again and record its hash"
    );
    assert!(
        String::from_utf8_lossy(&licence).contains("Grant to fgOS"),
        "the licence carries the grant to fgOS"
    );
}
