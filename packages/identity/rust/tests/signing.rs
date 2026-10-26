//! The machine signing key, `sign`, `verify` and the pinned machine keys. Runs
//! the real `ssh-keygen` on temporary state roots; never touches the real
//! state root.

use fgos_identity::pins::PinState;
use fgos_identity::{pins, signing, Signature};
use std::fs;
use std::path::PathBuf;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::{Arc, Barrier};

static NEXT: AtomicU64 = AtomicU64::new(0);

fn state_root() -> PathBuf {
    let dir = std::env::temp_dir().join(format!("fgos-identity-signing-{}-{}", std::process::id(), NEXT.fetch_add(1, Ordering::Relaxed)));
    fs::create_dir_all(&dir).unwrap();
    dir
}

/// A machine named `machine_id` holding a freshly minted key.
fn machine(machine_id: &str) -> PathBuf {
    let root = state_root();
    fs::write(root.join("machine-id"), format!("{machine_id}\n")).unwrap();
    signing::mint_key(&root).unwrap();
    root
}

fn refusal_of<T: std::fmt::Debug>(result: Result<T, fgos_identity::Refusal>) -> fgos_identity::Refusal {
    result.expect_err("expected a refusal")
}

const BYTES: &[u8] = b"fgos-test/1\nhello";

#[test]
fn a_signature_verifies_pins_the_machine_once_and_a_flipped_byte_is_refused_without_pinning() {
    let signer = machine("alpha-aaaaaa");
    let verifier = state_root();
    let signature = signing::sign(&signer, BYTES).unwrap();
    assert_eq!(signature.machine_id, "alpha-aaaaaa");
    assert!(signature.public_key.starts_with("ssh-ed25519 "));

    let mut flipped = BYTES.to_vec();
    flipped[0] ^= 1;
    let bad = refusal_of(signing::verify(&verifier, &flipped, &signature));
    assert_eq!(bad.reason, "bad-signature");
    assert!(pins::list(&verifier).unwrap().is_empty(), "only a signature that holds pins a machine");

    let first = signing::verify(&verifier, BYTES, &signature).unwrap();
    assert!(first.first_seen);
    assert_eq!(first.machine_id, "alpha-aaaaaa");
    assert_eq!(Some(first.fingerprint.clone()), signing::key_fingerprint(&signer).unwrap());
    let second = signing::verify(&verifier, BYTES, &signature).unwrap();
    assert!(!second.first_seen);
    assert_eq!(second.fingerprint, first.fingerprint);

    let listed = pins::list(&verifier).unwrap();
    assert_eq!(listed.len(), 1);
    assert_eq!(listed[0].fingerprint, first.fingerprint);
    assert_eq!(listed[0].public_key, signature.public_key);
}

#[test]
fn a_different_key_for_a_pinned_machine_is_refused_until_the_pin_is_forgotten() {
    let original = machine("alpha-aaaaaa");
    let reinstalled = machine("alpha-aaaaaa");
    let verifier = state_root();
    let old = signing::sign(&original, BYTES).unwrap();
    let new = signing::sign(&reinstalled, BYTES).unwrap();
    signing::verify(&verifier, BYTES, &old).unwrap();

    let changed = refusal_of(signing::verify(&verifier, BYTES, &new));
    assert_eq!(changed.reason, "machine-key-changed");
    for key in [&old.public_key, &new.public_key] {
        assert!(changed.detail.contains(&signing::fingerprint(key).unwrap()), "{}", changed.detail);
    }
    assert!(changed.detail.contains("--forget alpha-aaaaaa"));
    assert!(!signing::verify(&verifier, BYTES, &old).unwrap().first_seen, "the pinned key still passes");

    pins::forget(&verifier, "alpha-aaaaaa").unwrap();
    assert!(signing::verify(&verifier, BYTES, &new).unwrap().first_seen);
}

#[test]
fn a_signature_in_this_machines_name_must_come_from_this_machines_key() {
    let own = machine("alpha-aaaaaa");
    let impostor = machine("alpha-aaaaaa");
    let forged = signing::sign(&impostor, BYTES).unwrap();
    assert_eq!(refusal_of(signing::verify(&own, BYTES, &forged)).reason, "machine-key-changed");
    assert!(pins::list(&own).unwrap().is_empty());
    let genuine = signing::sign(&own, BYTES).unwrap();
    assert!(signing::verify(&own, BYTES, &genuine).unwrap().first_seen);
}

