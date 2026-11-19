//! The ports a probe run on this machine plugs in: the confinement policy as the resource resolver, a login port
//! that copies nothing (a probe holds no account login), and a bwrap driver over a given user runtime directory.
//! The doctor rows and the engine's own probe tests run the probes through these, one copy.

use super::super::homes::CleanupHomes;
use super::super::host::SystemHost;
use super::super::marker::resolve_confinement_temp_root;
use super::super::resolve::current_uid;
use crate::confinement::driver::bwrap::BwrapDriver;
use crate::confinement::driver::{
    BackendDriver, Credentials, DriverError, EnvFn, ErrorKind, ResourceResolver,
};
use crate::confinement::policy::{
    resolve_confinement_resources, Grant, ResolveContext, ResolveInput,
};
use serde_json::Value;
use std::path::Path;
use std::sync::Arc;

/// The resource resolver behind a probe's driver: a request's JSON in, the policy's resolved resources as JSON out.
pub struct PolicyResolver;

impl ResourceResolver for PolicyResolver {
    fn resolve(&self, input: &Value) -> Result<Vec<Value>, DriverError> {
        let text = |path: &[&str]| {
            path.iter()
                .try_fold(input, |value, key| value.get(*key))
                .and_then(Value::as_str)
                .map(str::to_owned)
        };
        let context = &input["context"];
        let ctx = |key: &str| context.get(key).and_then(Value::as_str).map(str::to_owned);
        let temp = std::env::temp_dir();
        let resolve_input = ResolveInput {
            dispatch_id: text(&["dispatchId"]).unwrap_or_default(),
            context: ResolveContext {
                run_dir: ctx("runDir"),
                fgos_dir: ctx("fgosDir"),
                repo_root: ctx("repoRoot"),
                cwd: ctx("cwd"),
                assignment_launch_context: context.get("assignmentLaunchContext").is_some(),
                ..Default::default()
            },
            grants: input["grants"]
                .as_array()
                .map(|list| {
                    list.iter()
                        .map(|grant| Grant {
                            resource: grant["resource"].as_str().unwrap_or_default().into(),
                            access: grant["access"].as_str().unwrap_or_default().into(),
                            ..Default::default()
                        })
                        .collect()
                })
                .unwrap_or_default(),
            temp_root: text(&["backendConfig", "tempRoot"]),
            default_temp_root: resolve_confinement_temp_root(&temp)
                .to_string_lossy()
                .into_owned(),
            credentials_path: text(&["providerSources", "credentialsPath"]),
            default_credentials_dir: temp.join("fgos-credentials").to_string_lossy().into_owned(),
            blind: input["blind"].as_bool().unwrap_or(false),
            home_dir: text(&["homeDir"])
                .unwrap_or_else(|| std::env::var("HOME").unwrap_or_default()),
            claude_socket_base: text(&["claudeSocketBase"])
                .unwrap_or_else(|| temp.to_string_lossy().into_owned()),
            xdg_runtime_dir: text(&["xdgRuntimeDir"]),
            xdg_config_home: text(&["xdgConfigHome"]),
            herdr_socket_path: text(&["herdrSocketPath"]),
            login_stores: input["loginStores"]
                .as_array()
                .map(|list| {
                    list.iter()
                        .filter_map(|store| store.as_str().map(str::to_owned))
                        .collect()
                })
                .unwrap_or_default(),
            ..Default::default()
        };
        let resolved = resolve_confinement_resources(&resolve_input)
            .map_err(|error| DriverError::new(ErrorKind::Port, error.to_string()))?;
        Ok(resolved
            .iter()
            .map(|resource| {
                serde_json::to_value(resource).expect("a resolved resource is plain data")
            })
            .collect())
    }
}

/// A probe holds no account login: nothing is ever copied into its home.
pub struct NoLogin;

impl Credentials for NoLogin {
    fn login_life_problem(&self, _source: &Value, _timeout_ms: u64) -> Option<String> {
        None
    }

    fn copy_files(
        &self,
        _private_home: &Path,
        _source_home: &Path,
        _files: &[String],
    ) -> Result<Vec<String>, DriverError> {
        Ok(Vec::new())
    }

    fn write_back_target(&self, _capacity: &Value) -> Option<Value> {
        None
    }
}

/// A bwrap driver whose environment names `runtime_dir` as the user runtime directory (the driver binds back only
/// a GO socket there) and this process's `HOME`.
pub fn driver_over(runtime_dir: &Path) -> Arc<dyn BackendDriver> {
    let runtime = runtime_dir.to_string_lossy().into_owned();
    let env: EnvFn = Arc::new(move |name| match name {
        "XDG_RUNTIME_DIR" if !runtime.is_empty() => Some(runtime.clone()),
        "HOME" => std::env::var("HOME").ok(),
        _ => None,
    });
    Arc::new(BwrapDriver::new(
        Arc::new(PolicyResolver),
        Arc::new(CleanupHomes::<SystemHost>::default()),
        Arc::new(NoLogin),
        env,
        current_uid().unwrap_or(0),
    ))
}
