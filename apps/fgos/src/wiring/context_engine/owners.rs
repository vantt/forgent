//! The owners a rule unit may name, read from the component authority model by the reader `fgos authority model`
//! uses: every top-level component, and every domain of the model's layers. `core` is an owner the crate adds
//! itself.

use std::collections::BTreeSet;
use std::path::Path;

use fgos_agent_context_engine::check::OwnerRegistry;
use fgos_component_authority::Model;

use crate::wiring::authority::model_dir;

/// The component and domain ids of the model of one project.
pub struct ModelOwners(BTreeSet<String>);

impl ModelOwners {
    /// Loads the model of the project at `root`. A project with no model has no owner but `core`.
    pub fn read(root: &Path) -> Result<ModelOwners, String> {
        let dir = model_dir(root)?;
        let Some(model) = Model::load_dir_if_present(&dir).map_err(|error| error.to_string())?
        else {
            return Ok(ModelOwners(BTreeSet::new()));
        };
        let mut owners: BTreeSet<String> = model
            .components
            .iter()
            .filter(|component| component.parent.is_none())
            .map(|component| component.id.clone())
            .collect();
        owners.extend(model.layers.domains.iter().cloned());
        Ok(ModelOwners(owners))
    }
}

impl OwnerRegistry for ModelOwners {
    fn is_owner(&self, owner: &str) -> bool {
        self.0.contains(owner)
    }
}
