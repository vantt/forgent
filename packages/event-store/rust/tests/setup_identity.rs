#![cfg(target_os = "linux")]
mod common;
use fgos_event_store::identity::mint_machine_id;
use std::{
    fs,
    sync::{Arc, Barrier},
};

#[test]
fn concurrent_setup_installs_one_complete_machine_id_without_replacing_it() {
    let repo = common::Repo::new();
    let state = repo.root.join("state");
    fs::create_dir(&state).unwrap();
    let barrier = Arc::new(Barrier::new(8));
    let results = std::thread::scope(|scope| {
        let threads: Vec<_> = (0..8)
            .map(|_| {
                let barrier = barrier.clone();
                let state = &state;
                scope.spawn(move || {
                    barrier.wait();
                    mint_machine_id(state, "A HOST").unwrap()
                })
            })
            .collect();
        threads
            .into_iter()
            .map(|t| t.join().unwrap())
            .collect::<Vec<_>>()
    });
    assert_eq!(results.iter().filter(|(created, _)| *created).count(), 1);
    assert!(results.iter().all(|(_, id)| id == &results[0].1));
    assert!(results[0].1.starts_with("a-host-"));
    assert_eq!(
        mint_machine_id(&state, "another-host").unwrap(),
        (false, results[0].1.clone())
    );
    assert!(fs::read_dir(&state)
        .unwrap()
        .all(|e| e.unwrap().file_name() == "machine-id"));
}
