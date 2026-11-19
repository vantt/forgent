//! What the driver needs from the modules around it. Each is a narrow trait owned here, implemented by the module
//! that owns the behaviour: the resolver by confinement policy, the private-home records by confinement cleanup,
//! the login copy by credentials. Tests use fakes until those modules land.

use super::DriverError;
use serde_json::Value;
use std::path::{Path, PathBuf};
use std::sync::Arc;

/// An environment lookup (a variable the lookup returns `None` for is unset). The driver never reads the
/// process environment directly, so a test states the environment it runs under.
pub type EnvFn = Arc<dyn Fn(&str) -> Option<String> + Send + Sync>;

/// Resolves a request's grants and needs to the resources a sandbox mounts (confinement policy owns it).
/// `input` carries `dispatchId`, `context`, `grants`, `resourceNeeds`, `backendConfig`, `providerSources` and
/// `blind`, as the Node resolver took them.
pub trait ResourceResolver: Send + Sync {
    fn resolve(&self, input: &Value) -> Result<Vec<Value>, DriverError>;
}

/// The host-side records of a private home (confinement cleanup owns them): the directories and markers that let a
/// settle remove exactly what a launch allocated.
pub trait PrivateHomeHost: Send + Sync {
    /// Creates `dir` owner-only, with every directory from `root` down owner-only too.
    fn ensure_private_dir(&self, dir: &Path, root: &Path) -> Result<(), DriverError>;
    /// The marker of a home an attempt owns; `fields` is `{attemptId, runDir, dispatchId, resource}`.
    fn write_attempt_marker(&self, dir: &Path, fields: &Value) -> Result<(), DriverError>;
    /// The marker of a home a dispatch outside the assignment door owns.
    fn write_ownership_marker(
        &self,
        dir: &Path,
        dispatch_id: &str,
        resource: &str,
    ) -> Result<(), DriverError>;
    /// The host's record beside an attempt home, outside every grant; returns the file written.
    fn write_attempt_home_record(
        &self,
        home: &Path,
        fields: &Value,
    ) -> Result<PathBuf, DriverError>;
    /// Removes an allocated home that belongs to `dispatch_id`.
    fn cleanup_resource(&self, path: &Path, dispatch_id: &str) -> Result<(), DriverError>;
}

/// The login files a leased account puts into a private home (credentials owns them).
pub trait Credentials: Send + Sync {
    /// Why the login in `source` cannot live through `timeout_ms`, or `None` when it can.
    fn login_life_problem(&self, source: &Value, timeout_ms: u64) -> Option<String>;
    /// Copies the listed files that exist under `source_home` into `private_home` at the same relative paths and
    /// returns the ones copied; an escaping, dangling or non-regular entry refuses before any worker starts.
    fn copy_files(
        &self,
        private_home: &Path,
        source_home: &Path,
        files: &[String],
    ) -> Result<Vec<String>, DriverError>;
    /// Where a login renewed inside the home goes back to, for an attempt that opted in to renewal.
    fn write_back_target(&self, capacity: &Value) -> Option<Value>;
}
