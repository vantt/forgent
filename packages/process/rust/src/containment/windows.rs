//! Windows driver `windows-job` (domain `windows-job`): a named Job Object that
//! kills its members when the last handle closes, with no breakaway. The
//! supervisor holds the job open; the gate is created suspended, put into the
//! job, then resumed. Empty judgement and kill come from
//! [`crate::platform::windows_job`]; this module only creates, spawns and
//! calls them.

use std::fmt;
use std::fs::File;
use std::os::windows::process::CommandExt;
use std::process::{Command, Stdio};
use std::time::{Duration, Instant};

use windows_sys::Win32::Security::Cryptography::{BCryptGenRandom, BCRYPT_USE_SYSTEM_PREFERRED_RNG};
use windows_sys::Win32::System::Threading::CREATE_SUSPENDED;

use super::{ContainmentDomain, ContainmentDriver, ContainmentError, Guarantee, GuaranteeLevel, SpawnSpec, Spawned};
use crate::platform::windows_job::{assign_and_resume, create_kill_job, filetime_now, own_session, sanitize_lock_name, Job};
use crate::{domain_watch, Domain, DomainState, DomainWatch, KillOutcome, ProcId, WindowsJob};

/// The longest wait for the job to be provably empty after it was ended.
const EMPTY_WAIT: Duration = Duration::from_secs(5);
const POLL: Duration = Duration::from_millis(10);

/// The job an attempt runs in, and the watch that judges it. Dropping it closes
/// the supervisor's handle: the members end unless the gate holds a handle of
/// its own.
pub(crate) struct JobHold {
    name: String,
    job: Job,
    watch: Option<DomainWatch>,
}

impl fmt::Debug for JobHold {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.debug_struct("JobHold").field("name", &self.name).finish_non_exhaustive()
    }
}

/// `windows-job`.
pub struct WindowsJobDriver;

impl WindowsJobDriver {
    /// The kernel name of the job `create` made for `domain`: the gate opens it
    /// by this name to hold a handle of its own.
    pub fn job_name(domain: &ContainmentDomain) -> Option<&str> {
        domain.job.as_ref().map(|hold| hold.name.as_str())
    }
}

impl ContainmentDriver for WindowsJobDriver {
    fn name(&self) -> &'static str {
        "windows-job"
    }

    fn create(&self, attempt_id: &str) -> Result<ContainmentDomain, ContainmentError> {
        let token = random_token()?;
        let name = format!("Local\\fgos-attempt-{}-{token}", sanitize_lock_name(attempt_id));
        let job = create_kill_job(&name)?;
        let mut domain = ContainmentDomain::new(attempt_id);
        domain.job = Some(JobHold { name, job, watch: None });
        Ok(domain)
    }

    fn spawn_in(&self, domain: &mut ContainmentDomain, spec: SpawnSpec) -> Result<Spawned, ContainmentError> {
        let Some((program, args)) = spec.argv.split_first() else {
            return Err(ContainmentError::SpawnFailed("empty gate command".into()));
        };
        if !spec.fd_map.is_empty() {
            return Err(ContainmentError::SpawnFailed("descriptor maps are not supported on windows".into()));
        }
        let Some(hold) = domain.job.as_ref() else {
            return Err(ContainmentError::DriverUnavailable("the domain has no job; it was not made by `create`".into()));
        };
        let Some(session_id) = own_session() else {
            return Err(ContainmentError::DriverUnavailable("the windows session of this process is unreadable".into()));
        };
        let pick = |file: &Option<File>| file.as_ref().and_then(|f| f.try_clone().ok()).map_or_else(Stdio::null, Stdio::from);
        let mut cmd = Command::new(program);
        cmd.args(args).env_clear().envs(&spec.env).current_dir(&spec.cwd).creation_flags(CREATE_SUSPENDED);
        cmd.stdin(pick(&spec.stdin)).stdout(pick(&spec.stdout)).stderr(pick(&spec.stderr));

        let declared_at = filetime_now();
        let mut child = cmd.spawn().map_err(|err| ContainmentError::SpawnFailed(err.to_string()))?;
        // The identity is read while the gate is still suspended, so it cannot have left.
        let Some(root) = crate::platform::current().identity_of(ProcId(child.id())) else {
            let _ = child.kill();
            let _ = child.wait();
            return Err(ContainmentError::SpawnFailed("gate has no readable identity".into()));
        };
        // On failure `assign_and_resume` ends the suspended gate itself.
        if let Err(err) = assign_and_resume(&hold.job, &child) {
            let _ = child.wait();
            return Err(ContainmentError::SpawnFailed(format!("gate could not enter the job: {err}")));
        }
        domain.set_domain(Domain::WindowsJob(WindowsJob { job: hold.name.clone(), session_id, declared_at, holder: root.clone(), keeper: None }));
        Ok(Spawned { child, root })
    }

    fn is_empty(&self, domain: &mut ContainmentDomain) -> DomainState {
        let Some(record @ Domain::WindowsJob(_)) = domain.domain().cloned() else {
            return DomainState::Unknown;
        };
        match domain.job.as_mut() {
            Some(hold) => hold.watch.get_or_insert_with(|| domain_watch(&record)).is_empty(),
            None => crate::domain_is_empty(&record),
        }
    }

    fn kill_all(&self, domain: &mut ContainmentDomain, _grace_ms: u64) -> KillOutcome {
        let Some(record @ Domain::WindowsJob(_)) = domain.domain().cloned() else {
            return KillOutcome::Refused;
        };
        let Some(hold) = domain.job.as_mut() else {
            return crate::domain_kill_all(&record);
        };
        // Windows has no polite stop for a process tree: the job ends at once.
        if hold.job.terminate().is_err() && hold.watch.get_or_insert_with(|| domain_watch(&record)).kill_all() != KillOutcome::Ok {
            return KillOutcome::Refused;
        }
        let watch = hold.watch.get_or_insert_with(|| domain_watch(&record));
        let start = Instant::now();
        loop {
            if watch.is_empty() == DomainState::Empty {
                return KillOutcome::Ok;
            }
            if start.elapsed() >= EMPTY_WAIT {
                return KillOutcome::Refused;
            }
            std::thread::sleep(POLL);
        }
    }

    fn guarantee(&self) -> Guarantee {
        Guarantee {
            driver: "windows-job",
            level: GuaranteeLevel::Kernel,
            escapes: vec!["processes created outside the job by a service or COM server on the agent's request"],
        }
    }
}

/// 128 random bits as 32 hex digits, from the system generator: the job name
/// cannot be guessed by another process.
fn random_token() -> Result<String, ContainmentError> {
    let mut bytes = [0u8; 16];
    // SAFETY: fills `bytes` with the system-preferred generator; no algorithm handle is passed.
    let status = unsafe { BCryptGenRandom(std::ptr::null_mut(), bytes.as_mut_ptr(), bytes.len() as u32, BCRYPT_USE_SYSTEM_PREFERRED_RNG) };
    if status != 0 {
        return Err(ContainmentError::DriverUnavailable(format!("the system random generator failed: {status:#x}")));
    }
    Ok(bytes.iter().map(|b| format!("{b:02x}")).collect())
}
