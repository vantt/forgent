//! The read side: every stored record whose `ts` falls in the window.

use crate::contract::{RecordSource, SourceError, Window};
use crate::record::types::Record;
use crate::shard::{read_store, UnsafeShard};
use crate::time::ParsedWindow;
use fgos_host_runtime::civil_time::parse_rfc3339_millis;
use std::path::Path;

/// The shard store name under `.fgos/observe/`.
pub const RECORDS_STORE: &str = "records";
const SOURCE_ID: &str = "fgos.observe.records";

/// Reads `.fgos/observe/records`. A line that is not a record is skipped, as the shard door skips a bad line; an
/// unsafe shard is skipped too, so one planted entry cannot hide the rest.
pub struct RecordStoreSource;

impl RecordSource for RecordStoreSource {
    fn source_id(&self) -> &'static str {
        SOURCE_ID
    }

    /// Any registered kind may be stored; the registry checks it on write.
    fn kinds(&self) -> &[&str] {
        &[]
    }

    fn records(&self, root: &Path, w: &Window) -> Result<Vec<Record>, SourceError> {
        let window = ParsedWindow::parse(w).map_err(|message| SourceError::ReadFailed {
            source_id: SOURCE_ID,
            message,
        })?;
        let read = read_store(root, RECORDS_STORE, UnsafeShard::Report)
            .map_err(|e| SourceError::Io(SOURCE_ID, e))?;
        Ok(read
            .records
            .into_iter()
            .filter_map(|stored| serde_json::from_value::<Record>(stored.value).ok())
            .filter(|record| parse_rfc3339_millis(&record.ts).is_some_and(|ms| window.contains(ms)))
            .collect())
    }
}
