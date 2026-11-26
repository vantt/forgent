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

#[cfg(test)]
mod tests {
    use super::*;

    /// The owner registry is proven over the real model of this repository, which the crate's own vectors never
    /// load: they use a fixed in-memory registry, so only here does a component id, a domain id and an unknown id
    /// meet the model files.
    #[test]
    fn the_real_model_names_a_component_and_a_domain_as_owners_and_refuses_an_unknown_one() {
        let root = Path::new(env!("CARGO_MANIFEST_DIR")).join("../..");
        let owners = ModelOwners::read(&root).expect("the repository model loads");

        assert!(owners.is_owner("component-authority"));
        assert!(owners.is_owner("coding"));
        assert!(!owners.is_owner("no-such-owner"));
    }
}
