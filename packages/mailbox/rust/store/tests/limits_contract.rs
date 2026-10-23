mod common;

use fgos_mailbox::hook::HookLimits;

#[test]
fn the_contract_fills_every_hook_limit_and_none_falls_back_to_a_default() {
    let contract = common::limits_contract();
    serde_json::from_value::<HookLimits>(common::config_section(&contract))
        .expect("every HookLimits field comes from the contract");

    let hook_keys = contract["keys"]
        .as_array()
        .expect("contract has a keys list")
        .iter()
        .filter(|entry| entry["reader"] == "hook");
    let mut checked = 0;
    for dropped in hook_keys {
        let mut reduced = contract.clone();
        reduced["keys"]
            .as_array_mut()
            .unwrap()
            .retain(|entry| entry["key"] != dropped["key"]);
        let result = serde_json::from_value::<HookLimits>(common::config_section(&reduced));
        assert!(
            result.is_err(),
            "{} is missing from the contract, yet HookLimits loaded: no field may fall back to a code default",
            dropped["key"]
        );
        checked += 1;
    }
    assert!(
        checked > 0,
        "the contract names no hook key, so nothing was checked"
    );
}

#[test]
fn the_pointer_key_is_in_the_contract_read_by_the_hook_and_empty_by_default() {
    let contract = common::limits_contract();
    let entry = contract["keys"]
        .as_array()
        .unwrap()
        .iter()
        .find(|entry| entry["key"] == "mailbox.postToolUse.pointerClis")
        .expect("the pointer key is in the contract");
    assert_eq!(entry["reader"], "hook");
    assert_eq!(entry["default"], serde_json::json!([]));
    let hook: HookLimits = serde_json::from_value(common::config_section(&contract)).unwrap();
    assert!(hook.post_tool_use.pointer_clis.is_empty());
}
