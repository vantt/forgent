mod common;

use fgos_mailbox_core::Limits;
use serde_json::Value;

/// The readers a contract key may name: the core's `Limits` or the hook
/// crate's `HookLimits`.
const READERS: [&str; 2] = ["core", "hook"];

fn keys(contract: &Value) -> &Vec<Value> {
    contract["keys"]
        .as_array()
        .expect("contract has a keys list")
}

#[test]
fn the_limits_contract_carries_every_core_key_and_limits_reads_all_of_them() {
    let contract = common::limits_contract();
    let section = common::config_section(&contract);
    serde_json::from_value::<Limits>(section).expect("every Limits field comes from the contract");

    let core_keys = keys(&contract)
        .iter()
        .filter(|entry| entry["reader"] == "core");
    for dropped in core_keys {
        let mut reduced = contract.clone();
        reduced["keys"]
            .as_array_mut()
            .unwrap()
            .retain(|entry| entry["key"] != dropped["key"]);
        let result = serde_json::from_value::<Limits>(common::config_section(&reduced));
        assert!(
            result.is_err(),
            "{} is missing from the contract, yet Limits loaded: no field may fall back to a code default",
            dropped["key"]
        );
    }
}

#[test]
fn every_contract_key_names_exactly_one_known_reader() {
    let contract = common::limits_contract();
    for entry in keys(&contract) {
        let reader = entry["reader"].as_str();
        assert!(
            reader.is_some_and(|r| READERS.contains(&r)),
            "{} names reader {}, not one of {READERS:?}",
            entry["key"],
            entry["reader"]
        );
    }
}
