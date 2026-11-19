//! The driver's private-home port, implemented where the behaviour lives: the markers, the host record and the
//! ownership-checked removal of this module.

use super::host::{CleanupHost, SystemHost};
use super::marker::{ensure_private_dir, write_ownership_marker, write_ownership_marker_v2};
use super::record::write_attempt_home_record;
use super::remove::cleanup_confinement_resource;
use super::CleanupError;
use crate::confinement::driver::{DriverError, ErrorKind, PrivateHomeHost};
use serde_json::Value;
use std::path::{Path, PathBuf};

/// The private homes of this machine, over the host `H` (this machine's process door by default).
#[derive(Debug, Clone, Copy, Default)]
pub struct CleanupHomes<H = SystemHost> {
    pub host: H,
}

fn port(err: CleanupError) -> DriverError {
    DriverError {
        kind: ErrorKind::Port,
        code: err.code,
        message: err.message,
    }
}

fn field<'a>(fields: &'a Value, key: &str) -> Option<&'a str> {
    fields.get(key).and_then(Value::as_str)
}

impl<H: CleanupHost + Send + Sync> PrivateHomeHost for CleanupHomes<H> {
    fn ensure_private_dir(&self, dir: &Path, root: &Path) -> Result<(), DriverError> {
        ensure_private_dir(dir, Some(root))
            .map(|_| ())
            .map_err(port)
    }

    fn write_attempt_marker(&self, dir: &Path, fields: &Value) -> Result<(), DriverError> {
        write_ownership_marker_v2(
            dir,
            field(fields, "attemptId"),
            field(fields, "runDir"),
            field(fields, "dispatchId"),
            field(fields, "resource").unwrap_or("private-home"),
        )
        .map(|_| ())
        .map_err(port)
    }

    fn write_ownership_marker(
        &self,
        dir: &Path,
        dispatch_id: &str,
        resource: &str,
    ) -> Result<(), DriverError> {
        write_ownership_marker(dir, dispatch_id, resource, std::process::id())
            .map(|_| ())
            .map_err(port)
    }

    fn write_attempt_home_record(
        &self,
        home: &Path,
        fields: &Value,
    ) -> Result<PathBuf, DriverError> {
        write_attempt_home_record(home, fields).map_err(port)
    }

    fn cleanup_resource(&self, path: &Path, dispatch_id: &str) -> Result<(), DriverError> {
        // A resource that cannot go stays: the judgement of orphans finds it later.
        let _ = cleanup_confinement_resource(path, Some(dispatch_id), &self.host);
        Ok(())
    }
}
