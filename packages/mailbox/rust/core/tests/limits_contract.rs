mod common;

use fgos_mailbox_core::Limits;

#[test]
fn the_limits_contract_carries_every_core_key_and_limits_reads_all_of_them() {
    let contract = common::limits_contract();
    let section = common::config_section(&contract);
    serde_json::from_value::<Limits>(section).expect("every Limits field comes from the contract");

    let keys = contract["keys"].as_array().unwrap();
    for dropped in keys {
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