#[test]
fn racing_first_sightings_of_one_machine_settle_to_one_pin() {
    let signers: Vec<Signature> = (0..4).map(|_| signing::sign(&machine("alpha-aaaaaa"), BYTES).unwrap()).collect();
    let verifier = state_root();
    let barrier = Arc::new(Barrier::new(signers.len()));
    let results: Vec<_> = std::thread::scope(|scope| {
        let threads: Vec<_> = signers
            .iter()
            .map(|signature| {
                let (barrier, verifier) = (barrier.clone(), &verifier);
                scope.spawn(move || {
                    barrier.wait();
                    signing::verify(verifier, BYTES, signature)
                })
            })
            .collect();
        threads.into_iter().map(|t| t.join().unwrap()).collect()
    });
    let winners: Vec<usize> = (0..results.len()).filter(|i| results[*i].is_ok()).collect();
    assert_eq!(winners.len(), 1, "{results:?}");
    assert!(results[winners[0]].as_ref().unwrap().first_seen);
    for (index, result) in results.iter().enumerate().filter(|(i, _)| *i != winners[0]) {
        assert_eq!(result.as_ref().unwrap_err().reason, "machine-key-changed", "signer {index}");
    }
    assert_eq!(pins::list(&verifier).unwrap()[0].public_key, signers[winners[0]].public_key);
}

#[test]
fn without_a_key_sign_is_refused_and_the_key_is_minted_once_with_a_private_mode() {
    let root = state_root();
    fs::write(root.join("machine-id"), "alpha-aaaaaa\n").unwrap();
    assert_eq!(refusal_of(signing::sign(&root, BYTES)).reason, "machine-key-missing");
    assert_eq!(signing::key_fingerprint(&root).unwrap(), None);

    let barrier = Arc::new(Barrier::new(4));
    let minted: Vec<(bool, String)> = std::thread::scope(|scope| {
        let threads: Vec<_> = (0..4)
            .map(|_| {
                let (barrier, root) = (barrier.clone(), &root);
                scope.spawn(move || {
                    barrier.wait();
                    signing::mint_key(root).unwrap()
                })
            })
            .collect();
        threads.into_iter().map(|t| t.join().unwrap()).collect()
    });
    assert_eq!(minted.iter().filter(|(created, _)| *created).count(), 1);
    assert!(minted.iter().all(|(_, print)| print == &minted[0].1));
    assert_eq!(signing::mint_key(&root).unwrap(), (false, minted[0].1.clone()));
    assert_eq!(signing::key_fingerprint(&root).unwrap(), Some(minted[0].1.clone()));

    let identity = root.join("identity");
    let public = fs::read_to_string(identity.join("machine-key.pub")).unwrap();
    assert_eq!(public.trim(), signing::own_public_key(&root).unwrap());
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        assert_eq!(fs::metadata(identity.join("machine-key")).unwrap().permissions().mode() & 0o777, 0o600);
    }
    assert!(fs::read_dir(root.join("tmp")).map(|mut d| d.next().is_none()).unwrap_or(true), "scratch directories are removed");
}

#[test]
fn a_signature_that_is_not_in_the_accepted_shape_is_refused_before_any_check() {
    let signer = machine("alpha-aaaaaa");
    let verifier = state_root();
    let good = signing::sign(&signer, BYTES).unwrap();
    let cases = [
        Signature { public_key: format!("{}\nother ssh-ed25519 AAAA", good.public_key), ..good.clone() },
        Signature { public_key: "ssh-rsa AAAA".into(), ..good.clone() },
        Signature { sig: "not armor".into(), ..good.clone() },
        Signature { machine_id: "../escape".into(), ..good.clone() },
    ];
    for case in cases {
        assert_eq!(refusal_of(signing::verify(&verifier, BYTES, &case)).reason, "invalid-signature", "{case:?}");
    }
    assert!(pins::list(&verifier).unwrap().is_empty());
}

#[test]
fn pins_list_by_machine_forget_one_and_refuse_what_they_do_not_hold() {
    let verifier = state_root();
    for id in ["zulu-zzzzzz", "alpha-aaaaaa"] {
        signing::verify(&verifier, BYTES, &signing::sign(&machine(id), BYTES).unwrap()).unwrap();
    }
    let ids: Vec<String> = pins::list(&verifier).unwrap().into_iter().map(|p| p.machine_id).collect();
    assert_eq!(ids, ["alpha-aaaaaa", "zulu-zzzzzz"]);
    assert_eq!(pins::forget(&verifier, "zulu-zzzzzz").unwrap().machine_id, "zulu-zzzzzz");
    assert_eq!(refusal_of(pins::forget(&verifier, "zulu-zzzzzz")).reason, "pin-not-found");
    assert_eq!(refusal_of(pins::forget(&verifier, "../x")).reason, "invalid-machine-id");

    fs::write(pins::directory(&verifier).join("alpha-aaaaaa"), "garbage").unwrap();
    assert_eq!(refusal_of(pins::list(&verifier)).reason, "pins-unreadable");
    let again = signing::sign(&machine("alpha-aaaaaa"), BYTES).unwrap();
    assert_eq!(refusal_of(signing::verify(&verifier, BYTES, &again)).reason, "pins-unreadable", "a broken pin is never replaced by a new sighting");
}

