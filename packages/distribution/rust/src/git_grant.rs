//! Activated-host route; the repository hook never loads the native addon.
pub fn main(args: &[String]) -> i32 {
    let result = (|| -> Result<(), String> {
        if args.len() != 4 || args[0] != "--protocol" || args[1] != "1" || args[2] != "--operation"
        {
            return Err("git-grant-check-protocol-mismatch".into());
        }
        #[cfg(unix)]
        unsafe {
            // Seal the inherited slot immediately, before constructing the driver.
            let flags = libc::fcntl(3, libc::F_GETFD);
            if flags < 0 || libc::fcntl(3, libc::F_SETFD, flags | libc::FD_CLOEXEC) < 0 {
                return Err("cutover-main-borrow-required".into());
            }
        }
        let cwd = std::env::current_dir().map_err(|e| e.to_string())?;
        let state = fgos_holder_lock::state_root::state_root().0;
        let driver = fgos_git::GitDriver::new(&state).map_err(|e| e.cause)?;
        let repo = match driver.resolve_repo(&cwd, &cwd).map_err(|e| e.cause)? {
            fgos_git::ResolveRepo::Repository(r) => r,
            _ => return Err("not-a-repository".into()),
        };
        let index = std::env::var_os("GIT_INDEX_FILE")
            .map(std::path::PathBuf::from)
            .unwrap_or_else(|| repo.git_dir().join("index"));
        let index = if index.is_absolute() {
            index
        } else {
            cwd.join(index)
        };
        driver
            .check_cutover_grant(&repo, &args[3], &index)
            .map_err(|e| e.cause)
    })();
    match result {
        Ok(()) => {
            println!("{{\"protocol\":1,\"result\":\"allowed\"}}");
            0
        }
        Err(cause) => {
            eprintln!("{cause}");
            10
        }
    }
}
