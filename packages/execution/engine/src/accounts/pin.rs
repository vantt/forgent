//! A pinned account's quarantine check, over the lease state's clock. The pin's form and the config it narrows
//! are `fgos-execution::account_pin`'s (the Node addon reads them there).

pub use fgos_execution::account_pin::{
    config_pinned_to_account, parse_account_pin, runner_config_for_binding, AccountPin, PinRefused,
};

/// Refuse a pinned account that is quarantined now, naming until when it waits. `pin_quarantined_until` is Seat
/// Binding's own judgment (its preflight over the account view): epoch ms, `NEVER_MS` for no end, `None` for usable.
pub fn assert_pinned_accounts_usable(
    pins: &[AccountPin],
    what: &str,
    pin_quarantined_until: &dyn Fn(&AccountPin) -> Option<i64>,
) -> Result<(), String> {
    for pin in pins {
        let Some(until) = pin_quarantined_until(pin) else {
            continue;
        };
        let waits = if until == super::state::NEVER_MS {
            "with no end time (cleared by hand)".to_string()
        } else {
            format!("until {}", super::time::iso_from_ms(until))
        };
        return Err(format!(
            "{what}: account \"{}/{}\" is quarantined {waits}; pin another account, or wait",
            pin.pool, pin.id
        ));
    }
    Ok(())
}
