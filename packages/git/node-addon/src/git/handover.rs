//! Private capability and one-use typed Externals. No fd-taking operation API.
use crate::{check, error};
use fgos_holder_lock::BorrowedHandle;
#[cfg(unix)]
use fgos_holder_lock::Resource;
use napi::{bindgen_prelude::External, Result};
use napi_derive::napi;
use std::{cell::Cell, sync::Mutex};
thread_local! { static REGISTERED: Cell<bool> = const { Cell::new(false) }; }
pub struct Registration;
pub struct Loan(Mutex<Option<BorrowedHandle<'static>>>);
#[napi]
pub fn take_git_handover() -> Result<External<Registration>> {
    check()?;
    if REGISTERED.with(|r| r.replace(true)) {
        return Err(error("git-handover-already-registered"));
    }
    Ok(External::new(Registration))
}
#[napi]
pub fn mint_git_loan(
    _capability: External<Registration>,
    fd: i32,
    name: String,
    path: String,
    kill_wait_ms: u32,
) -> Result<External<Loan>> {
    check()?;
    #[cfg(unix)]
    {
        // The capability is retained only by the bridge registered against
        // holder-lock's private description map, which pins the owner.
        let loan = unsafe {
            BorrowedHandle::from_acquired_description(
                fd,
                Resource::new(name, path),
                u64::from(kill_wait_ms),
            )
        }
        .map_err(error)?;
        Ok(External::new(Loan(Mutex::new(Some(loan)))))
    }
    #[cfg(not(unix))]
    {
        let _ = (fd, name, path, kill_wait_ms);
        Err(error("git-lock-handover-unsupported"))
    }
}
#[napi]
pub fn close_git_loan(loan: External<Loan>) -> Result<()> {
    drop(loan.0.lock().map_err(error)?.take());
    Ok(())
}
pub fn consume(loans: Vec<External<Loan>>) -> Result<Vec<BorrowedHandle<'static>>> {
    loans
        .iter()
        .map(|l| {
            l.0.lock()
                .map_err(error)?
                .take()
                .ok_or_else(|| error("git-loan-already-consumed"))
        })
        .collect()
}
