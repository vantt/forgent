//! Physical publication is separate from causally emitted coverage.
use crate::{
    append::Positions,
    envelope::line,
    errors::{invalid, Error},
    open_read::read_optional,
};
use serde::{Deserialize, Serialize};
use std::{collections::BTreeSet, path::Path};
#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Receipt {
    pub last_seq: u64,
    pub commit: String,
    #[serde(default, rename = "ref")]
    pub reference: String,
    #[serde(default)]
    pub sha256: String,
    #[serde(default)]
    pub first_seq: u64,
    pub cover: Positions,
    pub certified: BTreeSet<String>,
}
impl Receipt {
    pub fn read(path: &Path) -> Result<Self, Error> {
        read_optional(path)?
            .map(|b| serde_json::from_slice(&b).map_err(|e| invalid(e.to_string())))
            .unwrap_or_else(|| Ok(Self::default()))
    }
    pub fn write(&self, root: &Path) -> Result<(), Error> {
        self.write_with_fs(root, &crate::fsio::OsFileSystem)
    }
    pub(crate) fn write_with_fs(
        &self,
        root: &Path,
        fs: &dyn crate::fsio::FileSystem,
    ) -> Result<(), Error> {
        use crate::fsio::Point;
        use fgos_durable_file::ReplacePoint;
        fgos_durable_file::replace_durably_observed(root, "sealed.json", &line(self)?, |p| {
            fs.checkpoint(match p {
                ReplacePoint::Written => Point::AfterSealReceiptWrite,
                ReplacePoint::Synced => Point::AfterSealReceiptFsync,
                ReplacePoint::Renamed => Point::AfterSealReceiptRename,
                ReplacePoint::DirectorySynced => Point::AfterSealReceiptDirectoryFsync,
            })
        })
        .map_err(Error::from_install_error)?;
        Ok(())
    }
}

/// Exact candidate authorized under event-seal before reconciliation's CAS.
/// Retain both the observed prior tip and candidate, covering death on either
/// side of CAS without accumulating the whole reconciliation history.
pub(crate) fn reconciled_tips(
    layout: &crate::layout::Layout,
    reference: &fgos_git::RefName,
) -> Result<Vec<String>, Error> {
    let tips: std::collections::BTreeMap<String, Vec<String>> =
        read_optional(&layout.root.join("reconciled.json"))?
            .map(|b| serde_json::from_slice(&b).map_err(|e| invalid(e.to_string())))
            .transpose()?
            .unwrap_or_default();
    Ok(tips.get(reference.as_str()).cloned().unwrap_or_default())
}
pub(crate) fn authorize_reconcile(
    layout: &crate::layout::Layout,
    reference: &fgos_git::RefName,
    previous: Option<&fgos_git::Oid>,
    oid: &fgos_git::Oid,
) -> Result<(), Error> {
    let mut tips: std::collections::BTreeMap<String, Vec<String>> =
        read_optional(&layout.root.join("reconciled.json"))?
            .map(|b| serde_json::from_slice(&b).map_err(|e| invalid(e.to_string())))
            .transpose()?
            .unwrap_or_default();
    let mut candidates = vec![oid.as_str().to_owned()];
    if let Some(previous) = previous {
        candidates.push(previous.as_str().to_owned());
    }
    tips.insert(reference.as_str().into(), candidates);
    fgos_durable_file::replace_durably(&layout.root, "reconciled.json", &line(&tips)?)
        .map_err(Error::from_install_error)?;
    Ok(())
}

/// Load each stream receipt once, independent of history length.
pub(crate) fn own_bounds(layout: &crate::layout::Layout, origin: &str) -> Result<Positions, Error> {
    let mut bounds = Positions::new();
    for stream in layout.streams()? {
        let last = crate::append::read_last_seq(&layout.stream(&stream).sealed())?;
        bounds.insert(format!("{origin}:{}", stream.as_str()), last.unwrap_or(0));
    }
    Ok(bounds)
}