#[test]
fn a_pin_is_seen_until_the_owner_confirms_its_fingerprint_and_forgetting_resets_it() {
    let signer = machine("alpha-aaaaaa");
    let verifier = state_root();
    let signature = signing::sign(&signer, BYTES).unwrap();
    let fingerprint = signing::key_fingerprint(&signer).unwrap().unwrap();

    assert_eq!(refusal_of(pins::confirm(&verifier, "alpha-aaaaaa", &fingerprint)).reason, "pin-missing");
    let first = signing::verify(&verifier, BYTES, &signature).unwrap();
    assert_eq!(first.state, PinState::Seen);
    assert_eq!(pins::list(&verifier).unwrap()[0].confirmed_at, None);

    let wrong = refusal_of(pins::confirm(&verifier, "alpha-aaaaaa", "SHA256:other"));
    assert_eq!(wrong.reason, "fingerprint-mismatch");
    assert!(wrong.detail.contains(&fingerprint) && wrong.detail.contains("SHA256:other"), "{}", wrong.detail);
    assert_eq!(signing::verify(&verifier, BYTES, &signature).unwrap().state, PinState::Seen, "a refused confirm changes nothing");

    let confirmed = pins::confirm(&verifier, "alpha-aaaaaa", &fingerprint).unwrap();
    assert_eq!(confirmed.state, PinState::Confirmed);
    let stamp = confirmed.confirmed_at.clone().expect("confirmedAt is set");
    let after = signing::verify(&verifier, BYTES, &signature).unwrap();
    assert_eq!((after.state, after.first_seen), (PinState::Confirmed, false));
    assert_eq!(pins::confirm(&verifier, "alpha-aaaaaa", &fingerprint).unwrap().confirmed_at, Some(stamp), "confirming again is a no-op");
    let raw = fs::read_to_string(pins::directory(&verifier).join("alpha-aaaaaa")).unwrap();
    assert!(raw.contains("\"state\":\"confirmed\"") && raw.contains("\"confirmedAt\""), "{raw}");

    pins::forget(&verifier, "alpha-aaaaaa").unwrap();
    assert_eq!(refusal_of(pins::confirm(&verifier, "alpha-aaaaaa", &fingerprint)).reason, "pin-missing");
    let again = signing::verify(&verifier, BYTES, &signature).unwrap();
    assert_eq!((again.first_seen, again.state), (true, PinState::Seen));
}

#[test]
fn a_pin_file_without_state_reads_as_seen_and_the_own_machine_verifies_as_confirmed() {
    let verifier = state_root();
    let signature = signing::sign(&machine("alpha-aaaaaa"), BYTES).unwrap();
    let fingerprint = signing::fingerprint(&signature.public_key).unwrap();
    fs::create_dir_all(pins::directory(&verifier)).unwrap();
    let legacy = format!(
        "{{\"v\":1,\"machineId\":\"alpha-aaaaaa\",\"publicKey\":\"{}\",\"fingerprint\":\"{fingerprint}\",\"firstSeen\":\"2026-10-23T00:00:00.000Z\"}}\n",
        signature.public_key
    );
    fs::write(pins::directory(&verifier).join("alpha-aaaaaa"), legacy).unwrap();
    assert_eq!(pins::list(&verifier).unwrap()[0].state, PinState::Seen);
    assert_eq!(signing::verify(&verifier, BYTES, &signature).unwrap().state, PinState::Seen);

    let own = machine("alpha-aaaaaa");
    let mine = signing::sign(&own, BYTES).unwrap();
    assert_eq!(signing::verify(&own, BYTES, &mine).unwrap().state, PinState::Confirmed);
    assert_eq!(pins::list(&own).unwrap()[0].state, PinState::Confirmed, "the own pin is recorded as confirmed");
}

#[test]
fn a_confirm_racing_a_forget_never_leaves_a_confirmed_pin_after_the_forget() {
    for _ in 0..8 {
        let signer = machine("alpha-aaaaaa");
        let verifier = state_root();
        signing::verify(&verifier, BYTES, &signing::sign(&signer, BYTES).unwrap()).unwrap();
        let fingerprint = signing::key_fingerprint(&signer).unwrap().unwrap();
        let barrier = Arc::new(Barrier::new(2));
        let (confirm, forget) = std::thread::scope(|scope| {
            let c = scope.spawn(|| {
                barrier.wait();
                pins::confirm(&verifier, "alpha-aaaaaa", &fingerprint)
            });
            let f = scope.spawn(|| {
                barrier.wait();
                pins::forget(&verifier, "alpha-aaaaaa")
            });
            (c.join().unwrap(), f.join().unwrap())
        });
        forget.unwrap();
        assert!(confirm.is_ok() || confirm.unwrap_err().reason == "pin-missing");
        assert!(pins::list(&verifier).unwrap().is_empty(), "a forgotten key stays forgotten");
    }
}
