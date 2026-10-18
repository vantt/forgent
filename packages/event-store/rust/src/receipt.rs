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
