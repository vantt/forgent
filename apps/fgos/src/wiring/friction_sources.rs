//! Friction sources wiring (Lane B).

use fgos_observe::LegacyFrictionSource;

#[allow(dead_code)]
pub fn build_legacy_friction_sources() -> Vec<Box<dyn LegacyFrictionSource>> {
    vec![Box::new(
        fgos_work_state::legacy_friction::WorkStateLegacyFrictionSource::new(),
    )]
}
