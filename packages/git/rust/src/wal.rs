//! Publication WAL. Evidence ordering is not resource authority. Callers must
//! hold the stream's event-seal and borrow it into every effecting Git child.
//! No method here executes, retries, rolls back or deletes a Git ref.
use crate::{ObjectFormat, Oid, RefName, RepoHandle};
use fgos_durable_file::{install_ordered, Installed};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::fs::{self, File, OpenOptions};
use std::io::{self, Read};
use std::path::{Path, PathBuf};

const MAX_RECORD: u64 = 64 * 1024;
const MAX_RECORDS: usize = 16;
pub type WalResult<T> = Result<T, WalError>;
#[derive(Debug)]
pub enum WalError {
    Io(io::Error),
    Corrupt(String),
    /// An intent would exceed the per-record byte bound. Raised by `begin`
    /// before the operation directory or any record exists, so nothing was
    /// recorded.
    RecordTooLarge,
    /// The repository behind the WAL is not the one the operation was
    /// recorded against.
    Untrusted,
    /// A WAL directory or record has an owner or mode other users could
    /// write through, or the repository path is not canonical. The text
    /// names the path, the reason and the next step.
    UnsafePath(String),
    OperationIdConflict,
    PublicationBorrowUnavailable,
    Busy,
    RecoveryRequired,
    Unsupported,
    FenceMissing,
}
impl From<io::Error> for WalError {
    fn from(e: io::Error) -> Self {
        Self::Io(e)
    }
}
impl WalError {
    /// The one kebab name of this failure; free-text diagnostics travel apart.
    pub(crate) fn cause(&self) -> &'static str {
        match self {
            Self::Io(_) => "git-wal-io",
            Self::Corrupt(_) => "git-wal-corrupt",
            Self::RecordTooLarge => "wal-record-too-large",
            Self::Untrusted => "repository-identity-changed",
            Self::UnsafePath(_) => "git-wal-path-unsafe",
            Self::OperationIdConflict => "operation-id-conflict",
            Self::PublicationBorrowUnavailable => "publication-borrow-unavailable",
            Self::Busy => "busy",
            Self::RecoveryRequired => "operation-recovery-required",
            Self::Unsupported => "git-wal-unsupported",
            Self::FenceMissing => "git-fence-missing",
        }
    }
    pub(crate) fn diagnostic(&self) -> Option<String> {
        match self {
            Self::Io(e) => Some(e.to_string()),
            Self::Corrupt(text) | Self::UnsafePath(text) => Some(text.clone()),
            _ => None,
        }
    }
}
impl std::fmt::Display for WalError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.cause())?;
        self.diagnostic()
            .map_or(Ok(()), |text| write!(f, ": {text}"))
    }
}
impl std::error::Error for WalError {}
fn corrupt(s: &str) -> WalError {
    WalError::Corrupt(s.into())
}
/// Names an unsafe owner or mode with the path a person can act on: WAL
/// paths are opened through `/proc/self/fd`, so the descriptor prefix is
/// resolved back to the directory it holds.
#[cfg(unix)]
fn unsafe_path(path: &Path, uid: u32, mode: u32, root_allowed: bool) -> WalError {
    let shown = path
        .strip_prefix("/proc/self/fd")
        .ok()
        .and_then(|rest| {
            let mut parts = rest.components();
            let fd = Path::new("/proc/self/fd").join(parts.next()?);
            Some(fs::read_link(fd).ok()?.join(parts.as_path()))
        })
        .unwrap_or_else(|| path.to_path_buf());
    let shown = shown.display();
    let euid = unsafe { libc::geteuid() };
    WalError::UnsafePath(if uid != euid && !(root_allowed && uid == 0) {
        format!(
            "{shown} is owned by uid {uid}, not by uid {euid} running fgos; chown it to that user"
        )
    } else {
        format!(
            "{shown} has mode {:04o}, writable by group or others; run: chmod go-w {shown}",
            mode & 0o7777
        )
    })
}
/// Names what makes a Windows WAL path untrustworthy, with the path a person can act on.
#[cfg(windows)]
fn unsafe_path(path: &Path, reason: &str) -> WalError {
    let shown = path.display();
    WalError::UnsafePath(format!(
        "{shown} {reason}; remove that write access (icacls \"{shown}\" /remove:g <account>) or run fgos as the account that owns it"
    ))
}
/// The directory a Git door was handed must be spelled exactly as the filesystem
/// spells it. Windows `canonicalize` answers in the verbatim `\\?\D:\` form, so both
/// sides are compared in the plain form every other path of this crate uses.
fn require_canonical(path: &Path) -> WalResult<()> {
    let canonical = path.canonicalize()?;
    if fgos_process::path::plain_path(&canonical) != fgos_process::path::plain_path(path) {
        return Err(non_canonical(path, &canonical));
    }
    Ok(())
}
/// A directory only its creator may write: mode 0700 on Unix; elsewhere the
/// parent's inherited access list, which `Directory::open_trusted` then checks.
fn create_private_dir(path: &Path) -> io::Result<()> {
    #[cfg(unix)]
    {
        use std::os::unix::fs::DirBuilderExt;
        fs::DirBuilder::new().mode(0o700).create(path)
    }
    #[cfg(not(unix))]
    {
        fs::create_dir(path)
    }
}
fn non_canonical(path: &Path, canonical: &Path) -> WalError {
    WalError::UnsafePath(format!(
        "{} is not canonical (it resolves to {}); open the repository by its real path",
        path.display(),
        canonical.display()
    ))
}

/// The Windows counterpart of the Unix owner and mode check, and of the
/// descriptor-relative open: who owns a WAL directory or record, who may write
/// to it, and whether a child still sits directly beneath the directory handle
/// it was opened through.
#[cfg(windows)]
mod windows_trust {
    use std::ffi::{c_void, OsString};
    use std::fs::{File, OpenOptions};
    use std::io;
    use std::os::windows::ffi::OsStringExt;
    use std::os::windows::fs::{MetadataExt, OpenOptionsExt};
    use std::os::windows::io::{AsRawHandle, FromRawHandle, OwnedHandle};
    use std::path::{Path, PathBuf};
    use std::ptr::null_mut;
    use windows_sys::Win32::Foundation::{
        LocalFree, ERROR_SUCCESS, GENERIC_ALL, GENERIC_WRITE, HANDLE,
    };
    use windows_sys::Win32::Security::Authorization::{
        ConvertSidToStringSidW, GetSecurityInfo, SE_FILE_OBJECT,
    };
    use windows_sys::Win32::Security::{
        AclSizeInformation, CreateWellKnownSid, EqualSid, GetAce, GetAclInformation, GetLengthSid,
        GetTokenInformation, TokenOwner, TokenUser, WinAnonymousSid, WinAuthenticatedUserSid,
        WinBuiltinAdministratorsSid, WinBuiltinGuestsSid, WinBuiltinUsersSid, WinInteractiveSid,
        WinLocalSystemSid, WinWorldSid, ACE_HEADER, ACL, ACL_SIZE_INFORMATION,
        DACL_SECURITY_INFORMATION, INHERIT_ONLY_ACE, OWNER_SECURITY_INFORMATION,
        PSECURITY_DESCRIPTOR, PSID, SECURITY_MAX_SID_SIZE, TOKEN_QUERY, WELL_KNOWN_SID_TYPE,
    };
    use windows_sys::Win32::Storage::FileSystem::{
        GetFileInformationByHandle, GetFinalPathNameByHandleW, BY_HANDLE_FILE_INFORMATION, DELETE,
        FILE_APPEND_DATA, FILE_ATTRIBUTE_REPARSE_POINT, FILE_DELETE_CHILD,
        FILE_FLAG_BACKUP_SEMANTICS, FILE_FLAG_OPEN_REPARSE_POINT, FILE_NAME_NORMALIZED,
        FILE_WRITE_ATTRIBUTES, FILE_WRITE_DATA, FILE_WRITE_EA, VOLUME_NAME_DOS, WRITE_DAC,
        WRITE_OWNER,
    };
    use windows_sys::Win32::System::Threading::{GetCurrentProcess, OpenProcessToken};

    /// ACE type codes; windows-sys does not export them.
    const ACCESS_ALLOWED: u8 = 0;
    const ACCESS_DENIED: u8 = 1;
    const ACCESS_ALLOWED_OBJECT: u8 = 5;
    const ACCESS_DENIED_OBJECT: u8 = 6;
    const ACCESS_ALLOWED_CALLBACK: u8 = 9;
    const ACCESS_DENIED_CALLBACK: u8 = 10;
    const ACCESS_ALLOWED_CALLBACK_OBJECT: u8 = 11;
    const ACCESS_DENIED_CALLBACK_OBJECT: u8 = 12;
    /// Object ACE flag bits that say a GUID sits before the SID.
    const ACE_OBJECT_TYPE_PRESENT: u32 = 0x1;
    const ACE_INHERITED_OBJECT_TYPE_PRESENT: u32 = 0x2;
    /// Every right that lets a principal add to, change, delete from or take
    /// over a directory or record.
    const WRITE_RIGHTS: u32 = FILE_WRITE_DATA
        | FILE_APPEND_DATA
        | FILE_WRITE_EA
        | FILE_WRITE_ATTRIBUTES
        | FILE_DELETE_CHILD
        | DELETE
        | WRITE_DAC
        | WRITE_OWNER
        | GENERIC_WRITE
        | GENERIC_ALL;

    /// Opens a directory without following a reparse point at the leaf and
    /// refuses a handle that is one, or is not a directory.
    pub(super) fn open_directory(path: &Path) -> io::Result<File> {
        let file = OpenOptions::new()
            .read(true)
            .custom_flags(FILE_FLAG_BACKUP_SEMANTICS | FILE_FLAG_OPEN_REPARSE_POINT)
            .open(path)?;
        let metadata = file.metadata()?;
        if metadata.file_attributes() & FILE_ATTRIBUTE_REPARSE_POINT != 0 || !metadata.is_dir() {
            return Err(io::Error::new(
                io::ErrorKind::PermissionDenied,
                "refused: not a directory (link or reparse point)",
            ));
        }
        Ok(file)
    }

    /// A `LocalAlloc` block released on drop.
    struct Local(*mut c_void);
    impl Drop for Local {
        fn drop(&mut self) {
            if !self.0.is_null() {
                unsafe { LocalFree(self.0) };
            }
        }
    }

    /// Applies the trust rule to an open file or directory: its owner is the
    /// account running fgos (the common directory may also belong to
    /// Administrators or SYSTEM), and no access-allowed entry that applies to the
    /// object grants a write right to Everyone, Users or Authenticated Users.
    /// The `Err` text finishes the sentence "<path> ...".
    pub(super) fn check(file: &File, common: bool) -> Result<(), String> {
        let (mut owner, mut dacl, mut descriptor): (PSID, *mut ACL, PSECURITY_DESCRIPTOR) =
            (null_mut(), null_mut(), null_mut());
        let status = unsafe {
            GetSecurityInfo(
                file.as_raw_handle() as HANDLE,
                SE_FILE_OBJECT,
                OWNER_SECURITY_INFORMATION | DACL_SECURITY_INFORMATION,
                &mut owner,
                null_mut(),
                &mut dacl,
                null_mut(),
                &mut descriptor,
            )
        };
        if status != ERROR_SUCCESS {
            return Err(format!(
                "has a security descriptor that cannot be read (error {status})"
            ));
        }
        let _descriptor = Local(descriptor);
        if owner.is_null() {
            return Err("has no owner".into());
        }
        // The token's default owner is who owns what this process creates: the
        // account itself, or Administrators for an elevated one.
        let mut trusted = vec![
            token_sid(TokenUser).ok_or("its owner cannot be compared with the current account")?,
            token_sid(TokenOwner).ok_or("its owner cannot be compared with the current account")?,
        ];
        if common {
            for kind in [WinBuiltinAdministratorsSid, WinLocalSystemSid] {
                trusted.extend(well_known(kind));
            }
        }
        if !trusted
            .iter()
            .any(|sid| unsafe { EqualSid(owner, sid.as_ptr() as PSID) } != 0)
        {
            return Err(format!(
                "is owned by {}, not by the account running fgos; take ownership of it as that account",
                sid_text(owner)
            ));
        }
        if dacl.is_null() {
            return Err("has no access list, so every account may write to it".into());
        }
        let mut size = ACL_SIZE_INFORMATION::default();
        if unsafe {
            GetAclInformation(
                dacl,
                &mut size as *mut _ as *mut c_void,
                std::mem::size_of::<ACL_SIZE_INFORMATION>() as u32,
                AclSizeInformation,
            )
        } == 0
        {
            return Err("has an access list that cannot be read".into());
        }
        let broad = broad_sids();
        for index in 0..size.AceCount {
            let mut entry: *mut c_void = null_mut();
            if unsafe { GetAce(dacl, index, &mut entry) } == 0 || entry.is_null() {
                return Err("has an access list entry that cannot be read".into());
            }
            check_ace(entry as *const u8, &broad)?;
        }
        Ok(())
    }

    /// The accounts whose write access makes a path untrusted.
    fn broad_sids() -> Vec<(&'static str, Vec<u8>)> {
        [
            ("Everyone", WinWorldSid),
            ("Users", WinBuiltinUsersSid),
            ("Authenticated Users", WinAuthenticatedUserSid),
            ("Anonymous Logon", WinAnonymousSid),
            ("Guests", WinBuiltinGuestsSid),
            ("INTERACTIVE", WinInteractiveSid),
        ]
        .into_iter()
        .filter_map(|(name, kind)| Some((name, well_known(kind)?)))
        .collect()
    }

    /// Judges one access-list entry. Denials and inherit-only entries grant
    /// nothing here. Every other kind that grants write to a broad account
    /// refuses, including kinds this rule can only partly read: an entry whose
    /// type it does not recognise refuses outright, since it cannot say whom it names.
    ///
    /// # Safety contract
    /// `entry` must point at a complete ACE as `GetAce` returns it.
    fn check_ace(entry: *const u8, broad: &[(&str, Vec<u8>)]) -> Result<(), String> {
        let header = unsafe { std::ptr::read_unaligned(entry as *const ACE_HEADER) };
        if matches!(
            header.AceType,
            ACCESS_DENIED
                | ACCESS_DENIED_OBJECT
                | ACCESS_DENIED_CALLBACK
                | ACCESS_DENIED_CALLBACK_OBJECT
        ) || header.AceFlags & INHERIT_ONLY_ACE as u8 != 0
        {
            return Ok(());
        }
        let ace_size = header.AceSize as usize;
        let read_u32 = |offset: usize| -> Option<u32> {
            (offset + 4 <= ace_size)
                .then(|| unsafe { std::ptr::read_unaligned(entry.add(offset) as *const u32) })
        };
        let sid_offset = match header.AceType {
            ACCESS_ALLOWED | ACCESS_ALLOWED_CALLBACK => Some(8),
            ACCESS_ALLOWED_OBJECT | ACCESS_ALLOWED_CALLBACK_OBJECT => read_u32(8).map(|flags| {
                12 + if flags & ACE_OBJECT_TYPE_PRESENT != 0 {
                    16
                } else {
                    0
                } + if flags & ACE_INHERITED_OBJECT_TYPE_PRESENT != 0 {
                    16
                } else {
                    0
                }
            }),
            _ => return Err("has an access list entry of a kind that cannot be judged".into()),
        };
        let (Some(mask), Some(sid_offset)) = (read_u32(4), sid_offset) else {
            return Err("has an access list entry that cannot be read".into());
        };
        if sid_offset >= ace_size {
            return Err("has an access list entry that cannot be read".into());
        }
        if mask & WRITE_RIGHTS == 0 {
            return Ok(());
        }
        let sid = unsafe { entry.add(sid_offset) } as PSID;
        match broad
            .iter()
            .find(|(_, wide)| unsafe { EqualSid(sid, wide.as_ptr() as PSID) } != 0)
        {
            Some((name, _)) => Err(format!("grants write access to {name}")),
            None => Ok(()),
        }
    }

    fn well_known(kind: WELL_KNOWN_SID_TYPE) -> Option<Vec<u8>> {
        let mut sid = vec![0u8; SECURITY_MAX_SID_SIZE as usize];
        let mut len = sid.len() as u32;
        (unsafe { CreateWellKnownSid(kind, null_mut(), sid.as_mut_ptr() as PSID, &mut len) } != 0)
            .then_some(sid)
    }

    /// A copy of the SID `class` (`TokenUser` or `TokenOwner`) names in this
    /// process's token; both structures begin with that one SID pointer.
    fn token_sid(class: i32) -> Option<Vec<u8>> {
        let mut token: HANDLE = null_mut();
        if unsafe { OpenProcessToken(GetCurrentProcess(), TOKEN_QUERY, &mut token) } == 0 {
            return None;
        }
        let token = unsafe { OwnedHandle::from_raw_handle(token as _) };
        let mut needed = 0u32;
        unsafe {
            GetTokenInformation(
                token.as_raw_handle() as HANDLE,
                class,
                null_mut(),
                0,
                &mut needed,
            )
        };
        if needed == 0 {
            return None;
        }
        // u64 words keep the buffer aligned for the pointer it starts with.
        let mut buffer = vec![0u64; (needed as usize).div_ceil(8)];
        if unsafe {
            GetTokenInformation(
                token.as_raw_handle() as HANDLE,
                class,
                buffer.as_mut_ptr() as *mut c_void,
                needed,
                &mut needed,
            )
        } == 0
        {
            return None;
        }
        let sid = unsafe { *(buffer.as_ptr() as *const PSID) };
        let len = unsafe { GetLengthSid(sid) } as usize;
        Some(unsafe { std::slice::from_raw_parts(sid as *const u8, len) }.to_vec())
    }

    fn sid_text(sid: PSID) -> String {
        let mut text: *mut u16 = null_mut();
        if unsafe { ConvertSidToStringSidW(sid, &mut text) } == 0 || text.is_null() {
            return "an unknown account".into();
        }
        let _free = Local(text as *mut c_void);
        let len = (0..).take_while(|&i| unsafe { *text.add(i) } != 0).count();
        OsString::from_wide(unsafe { std::slice::from_raw_parts(text, len) })
            .to_string_lossy()
            .into_owned()
    }

    fn final_path(file: &File) -> io::Result<PathBuf> {
        let mut buffer = vec![0u16; 512];
        loop {
            let n = unsafe {
                GetFinalPathNameByHandleW(
                    file.as_raw_handle() as HANDLE,
                    buffer.as_mut_ptr(),
                    buffer.len() as u32,
                    FILE_NAME_NORMALIZED | VOLUME_NAME_DOS,
                )
            } as usize;
            if n == 0 {
                return Err(io::Error::last_os_error());
            }
            if n >= buffer.len() {
                buffer.resize(n + 1, 0);
                continue;
            }
            return Ok(PathBuf::from(OsString::from_wide(&buffer[..n])));
        }
    }

    /// The child was opened by the parent's path, which a rename could have
    /// pointed elsewhere since the parent was opened: the child must still sit
    /// directly under the directory the parent handle names.
    pub(super) fn require_beneath(parent: &File, child: &File) -> io::Result<()> {
        let (parent, child) = (final_path(parent)?, final_path(child)?);
        if child.parent() == Some(parent.as_path()) {
            Ok(())
        } else {
            Err(io::Error::new(
                io::ErrorKind::PermissionDenied,
                "refused: the directory moved while it was being opened",
            ))
        }
    }

    /// `volume:index` of an open file; stable while the file exists.
    pub(super) fn identity(file: &File) -> io::Result<String> {
        let mut info: BY_HANDLE_FILE_INFORMATION = unsafe { std::mem::zeroed() };
        if unsafe { GetFileInformationByHandle(file.as_raw_handle() as HANDLE, &mut info) } == 0 {
            return Err(io::Error::last_os_error());
        }
        let index = (u64::from(info.nFileIndexHigh) << 32) | u64::from(info.nFileIndexLow);
        Ok(format!("{}:{index}", info.dwVolumeSerialNumber))
    }

    #[cfg(test)]
    mod tests {
        use super::*;
        use windows_sys::Win32::Security::{GetLengthSid, WinBuiltinAdministratorsSid};

        fn sid(kind: WELL_KNOWN_SID_TYPE) -> Vec<u8> {
            let wide = well_known(kind).expect("well-known SID");
            let len = unsafe { GetLengthSid(wide.as_ptr() as PSID) } as usize;
            wide[..len].to_vec()
        }

        /// An ACE of `ace_type` in the simple (header, mask, SID) layout, or the
        /// object layout when `object_flags` is given (no GUID bytes counted unless flagged).
        fn ace(
            ace_type: u8,
            ace_flags: u8,
            mask: u32,
            object_flags: Option<u32>,
            sid: &[u8],
        ) -> Vec<u8> {
            let mut body = mask.to_le_bytes().to_vec();
            if let Some(flags) = object_flags {
                body.extend(flags.to_le_bytes());
                if flags & ACE_OBJECT_TYPE_PRESENT != 0 {
                    body.extend([7u8; 16]);
                }
                if flags & ACE_INHERITED_OBJECT_TYPE_PRESENT != 0 {
                    body.extend([9u8; 16]);
                }
            }
            body.extend(sid);
            let size = (4 + body.len()) as u16;
            let mut out = vec![ace_type, ace_flags];
            out.extend(size.to_le_bytes());
            out.extend(body);
            out
        }

        fn verdict(entry: &[u8]) -> Result<(), String> {
            check_ace(entry.as_ptr(), &broad_sids())
        }

        #[test]
        fn write_grants_of_every_allow_kind_to_a_broad_account_refuse() {
            let everyone = sid(WinWorldSid);
            for kind in [ACCESS_ALLOWED, ACCESS_ALLOWED_CALLBACK] {
                let entry = ace(kind, 0, FILE_WRITE_DATA, None, &everyone);
                assert_eq!(
                    verdict(&entry),
                    Err("grants write access to Everyone".into()),
                    "type {kind}"
                );
            }
            for flags in [
                0,
                ACE_OBJECT_TYPE_PRESENT,
                ACE_OBJECT_TYPE_PRESENT | ACE_INHERITED_OBJECT_TYPE_PRESENT,
            ] {
                for kind in [ACCESS_ALLOWED_OBJECT, ACCESS_ALLOWED_CALLBACK_OBJECT] {
                    let entry = ace(kind, 0, GENERIC_ALL, Some(flags), &everyone);
                    assert_eq!(
                        verdict(&entry),
                        Err("grants write access to Everyone".into()),
                        "type {kind} flags {flags}"
                    );
                }
            }
        }

        #[test]
        fn denials_inherit_only_read_only_and_narrow_entries_pass() {
            let everyone = sid(WinWorldSid);
            let admins = sid(WinBuiltinAdministratorsSid);
            for kind in [ACCESS_DENIED, ACCESS_DENIED_CALLBACK] {
                assert_eq!(
                    verdict(&ace(kind, 0, FILE_WRITE_DATA, None, &everyone)),
                    Ok(())
                );
            }
            for kind in [ACCESS_DENIED_OBJECT, ACCESS_DENIED_CALLBACK_OBJECT] {
                assert_eq!(
                    verdict(&ace(kind, 0, FILE_WRITE_DATA, Some(0), &everyone)),
                    Ok(())
                );
            }
            let inherit_only = ace(
                ACCESS_ALLOWED_CALLBACK,
                INHERIT_ONLY_ACE as u8,
                FILE_WRITE_DATA,
                None,
                &everyone,
            );
            assert_eq!(verdict(&inherit_only), Ok(()));
            assert_eq!(
                verdict(&ace(ACCESS_ALLOWED_CALLBACK, 0, 0x1, None, &everyone)),
                Ok(())
            );
            assert_eq!(
                verdict(&ace(
                    ACCESS_ALLOWED_CALLBACK,
                    0,
                    FILE_WRITE_DATA,
                    None,
                    &admins
                )),
                Ok(())
            );
        }

        #[test]
        fn an_entry_of_an_unrecognised_kind_refuses() {
            let admins = sid(WinBuiltinAdministratorsSid);
            assert!(verdict(&ace(0x7f, 0, FILE_WRITE_DATA, None, &admins)).is_err());
        }

        #[test]
        fn anonymous_guests_and_interactive_are_broad() {
            for (kind, name) in [
                (WinAnonymousSid, "Anonymous Logon"),
                (WinBuiltinGuestsSid, "Guests"),
                (WinInteractiveSid, "INTERACTIVE"),
                (WinBuiltinUsersSid, "Users"),
                (WinAuthenticatedUserSid, "Authenticated Users"),
            ] {
                let entry = ace(ACCESS_ALLOWED, 0, FILE_APPEND_DATA, None, &sid(kind));
                assert_eq!(
                    verdict(&entry),
                    Err(format!("grants write access to {name}"))
                );
            }
        }
    }
}

/// An injected filesystem checkpoint is called after each acknowledged WAL
/// filesystem boundary. Returning an error simulates process loss, retaining
/// all evidence. Durable-file provides the lower-level write/fsync boundaries.
pub use fgos_durable_file::{FileSystem, OsFileSystem};

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
pub struct HooksChange {
    pub old: Option<String>,
    pub next: Option<String>,
    pub owner_path: String,
}
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
pub struct ConfigChange {
    /// RepositoryConfig assigns this under repo-config authority. Historical
    /// chains omit it, preserving their canonical digests.
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub config_sequence: Option<u64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub staging: Option<crate::NativeLockArtifact>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub hooks: Option<HooksChange>,
    pub remote: String,
    pub url: String,
    pub refspecs: Vec<String>,
    pub old_values: Vec<String>,
    pub old_config_digest: String,
}
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
pub struct WorktreeDeliveryBinding {
    pub delivered_to: String,
    pub evidence_digest: String,
}
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
pub struct ScopedCommitIntent {
    pub worktree: String,
    pub baseline: String,
    pub request: String,
    pub paths: PathSet,
    pub tree: String,
    /// Intents written before the cutover grant was removed carry
    /// `"cutoverGrant": null`, or a grant object written only by the retired
    /// `fgos events migrate`. `null` is read back as written so those record
    /// digests still verify; new intents omit the key. An intent carrying a
    /// grant object is refused on purpose, with no reader for that dead shape:
    /// resolve such an operation with the previous release before upgrading.
    #[serde(
        default,
        rename = "cutoverGrant",
        skip_serializing_if = "Option::is_none",
        deserialize_with = "present_null"
    )]
    pub retired_cutover_grant: Option<()>,
}
/// A key that is present only as `null`: `Some(())` round-trips it as `null`,
/// where a plain `Option` would read `null` as absent and drop the key.
fn present_null<'de, D: serde::Deserializer<'de>>(d: D) -> Result<Option<()>, D::Error> {
    <()>::deserialize(d).map(Some)
}
/// A set of literal repository paths as a record holds it. New records keep
/// only a digest, so a record stays bounded however many paths an operation
/// selects; records written earlier list the paths and still read.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(untagged)]
pub enum PathSet {
    Listed(Vec<String>),
    Digest(PathDigest),
}
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
pub struct PathDigest {
    pub count: usize,
    pub sha256: String,
}
impl From<Vec<String>> for PathSet {
    fn from(paths: Vec<String>) -> Self {
        Self::Listed(paths)
    }
}
impl PathSet {
    /// An empty selection stays an empty list; any other is recorded as digest.
    pub fn of(paths: &[String]) -> WalResult<Self> {
        if paths.is_empty() {
            return Ok(Self::Listed(vec![]));
        }
        let set = Self::sorted(paths);
        Ok(Self::Digest(PathDigest {
            count: set.len(),
            sha256: canonical_digest(&set)?,
        }))
    }
    fn sorted(paths: &[String]) -> Vec<&String> {
        let mut set: Vec<_> = paths.iter().collect();
        set.sort();
        set.dedup();
        set
    }
    pub fn is_empty(&self) -> bool {
        matches!(self, Self::Listed(paths) if paths.is_empty())
    }
    /// Whether `actual` is exactly this set, whatever its order.
    pub fn matches(&self, actual: &[String]) -> WalResult<bool> {
        let set = Self::sorted(actual);
        Ok(match self {
            Self::Listed(paths) => Self::sorted(paths) == set,
            Self::Digest(d) => d.count == set.len() && d.sha256 == canonical_digest(&set)?,
        })
    }
    fn validate(&self) -> WalResult<()> {
        match self {
            Self::Listed(paths) => {
                for path in paths {
                    if crate::literal_repo_path(path).is_err() {
                        return Err(corrupt("scoped commit path"));
                    }
                }
            }
            Self::Digest(d) if d.count == 0 || !digest_valid(&d.sha256) => {
                return Err(corrupt("scoped commit path digest"));
            }
            Self::Digest(_) => {}
        }
        Ok(())
    }
}
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
pub struct SyncIntent {
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub reference: Option<String>,
    pub worktree: String,
    pub head: String,
    pub target: String,
    pub message: String,
    /// Consumer-declared files applied after the merge (prepare only).
    #[serde(default, skip_serializing_if = "Vec::is_empty")]
    pub files: Vec<IntentFile>,
}
/// One consumer-declared file as an intent records it: its path and the blob
/// OID of its declared bytes, `None` declaring an absence. The bytes live only
/// in the caller's request and the tree built from it, never in the WAL.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct DeclaredBlob {
    pub path: String,
    pub blob: Option<String>,
}
/// The one reader of a recorded declared file. Records written before the
/// blob form carry the bytes themselves; they stay verbatim so their record
/// digest still verifies, and are only ever read as their blob OID.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(untagged)]
pub enum IntentFile {
    Blob(DeclaredBlob),
    Bytes(crate::LandFile),
}
fn intent_files_valid(files: &[IntentFile], format: ObjectFormat) -> bool {
    files.iter().all(|file| match file {
        IntentFile::Blob(b) => {
            crate::land::declared_path_valid(&b.path)
                && b.blob
                    .as_ref()
                    .is_none_or(|o| Oid::parse(o, format).is_ok())
        }
        IntentFile::Bytes(f) => crate::land::declared_path_valid(&f.path),
    })
}
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct LandIntent {
    pub request: LandIntentRequest,
    pub candidate: crate::LandCandidate,
}
/// The Land request as its intent records it: the caller's `LandRequest`
/// with each declared file as its blob OID.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct LandIntentRequest {
    pub source: String,
    #[serde(default)]
    pub target: String,
    pub destination: String,
    pub message: String,
    #[serde(default)]
    pub squash: bool,
    pub footprint: Option<Vec<String>>,
    pub subtree: Option<String>,
    #[serde(default)]
    pub files: Vec<IntentFile>,
}
impl LandIntentRequest {
    pub fn of(req: &crate::LandRequest, files: Vec<IntentFile>) -> Self {
        Self {
            source: req.source.clone(),
            target: req.target.clone(),
            destination: req.destination.clone(),
            message: req.message.clone(),
            squash: req.squash,
            footprint: req.footprint.clone(),
            subtree: req.subtree.clone(),
            files,
        }
    }
}
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum OperationKind {
    Land(Box<LandIntent>),
    Restore(Box<crate::restore::RestoreIntent>),
    ScopedCommit(Box<ScopedCommitIntent>),
    Sync(Box<SyncIntent>),
    PublicationCas,
    WorktreeCreate {
        path: Box<str>,
        registration: Box<str>,
        branch: Option<Box<str>>,
        session_id: Option<Box<str>>,
    },
    WorktreeMove {
        source: Box<str>,
        destination: Box<str>,
        registration: Box<str>,
        registration_identity: Box<str>,
    },
    WorktreeRemove {
        path: Box<str>,
        registration: Box<str>,
        registration_identity: Box<str>,
        delivery: Box<WorktreeDeliveryBinding>,
    },
    RefUpdate {
        worktree: Option<String>,
    },
    RefDelete,
    ConfigChange(Box<ConfigChange>),
    RemoteFetch {
        url: String,
        refspecs: Vec<String>,
        #[serde(default, skip_serializing_if = "Vec::is_empty")] // Preserve historical digests.
        targets: Vec<(String, Tip, Tip)>,
    },
    RemotePush {
        url: String,
        refspecs: Vec<String>,
        #[serde(default, skip_serializing_if = "Vec::is_empty")] // Preserve historical digests.
        targets: Vec<(String, Tip, Tip)>,
    },
}
impl OperationKind {
    /// Stable variant name for diagnostics.
    pub fn name(&self) -> &'static str {
        match self {
            Self::Land(_) => "Land",
            Self::Restore(_) => "Restore",
            Self::ScopedCommit(_) => "ScopedCommit",
            Self::Sync(_) => "Sync",
            Self::PublicationCas => "PublicationCas",
            Self::WorktreeCreate { .. } => "WorktreeCreate",
            Self::WorktreeMove { .. } => "WorktreeMove",
            Self::WorktreeRemove { .. } => "WorktreeRemove",
            Self::RefUpdate { .. } => "RefUpdate",
            Self::RefDelete => "RefDelete",
            Self::ConfigChange(_) => "ConfigChange",
            Self::RemoteFetch { .. } => "RemoteFetch",
            Self::RemotePush { .. } => "RemotePush",
        }
    }
}
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
pub struct Intent {
    pub kind: OperationKind,
    pub request_digest: String,
    pub repo_identity: String,
    pub resource_set: Vec<String>,
    pub authority_binding: String,
    pub writer_identity: String,
    pub object_format: ObjectFormat,
    pub expected: Tip,
    pub next: Tip,
}
fn is_false(value: &bool) -> bool {
    !value
}
/// Strings are validated against Intent.objectFormat before use, including on
/// reads; serde is never a way around Oid/RefName validation.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(tag = "kind", content = "oid", rename_all = "camelCase")]
pub enum Tip {
    Absent,
    Oid(String),
}
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum Attribution {
    ThisInvocationWonCas,
    EffectObservedOnly,
    Uncertain,
}
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(tag = "kind", rename_all = "camelCase", deny_unknown_fields)]
pub enum Outcome {
    Restore {
        state: String,
    },
    Land {
        checkout: String,
        #[serde(default, rename = "observedOnly", skip_serializing_if = "is_false")]
        observed_only: bool,
    },
    Commit {
        observed: String,
        contract_violation: bool,
    },
    CommitRejected {
        cause: String,
    },
    /// Effect-free approval; URL and mappings live in the ConfigChange intent.
    ConfigApproved,
    Worktree {
        completed: bool,
        details: Vec<String>,
    },
    AbandonedBeforeAttempt,
    Transfer {
        acknowledged: bool,
        unknown: bool,
        observations: Vec<(String, Tip)>,
        details: Vec<String>,
    },
    Success {
        observed: Tip,
        attribution: Attribution,
    },
    Loss {
        observed: Tip,
    },
    Superseded {
        later_operation_id: String,
        later_receipt_digest: String,
        attribution: Attribution,
    },
}
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(
    tag = "phase",
    content = "data",
    rename_all = "kebab-case",
    deny_unknown_fields
)]
pub enum Phase {
    NativeLockOwned(crate::NativeLockArtifact),
    RestoreAcknowledged,
    RestoreApplied {
        snapshot: String,
    },
    LandVerified {
        evidence: crate::LandEvidence,
        #[serde(default, skip_serializing_if = "Option::is_none")]
        checkout: Option<String>,
    },
    Intent(Intent),
    Prepared,
    SyncState {
        conflicts: Vec<String>,
        staged: Vec<String>,
        index_digest: String,
        #[serde(default, skip_serializing_if = "Vec::is_empty")]
        clean_modes: Vec<(String, u32)>,
    },
    /// Durable one-shot barrier before Sync invokes its ref-moving commit.
    SyncCommitAttempt {
        tree: String,
    },
    TargetAttempt {
        prior_target_attempt: Option<()>,
        expected: Tip,
        next: Tip,
    },
    Outcome(Outcome),
    PinReleaseAttempt {
        prior_target_attempt: Option<()>,
        expected: Tip,
        next: Tip,
    },
    PinReleased,
}
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields, rename_all = "camelCase")]
pub struct Record {
    pub version: u32,
    pub operation_id: String,
    pub sequence: usize,
    pub previous_digest: Option<String>,
    pub phase: Phase,
    pub digest: String,
}
/// Canonical UTF-8 JSON: recursively sorted keys, no whitespace, no floats.
/// The digest field is omitted when computing an envelope's hash.
pub fn canonical_digest<T: Serialize>(value: &T) -> WalResult<String> {
    let v = serde_json::to_value(value).map_err(|_| corrupt("serialization"))?;
    fn check(v: &serde_json::Value) -> bool {
        match v {
            serde_json::Value::Number(n) => n.is_i64() || n.is_u64(),
            serde_json::Value::Array(a) => a.iter().all(check),
            serde_json::Value::Object(m) => m.values().all(check),
            _ => true,
        }
    }
    if !check(&v) {
        return Err(corrupt("floating point canonical value"));
    }
    // serde_json's default Map is a BTreeMap; explicitly sort regardless of
    // workspace feature unification (preserve_order may be enabled upstream).
    fn sorted(v: serde_json::Value) -> serde_json::Value {
        match v {
            serde_json::Value::Object(m) => {
                let mut entries: Vec<_> = m.into_iter().collect();
                entries.sort_by(|a, b| a.0.cmp(&b.0));
                serde_json::Value::Object(
                    entries.into_iter().map(|(k, v)| (k, sorted(v))).collect(),
                )
            }
            serde_json::Value::Array(a) => {
                serde_json::Value::Array(a.into_iter().map(sorted).collect())
            }
            v => v,
        }
    }
    let bytes = serde_json::to_vec(&sorted(v)).map_err(|_| corrupt("serialization"))?;
    Ok(format!("{:x}", Sha256::digest(bytes)))
}
fn record_digest(record: &Record) -> WalResult<String> {
    let mut v = serde_json::to_value(record).map_err(|_| corrupt("serialization"))?;
    v.as_object_mut()
        .ok_or_else(|| corrupt("envelope"))?
        .remove("digest");
    canonical_digest(&v)
}
pub(crate) fn valid_id(s: &str) -> bool {
    !s.is_empty()
        && s.len() <= 80
        && s.bytes()
            .all(|b| b.is_ascii_alphanumeric() || b == b'-' || b == b'_')
}
fn digest_valid(s: &str) -> bool {
    s.len() == 64
        && s.bytes()
            .all(|b| b.is_ascii_digit() || (b'a'..=b'f').contains(&b))
}
fn validate_tip(tip: &Tip, format: ObjectFormat) -> WalResult<()> {
    if let Tip::Oid(s) = tip {
        Oid::parse(s, format).map_err(|_| corrupt("OID"))?;
    }
    Ok(())
}

pub(crate) fn worktree_resources(kind: &OperationKind) -> WalResult<Vec<String>> {
    let mut paths = match kind {
        OperationKind::WorktreeCreate { path, .. } | OperationKind::WorktreeRemove { path, .. } => {
            vec![format!("worktree:{path}")]
        }
        OperationKind::WorktreeMove {
            source,
            destination,
            ..
        } => vec![
            format!("worktree:{source}"),
            format!("worktree:{destination}"),
        ],
        _ => return Err(corrupt("not-a-worktree-operation")),
    };
    if let OperationKind::WorktreeCreate {
        branch: Some(branch),
        ..
    } = kind
    {
        paths.push(branch.to_string());
    }
    paths.sort();
    paths.dedup();
    Ok(paths)
}

impl Intent {
    /// What is asked `(kind, digest)`, who holds it `(resources, binding)` and
    /// the tip it moves `(expected, next)`; the repository, writer and object
    /// format are filled the same way for every port.
    pub(crate) fn of<F: FileSystem>(
        wal: &Wal<F>,
        repo: &RepoHandle,
        writer: &str,
        (kind, request_digest): (OperationKind, String),
        (resource_set, authority_binding): (Vec<String>, String),
        (expected, next): (Tip, Tip),
    ) -> Self {
        Self {
            kind,
            request_digest,
            repo_identity: wal.repository_identity().into(),
            resource_set,
            authority_binding,
            writer_identity: writer.into(),
            object_format: repo.object_format(),
            expected,
            next,
        }
    }
    /// Delete keeps the old object reachable until its terminal receipt.
    pub fn candidate(&self) -> &Tip {
        if self.next == Tip::Absent
            || matches!(&self.kind, OperationKind::Restore(p) if p.request.discard_local_delta)
        {
            &self.expected
        } else {
            &self.next
        }
    }
    fn validate(&self) -> WalResult<()> {
        if !digest_valid(&self.request_digest)
            || self.repo_identity.is_empty()
            || self.authority_binding.is_empty()
            || self.writer_identity.is_empty()
            || self.resource_set.is_empty()
        {
            return Err(corrupt("intent binding"));
        }
        if let OperationKind::Restore(p) = &self.kind {
            if !Path::new(&p.worktree).is_absolute()
                || !checkout_resource_valid(&self.resource_set, &p.worktree)
                || (p.reference != "HEAD" && RefName::parse(&p.reference).is_err())
                || !digest_valid(&p.snapshot)
                || canonical_digest(&p.request)? != self.request_digest
                || self.expected != Tip::Oid(p.request.expected_head.clone())
                || self.next != Tip::Oid(p.request.target.clone())
            {
                return Err(corrupt("restore binding"));
            }
            Oid::parse(&p.request.expected_head, self.object_format)
                .map_err(|_| corrupt("restore head"))?;
            Oid::parse(&p.request.target, self.object_format)
                .map_err(|_| corrupt("restore target"))?;
            return Ok(());
        }
        if let OperationKind::Land(payload) = &self.kind {
            let c = &payload.candidate;
            let r = &payload.request;
            if !r.destination.starts_with("refs/heads/")
                || RefName::parse(&r.destination).is_err()
                || self.resource_set.first() != Some(&r.destination)
                || self.resource_set.len() != 2
                || !checkout_resource_valid(&self.resource_set[1..], &c.worktree.to_string_lossy())
                || !Path::new(&c.worktree).is_absolute()
                || c.source != r.source
                || c.target != r.target
                || self.expected != Tip::Oid(r.target.clone())
                || self.next != Tip::Oid(c.candidate.clone())
                || canonical_digest(&c.tree)? != c.tree_digest
                || !intent_files_valid(&r.files, self.object_format)
            {
                return Err(corrupt("land binding"));
            }
            for oid in [&r.source, &r.target, &c.candidate, &c.tree] {
                Oid::parse(oid, self.object_format).map_err(|_| corrupt("land oid"))?;
            }
            return Ok(());
        }
        if let OperationKind::ScopedCommit(payload) = &self.kind {
            let ScopedCommitIntent {
                worktree,
                paths,
                tree,
                ..
            } = payload.as_ref();
            if !Path::new(worktree).is_absolute()
                || !checkout_resource_valid(&self.resource_set, worktree)
            {
                return Err(corrupt("scoped commit binding"));
            }
            paths.validate()?;
            Oid::parse(tree, self.object_format).map_err(|_| corrupt("commit tree"))?;
            validate_tip(&self.expected, self.object_format)?;
            return validate_tip(&self.next, self.object_format);
        }
        if let OperationKind::Sync(payload) = &self.kind {
            let SyncIntent {
                worktree,
                head,
                target,
                message,
                reference,
                files,
            } = payload.as_ref();
            if !Path::new(worktree).is_absolute()
                || !checkout_resource_valid(&self.resource_set, worktree)
                || message.is_empty()
                || message.contains('\0')
                || reference
                    .as_ref()
                    .is_some_and(|r| RefName::parse(r).is_err())
                || !intent_files_valid(files, self.object_format)
            {
                return Err(corrupt("sync binding"));
            }
            Oid::parse(head, self.object_format).map_err(|_| corrupt("sync head"))?;
            Oid::parse(target, self.object_format).map_err(|_| corrupt("sync target"))?;
            validate_tip(&self.expected, self.object_format)?;
            return validate_tip(&self.next, self.object_format);
        }
        let paths = match &self.kind {
            OperationKind::WorktreeCreate {
                path, registration, ..
            }
            | OperationKind::WorktreeRemove {
                path, registration, ..
            } => Some((vec![path], registration)),
            OperationKind::WorktreeMove {
                source,
                destination,
                registration,
                ..
            } => Some((vec![source, destination], registration)),
            _ => None,
        };
        if let Some((paths, registration)) = paths {
            let mut actual = self.resource_set.clone();
            let existing = match &self.kind {
                OperationKind::WorktreeRemove { path, .. } => Some(path.as_ref()),
                OperationKind::WorktreeMove { source, .. } => Some(source.as_ref()),
                _ => None,
            };
            if let Some(path) = existing {
                actual.retain(|r| {
                    !r.strip_prefix(&format!("worktree:{path}:custody:"))
                        .is_some_and(|lock| Path::new(lock).is_absolute())
                });
                if self.resource_set.len() > actual.len() + 1 {
                    return Err(corrupt("worktree custody binding"));
                }
            }
            let resources = worktree_resources(&self.kind)?;
            if paths.iter().any(|p| {
                !Path::new(&***p).is_absolute()
                    || Path::new(&***p).components().any(|c| {
                        matches!(
                            c,
                            std::path::Component::ParentDir | std::path::Component::CurDir
                        )
                    })
            }) || registration.is_empty()
                || registration.contains(['/', '\\'])
                || registration.as_ref() == "."
                || registration.as_ref() == ".."
                || actual != resources
            {
                return Err(corrupt("worktree binding"));
            }
            match &self.kind {
                OperationKind::WorktreeCreate {
                    branch, session_id, ..
                } => {
                    if self.expected != Tip::Absent
                        || self.next == Tip::Absent
                        || session_id.as_ref().is_some_and(|s| !valid_id(s))
                    {
                        return Err(corrupt("worktree create binding"));
                    }
                    if let Some(branch) = branch {
                        RefName::parse(branch).map_err(|_| corrupt("worktree branch"))?;
                        if !branch.starts_with("refs/heads/") {
                            return Err(corrupt("worktree branch"));
                        }
                    }
                }
                OperationKind::WorktreeMove {
                    source,
                    destination,
                    registration_identity,
                    ..
                } => {
                    if source == destination
                        || self.expected == Tip::Absent
                        || self.next != self.expected
                        || registration_identity.is_empty()
                    {
                        return Err(corrupt("worktree move binding"));
                    }
                }
                OperationKind::WorktreeRemove {
                    registration_identity,
                    delivery,
                    ..
                } => {
                    if self.expected == Tip::Absent
                        || self.next != Tip::Absent
                        || registration_identity.is_empty()
                        || !digest_valid(&delivery.evidence_digest)
                        || Oid::parse(&delivery.delivered_to, self.object_format).is_err()
                    {
                        return Err(corrupt("worktree remove binding"));
                    }
                }
                _ => unreachable!(),
            }
            validate_tip(&self.expected, self.object_format)?;
            return validate_tip(&self.next, self.object_format);
        }
        if let OperationKind::ConfigChange(change) = &self.kind {
            let ConfigChange {
                remote,
                url,
                refspecs,
                old_config_digest,
                ..
            } = change.as_ref();
            if change.config_sequence == Some(0)
                || (change.hooks.is_none()
                    && (remote.is_empty() || url.is_empty() || refspecs.is_empty()))
                || change.hooks.as_ref().is_some_and(|h| {
                    !Path::new(&h.owner_path).is_absolute()
                        || h.next.as_ref().is_some_and(|n| n != &h.owner_path)
                        || (h.next.is_none() && h.old.as_ref() != Some(&h.owner_path))
                })
                || change.staging.as_ref().is_some_and(|a| {
                    !a.valid()
                        || Path::new(&a.path).file_name().and_then(|s| s.to_str())
                            != Some("config.lock")
                })
                || !digest_valid(old_config_digest)
                || self.resource_set != ["config:local"]
                || self.expected != Tip::Absent
                || self.next != Tip::Absent
            {
                return Err(corrupt("config change binding"));
            }
            return Ok(());
        }
        if let OperationKind::RemoteFetch {
            url,
            refspecs,
            targets,
        }
        | OperationKind::RemotePush {
            url,
            refspecs,
            targets,
        } = &self.kind
        {
            if url.is_empty() || refspecs.is_empty() {
                return Err(corrupt("remote binding"));
            }
            let publication = self.resource_set[0].starts_with("refs/fgos/");
            let fetch = matches!(self.kind, OperationKind::RemoteFetch { .. });
            let mut seen = std::collections::BTreeSet::new();
            for (name, old, next) in targets {
                RefName::parse(name).map_err(|_| corrupt("remote target"))?;
                validate_tip(old, self.object_format)?;
                validate_tip(next, self.object_format)?;
                if !self.resource_set.contains(name)
                    || !seen.insert(name)
                    || *next == Tip::Absent
                    || (publication && fetch && !name.starts_with("refs/fgos/remotes/"))
                    || (publication && !fetch && name != &self.resource_set[0])
                    || (!publication && fetch && !name.starts_with("refs/remotes/"))
                    || (!publication && !fetch && !name.starts_with("refs/heads/"))
                {
                    return Err(corrupt("remote target resource"));
                }
            }
            if !publication {
                if targets.len() != self.resource_set.len()
                    || targets.len() != refspecs.len()
                    || self.expected != Tip::Absent
                    || self.next != Tip::Absent
                {
                    return Err(corrupt("remote targets"));
                }
                for spec in refspecs {
                    let (source, destination) = spec
                        .split_once(':')
                        .ok_or_else(|| corrupt("remote mapping"))?;
                    RefName::parse(source).map_err(|_| corrupt("remote source"))?;
                    RefName::parse(destination).map_err(|_| corrupt("remote destination"))?;
                    if source.starts_with("refs/fgos/") || !seen.contains(&destination.to_owned()) {
                        return Err(corrupt("remote mapping resource"));
                    }
                }
                for resource in &self.resource_set {
                    RefName::parse(resource).map_err(|_| corrupt("resource ref"))?;
                }
                if self
                    .resource_set
                    .iter()
                    .collect::<std::collections::BTreeSet<_>>()
                    .len()
                    != self.resource_set.len()
                {
                    return Err(corrupt("duplicate remote resource"));
                }
                return Ok(());
            }
        }
        if matches!(
            self.kind,
            OperationKind::RefUpdate { .. } | OperationKind::RefDelete
        ) {
            for resource in &self.resource_set {
                RefName::parse(resource).map_err(|_| corrupt("resource ref"))?;
                if resource.starts_with("refs/fgos/") {
                    return Err(corrupt("non-event resource"));
                }
            }
            if self.resource_set.len() != 1
                || !self.resource_set[0].starts_with("refs/heads/")
                || (matches!(self.kind, OperationKind::RefDelete)
                    && (self.next != Tip::Absent || self.expected == Tip::Absent))
                || (matches!(self.kind, OperationKind::RefUpdate { .. })
                    && self.next == Tip::Absent)
            {
                return Err(corrupt("refs binding"));
            }
            validate_tip(&self.expected, self.object_format)?;
            return validate_tip(&self.next, self.object_format);
        }
        for resource in &self.resource_set {
            RefName::parse(resource).map_err(|_| corrupt("resource ref"))?;
            if !resource.starts_with("refs/fgos/")
                || resource.starts_with("refs/fgos/git-operations/")
            {
                return Err(corrupt("publication resource"));
            }
        }
        if self.kind == OperationKind::PublicationCas && self.resource_set.len() != 1 {
            return Err(corrupt("CAS resource set"));
        }
        validate_tip(&self.expected, self.object_format)?;
        validate_tip(&self.next, self.object_format)
    }
}

#[derive(Debug, Clone)]
pub struct Chain {
    records: Vec<Record>,
}
impl Chain {
    pub fn records(&self) -> &[Record] {
        &self.records
    }
    pub fn intent(&self) -> &Intent {
        match &self.records[0].phase {
            Phase::Intent(i) => i,
            _ => unreachable!("validated chain"),
        }
    }
    pub fn outcome(&self) -> Option<&Outcome> {
        self.records.iter().find_map(|r| {
            if let Phase::Outcome(o) = &r.phase {
                Some(o)
            } else {
                None
            }
        })
    }
    pub(crate) fn config_sequence(&self) -> Option<u64> {
        match &self.intent().kind {
            OperationKind::ConfigChange(c) => c.config_sequence,
            _ => None,
        }
    }
    pub fn last_state(&self) -> &Phase {
        &self
            .records
            .iter()
            .rev()
            .find(|r| !matches!(r.phase, Phase::NativeLockOwned(_)))
            .expect("intent")
            .phase
    }
    pub fn last(&self) -> &Record {
        self.records.last().expect("validated nonempty chain")
    }
    fn validate(&self, id: &str) -> WalResult<()> {
        if self.records.is_empty() {
            return Err(corrupt("empty operation directory"));
        }
        for (n, r) in self.records.iter().enumerate() {
            if r.version != 1
                || r.sequence != n
                || r.operation_id != id
                || r.digest != record_digest(r)?
                || r.previous_digest != n.checked_sub(1).map(|p| self.records[p].digest.clone())
            {
                return Err(corrupt("version/hash/chain"));
            }
            if n == 0 {
                if let Phase::Intent(i) = &r.phase {
                    i.validate()?;
                } else {
                    return Err(corrupt("missing intent"));
                }
            } else {
                validate_transition(&self.records[..n], &r.phase)?;
            }
        }
        Ok(())
    }
}
fn checkout_resource_valid(resources: &[String], worktree: &str) -> bool {
    resources == [format!("worktree:{worktree}")]
        || resources.len() == 1
            && resources[0]
                .strip_prefix(&format!("worktree:{worktree}:custody:"))
                .is_some_and(|p| Path::new(p).is_absolute())
}
fn validate_transition(records: &[Record], phase: &Phase) -> WalResult<()> {
    let already_owned = records
        .iter()
        .any(|r| matches!(r.phase, Phase::NativeLockOwned(_)));
    // Ownership evidence is durable metadata, not an operation-state transition.
    let states: Vec<_> = records
        .iter()
        .filter(|r| !matches!(r.phase, Phase::NativeLockOwned(_)))
        .cloned()
        .collect();
    let records = states.as_slice();
    let i = match &records[0].phase {
        Phase::Intent(i) => i,
        _ => return Err(corrupt("intent")),
    };
    let prev = &records.last().ok_or_else(|| corrupt("empty"))?.phase;
    if let Phase::NativeLockOwned(artifact) = phase {
        let filename = match i.kind {
            OperationKind::ConfigChange(_) => "config.lock",
            OperationKind::Land(_)
            | OperationKind::ScopedCommit(_)
            | OperationKind::Sync(_)
            | OperationKind::Restore(_) => "index.lock",
            _ => return Err(corrupt("native lock operation kind")),
        };
        if already_owned
            || Path::new(&artifact.path)
                .file_name()
                .and_then(|s| s.to_str())
                != Some(filename)
            || records.iter().any(|r| matches!(r.phase, Phase::Outcome(_)))
            || !artifact.valid()
        {
            return Err(corrupt("native lock ownership binding"));
        }
        return Ok(());
    }
    let valid = match (prev, phase) {
        (Phase::TargetAttempt { .. }, Phase::RestoreApplied { snapshot }) => {
            matches!(i.kind, OperationKind::Restore(_)) && digest_valid(snapshot)
        }
        (Phase::Intent(_) | Phase::Prepared, Phase::Outcome(Outcome::ConfigApproved)) => {
            matches!(i.kind, OperationKind::ConfigChange(_))
        }
        (Phase::Intent(_) | Phase::Prepared, Phase::Outcome(Outcome::CommitRejected { cause })) => {
            cause == "foreign-checkout-abandoned"
                && matches!(
                    i.kind,
                    OperationKind::ScopedCommit(_) | OperationKind::Sync(_)
                )
        }
        (
            Phase::TargetAttempt { .. } | Phase::SyncState { .. } | Phase::SyncCommitAttempt { .. },
            Phase::Outcome(Outcome::CommitRejected { cause }),
        ) if cause == "foreign-checkout-effect-unknown" => matches!(
            i.kind,
            OperationKind::ScopedCommit(_) | OperationKind::Sync(_)
        ),
        (Phase::Prepared, Phase::LandVerified { evidence, .. }) => {
            matches!(&i.kind, OperationKind::Land(p) if evidence.source == p.candidate.source && evidence.target == p.candidate.target && evidence.candidate == p.candidate.candidate && evidence.tree_digest == p.candidate.tree_digest && !evidence.evidence_digest.is_empty())
        }
        (
            Phase::LandVerified { .. },
            Phase::TargetAttempt {
                prior_target_attempt: None,
                expected,
                next,
            },
        ) => matches!(i.kind, OperationKind::Land(_)) && expected == &i.expected && next == &i.next,
        (Phase::Intent(_), Phase::Prepared) => true,
        (
            Phase::Intent(_) | Phase::Prepared | Phase::LandVerified { .. },
            Phase::Outcome(Outcome::AbandonedBeforeAttempt),
        ) => true,
        (
            Phase::Prepared,
            Phase::Outcome(Outcome::Success {
                observed,
                attribution: Attribution::EffectObservedOnly,
            }),
        ) => i.kind == OperationKind::PublicationCas && observed == &i.next,
        (
            Phase::Prepared,
            Phase::TargetAttempt {
                prior_target_attempt: None,
                expected,
                next,
            },
        ) => {
            !matches!(i.kind, OperationKind::Land(_)) && expected == &i.expected && next == &i.next
        }
        (
            Phase::TargetAttempt { .. },
            Phase::SyncState {
                conflicts,
                staged,
                index_digest,
                clean_modes,
            },
        ) => {
            matches!(i.kind, OperationKind::Sync(_))
                && digest_valid(index_digest)
                && clean_modes.iter().all(|(p, mode)| {
                    staged.contains(p) && !conflicts.contains(p) && *mode <= 0o177777
                })
                && conflicts
                    .iter()
                    .all(|p| crate::fgos_scope_literal(p).is_ok())
                && staged.iter().all(|p| crate::literal_repo_path(p).is_ok())
        }
        (Phase::SyncState { .. }, Phase::SyncCommitAttempt { tree }) => {
            matches!(i.kind, OperationKind::Sync(_)) && Oid::parse(tree, i.object_format).is_ok()
        }
        (
            Phase::TargetAttempt { .. }
            | Phase::SyncState { .. }
            | Phase::SyncCommitAttempt { .. }
            | Phase::RestoreApplied { .. },
            Phase::Outcome(o),
        ) => match o {
            Outcome::Restore { state } => {
                matches!(i.kind, OperationKind::Restore(_))
                    && ["restored", "effectObservedOnly", "recoveryRequired"]
                        .contains(&state.as_str())
            }
            Outcome::Land { checkout, .. } => {
                matches!(i.kind, OperationKind::Land(_))
                    && [
                        "reconciled",
                        "pending",
                        "pendingStoreCollision",
                        "notApplicable",
                        "recoveryRequired",
                    ]
                    .contains(&checkout.as_str())
            }
            Outcome::Commit { observed, .. } => {
                matches!(
                    i.kind,
                    OperationKind::ScopedCommit(_) | OperationKind::Sync(_)
                ) && Oid::parse(observed, i.object_format).is_ok()
                    && (!matches!(i.kind, OperationKind::Sync(_))
                        || matches!(prev, Phase::SyncCommitAttempt { .. }))
            }
            Outcome::CommitRejected { cause } => {
                matches!(
                    i.kind,
                    OperationKind::ScopedCommit(_) | OperationKind::Sync(_)
                ) && !cause.is_empty()
            }
            Outcome::Worktree { details, .. } => {
                matches!(
                    i.kind,
                    OperationKind::WorktreeCreate { .. }
                        | OperationKind::WorktreeMove { .. }
                        | OperationKind::WorktreeRemove { .. }
                ) && details.len() <= 64
            }
            Outcome::AbandonedBeforeAttempt | Outcome::ConfigApproved => false,
            Outcome::Transfer {
                acknowledged,
                unknown,
                observations,
                details,
            } => {
                if matches!(
                    i.kind,
                    OperationKind::PublicationCas
                        | OperationKind::RefUpdate { .. }
                        | OperationKind::RefDelete
                        | OperationKind::Land(_)
                ) || details.len() > 1024
                    || (*acknowledged && *unknown)
                {
                    return Err(corrupt("transfer outcome"));
                }
                for (reference, observed) in observations {
                    if !i.resource_set.contains(reference) {
                        return Err(corrupt("transfer observation resource"));
                    }
                    validate_tip(observed, i.object_format)?;
                }
                true
            }
            Outcome::Success {
                observed,
                attribution,
            } => {
                validate_tip(observed, i.object_format)?;
                matches!(
                    i.kind,
                    OperationKind::PublicationCas
                        | OperationKind::RefUpdate { .. }
                        | OperationKind::RefDelete
                ) && observed == &i.next
                    && *attribution != Attribution::Uncertain
            }
            Outcome::Loss { observed } => {
                validate_tip(observed, i.object_format)?;
                matches!(
                    i.kind,
                    OperationKind::PublicationCas
                        | OperationKind::RefUpdate { .. }
                        | OperationKind::RefDelete
                        | OperationKind::Land(_)
                )
            }
            Outcome::Superseded {
                later_operation_id,
                later_receipt_digest,
                attribution,
            } => {
                i.kind == OperationKind::PublicationCas
                    && valid_id(later_operation_id)
                    && digest_valid(later_receipt_digest)
                    && *attribution != Attribution::ThisInvocationWonCas
            }
        },
        (
            Phase::Outcome(_),
            Phase::PinReleaseAttempt {
                prior_target_attempt: None,
                expected,
                next: Tip::Absent,
            },
        ) => expected == i.candidate(),
        (Phase::PinReleaseAttempt { .. }, Phase::PinReleased) => true,
        (Phase::Outcome(_) | Phase::PinReleased, Phase::RestoreAcknowledged) => {
            matches!(i.kind, OperationKind::Restore(_))
        }
        _ => false,
    };
    if valid {
        Ok(())
    } else {
        Err(corrupt("illegal phase transition"))
    }
}

/// Directory descriptors remain open throughout each operation. All descendants
/// are resolved relative to those descriptors, never a re-resolved WAL path.
///
/// Windows has no descriptor-relative path, so a directory keeps the path it
/// was opened by beside its handle; `child` opens by that joined path and then
/// proves the child sits directly beneath the directory this handle names.
struct Directory {
    file: File,
    #[cfg(windows)]
    path: PathBuf,
}
impl Directory {
    fn path(&self) -> PathBuf {
        #[cfg(target_os = "linux")]
        {
            use std::os::fd::AsRawFd;
            PathBuf::from(format!("/proc/self/fd/{}", self.file.as_raw_fd()))
        }
        #[cfg(windows)]
        {
            self.path.clone()
        }
        #[cfg(not(any(target_os = "linux", windows)))]
        {
            PathBuf::new()
        }
    }
    fn open(path: &Path) -> WalResult<Self> {
        Self::open_trusted(path, false)
    }
    fn open_trusted(path: &Path, common: bool) -> WalResult<Self> {
        #[cfg(target_os = "linux")]
        {
            use std::os::unix::fs::{MetadataExt, OpenOptionsExt};
            let file = OpenOptions::new()
                .read(true)
                .custom_flags(libc::O_DIRECTORY | libc::O_NOFOLLOW | libc::O_CLOEXEC)
                .open(path)?;
            let m = file.metadata()?;
            if (m.uid() != unsafe { libc::geteuid() } && !(common && m.uid() == 0))
                || m.mode() & if common { 0o002 } else { 0o022 } != 0
            {
                return Err(unsafe_path(path, m.uid(), m.mode(), common));
            }
            Ok(Self { file })
        }
        #[cfg(windows)]
        {
            let file = windows_trust::open_directory(path)?;
            windows_trust::check(&file, common).map_err(|reason| unsafe_path(path, &reason))?;
            Ok(Self {
                file,
                path: fgos_process::path::plain_path(path),
            })
        }
        #[cfg(not(any(target_os = "linux", windows)))]
        {
            let _ = (path, common);
            Err(WalError::Unsupported)
        }
    }
    fn child(&self, name: &str, create: bool, fsys: &dyn FileSystem) -> WalResult<Self> {
        self.child_synced(name, create, create, fsys)
    }
    /// `sync`: make the child and its name durable now. An operation
    /// directory is created without it: its first record's install fsyncs
    /// the directory and its parent before that record is acknowledged.
    fn child_synced(
        &self,
        name: &str,
        create: bool,
        sync: bool,
        fsys: &dyn FileSystem,
    ) -> WalResult<Self> {
        let path = self.path().join(name);
        if create {
            #[cfg(any(unix, windows))]
            match create_private_dir(&path) {
                Ok(()) => {
                    fsys.checkpoint("mkdir")?;
                }
                Err(e) if e.kind() == io::ErrorKind::AlreadyExists => (),
                Err(e) => return Err(e.into()),
            }
        }
        let child = Self::open(&path)?;
        #[cfg(windows)]
        windows_trust::require_beneath(&self.file, &child.file)?;
        // Also sync pre-existing dirs: a preceding failed creator may have
        // installed the name without ever syncing it. Once this process has
        // synced a directory and its name, both stay durable until that
        // directory is removed, so a later open of the same directory (same
        // device, inode and birth time) needs no second fsync.
        if sync {
            let key = durable_key(&child.file);
            // Where no identity can be read the directory is synced on every
            // open: the cache below only skips a sync it can prove was done.
            if key.is_none()
                || !DURABLE_DIRECTORIES
                    .lock()
                    .is_ok_and(|seen| seen.contains(&key))
            {
                fgos_durable_file::sync_directory(&child.path())?;
                fsys.checkpoint("directory-fsync")?;
                fgos_durable_file::sync_directory(&self.path())?;
                fsys.checkpoint("parent-fsync")?;
                if key.is_some() {
                    if let Ok(mut seen) = DURABLE_DIRECTORIES.lock() {
                        seen.insert(key);
                    }
                }
            }
        }
        Ok(child)
    }
}

/// Identity of a directory that a removal and re-creation cannot reuse:
/// `(device, inode, birth time)` on Unix.
#[cfg(unix)]
type DurableKey = (u64, u64, u128);
/// `(volume serial, 128-bit file id, creation time)` on Windows.
#[cfg(not(unix))]
type DurableKey = (u64, u128, u128);

/// Directories this process has made durable, with their names, by
/// directory identity.
static DURABLE_DIRECTORIES: std::sync::Mutex<std::collections::BTreeSet<Option<DurableKey>>> =
    std::sync::Mutex::new(std::collections::BTreeSet::new());

/// Identity of a directory that a removal and re-creation cannot reuse;
/// `None` when the filesystem reports no birth time.
#[cfg(unix)]
fn durable_key(dir: &File) -> Option<DurableKey> {
    durable_identity(&dir.metadata().ok()?)
}

/// Read from the open directory handle: the full volume serial and file id
/// (the 64-bit file index is not unique on ReFS) plus the creation time.
#[cfg(windows)]
fn durable_key(dir: &File) -> Option<DurableKey> {
    use std::os::windows::io::AsRawHandle;
    use windows_sys::Win32::Storage::FileSystem::{
        FileBasicInfo, FileIdInfo, GetFileInformationByHandleEx, FILE_BASIC_INFO, FILE_ID_INFO,
    };
    let handle = dir.as_raw_handle();
    // SAFETY: both structs are plain data and the sizes passed match them.
    let (id, basic) = unsafe {
        let mut id: FILE_ID_INFO = std::mem::zeroed();
        if GetFileInformationByHandleEx(
            handle,
            FileIdInfo,
            (&mut id as *mut FILE_ID_INFO).cast(),
            std::mem::size_of::<FILE_ID_INFO>() as u32,
        ) == 0
        {
            return None;
        }
        let mut basic: FILE_BASIC_INFO = std::mem::zeroed();
        if GetFileInformationByHandleEx(
            handle,
            FileBasicInfo,
            (&mut basic as *mut FILE_BASIC_INFO).cast(),
            std::mem::size_of::<FILE_BASIC_INFO>() as u32,
        ) == 0
        {
            return None;
        }
        (id, basic)
    };
    Some((
        id.VolumeSerialNumber,
        u128::from_le_bytes(id.FileId.Identifier),
        u128::try_from(basic.CreationTime).ok()?,
    ))
}

#[cfg(not(any(unix, windows)))]
fn durable_key(_dir: &File) -> Option<DurableKey> {
    None
}

#[cfg(unix)]
pub(crate) fn durable_identity(m: &fs::Metadata) -> Option<(u64, u64, u128)> {
    use std::os::unix::fs::MetadataExt;
    let born = m
        .created()
        .ok()?
        .duration_since(std::time::UNIX_EPOCH)
        .ok()?
        .as_nanos();
    Some((m.dev(), m.ino(), born))
}

pub struct Wal<F = OsFileSystem> {
    common: Directory,
    root: Directory,
    ledger: Directory,
    fs: F,
    identity: String,
    /// Per-operation `git-operation` locks this Wal holds, keyed by operation
    /// id: taken when `begin` creates a chain, released when an outcome is
    /// appended for it or when the Wal drops. The kernel frees them if the
    /// process dies, which is what lets admission tell a live writer from a
    /// dead one.
    op_locks:
        std::sync::Mutex<std::collections::BTreeMap<String, fgos_holder_lock::LockScope<'static>>>,
}
#[derive(Debug)]
pub enum Begin {
    Created(Chain),
    Existing(Chain),
    Compacted(CompactReceipt),
}
/// All WAL-writing doors require the controller's durable cutover fence.
pub fn require_activation_fence(repo: &RepoHandle) -> WalResult<()> {
    if !fgos_holder_lock::tombstone::is_tombstone(
        &repo.trusted_main_root().join(".fgos/locks/activation.lock"),
        "activation",
        "fgos git",
    ) {
        return Err(WalError::FenceMissing);
    }
    Ok(())
}
impl Wal<OsFileSystem> {
    pub fn open(repo: &RepoHandle) -> WalResult<Self> {
        Self::open_with(repo, OsFileSystem)
    }
}
impl<F: FileSystem> Wal<F> {
    /// The WAL of `repo` for writing: every writing door requires the activation fence first.
    pub fn open_with(repo: &RepoHandle, fsys: F) -> WalResult<Self> {
        require_activation_fence(repo)?;
        Self::with_filesystem(repo.common_dir(), fsys)
    }
    pub fn with_filesystem(common: &Path, fsys: F) -> WalResult<Self> {
        require_canonical(common)?;
        let common = Directory::open_trusted(common, true)?;
        let identity = repository_identity(&common)?;
        let fgos = common.child("fgos", true, &fsys)?;
        let git = fgos.child("git", true, &fsys)?;
        let root = git.child("operations", true, &fsys)?;
        let ledger = git.child("compacted", true, &fsys)?;
        Ok(Self {
            common,
            root,
            ledger,
            fs: fsys,
            identity,
            op_locks: Default::default(),
        })
    }
    /// C5/doctor reader: opens existing descriptors without mkdir or fsync.
    /// NotFound means the WAL has never been initialized, not a corrupt chain.
    pub fn open_existing(common_path: &Path, fsys: F) -> WalResult<Self> {
        require_canonical(common_path)?;
        let common = Directory::open_trusted(common_path, true)?;
        let identity = repository_identity(&common)?;
        let fgos = common.child("fgos", false, &fsys)?;
        let git = fgos.child("git", false, &fsys)?;
        let root = git.child("operations", false, &fsys)?;
        let ledger = git.child("compacted", false, &fsys)?;
        Ok(Self {
            common,
            root,
            ledger,
            fs: fsys,
            identity,
            op_locks: Default::default(),
        })
    }
    /// Seven-day orphan retention is housekeeping, never effect attribution.
    /// Referenced and malformed evidence is never aged out.
    fn prune_restore_orphans(&self, dir: &Directory) -> WalResult<()> {
        let retained = self.retained(100_000)?;
        let mut referenced = std::collections::BTreeSet::new();
        for chain in &retained {
            if let OperationKind::Restore(p) = &chain.intent().kind {
                referenced.insert(p.snapshot.clone());
            }
            for record in chain.records() {
                if let Phase::RestoreApplied { snapshot } = &record.phase {
                    referenced.insert(snapshot.clone());
                }
            }
        }
        for entry in fs::read_dir(dir.path())? {
            let entry = entry?;
            let name = entry.file_name().to_string_lossy().into_owned();
            let metadata = fs::symlink_metadata(entry.path())?;
            if !metadata.is_file()
                || referenced.contains(&name)
                || !metadata
                    .modified()?
                    .elapsed()
                    .is_ok_and(|age| age.as_secs() >= 7 * 24 * 60 * 60)
            {
                continue;
            }
            let removable = if digest_valid(&name) {
                self.read_restore_snapshot::<serde_json::Value>(&name)
                    .is_ok()
            } else {
                is_durable_temporary(&name)
            };
            if removable {
                fs::remove_file(entry.path())?;
            }
        }
        fgos_durable_file::sync_directory(&dir.path())?;
        Ok(())
    }
    pub(crate) fn store_restore_snapshot<T: Serialize>(&self, value: &T) -> WalResult<String> {
        let bytes = serde_json::to_vec(value).map_err(|_| corrupt("snapshot serialize"))?;
        if bytes.len() > 128 * 1024 * 1024 {
            return Err(corrupt("restore snapshot capacity"));
        }
        let digest = canonical_digest(value)?;
        let git = self
            .common
            .child("fgos", false, &self.fs)?
            .child("git", false, &self.fs)?;
        let dir = git.child("restore-snapshots", true, &self.fs)?;
        self.prune_restore_orphans(&dir)?;
        install_ordered(
            &dir.path(),
            &digest,
            &bytes,
            &self.fs,
            None,
            &mut || Ok(()),
            &[],
        )
        .map_err(|e| WalError::Io(e.source))?;
        self.fs.checkpoint("restore-snapshot-durable")?;
        let _: serde_json::Value = self.read_restore_snapshot(&digest)?;
        Ok(digest)
    }
    pub(crate) fn store_restore_patch(
        &self,
        reference: &str,
        id: &str,
        bytes: &[u8],
    ) -> WalResult<PathBuf> {
        if !valid_id(id) || (reference != "HEAD" && !reference.starts_with("refs/heads/")) {
            return Err(corrupt("invalid restore patch identity"));
        }
        let branch = reference
            .trim_start_matches("refs/heads/")
            .replace('/', "-");
        let dir = self.common.child("fgos-resync-patches", true, &self.fs)?;
        let name = format!("{branch}-{id}.patch");
        install_ordered(
            &dir.path(),
            &name,
            bytes,
            &self.fs,
            None,
            &mut || Ok(()),
            &[],
        )
        .map_err(|e| WalError::Io(e.source))?;
        Ok(fgos_process::path::plain_path(
            &dir.path().join(name).canonicalize()?,
        ))
    }
    pub(crate) fn clear_restore_patch(
        &self,
        reference: &str,
        id: &str,
        bytes: &[u8],
    ) -> WalResult<bool> {
        let branch = reference
            .trim_start_matches("refs/heads/")
            .replace('/', "-");
        let dir = self.common.child("fgos-resync-patches", false, &self.fs)?;
        let path = dir.path().join(format!("{branch}-{id}.patch"));
        if !fs::symlink_metadata(&path).is_ok_and(|m| m.is_file() && !m.file_type().is_symlink())
            || fs::read(&path)? != bytes
        {
            return Ok(false);
        }
        fs::remove_file(path)?;
        fgos_durable_file::sync_directory(&dir.path())?;
        Ok(true)
    }
    pub(crate) fn release_restore_snapshots(&self, digests: &[String]) -> WalResult<()> {
        let retained = self.retained(100_000)?;
        let dir = self
            .common
            .child("fgos", false, &self.fs)?
            .child("git", false, &self.fs)?
            .child("restore-snapshots", false, &self.fs)?;
        for digest in digests {
            if !digest_valid(digest) {
                return Err(corrupt("snapshot digest"));
            }
            let used = retained.iter().any(|chain| {
                if matches!(chain.last_state(), Phase::RestoreAcknowledged) {
                    return false;
                }
                matches!(&chain.intent().kind, OperationKind::Restore(p) if &p.snapshot == digest)
                    || chain.records.iter().any(|r| {
                        matches!(&r.phase, Phase::RestoreApplied { snapshot } if snapshot == digest)
                    })
            });
            if !used {
                match fs::remove_file(dir.path().join(digest)) {
                    Ok(()) => self.fs.checkpoint("restore-snapshot-released")?,
                    Err(e) if e.kind() == std::io::ErrorKind::NotFound => (),
                    Err(e) => return Err(e.into()),
                }
            }
        }
        fgos_durable_file::sync_directory(&dir.path())?;
        Ok(())
    }
    pub(crate) fn read_restore_snapshot<T: serde::de::DeserializeOwned>(
        &self,
        digest: &str,
    ) -> WalResult<T> {
        if !digest_valid(digest) {
            return Err(corrupt("snapshot digest"));
        }
        let dir = self
            .common
            .child("fgos", false, &self.fs)?
            .child("git", false, &self.fs)?
            .child("restore-snapshots", false, &self.fs)?;
        let value: serde_json::Value = read_json(&dir.path().join(digest), 128 * 1024 * 1024)?;
        if canonical_digest(&value)? != digest {
            return Err(corrupt("snapshot digest mismatch"));
        }
        serde_json::from_value(value).map_err(|_| corrupt("snapshot shape"))
    }
    pub fn repository_identity(&self) -> &str {
        &self.identity
    }
    fn operation(&self, id: &str, create: bool) -> WalResult<Directory> {
        if !valid_id(id) {
            return Err(corrupt("operation id"));
        }
        // Record zero's install makes a created operation directory durable.
        self.root.child_synced(id, create, false, &self.fs)
    }
    pub fn begin(
        &self,
        id: &str,
        intent: Intent,
        authority: &dyn PublicationAuthority,
    ) -> WalResult<Begin> {
        authority.validate_publication_borrow(&intent)?;
        intent.validate()?;
        if intent.repo_identity != self.identity {
            return Err(WalError::Untrusted);
        }
        if let Some(c) = self.compacted(id)? {
            if !c.matches(&intent)? {
                return Err(WalError::OperationIdConflict);
            }
            return Ok(Begin::Compacted(c));
        }
        // Refuse an oversized intent before the operation directory exists, so
        // the refusal leaves nothing behind that could block a later attempt.
        let r = make_record(id, 0, None, Phase::Intent(intent.clone()))?;
        check_record_bound(&r)?;
        let dir = self.operation(id, true)?;
        if let Some(c) = self.compacted(id)? {
            if !c.matches(&intent)? {
                return Err(WalError::OperationIdConflict);
            }
            return Ok(Begin::Compacted(c));
        }
        // An installed record zero already binds this id: the no-overwrite
        // install below could only lose to it, so answer as that loser
        // would, without writing (and syncing) a doomed temporary.
        if dir.path().join(record_name(0)).try_exists()? {
            fgos_durable_file::sync_directories(&[&dir.path(), &self.root.path()])?;
            self.fs.checkpoint("existing-intent-parent-fsync")?;
            return match self.existing(id, &intent) {
                // A compactor may have removed the chain since: its ledger
                // entry is then the binding, as after a lost install.
                Err(e) => match self.compacted(id)? {
                    Some(c) if c.matches(&intent)? => Ok(Begin::Compacted(c)),
                    Some(_) => Err(WalError::OperationIdConflict),
                    None => Err(e),
                },
                found => found,
            };
        }
        let installed = self.install(&dir, &record_name(0), &r, true)?;
        // A concurrent compactor may have removed record zero after our first
        // ledger read. Its durable binding wins even if we installed a name
        // through a still-open operation directory descriptor.
        if let Some(c) = self.compacted(id)? {
            if !c.matches(&intent)? {
                return Err(WalError::OperationIdConflict);
            }
            return Ok(Begin::Compacted(c));
        }
        match installed {
            Installed::Created => {
                self.hold_operation(id);
                Ok(Begin::Created(Chain { records: vec![r] }))
            }
            Installed::AlreadyExists => self.existing(id, &intent),
        }
    }
    /// Registry path of operation `id`'s `git-operation` lock, from the
    /// holder-lock door.
    fn operation_lock_path(&self, id: &str) -> Option<PathBuf> {
        fgos_holder_lock::lock_path("git-operation", &self.operation_lock_params(id)?).ok()
    }
    fn operation_lock_params(
        &self,
        id: &str,
    ) -> Option<std::collections::BTreeMap<String, String>> {
        // The id becomes a path segment that remove_operation deletes: an id
        // with '/' or '..' must never reach the template, whatever its source.
        if !valid_id(id) {
            return None;
        }
        Some(std::collections::BTreeMap::from([
            ("common".to_owned(), self.common.path().to_str()?.to_owned()),
            ("operationId".to_owned(), id.to_owned()),
        ]))
    }
    /// Take `git-operation` for a chain this Wal just created, in a scope of
    /// its own (operations take worktree-admin and main-checkout after
    /// begin, which a caller's scope would refuse as out of order). Liveness
    /// is advisory: when the lock cannot be taken the operation proceeds and
    /// admission falls back to `resource-recovery-required`.
    fn hold_operation(&self, id: &str) {
        let Ok(mut scope) = fgos_holder_lock::LockScope::seeded(vec![]) else {
            return;
        };
        let (Some(params), Ok(mut held)) = (self.operation_lock_params(id), self.op_locks.lock())
        else {
            return;
        };
        if scope
            .acquire("git-operation", &params, fgos_holder_lock::Wait::Ms(0))
            .is_ok()
        {
            held.insert(id.to_owned(), scope);
        }
    }
    /// Whether another live process holds operation `id`'s `git-operation`
    /// lock. A free, absent or unprobeable lock answers `false`.
    pub fn operation_live(&self, id: &str) -> bool {
        self.operation_lock_path(id).is_some_and(|path| {
            matches!(
                fgos_holder_lock::port::probe(&fgos_holder_lock::port::Resource::new(
                    "git-operation",
                    path
                )),
                Ok(fgos_holder_lock::port::Probe::Held)
            )
        })
    }
    /// The established chain of `id`, when it binds the same request.
    fn existing(&self, id: &str, intent: &Intent) -> WalResult<Begin> {
        let c = self.inspect(id)?;
        if c.intent().request_digest != intent.request_digest
            || binding_digest(c.intent())? != binding_digest(intent)?
        {
            return Err(WalError::OperationIdConflict);
        }
        Ok(Begin::Existing(c))
    }
    /// Install one record: durable-file writes and fsyncs the file, installs
    /// the name without overwrite and fsyncs `dir`. `new_directory`: `dir`
    /// was created for this record (record zero), so its parent is fsynced
    /// too before the record is acknowledged; a later record's directory
    /// name is already durable.
    fn install<T: Serialize>(
        &self,
        dir: &Directory,
        name: &str,
        value: &T,
        new_directory: bool,
    ) -> WalResult<Installed> {
        self.install_ordered(dir, name, value, new_directory, None, &mut || Ok(()))
    }
    /// `alongside` runs while the record bytes are synced, `before_install`
    /// after both and before its name exists (see
    /// `fgos_durable_file::install_ordered`).
    fn install_ordered<T: Serialize>(
        &self,
        dir: &Directory,
        name: &str,
        value: &T,
        new_directory: bool,
        alongside: Option<&(dyn Fn() -> io::Result<()> + Sync)>,
        before_install: &mut dyn FnMut() -> io::Result<()>,
    ) -> WalResult<Installed> {
        let bytes = serde_json::to_vec(value).map_err(|_| corrupt("serialize"))?;
        if bytes.len() as u64 > MAX_RECORD {
            return Err(corrupt("record byte bound"));
        }
        let root = self.root.path();
        let parents: &[&Path] = if new_directory { &[&root] } else { &[] };
        let result = install_ordered(
            &dir.path(),
            name,
            &bytes,
            &self.fs,
            alongside,
            before_install,
            parents,
        )
        .map_err(|e| WalError::Io(e.source))?;
        self.fs.checkpoint("record-install")?;
        Ok(result)
    }
    pub fn inspect(&self, id: &str) -> WalResult<Chain> {
        let dir = self.operation(id, false)?;
        let mut names = Vec::new();
        let mut scanned = 0;
        for e in fs::read_dir(dir.path())? {
            let e = e?;
            let name = e
                .file_name()
                .into_string()
                .map_err(|_| corrupt("non UTF-8 record name"))?;
            if is_durable_temporary(&name) {
                continue;
            }
            scanned += 1;
            if scanned > MAX_RECORDS * 2 {
                return Err(corrupt("directory scan bound"));
            }
            if names.len() >= MAX_RECORDS {
                return Err(corrupt("record bound"));
            }
            names.push(name);
        }
        names.sort();
        let mut records = Vec::new();
        for (n, name) in names.iter().enumerate() {
            if name != &record_name(n) {
                return Err(corrupt("record gap or unknown evidence"));
            }
            records.push(read_json(&dir.path().join(name), MAX_RECORD)?);
        }
        let chain = Chain { records };
        chain.validate(id)?;
        if chain.intent().repo_identity != self.identity {
            return Err(WalError::Untrusted);
        }
        Ok(chain)
    }
    /// The caller passes the exact chain it observed. A racing installer wins
    /// the next numbered name; the loser gets Busy and no effect permit.
    /// Supersession has a separate checked entry point.
    pub fn append(&self, chain: &Chain, phase: Phase) -> WalResult<Chain> {
        self.append_ordered(chain, phase, None, &mut || Ok(()))
    }
    /// [`Wal::append`] whose record is installed only after `alongside` (run
    /// on another thread while the record's bytes are synced) and then
    /// `before_install` returned `Ok`. A caller uses it to make another
    /// durable effect that must precede this record durable together with
    /// the record's own write.
    pub fn append_ordered(
        &self,
        chain: &Chain,
        phase: Phase,
        alongside: Option<&(dyn Fn() -> io::Result<()> + Sync)>,
        before_install: &mut dyn FnMut() -> io::Result<()>,
    ) -> WalResult<Chain> {
        if matches!(
            phase,
            Phase::Intent(_) | Phase::Outcome(Outcome::Superseded { .. })
        ) {
            return Err(WalError::RecoveryRequired);
        }
        self.append_checked(chain, phase, alongside, before_install)
    }
    fn append_checked(
        &self,
        chain: &Chain,
        phase: Phase,
        alongside: Option<&(dyn Fn() -> io::Result<()> + Sync)>,
        before_install: &mut dyn FnMut() -> io::Result<()>,
    ) -> WalResult<Chain> {
        let id = &chain.last().operation_id;
        chain.validate(id)?;
        let actual = self.inspect(id)?;
        if actual.last().digest != chain.last().digest {
            return Err(WalError::Busy);
        }
        validate_transition(&chain.records, &phase)?;
        let r = make_record(
            id,
            chain.records.len(),
            Some(chain.last().digest.clone()),
            phase,
        )?;
        let dir = self.operation(id, false)?;
        if self.install_ordered(
            &dir,
            &record_name(r.sequence),
            &r,
            false,
            alongside,
            before_install,
        )? != Installed::Created
        {
            return Err(WalError::Busy);
        }
        if matches!(r.phase, Phase::Outcome(_)) {
            if let Ok(mut held) = self.op_locks.lock() {
                held.remove(id);
            }
        }
        let mut records = chain.records.clone();
        records.push(r);
        Ok(Chain { records })
    }
    /// Validates durable later evidence and live authority admission. This only
    /// records an outcome; it cannot authorize any replay of the old effect.
    pub fn supersede(
        &self,
        old: &Chain,
        later_id: &str,
        admission: &dyn AuthorityAdmission,
    ) -> WalResult<Chain> {
        if !matches!(old.last_state(), Phase::TargetAttempt { .. })
            || old.last().operation_id == later_id
        {
            return Err(WalError::RecoveryRequired);
        }
        let later = self.inspect(later_id)?;
        let a = old.intent();
        let b = later.intent();
        if a.kind != OperationKind::PublicationCas
            || b.kind != OperationKind::PublicationCas
            || a.repo_identity != b.repo_identity
            || a.resource_set != b.resource_set
            || a.authority_binding != b.authority_binding
            || (b.expected != a.expected && b.expected != a.next)
            || !matches!(
                later.outcome(),
                Some(Outcome::Success {
                    attribution: Attribution::ThisInvocationWonCas,
                    ..
                })
            )
            || !admission.old_performer_gone(a)?
            || self.native_lock_present(a)?
        {
            return Err(WalError::RecoveryRequired);
        }
        let attribution = if b.expected == a.next {
            Attribution::EffectObservedOnly
        } else {
            Attribution::Uncertain
        };
        let receipt = later
            .records
            .iter()
            .find(|r| matches!(r.phase, Phase::Outcome(_)))
            .ok_or_else(|| corrupt("later receipt"))?;
        self.append_checked(
            old,
            Phase::Outcome(Outcome::Superseded {
                later_operation_id: later_id.into(),
                later_receipt_digest: receipt.digest.clone(),
                attribution,
            }),
            None,
            &mut || Ok(()),
        )
    }
    pub(crate) fn native_lock_present(&self, intent: &Intent) -> WalResult<bool> {
        // Never unlink any native lock. Probe files and reftable: an unknown
        // backend artifact conservatively blocks every attempted supersession.
        for p in [
            format!("{}.lock", intent.resource_set[0]),
            "reftable/tables.list.lock".into(),
            "packed-refs.lock".into(),
        ] {
            match fs::symlink_metadata(self.common.path().join(p)) {
                Ok(_) => return Ok(true),
                Err(e) if e.kind() == io::ErrorKind::NotFound => (),
                Err(e) => return Err(e.into()),
            }
        }
        Ok(false)
    }
}
fn compaction_suffix(dir: &Directory, id: &str) -> WalResult<Vec<Record>> {
    let mut records = Vec::new();
    for (count, entry) in fs::read_dir(dir.path())?.enumerate() {
        if count >= MAX_RECORDS {
            return Err(corrupt("compaction residue bound"));
        }
        let entry = entry?;
        let r: Record = read_json(&entry.path(), MAX_RECORD)?;
        if r.version != 1
            || r.operation_id != id
            || entry.file_name() != std::ffi::OsStr::new(&record_name(r.sequence))
            || r.digest != record_digest(&r)?
        {
            return Err(corrupt("unattributable compaction residue"));
        }
        records.push(r);
    }
    records.sort_by_key(|r| r.sequence);
    for pair in records.windows(2) {
        if pair[1].sequence != pair[0].sequence + 1
            || pair[1].previous_digest.as_ref() != Some(&pair[0].digest)
        {
            return Err(corrupt("compaction suffix"));
        }
    }
    if records.last().is_some_and(|r| {
        !matches!(
            r.phase,
            Phase::PinReleased
                | Phase::RestoreAcknowledged
                | Phase::Outcome(Outcome::Worktree { .. })
                | Phase::Outcome(Outcome::Transfer { .. })
                | Phase::Outcome(Outcome::ConfigApproved)
                | Phase::Outcome(Outcome::AbandonedBeforeAttempt)
        )
    }) {
        return Err(corrupt("nonterminal compaction suffix"));
    }
    Ok(records)
}

fn repository_identity(dir: &Directory) -> WalResult<String> {
    #[cfg(unix)]
    {
        use std::os::unix::fs::MetadataExt;
        let m = dir.file.metadata()?;
        Ok(format!("{}:{}", m.dev(), m.ino()))
    }
    #[cfg(windows)]
    {
        Ok(windows_trust::identity(&dir.file)?)
    }
    #[cfg(not(any(unix, windows)))]
    {
        let _ = dir;
        Err(WalError::Unsupported)
    }
}
/// Whether `intent` fits one record under `id`, measured exactly as `begin`
/// measures it, so a caller can split work before any record exists.
pub fn intent_fits(id: &str, intent: &Intent) -> WalResult<bool> {
    match check_record_bound(&make_record(id, 0, None, Phase::Intent(intent.clone()))?) {
        Ok(()) => Ok(true),
        Err(WalError::RecordTooLarge) => Ok(false),
        Err(e) => Err(e),
    }
}
fn check_record_bound(r: &Record) -> WalResult<()> {
    let bytes = serde_json::to_vec(r).map_err(|_| corrupt("serialize"))?;
    if bytes.len() as u64 > MAX_RECORD {
        return Err(WalError::RecordTooLarge);
    }
    Ok(())
}
fn make_record(
    id: &str,
    sequence: usize,
    previous_digest: Option<String>,
    phase: Phase,
) -> WalResult<Record> {
    let mut r = Record {
        version: 1,
        operation_id: id.into(),
        sequence,
        previous_digest,
        phase,
        digest: String::new(),
    };
    r.digest = record_digest(&r)?;
    Ok(r)
}
fn record_name(n: usize) -> String {
    format!("{n:08}.json")
}
fn read_json<T: for<'de> Deserialize<'de>>(path: &Path, limit: u64) -> WalResult<T> {
    let mut options = OpenOptions::new();
    options.read(true);
    #[cfg(unix)]
    {
        use std::os::unix::fs::OpenOptionsExt;
        options.custom_flags(libc::O_NOFOLLOW | libc::O_NONBLOCK);
    }
    #[cfg(windows)]
    let file = {
        let file = fgos_durable_file::open_no_reparse(&mut options, path)?;
        windows_trust::check(&file, false).map_err(|reason| unsafe_path(path, &reason))?;
        file
    };
    #[cfg(not(windows))]
    let file = options.open(path)?;
    #[cfg(unix)]
    {
        use std::os::unix::fs::MetadataExt;
        let m = file.metadata()?;
        if m.uid() != unsafe { libc::geteuid() } || m.mode() & 0o022 != 0 {
            return Err(unsafe_path(path, m.uid(), m.mode(), false));
        }
    }
    if !file.metadata()?.is_file() || file.metadata()?.len() > limit {
        return Err(corrupt("record size/type"));
    }
    let mut bytes = Vec::new();
    file.take(limit + 1).read_to_end(&mut bytes)?;
    if bytes.len() as u64 > limit {
        return Err(corrupt("record size"));
    }
    serde_json::from_slice(&bytes).map_err(|_| corrupt("record parse"))
}
/// Implemented by the holder-lock adapter, never by deserializing request
/// fields. Must complete §8/8.1 predecessor admission and validate the live
/// event-seal binding, or prove the old containment domain Empty.
/// No default adapter: the operation layer must validate a live event-seal
/// borrow for this exact repository/resource/binding before even Intent is
/// installed. Implement with holder-lock, not a request-supplied boolean/fd.
pub trait PublicationAuthority {
    fn validate_publication_borrow(&self, intent: &Intent) -> WalResult<()>;
}
pub trait AuthorityAdmission {
    fn old_performer_gone(&self, intent: &Intent) -> WalResult<bool>;
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ObservedRef {
    Direct(Tip),
    Symbolic,
}
/// The operation layer implements these reads through the hardened Git driver.
/// The resource and pin are derived here, never supplied by a recorded path.
pub trait RecoveryReader {
    fn read_ref(&self, reference: &str) -> WalResult<ObservedRef>;
    fn candidate_intact(&self, intent: &Intent) -> WalResult<bool>;
}
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum Recovery {
    FirstAttemptEligible,
    RecoveryRequired,
    EffectObservedOnly,
    PinReconciliationRequired,
    Terminal(Outcome),
}
impl<F: FileSystem> Wal<F> {
    pub fn recover(&self, id: &str, reader: &dyn RecoveryReader) -> WalResult<Recovery> {
        if let Some(c) = self.compacted(id)? {
            return Ok(Recovery::Terminal(c.outcome()?));
        }
        let c = self.inspect(id)?;
        // Terminal evidence never grants a new effect even if the ref moved.
        if let Some(o) = c.outcome() {
            return Ok(Recovery::Terminal(o.clone()));
        }
        let i = c.intent();
        if i.kind != OperationKind::PublicationCas {
            return Ok(Recovery::RecoveryRequired);
        }
        let target = reader.read_ref(&i.resource_set[0])?;
        let pin = reader.read_ref(&format!("refs/fgos/git-operations/{id}/candidate"))?;
        if matches!(c.last_state(), Phase::Intent(_)) {
            return Ok(Recovery::RecoveryRequired);
        }
        if !reader.candidate_intact(i)? {
            return Ok(Recovery::RecoveryRequired);
        }
        if target == ObservedRef::Direct(i.next.clone()) {
            if pin != ObservedRef::Direct(i.candidate().clone()) || self.native_lock_present(i)? {
                return Ok(Recovery::PinReconciliationRequired);
            }
            return Ok(Recovery::EffectObservedOnly);
        }
        if self.native_lock_present(i)? {
            return Ok(Recovery::RecoveryRequired);
        }
        if target == ObservedRef::Direct(i.expected.clone())
            && pin == ObservedRef::Direct(i.candidate().clone())
            && matches!(c.last_state(), Phase::Prepared)
        {
            return Ok(Recovery::FirstAttemptEligible);
        }
        Ok(Recovery::RecoveryRequired)
    }
}

/// Compact terminal receipt. Keys are short to maintain the ≤512-byte bound
/// even for SHA-256 refs. Request/resource/authority bindings remain immutable.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct CompactReceipt {
    pub v: u8,
    pub id: String,
    #[serde(rename = "q")]
    #[serde(with = "ledger_hex")]
    pub request: String,
    #[serde(rename = "b")]
    #[serde(with = "ledger_hex")]
    pub binding: String,
    #[serde(rename = "r")]
    #[serde(with = "ledger_hex_vec")]
    pub receipt: Vec<String>,
    #[serde(default, rename = "e", with = "ledger_hex")]
    pub expected: String,
    #[serde(default, rename = "n", with = "ledger_hex")]
    pub next: String,
    #[serde(default, skip_serializing_if = "Option::is_none", rename = "f")]
    pub reference: Option<String>,
    #[serde(with = "ledger_hex")]
    pub digest: String,
}
// Lossless base64url representation of hex hashes keeps full SHA-256 receipts
// below the signed 512-byte ledger bound, including maximum-length ids.
mod ledger_hex {
    use serde::{Deserialize, Deserializer, Serializer};
    const ALPHABET: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
    pub(super) fn encode(s: &str) -> String {
        if !matches!(s.len(), 40 | 64)
            || !s
                .bytes()
                .all(|b| b.is_ascii_digit() || (b'a'..=b'f').contains(&b))
        {
            return s.into();
        }
        let mut out = String::from("~");
        let mut bits = 0u32;
        let mut n = 0;
        for byte in s.as_bytes().as_chunks::<2>().0 {
            let hex = |b: u8| if b <= b'9' { b - b'0' } else { b - b'a' + 10 };
            bits = (bits << 8) | u32::from(hex(byte[0]) * 16 + hex(byte[1]));
            n += 8;
            while n >= 6 {
                n -= 6;
                out.push(ALPHABET[((bits >> n) & 63) as usize] as char);
            }
        }
        if n > 0 {
            out.push(ALPHABET[((bits << (6 - n)) & 63) as usize] as char);
        }
        out
    }
    pub(super) fn decode(s: String) -> Result<String, String> {
        let Some(encoded) = s.strip_prefix('~') else {
            return Ok(s);
        };
        let mut out = String::new();
        let mut bits = 0u32;
        let mut n = 0;
        for c in encoded.bytes() {
            let v = ALPHABET
                .iter()
                .position(|b| *b == c)
                .ok_or("invalid ledger hash")?;
            bits = (bits << 6) | v as u32;
            n += 6;
            if n >= 8 {
                n -= 8;
                let b = ((bits >> n) & 255) as u8;
                use std::fmt::Write;
                write!(out, "{b:02x}").unwrap();
            }
        }
        if encode(&out) != s {
            return Err("noncanonical ledger hash".into());
        }
        Ok(out)
    }
    pub fn serialize<S: Serializer>(s: &str, serializer: S) -> Result<S::Ok, S::Error> {
        serializer.serialize_str(&encode(s))
    }
    pub fn deserialize<'de, D: Deserializer<'de>>(d: D) -> Result<String, D::Error> {
        decode(String::deserialize(d)?).map_err(serde::de::Error::custom)
    }
}
mod ledger_hex_vec {
    use serde::{Deserialize, Deserializer, Serialize, Serializer};
    pub fn serialize<S: Serializer>(values: &[String], serializer: S) -> Result<S::Ok, S::Error> {
        values
            .iter()
            .map(|s| super::ledger_hex::encode(s))
            .collect::<Vec<_>>()
            .serialize(serializer)
    }
    pub fn deserialize<'de, D: Deserializer<'de>>(d: D) -> Result<Vec<String>, D::Error> {
        Vec::<String>::deserialize(d)?
            .into_iter()
            .map(|s| super::ledger_hex::decode(s).map_err(serde::de::Error::custom))
            .collect()
    }
}
fn compact_outcome(o: &Outcome) -> Vec<String> {
    match o {
        Outcome::Restore { state } => vec!["z".into(), state.clone()],
        Outcome::Land {
            checkout,
            observed_only,
        } => vec!["d".into(), checkout.clone(), observed_only.to_string()],
        Outcome::Commit {
            observed,
            contract_violation,
        } => vec!["k".into(), observed.clone(), contract_violation.to_string()],
        Outcome::CommitRejected { cause } => vec!["r".into(), cause.clone()],
        Outcome::Worktree { completed, .. } => vec!["w".into(), completed.to_string()],
        Outcome::ConfigApproved => vec!["c".into()],
        Outcome::AbandonedBeforeAttempt => vec!["a".into()],
        Outcome::Transfer {
            acknowledged,
            unknown,
            ..
        } => vec![
            "t".into(),
            acknowledged.to_string(),
            unknown.to_string(),
            canonical_digest(o).expect("serializable outcome"),
        ],
        Outcome::Success {
            observed,
            attribution,
        } => vec![
            "s".into(),
            compact_tip(observed),
            if *attribution == Attribution::ThisInvocationWonCas {
                "w"
            } else {
                "e"
            }
            .into(),
        ],
        Outcome::Loss { observed } => vec!["l".into(), compact_tip(observed)],
        Outcome::Superseded {
            later_operation_id,
            later_receipt_digest,
            attribution,
        } => vec![
            "x".into(),
            later_operation_id.clone(),
            later_receipt_digest.clone(),
            if *attribution == Attribution::EffectObservedOnly {
                "e"
            } else {
                "u"
            }
            .into(),
        ],
    }
}
fn compact_tip(t: &Tip) -> String {
    match t {
        Tip::Absent => "-".into(),
        Tip::Oid(o) => o.clone(),
    }
}
fn valid_compact_outcome(o: &[String]) -> bool {
    let tip = |s: &str| {
        s == "-"
            || Oid::parse(s, ObjectFormat::Sha1).is_ok()
            || Oid::parse(s, ObjectFormat::Sha256).is_ok()
    };
    match o.first().map(String::as_str) {
        Some("z") => {
            o.len() == 2
                && ["restored", "effectObservedOnly", "recoveryRequired"].contains(&o[1].as_str())
        }
        Some("d") => {
            (o.len() == 2 || (o.len() == 3 && ["true", "false"].contains(&o[2].as_str())))
                && [
                    "reconciled",
                    "pending",
                    "pendingStoreCollision",
                    "notApplicable",
                    "recoveryRequired",
                ]
                .contains(&o[1].as_str())
        }
        Some("k") => o.len() == 3 && tip(&o[1]) && matches!(o[2].as_str(), "true" | "false"),
        Some("r") => o.len() == 2 && !o[1].is_empty(),
        Some("w") => o.len() == 2 && matches!(o[1].as_str(), "true" | "false"),
        Some("a" | "c") => o.len() == 1,
        Some("t") => {
            o.len() == 4
                && matches!(o[1].as_str(), "true" | "false")
                && matches!(o[2].as_str(), "true" | "false")
                && !(o[1] == "true" && o[2] == "true")
                && digest_valid(&o[3])
        }
        Some("s") => o.len() == 3 && tip(&o[1]) && matches!(o[2].as_str(), "w" | "e"),
        Some("l") => o.len() == 2 && tip(&o[1]),
        Some("x") => {
            o.len() == 4
                && valid_id(&o[1])
                && digest_valid(&o[2])
                && matches!(o[3].as_str(), "e" | "u")
        }
        _ => false,
    }
}
impl CompactReceipt {
    /// What the entry's `digest` binds. Version 1 omitted expected/next, which
    /// must never be guessed; version 3 adds the reference.
    fn ledger_digest(&self) -> WalResult<String> {
        let c = self;
        match c.v {
            1 => canonical_digest(&(c.v, &c.id, &c.request, &c.binding, &c.receipt)),
            3 => canonical_digest(&(
                c.v,
                &c.id,
                &c.request,
                &c.binding,
                &c.receipt,
                &c.expected,
                &c.next,
                &c.reference,
            )),
            _ => canonical_digest(&(
                c.v,
                &c.id,
                &c.request,
                &c.binding,
                &c.receipt,
                &c.expected,
                &c.next,
            )),
        }
    }
    /// Decode the durable terminal observation; request-specific expected/next
    /// and the processCrash-only receipt envelope are supplied by Publication.
    pub fn outcome(&self) -> WalResult<Outcome> {
        if !valid_compact_outcome(&self.receipt) {
            return Err(corrupt("compact outcome"));
        }
        let r = &self.receipt;
        let tip = |s: &str| {
            if s == "-" {
                Tip::Absent
            } else {
                Tip::Oid(s.into())
            }
        };
        Ok(match r[0].as_str() {
            "z" => Outcome::Restore {
                state: r[1].clone(),
            },
            "k" => Outcome::Commit {
                observed: r[1].clone(),
                contract_violation: r[2] == "true",
            },
            "r" => Outcome::CommitRejected {
                cause: r[1].clone(),
            },
            "d" => Outcome::Land {
                checkout: r[1].clone(),
                observed_only: r.get(2).is_some_and(|s| s == "true"),
            },
            "w" => Outcome::Worktree {
                completed: r[1] == "true",
                details: vec![],
            },
            "c" => Outcome::ConfigApproved,
            "a" => Outcome::AbandonedBeforeAttempt,
            "t" => Outcome::Transfer {
                acknowledged: r[1] == "true",
                unknown: r[2] == "true",
                observations: vec![],
                details: vec![format!("compacted transfer digest: {}", r[3])],
            },
            "s" => Outcome::Success {
                observed: tip(&r[1]),
                attribution: if r[2] == "w" {
                    Attribution::ThisInvocationWonCas
                } else {
                    Attribution::EffectObservedOnly
                },
            },
            "l" => Outcome::Loss {
                observed: tip(&r[1]),
            },
            _ => Outcome::Superseded {
                later_operation_id: r[1].clone(),
                later_receipt_digest: r[2].clone(),
                attribution: if r[3] == "e" {
                    Attribution::EffectObservedOnly
                } else {
                    Attribution::Uncertain
                },
            },
        })
    }
    pub(crate) fn matches(&self, i: &Intent) -> WalResult<bool> {
        Ok(self.request == i.request_digest && self.binding == binding_digest(i)?)
    }
}
fn binding_digest(i: &Intent) -> WalResult<String> {
    if matches!(i.kind, OperationKind::Land(_)) {
        return canonical_digest(&(
            "land",
            &i.repo_identity,
            i.resource_set.first(),
            &i.authority_binding,
            &i.writer_identity,
            &i.expected,
            &i.next,
            i.object_format,
        ));
    }
    canonical_digest(&(
        &i.repo_identity,
        &i.resource_set,
        &i.authority_binding,
        &i.expected,
        &i.next,
        i.object_format,
    ))
}
impl<F: FileSystem> Wal<F> {
    /// Finish deletion interrupted after durable ledger installation. Remaining
    /// records must form the exact valid suffix of a terminal chain. Unknown
    /// artifacts are retained. Caller holds the original publication authority.
    pub fn resume_compaction(
        &self,
        id: &str,
        reader: &dyn RecoveryReader,
        intent: &Intent,
        authority: &dyn PublicationAuthority,
    ) -> WalResult<()> {
        authority.validate_publication_borrow(intent)?;
        if !self
            .compacted(id)?
            .ok_or(WalError::RecoveryRequired)?
            .matches(intent)?
        {
            return Err(WalError::OperationIdConflict);
        }
        if reader.read_ref(&format!("refs/fgos/git-operations/{id}/candidate"))?
            != ObservedRef::Direct(Tip::Absent)
        {
            return Err(WalError::RecoveryRequired);
        }
        let dir = match self.operation(id, false) {
            Ok(d) => d,
            Err(WalError::Io(e)) if e.kind() == io::ErrorKind::NotFound => return Ok(()),
            Err(e) => return Err(e),
        };
        self.remove_operation(id, &dir, &compaction_suffix(&dir, id)?)
    }
    /// Removes an operation's records, then its directory, with a flush after each step.
    /// Nothing else in the directory is touched: unexpected files are evidence.
    fn remove_operation(&self, id: &str, dir: &Directory, records: &[Record]) -> WalResult<()> {
        for r in records {
            fs::remove_file(dir.path().join(record_name(r.sequence)))?;
            self.fs.checkpoint("remove-record")?;
        }
        fgos_durable_file::sync_directory(&dir.path())?;
        self.fs.checkpoint("removed-records-fsync")?;
        fs::remove_dir(self.root.path().join(id))?;
        self.fs.checkpoint("remove-operation")?;
        // The lock was released at the outcome; an absent file probes free.
        if let Some(lock) = self.operation_lock_path(id) {
            match fs::remove_file(lock) {
                Ok(()) => {}
                Err(e) if e.kind() == io::ErrorKind::NotFound => {}
                Err(e) => return Err(e.into()),
            }
        }
        fgos_durable_file::sync_directory(&self.root.path())?;
        Ok(self.fs.checkpoint("removed-operation-parent-fsync")?)
    }
    pub fn compacted(&self, id: &str) -> WalResult<Option<CompactReceipt>> {
        if !valid_id(id) {
            return Err(corrupt("operation id"));
        }
        let path = self.ledger.path().join(id);
        let c: CompactReceipt = match read_json(&path, 512) {
            Ok(c) => c,
            Err(WalError::Io(e)) if e.kind() == io::ErrorKind::NotFound => return Ok(None),
            Err(e) => return Err(e),
        };
        // Version 1 omitted expected/next. Keep its immutable binding and
        // exact-request replay readable; missing facts must never be guessed.
        let tips_valid = if c.v == 1 {
            c.expected.is_empty() && c.next.is_empty()
        } else {
            [&c.expected, &c.next].iter().all(|s| {
                *s == "-" || matches!(s.len(), 40 | 64) && s.bytes().all(|b| b.is_ascii_hexdigit())
            })
        };
        if !matches!(c.v, 1..=3)
            || (c.v < 3 && c.reference.is_some())
            || c.reference
                .as_ref()
                .is_some_and(|r| RefName::parse(r).is_err())
            || c.id != id
            || c.digest != c.ledger_digest()?
            || !digest_valid(&c.request)
            || !digest_valid(&c.binding)
            || !tips_valid
            || !valid_compact_outcome(&c.receipt)
        {
            return Err(corrupt("ledger hash/version/id"));
        }
        Ok(Some(c))
    }
    /// Call only under the same live event-seal, after a PinReleaseAttempt,
    /// exact-old pin delete, read-back and pin-directory durability. Unknown
    /// evidence and unresolved chains are never removed. A failed deletion
    /// leaves the immutable ledger as the id-binding authority.
    pub fn compact(
        &self,
        chain: &Chain,
        reader: &dyn RecoveryReader,
        authority: &dyn PublicationAuthority,
    ) -> WalResult<CompactReceipt> {
        self.compact_inner(chain, reader, authority, false)
    }
    /// Explicit acknowledgement releases Restore evidence through the normal ledger.
    pub(crate) fn compact_restore_ack(
        &self,
        chain: &Chain,
        reader: &dyn RecoveryReader,
        authority: &dyn PublicationAuthority,
    ) -> WalResult<CompactReceipt> {
        if !matches!(chain.intent().kind, OperationKind::Restore(_))
            || !matches!(chain.last_state(), Phase::RestoreAcknowledged)
        {
            return Err(WalError::RecoveryRequired);
        }
        self.compact_inner(chain, reader, authority, true)
    }
    fn compact_inner(
        &self,
        chain: &Chain,
        reader: &dyn RecoveryReader,
        authority: &dyn PublicationAuthority,
        restore_ack: bool,
    ) -> WalResult<CompactReceipt> {
        authority.validate_publication_borrow(chain.intent())?;
        let id = &chain.last().operation_id;
        let actual = self.inspect(id)?;
        if actual.last().digest != chain.last().digest
            // Restore releases its binding only after durable caller acknowledgement.
            || (matches!(actual.intent().kind, OperationKind::Restore(_)) && !restore_ack)
            || !(matches!(actual.last_state(), Phase::PinReleased)
                || (actual.intent().kind != OperationKind::PublicationCas
                    && actual.outcome().is_some()))
            || reader.read_ref(&format!("refs/fgos/git-operations/{id}/candidate"))?
                != ObservedRef::Direct(Tip::Absent)
        {
            return Err(WalError::RecoveryRequired);
        }
        let operation = self.operation(id, false)?;
        // Preserve every orphan/unknown artifact; do not partially compact an
        // operation which contains evidence outside the validated chain.
        for entry in fs::read_dir(operation.path())? {
            let entry = entry?;
            if !actual
                .records
                .iter()
                .any(|r| entry.file_name() == std::ffi::OsStr::new(&record_name(r.sequence)))
            {
                return Err(WalError::RecoveryRequired);
            }
        }
        let i = actual.intent();
        let mut c = CompactReceipt {
            v: if matches!(i.kind, OperationKind::Land(_))
                || matches!(&i.kind, OperationKind::Sync(p) if p.reference.is_some())
            {
                3
            } else {
                2
            },
            id: id.clone(),
            request: i.request_digest.clone(),
            binding: binding_digest(i)?,
            expected: compact_tip(&i.expected),
            next: compact_tip(&i.next),
            receipt: compact_outcome(actual.outcome().ok_or(WalError::RecoveryRequired)?),
            reference: match &i.kind {
                OperationKind::Sync(p) => p.reference.clone(),
                OperationKind::Land(p) => Some(p.request.destination.clone()),
                _ => None,
            },
            digest: String::new(),
        };
        c.digest = c.ledger_digest()?;
        if serde_json::to_vec(&c)
            .map_err(|_| corrupt("ledger serialize"))?
            .len()
            + 1
            > 512
        {
            return Err(corrupt("ledger entry exceeds 512 bytes"));
        }
        if self.install(&self.ledger, id, &c, false)? == Installed::AlreadyExists {
            let existing = self
                .compacted(id)?
                .ok_or_else(|| corrupt("missing ledger"))?;
            if existing.digest != c.digest {
                return Err(WalError::OperationIdConflict);
            }
        }
        // The install fsynced the ledger directory after the name.
        let dir = self.operation(id, false)?;
        // No recursive remove: unexpected files (including failed-write temps)
        // are evidence. Leave them attributable by the durable ledger.
        self.remove_operation(id, &dir, &actual.records)?;
        Ok(c)
    }
}
#[derive(Debug)]
pub struct ScanEntry {
    pub operation_id: String,
    pub terminal: bool,
    pub error: Option<String>,
}
#[derive(Debug)]
pub struct Backlog {
    pub entries: Vec<ScanEntry>,
    pub complete: bool,
    pub unresolved: usize,
    pub ledger_bytes: u64,
    /// Retained id bindings are linear, even though the active working set drains.
    pub ledger_entries: usize,
    /// Doctor consumers should surface this as capacity debt, never delete ids.
    pub ledger_capacity_warning: bool,
    pub retained_bytes: u64,
    /// Finished chains still on disk (compacted ones live in the ledger instead).
    pub retained_terminal: usize,
    pub oldest_retained: Option<std::time::SystemTime>,
    pub oldest_unresolved: Option<(String, std::time::SystemTime)>,
}
impl<F: FileSystem> Wal<F> {
    /// When the operation's directory last changed (its last record was
    /// installed). Scheduling only: it never decides a protocol outcome.
    pub(crate) fn last_change(&self, id: &str) -> Option<std::time::SystemTime> {
        fs::metadata(self.root.path().join(id))
            .ok()?
            .modified()
            .ok()
    }
    /// Whether `id` names a compacted receipt or a directory holding record
    /// zero; a directory without one is an abandoned shell and names nothing.
    pub fn known_id(&self, id: &str) -> WalResult<bool> {
        if self.compacted(id)?.is_some() {
            return Ok(true);
        }
        match self.operation(id, false) {
            Ok(dir) => self.has_intent(&dir),
            Err(WalError::Io(e)) if e.kind() == io::ErrorKind::NotFound => Ok(false),
            Err(e) => Err(e),
        }
    }
    fn has_intent(&self, dir: &Directory) -> WalResult<bool> {
        if dir.path().join(record_name(0)).try_exists()? {
            return Ok(true);
        }
        for entry in fs::read_dir(dir.path())? {
            let name = entry?.file_name().to_string_lossy().into_owned();
            if !is_durable_temporary(&name) {
                return Err(corrupt("unknown pre-intent artifact"));
            }
        }
        Ok(false)
    }
    /// Call only under repo-config authority. ConfigChange provenance chains
    /// remain retained, so sequence allocation and provenance share WAL truth.
    pub(crate) fn next_config_sequence(&self) -> WalResult<u64> {
        self.retained(100_000)?
            .iter()
            .filter_map(Chain::config_sequence)
            .max()
            .unwrap_or(0)
            .checked_add(1)
            .ok_or(WalError::RecoveryRequired)
    }
    /// Admission never traverses historical ledger entries. A directory without
    /// record zero is not an Intent and cannot block an unrelated operation.
    pub fn active(&self, bound: usize) -> WalResult<Vec<Chain>> {
        Ok(self
            .retained(bound)?
            .into_iter()
            .filter(|c| c.outcome().is_none())
            .collect())
    }
    /// Retained operation directories, including terminal records awaiting
    /// compaction. Historical compacted ids are never traversed.
    pub fn retained(&self, bound: usize) -> WalResult<Vec<Chain>> {
        let mut chains = Vec::new();
        for (n, entry) in fs::read_dir(self.root.path())?.enumerate() {
            if n >= bound {
                return Err(WalError::RecoveryRequired);
            }
            let id = entry?.file_name().to_string_lossy().into_owned();
            if self.compacted(&id)?.is_some() {
                continue;
            }
            let dir = self.operation(&id, false)?;
            if !self.has_intent(&dir)? {
                continue;
            }
            let chain = self.inspect(&id)?;
            chains.push(chain);
        }
        Ok(chains)
    }
    /// Bound covers both operation directories and immutable ledger entries;
    /// reaching it always reports incomplete, never clearance for C5.
    pub fn scan(&self, bound: usize) -> WalResult<Backlog> {
        let mut result = Backlog {
            entries: vec![],
            complete: true,
            unresolved: 0,
            ledger_bytes: 0,
            ledger_entries: 0,
            ledger_capacity_warning: false,
            retained_bytes: 0,
            retained_terminal: 0,
            oldest_retained: None,
            oldest_unresolved: None,
        };
        let mut seen = 0;
        for (dir, ledger) in [(&self.root, false), (&self.ledger, true)] {
            for entry in fs::read_dir(dir.path())? {
                let entry = entry?;
                let id = entry.file_name().to_string_lossy().into_owned();
                if is_durable_temporary(&id) {
                    continue;
                }
                // A directory whose record zero was never installed bound no
                // operation; listing it would send every reader to inspect it.
                if !ledger && matches!(self.known_id(&id), Ok(false)) {
                    continue;
                }
                if seen == bound {
                    result.complete = false;
                    return Ok(result);
                }
                seen += 1;
                // The ledger is installed durably before any chain deletion.
                // Re-read it after every failed observation of a root entry.
                let inspect_entry =
                    || -> WalResult<(bool, u64, Option<std::time::SystemTime>, bool)> {
                        let metadata = entry.metadata()?;
                        if ledger {
                            self.compacted(&id)?
                                .ok_or_else(|| corrupt("missing ledger"))?;
                            return Ok((true, metadata.len(), metadata.modified().ok(), false));
                        }
                        if self.compacted(&id)?.is_some() {
                            return Ok((true, 0, None, false));
                        }
                        let operation = self.operation(&id, false)?;
                        let terminal =
                            !self.has_intent(&operation)? || self.inspect(&id)?.outcome().is_some();
                        let mut bytes = metadata.len();
                        let mut incomplete = false;
                        let mut counted = 0;
                        for file in fs::read_dir(operation.path())? {
                            let file = file?;
                            if is_durable_temporary(&file.file_name().to_string_lossy()) {
                                continue;
                            }
                            counted += 1;
                            if counted > MAX_RECORDS * 2 {
                                incomplete = true;
                                break;
                            }
                            bytes += file.metadata()?.len();
                        }
                        Ok((terminal, bytes, metadata.modified().ok(), incomplete))
                    };
                let (terminal, bytes, modified, incomplete, error) = match inspect_entry() {
                    Ok((t, bytes, modified, incomplete)) => (t, bytes, modified, incomplete, None),
                    Err(e) if !ledger => match self.compacted(&id) {
                        Ok(Some(_)) => (true, 0, None, false, None),
                        _ => (false, 0, None, false, Some(e.to_string())),
                    },
                    Err(e) => (
                        false,
                        entry.metadata().map(|m| m.len()).unwrap_or(0),
                        None,
                        false,
                        Some(e.to_string()),
                    ),
                };
                if ledger {
                    result.ledger_bytes += bytes;
                    result.ledger_entries += 1;
                    result.ledger_capacity_warning =
                        result.ledger_entries >= 100_000 || result.ledger_bytes >= 64 * 1024 * 1024;
                } else {
                    result.retained_bytes += bytes;
                    // A compacted leftover reports no modification time, so it never counts as retained.
                    if let (true, Some(time)) = (terminal, modified) {
                        result.retained_terminal += 1;
                        result.oldest_retained =
                            Some(result.oldest_retained.map_or(time, |old| old.min(time)));
                    }
                }
                result.complete &= !incomplete;
                if !terminal {
                    result.unresolved += 1;
                    if let Some(time) = modified {
                        if result
                            .oldest_unresolved
                            .as_ref()
                            .is_none_or(|(_, old)| time < *old)
                        {
                            result.oldest_unresolved = Some((id.clone(), time));
                        }
                    }
                }
                result.entries.push(ScanEntry {
                    operation_id: id,
                    terminal,
                    error,
                });
            }
        }
        Ok(result)
    }
}

// Same temporary-name rule for every WAL directory reader.
fn is_durable_temporary(name: &str) -> bool {
    name.starts_with(".durable-file-") && name.ends_with(".tmp")
}

#[cfg(all(test, any(target_os = "linux", windows)))]
mod tests {
    use super::*;
    use std::sync::atomic::{AtomicUsize, Ordering};
    static SERIAL: AtomicUsize = AtomicUsize::new(0);
    struct Authority;
    impl PublicationAuthority for Authority {
        fn validate_publication_borrow(&self, _: &Intent) -> WalResult<()> {
            Ok(())
        }
    }
    struct Temp(PathBuf);
    impl Temp {
        fn new() -> Self {
            // A WAL opens only by its real path, so the scratch root is the
            // canonical spelling of the temp directory (Windows may hand out an
            // 8.3 short name such as RUNNER~1), written plainly.
            let root =
                fgos_process::path::plain_path(&std::env::temp_dir().canonicalize().unwrap());
            let p = root.join(format!(
                "fgos-wal-{}-{}",
                std::process::id(),
                SERIAL.fetch_add(1, Ordering::Relaxed)
            ));
            create_private_dir(&p).unwrap();
            Self(p)
        }
    }
    impl Drop for Temp {
        fn drop(&mut self) {
            let _ = fs::remove_dir_all(&self.0);
        }
    }
    fn intent<F: FileSystem>(wal: &Wal<F>) -> Intent {
        Intent {
            kind: OperationKind::PublicationCas,
            request_digest: "a".repeat(64),
            repo_identity: wal.identity.clone(),
            resource_set: vec!["refs/fgos/events/machine".into()],
            authority_binding: "event-seal:machine".into(),
            writer_identity: "performer-1".into(),
            object_format: ObjectFormat::Sha1,
            expected: Tip::Absent,
            next: Tip::Oid("b".repeat(40)),
        }
    }
    fn begun<F: FileSystem>(w: &Wal<F>, id: &str) -> Chain {
        match w.begin(id, intent(w), &Authority).unwrap() {
            Begin::Created(c) => c,
            _ => panic!(),
        }
    }
    fn attempted<F: FileSystem>(w: &Wal<F>, id: &str) -> Chain {
        let c = w.append(&begun(w, id), Phase::Prepared).unwrap();
        w.append(
            &c,
            Phase::TargetAttempt {
                prior_target_attempt: None,
                expected: c.intent().expected.clone(),
                next: c.intent().next.clone(),
            },
        )
        .unwrap()
    }
    fn success<F: FileSystem>(w: &Wal<F>, c: &Chain) -> Chain {
        w.append(
            c,
            Phase::Outcome(Outcome::Success {
                observed: c.intent().next.clone(),
                attribution: Attribution::ThisInvocationWonCas,
            }),
        )
        .unwrap()
    }
    struct Reader {
        target: ObservedRef,
        pin: ObservedRef,
        intact: bool,
    }
    impl RecoveryReader for Reader {
        fn read_ref(&self, name: &str) -> WalResult<ObservedRef> {
            Ok(if name.contains("git-operations") {
                self.pin.clone()
            } else {
                self.target.clone()
            })
        }
        fn candidate_intact(&self, _: &Intent) -> WalResult<bool> {
            Ok(self.intact)
        }
    }
    fn reader(i: &Intent) -> Reader {
        Reader {
            target: ObservedRef::Direct(i.expected.clone()),
            pin: ObservedRef::Direct(i.next.clone()),
            intact: true,
        }
    }
    #[test]
    fn immutable_binding_and_transition_loser_stop() {
        let t = Temp::new();
        let w = Wal::with_filesystem(&t.0, OsFileSystem).unwrap();
        let c = begun(&w, "one");
        assert!(matches!(
            w.begin("one", intent(&w), &Authority).unwrap(),
            Begin::Existing(_)
        ));
        for mutate in 0..3 {
            let mut i = intent(&w);
            match mutate {
                0 => i.request_digest = "c".repeat(64),
                1 => i.resource_set = vec!["refs/fgos/events/other".into()],
                _ => i.authority_binding = "other".into(),
            }
            assert!(matches!(
                w.begin("one", i, &Authority),
                Err(WalError::OperationIdConflict)
            ));
        }
        w.append(&c, Phase::Prepared).unwrap();
        assert!(matches!(w.append(&c, Phase::Prepared), Err(WalError::Busy)));
        assert_eq!(w.inspect("one").unwrap().records.len(), 2);
    }
    #[test]
    fn concurrent_record_zero_and_attempt_have_one_winner() {
        let t = Temp::new();
        let w = Wal::with_filesystem(&t.0, OsFileSystem).unwrap();
        let barrier = std::sync::Barrier::new(3);
        std::thread::scope(|s| {
            let handles: Vec<_> = (0..3)
                .map(|_| {
                    s.spawn(|| {
                        barrier.wait();
                        matches!(
                            w.begin("race", intent(&w), &Authority).unwrap(),
                            Begin::Created(_)
                        )
                    })
                })
                .collect();
            assert_eq!(
                handles
                    .into_iter()
                    .map(|h| usize::from(h.join().unwrap()))
                    .sum::<usize>(),
                1
            );
        });
        let c = w
            .append(&w.inspect("race").unwrap(), Phase::Prepared)
            .unwrap();
        std::thread::scope(|s| {
            let handles: Vec<_> = (0..3)
                .map(|_| {
                    s.spawn(|| {
                        barrier.wait();
                        w.append(
                            &c,
                            Phase::TargetAttempt {
                                prior_target_attempt: None,
                                expected: c.intent().expected.clone(),
                                next: c.intent().next.clone(),
                            },
                        )
                        .is_ok()
                    })
                })
                .collect();
            assert_eq!(
                handles
                    .into_iter()
                    .map(|h| usize::from(h.join().unwrap()))
                    .sum::<usize>(),
                1
            );
        });
    }
    #[test]
    fn recovery_table_never_reissues_attempt_even_after_aba() {
        let t = Temp::new();
        let w = Wal::with_filesystem(&t.0, OsFileSystem).unwrap();
        let c = begun(&w, "one");
        let mut r = reader(c.intent());
        assert_eq!(w.recover("one", &r).unwrap(), Recovery::RecoveryRequired);
        let c = w.append(&c, Phase::Prepared).unwrap();
        assert_eq!(
            w.recover("one", &r).unwrap(),
            Recovery::FirstAttemptEligible
        );
        w.append(
            &c,
            Phase::TargetAttempt {
                prior_target_attempt: None,
                expected: c.intent().expected.clone(),
                next: c.intent().next.clone(),
            },
        )
        .unwrap();
        assert_eq!(w.recover("one", &r).unwrap(), Recovery::RecoveryRequired);
        r.target = ObservedRef::Direct(c.intent().next.clone());
        assert_eq!(w.recover("one", &r).unwrap(), Recovery::EffectObservedOnly);
        r.pin = ObservedRef::Direct(Tip::Absent);
        assert_eq!(
            w.recover("one", &r).unwrap(),
            Recovery::PinReconciliationRequired
        );
        r.intact = false;
        assert_eq!(w.recover("one", &r).unwrap(), Recovery::RecoveryRequired);
    }
    #[test]
    fn corrupt_version_hash_gap_unknown_and_symlink_are_not_empty() {
        // A symlink needs a privilege Windows tests do not hold; its refusal is
        // covered where the link is made, by the no-reparse open.
        let cases = if cfg!(unix) { 5 } else { 4 };
        for case in 0..cases {
            let t = Temp::new();
            let w = Wal::with_filesystem(&t.0, OsFileSystem).unwrap();
            begun(&w, "one");
            let dir = w.root.path().join("one");
            let p = dir.join(record_name(0));
            match case {
                0 => fs::write(&p, b"{").unwrap(),
                1 => {
                    let mut v: serde_json::Value = read_json(&p, MAX_RECORD).unwrap();
                    v["version"] = 2.into();
                    fs::write(&p, serde_json::to_vec(&v).unwrap()).unwrap();
                }
                2 => fs::rename(&p, dir.join(record_name(1))).unwrap(),
                3 => fs::write(dir.join("unknown"), b"evidence").unwrap(),
                _ => {
                    fs::remove_file(&p).unwrap();
                    #[cfg(unix)]
                    std::os::unix::fs::symlink("/etc/passwd", &p).unwrap();
                }
            }
            assert!(w.inspect("one").is_err());
            let scan = w.scan(100).unwrap();
            assert_eq!(scan.unresolved, 1);
            assert!(scan.entries[0].error.is_some());
        }
    }
    // Unix only: it asserts the mode text and a symlink, neither of which Windows has.
    #[cfg(unix)]
    #[test]
    fn trust_root_refuses_writable_or_symlink_directory() {
        use std::os::unix::fs::{symlink, PermissionsExt};
        let t = Temp::new();
        fs::create_dir(t.0.join("fgos")).unwrap();
        fs::set_permissions(t.0.join("fgos"), fs::Permissions::from_mode(0o775)).unwrap();
        let fgos = t.0.join("fgos").display().to_string();
        match Wal::with_filesystem(&t.0, OsFileSystem) {
            Err(e @ WalError::UnsafePath(_)) => assert_eq!(
                e.to_string(),
                format!("git-wal-path-unsafe: {fgos} has mode 0775, writable by group or others; run: chmod go-w {fgos}")
            ),
            other => panic!("a group-writable fgos directory is refused by name: {:?}", other.err()),
        }
        fs::remove_dir(t.0.join("fgos")).unwrap();
        let other = Temp::new();
        symlink(&other.0, t.0.join("fgos")).unwrap();
        assert!(Wal::with_filesystem(&t.0, OsFileSystem).is_err());
    }
    #[cfg(windows)]
    #[test]
    fn trust_root_refuses_directory_writable_by_everyone() {
        let t = Temp::new();
        let fgos = t.0.join("fgos");
        fs::create_dir(&fgos).unwrap();
        let granted = std::process::Command::new("icacls")
            .arg(&fgos)
            .args(["/grant", "*S-1-1-0:(OI)(CI)(W)"])
            .output()
            .unwrap();
        assert!(granted.status.success(), "icacls failed: {granted:?}");
        match Wal::with_filesystem(&t.0, OsFileSystem) {
            Err(WalError::UnsafePath(text)) => {
                assert!(text.contains("grants write access to Everyone"), "{text}");
            }
            other => panic!(
                "a directory Everyone may write is refused by name: {:?}",
                other.err()
            ),
        }
    }
    struct Admission(bool);
    impl AuthorityAdmission for Admission {
        fn old_performer_gone(&self, _: &Intent) -> WalResult<bool> {
            Ok(self.0)
        }
    }
    #[test]
    fn supersession_requires_winner_binding_domain_and_no_native_lock() {
        let t = Temp::new();
        let w = Wal::with_filesystem(&t.0, OsFileSystem).unwrap();
        let old = attempted(&w, "old");
        let later = attempted(&w, "later");
        assert!(w.supersede(&old, "later", &Admission(true)).is_err());
        success(&w, &later);
        assert!(w.supersede(&old, "later", &Admission(false)).is_err());
        fs::create_dir_all(t.0.join("refs/fgos/events")).unwrap();
        let lock = t.0.join("refs/fgos/events/machine.lock");
        fs::write(&lock, b"native evidence").unwrap();
        assert!(w.supersede(&old, "later", &Admission(true)).is_err());
        assert_eq!(fs::read(&lock).unwrap(), b"native evidence");
        fs::remove_file(&lock).unwrap();
        let c = w.supersede(&old, "later", &Admission(true)).unwrap();
        assert!(matches!(
            c.outcome(),
            Some(Outcome::Superseded {
                attribution: Attribution::Uncertain,
                ..
            })
        ));
        assert_eq!(w.scan(100).unwrap().unresolved, 0);
        assert!(!w.scan(0).unwrap().complete);
    }
    struct Fault {
        fail: AtomicUsize,
        count: AtomicUsize,
    }
    impl FileSystem for Fault {
        fn checkpoint(&self, _: &'static str) -> io::Result<()> {
            let n = self.count.fetch_add(1, Ordering::SeqCst) + 1;
            if n == self.fail.load(Ordering::SeqCst) {
                Err(io::Error::other("injected crash"))
            } else {
                Ok(())
            }
        }
    }
    /// Records every checkpoint name it sees.
    struct Steps(std::sync::Mutex<Vec<&'static str>>);
    impl FileSystem for Steps {
        fn checkpoint(&self, step: &'static str) -> io::Result<()> {
            self.0.lock().unwrap().push(step);
            Ok(())
        }
    }
    #[test]
    fn begin_replay_syncs_both_directories_after_creator_stopped_before_parent_fsync() {
        struct StopBeforeSync;
        impl FileSystem for StopBeforeSync {
            fn checkpoint(&self, step: &'static str) -> io::Result<()> {
                if step == "temp-removed" {
                    Err(io::Error::other("creator stopped before directory sync"))
                } else {
                    Ok(())
                }
            }
        }
        let t = Temp::new();
        let creator = Wal::with_filesystem(&t.0, StopBeforeSync).unwrap();
        assert!(creator
            .begin("replay", intent(&creator), &Authority)
            .is_err());
        assert!(
            creator.inspect("replay").is_ok(),
            "record zero exists despite failed begin"
        );
        let replay = Wal::with_filesystem(&t.0, Steps(Default::default())).unwrap();
        replay.fs.0.lock().unwrap().clear();
        assert!(matches!(
            replay.begin("replay", intent(&replay), &Authority).unwrap(),
            Begin::Existing(_)
        ));
        assert_eq!(
            &*replay.fs.0.lock().unwrap(),
            &["existing-intent-parent-fsync"]
        );
        let mut different = intent(&replay);
        different.request_digest = "f".repeat(64);
        assert!(matches!(
            replay.begin("replay", different, &Authority),
            Err(WalError::OperationIdConflict)
        ));
    }

    #[test]
    fn oversized_intent_is_refused_before_an_operation_directory_exists() {
        let t = Temp::new();
        let w = Wal::with_filesystem(&t.0, OsFileSystem).unwrap();
        let mut huge = intent(&w);
        huge.writer_identity = "w".repeat(MAX_RECORD as usize);
        assert!(matches!(
            w.begin("too-large", huge, &Authority),
            Err(WalError::RecordTooLarge)
        ));
        assert!(
            !t.0.join("too-large").exists(),
            "refusal must not leave a directory"
        );
        assert!(matches!(w.known_id("too-large"), Ok(false)));
        assert!(matches!(
            w.begin("too-large", intent(&w), &Authority).unwrap(),
            Begin::Created(_)
        ));
    }
    #[test]
    fn scoped_commit_intent_written_with_a_null_cutover_grant_keeps_its_digest() {
        // Earlier releases wrote `"cutoverGrant": null` into ordinary intents, and a
        // record verifies only if re-serializing it reproduces the bytes it was hashed from.
        // The grant object only the retired `events migrate` wrote stays refused.
        let intent = ScopedCommitIntent {
            worktree: "/w".into(),
            baseline: "{}".into(),
            request: "{}".into(),
            paths: PathSet::of(&[]).unwrap(),
            tree: "0".repeat(40),
            retired_cutover_grant: None,
        };
        let mut earlier = serde_json::to_value(&intent).unwrap();
        assert!(earlier.get("cutoverGrant").is_none());
        earlier["cutoverGrant"] = serde_json::Value::Null;
        let read: ScopedCommitIntent = serde_json::from_value(earlier.clone()).unwrap();
        assert_eq!(serde_json::to_value(&read).unwrap(), earlier);
        assert_eq!(
            canonical_digest(&read).unwrap(),
            canonical_digest(&earlier).unwrap()
        );
        earlier["cutoverGrant"] =
            serde_json::json!({"exactPaths": [".fgos/x"], "legacyRefOid": "0", "sealDigest": "0"});
        assert!(serde_json::from_value::<ScopedCommitIntent>(earlier).is_err());
    }
    #[test]
    fn path_set_digest_matches_the_same_paths_in_any_order_and_listed_records_still_read() {
        let paths: Vec<String> = ["b/2", "a/1", "c/3"].map(String::from).to_vec();
        let digest = PathSet::of(&paths).unwrap();
        assert!(matches!(digest, PathSet::Digest(_)));
        assert!(digest
            .matches(&["c/3".into(), "a/1".into(), "b/2".into()])
            .unwrap());
        assert!(!digest.matches(&["a/1".into(), "b/2".into()]).unwrap());
        assert!(!digest
            .matches(&["a/1".into(), "b/2".into(), "c/4".into()])
            .unwrap());
        assert!(PathSet::of(&[]).unwrap().is_empty());
        let listed: PathSet = serde_json::from_str(r#"["a/1","b/2","c/3"]"#).unwrap();
        assert!(listed.matches(&paths).unwrap());
        assert_eq!(
            serde_json::from_str::<PathSet>(&serde_json::to_string(&digest).unwrap()).unwrap(),
            digest
        );
    }
    #[test]
    fn scan_ignores_compaction_temporaries_before_counting_the_bound() {
        let t = Temp::new();
        let wal = Wal::with_filesystem(&t.0, OsFileSystem).unwrap();
        fs::write(
            wal.ledger.path().join(".durable-file-123-0.tmp"),
            b"partial ledger",
        )
        .unwrap();
        let scan = wal.scan(0).unwrap();
        assert!(scan.complete);
        assert_eq!(scan.unresolved, 0);
        assert_eq!(scan.ledger_entries, 0);
        assert!(scan.entries.is_empty());
        fs::write(wal.ledger.path().join("unexpected"), b"bad").unwrap();
        let scan = wal.scan(10).unwrap();
        assert_eq!(scan.unresolved, 1);
        assert!(scan.entries[0].error.is_some());
    }

    #[test]
    fn failed_write_temporaries_never_count_against_the_record_bound() {
        // The test above puts one temporary in the ledger directory. A write that keeps failing
        // leaves one more temporary each time, inside an operation directory: beside a valid chain,
        // or before its first record exists. Neither may turn the operation, or the scan that
        // admission runs, into corruption.
        let t = Temp::new();
        let wal = Wal::with_filesystem(&t.0, OsFileSystem).unwrap();
        let chain = attempted(&wal, "stuck");
        let pre = wal.operation("not-begun", true).unwrap();
        let beside = wal.operation("stuck", false).unwrap();
        for n in 0..(MAX_RECORDS * 2 + 8) {
            for dir in [&beside, &pre] {
                fs::write(
                    dir.path().join(format!(".durable-file-{n}-0.tmp")),
                    b"partial",
                )
                .unwrap();
            }
        }
        let mut refused = Vec::new();
        match wal.inspect("stuck") {
            Ok(c) if c.records().len() == chain.records().len() => (),
            other => refused.push(format!("a chain with leftover temporaries: {other:?}")),
        }
        if !matches!(wal.known_id("not-begun"), Ok(false)) {
            refused.push(format!(
                "a pre-intent directory with leftover temporaries: {:?}",
                wal.known_id("not-begun")
            ));
        }
        match wal.scan(10) {
            Ok(scan) if scan.complete && scan.entries.iter().all(|e| e.error.is_none()) => (),
            other => refused.push(format!("a scan over both directories: {other:?}")),
        }
        assert!(refused.is_empty(), "{refused:#?}");
    }

    #[test]
    fn scan_lists_only_operations_whose_intent_was_recorded_so_every_entry_can_be_inspected() {
        // A refused or interrupted begin can leave an empty operation directory.
        let t = Temp::new();
        let wal = Wal::with_filesystem(&t.0, OsFileSystem).unwrap();
        attempted(&wal, "begun");
        wal.operation("not-begun", true).unwrap();
        let scan = wal.scan(10).unwrap();
        let ids: Vec<_> = scan
            .entries
            .iter()
            .map(|e| e.operation_id.as_str())
            .collect();
        assert_eq!(ids, ["begun"]);
        for entry in &scan.entries {
            wal.inspect(&entry.operation_id).unwrap();
        }
    }

    #[test]
    fn scan_remains_terminal_while_compaction_removes_records_and_directories() {
        struct SlowRemoval;
        impl FileSystem for SlowRemoval {
            fn checkpoint(&self, step: &'static str) -> io::Result<()> {
                if step == "remove-record" {
                    std::thread::sleep(std::time::Duration::from_millis(1));
                }
                Ok(())
            }
        }
        let t = Temp::new();
        let wal = Wal::with_filesystem(&t.0, SlowRemoval).unwrap();
        let mut terminal = Vec::new();
        for n in 0..16 {
            let c = success(&wal, &attempted(&wal, &format!("race-{n}")));
            let c = wal
                .append(
                    &c,
                    Phase::PinReleaseAttempt {
                        prior_target_attempt: None,
                        expected: c.intent().next.clone(),
                        next: Tip::Absent,
                    },
                )
                .unwrap();
            terminal.push(wal.append(&c, Phase::PinReleased).unwrap());
        }
        let done = std::sync::atomic::AtomicBool::new(false);
        std::thread::scope(|scope| {
            let worker = scope.spawn(|| {
                for chain in &terminal {
                    let mut r = reader(chain.intent());
                    r.pin = ObservedRef::Direct(Tip::Absent);
                    wal.compact(chain, &r, &Authority).unwrap();
                }
                done.store(true, Ordering::SeqCst);
            });
            let mut scans = 0;
            while !done.load(Ordering::SeqCst) && scans < 1000 {
                let backlog = wal.scan(100).unwrap();
                assert!(backlog.complete);
                assert_eq!(backlog.unresolved, 0, "{:?}", backlog.entries);
                assert!(backlog.entries.iter().all(|e| e.error.is_none()));
                scans += 1;
            }
            worker.join().unwrap();
            assert!(scans > 0);
        });
        assert_eq!(wal.scan(100).unwrap().ledger_entries, 16);
    }

    #[test]
    fn durable_directories_are_synced_once_per_process_and_records_keep_their_syncs() {
        let t = Temp::new();
        let first = Wal::with_filesystem(&t.0, Steps(Default::default())).unwrap();
        assert!(first.fs.0.lock().unwrap().contains(&"directory-fsync"));
        // Same directories, already durable: no second fsync of them.
        let again = Wal::with_filesystem(&t.0, Steps(Default::default())).unwrap();
        assert!(!again.fs.0.lock().unwrap().contains(&"directory-fsync"));
        // A record still fsyncs its file and directory; record zero also
        // the parent of its new operation directory.
        let c = begun(&again, "one");
        let steps = std::mem::take(&mut *again.fs.0.lock().unwrap());
        assert_eq!(steps.iter().filter(|s| **s == "file-fsync").count(), 1);
        assert_eq!(steps.iter().filter(|s| **s == "parent-fsync").count(), 1);
        again.append(&c, Phase::Prepared).unwrap();
        let steps = std::mem::take(&mut *again.fs.0.lock().unwrap());
        assert_eq!(steps.iter().filter(|s| **s == "file-fsync").count(), 1);
        assert_eq!(steps.iter().filter(|s| **s == "parent-fsync").count(), 1);
        // A directory removed and made again is a new directory: synced again.
        drop((first, again));
        fs::remove_dir_all(t.0.join("fgos")).unwrap();
        let fresh = Wal::with_filesystem(&t.0, Steps(Default::default())).unwrap();
        assert!(fresh.fs.0.lock().unwrap().contains(&"directory-fsync"));
    }
    #[test]
    fn crash_at_each_record_install_boundary_is_conservative() {
        for point in 1..=16 {
            let t = Temp::new();
            let w = Wal::with_filesystem(
                &t.0,
                Fault {
                    fail: AtomicUsize::new(usize::MAX),
                    count: AtomicUsize::new(0),
                },
            )
            .unwrap();
            let c = w.append(&begun(&w, "one"), Phase::Prepared).unwrap();
            w.fs.count.store(0, Ordering::SeqCst);
            w.fs.fail.store(point, Ordering::SeqCst);
            let _ = w.append(
                &c,
                Phase::TargetAttempt {
                    prior_target_attempt: None,
                    expected: c.intent().expected.clone(),
                    next: c.intent().next.clone(),
                },
            );
            let reopened = Wal::with_filesystem(&t.0, OsFileSystem).unwrap();
            let c = reopened.inspect("one").unwrap();
            let state = reopened.recover("one", &reader(c.intent())).unwrap();
            assert!(matches!(
                state,
                Recovery::FirstAttemptEligible | Recovery::RecoveryRequired
            ));
            if matches!(c.last_state(), Phase::TargetAttempt { .. }) {
                assert_eq!(state, Recovery::RecoveryRequired);
            }
        }
    }
    #[test]
    fn scan_counts_only_finished_chains_still_on_disk() {
        let t = Temp::new();
        let w = Wal::with_filesystem(&t.0, OsFileSystem).unwrap();
        let empty = w.scan(100).unwrap();
        assert_eq!((empty.retained_terminal, empty.oldest_retained), (0, None));
        let c = success(&w, &attempted(&w, "compacted"));
        let c = w
            .append(
                &c,
                Phase::PinReleaseAttempt {
                    prior_target_attempt: None,
                    expected: c.intent().next.clone(),
                    next: Tip::Absent,
                },
            )
            .unwrap();
        let c = w.append(&c, Phase::PinReleased).unwrap();
        let mut r = reader(c.intent());
        r.pin = ObservedRef::Direct(Tip::Absent);
        w.compact(&c, &r, &Authority).unwrap();
        success(&w, &attempted(&w, "finished"));
        attempted(&w, "pending");
        let scan = w.scan(100).unwrap();
        assert_eq!(
            (scan.retained_terminal, scan.unresolved, scan.ledger_entries),
            (1, 1, 1)
        );
        assert_eq!(scan.oldest_retained, w.last_change("finished"));
    }
    #[test]
    fn doctor_scan_flags_retained_ledger_capacity_without_deleting_evidence() {
        let t = Temp::new();
        let w = Wal::with_filesystem(&t.0, OsFileSystem).unwrap();
        let path = w.ledger.path().join("capacity-evidence");
        let file = std::fs::File::create(&path).unwrap();
        file.set_len(64 * 1024 * 1024).unwrap();
        let scan = w.scan(100).unwrap();
        assert_eq!(scan.ledger_entries, 1);
        assert!(scan.ledger_capacity_warning);
        assert!(scan.entries[0].error.is_some());
        assert!(path.exists());
    }
    #[test]
    fn legacy_compact_entries_keep_their_binding_and_exact_request_replay() {
        let t = Temp::new();
        let wal = Wal::with_filesystem(&t.0, OsFileSystem).unwrap();
        let i = intent(&wal);
        let receipt = compact_outcome(&Outcome::Success {
            observed: i.next.clone(),
            attribution: Attribution::ThisInvocationWonCas,
        });
        let binding = binding_digest(&i).unwrap();
        let digest =
            canonical_digest(&(1u8, "legacy", &i.request_digest, &binding, &receipt)).unwrap();
        let old = serde_json::json!({"v": 1, "id": "legacy", "q": i.request_digest, "b": binding, "r": receipt, "digest": digest});
        fgos_durable_file::install_once(&wal.ledger.path(), "legacy", old.to_string().as_bytes())
            .unwrap();
        assert!(matches!(
            wal.begin("legacy", i.clone(), &Authority).unwrap(),
            Begin::Compacted(_)
        ));
        let mut other = i;
        other.expected = Tip::Oid("c".repeat(40));
        assert!(matches!(
            wal.begin("legacy", other, &Authority),
            Err(WalError::OperationIdConflict)
        ));
        assert_eq!(wal.scan(10).unwrap().unresolved, 0);
    }

    #[test]
    fn intent_recorded_with_declared_bytes_by_an_earlier_release_reads_and_compacts() {
        let declared = || {
            [
                (".fgos/events/s.jsonl", Some(b"1\n2\n".to_vec())),
                ("gone", None),
            ]
            .map(|(path, bytes)| {
                IntentFile::Bytes(crate::LandFile {
                    path: path.into(),
                    bytes,
                })
            })
            .to_vec()
        };
        for land in [false, true] {
            let t = Temp::new();
            let w = Wal::with_filesystem(&t.0, OsFileSystem).unwrap();
            let worktree = t.0.join("tree").to_string_lossy().into_owned();
            let mut i = intent(&w);
            i.resource_set = vec![format!("worktree:{worktree}")];
            i.expected = Tip::Oid("a".repeat(40));
            i.next = Tip::Oid("b".repeat(40));
            i.kind = if land {
                let destination = "refs/heads/trunk".to_string();
                i.resource_set.insert(0, destination.clone());
                let tree = "d".repeat(40);
                OperationKind::Land(Box::new(LandIntent {
                    request: LandIntentRequest {
                        source: "c".repeat(40),
                        target: "a".repeat(40),
                        destination,
                        message: "land".into(),
                        squash: false,
                        footprint: None,
                        subtree: None,
                        files: declared(),
                    },
                    candidate: crate::LandCandidate {
                        worktree: PathBuf::from(&worktree),
                        source: "c".repeat(40),
                        target: "a".repeat(40),
                        candidate: "b".repeat(40),
                        tree_digest: canonical_digest(&tree).unwrap(),
                        tree,
                    },
                }))
            } else {
                OperationKind::Sync(Box::new(SyncIntent {
                    reference: Some("refs/heads/producer".into()),
                    worktree: worktree.clone(),
                    head: "a".repeat(40),
                    target: "b".repeat(40),
                    message: "sync".into(),
                    files: declared(),
                }))
            };
            let Begin::Created(written) = w.begin("legacy", i, &Authority).unwrap() else {
                panic!()
            };
            // The record carries the bytes exactly as earlier releases wrote them.
            let raw =
                fs::read_to_string(w.root.path().join("legacy").join(record_name(0))).unwrap();
            assert!(raw.contains(r#""bytes":[49,10,50,10]"#) && !raw.contains("blob"));
            let read = w.inspect("legacy").unwrap();
            assert_eq!(read.intent(), written.intent());
            let c = w
                .append(&read, Phase::Outcome(Outcome::AbandonedBeforeAttempt))
                .unwrap();
            let mut r = reader(c.intent());
            r.pin = ObservedRef::Direct(Tip::Absent);
            let compact = w.compact(&c, &r, &Authority).unwrap();
            assert!(!w.root.path().join("legacy").exists());
            assert_eq!(compact.request, written.intent().request_digest);
            assert_eq!(
                w.compacted("legacy").unwrap().unwrap().digest,
                compact.digest
            );
        }
    }
    #[test]
    fn compact_retains_binding_and_receipt_before_deletion() {
        let t = Temp::new();
        let w = Wal::with_filesystem(&t.0, OsFileSystem).unwrap();
        let c = success(&w, &attempted(&w, "one"));
        let c = w
            .append(
                &c,
                Phase::PinReleaseAttempt {
                    prior_target_attempt: None,
                    expected: c.intent().next.clone(),
                    next: Tip::Absent,
                },
            )
            .unwrap();
        let c = w.append(&c, Phase::PinReleased).unwrap();
        let mut r = reader(c.intent());
        r.pin = ObservedRef::Direct(Tip::Absent);
        w.compact(&c, &r, &Authority).unwrap();
        assert!(!w.root.path().join("one").exists());
        assert!(matches!(
            w.begin("one", intent(&w), &Authority).unwrap(),
            Begin::Compacted(_)
        ));
        let mut i = intent(&w);
        i.request_digest = "c".repeat(64);
        assert!(matches!(
            w.begin("one", i, &Authority),
            Err(WalError::OperationIdConflict)
        ));
        let scan = w.scan(100).unwrap();
        assert!(scan.ledger_bytes <= 512);
        assert_eq!(scan.ledger_entries, 1);
        assert!(!scan.ledger_capacity_warning);
    }
    fn git(path: &Path, args: &[&str], input: Option<&[u8]>) -> Vec<u8> {
        use std::io::Write;
        use std::process::{Command, Stdio};
        let mut child = Command::new("git")
            .current_dir(path)
            .args(args)
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped())
            .spawn()
            .unwrap();
        if let Some(bytes) = input {
            child.stdin.take().unwrap().write_all(bytes).unwrap();
        }
        let output = child.wait_with_output().unwrap();
        assert!(
            output.status.success(),
            "{:?}: {}",
            args,
            String::from_utf8_lossy(&output.stderr)
        );
        output.stdout
    }
    #[test]
    fn recovery_observes_real_git_refs_and_native_residue_both_formats() {
        for (format, backend) in [
            ("sha1", "files"),
            ("sha256", "files"),
            ("sha1", "reftable"),
            ("sha256", "reftable"),
        ] {
            let t = Temp::new();
            git(
                &t.0,
                &[
                    "init",
                    "--bare",
                    "--quiet",
                    &format!("--object-format={format}"),
                    &format!("--ref-format={backend}"),
                ],
                None,
            );
            let state = Temp::new();
            let driver = crate::GitDriver::new(&state.0).unwrap();
            let repo = match driver.resolve_repo(&t.0, &t.0).unwrap() {
                crate::ResolveRepo::Repository(r) => r,
                _ => panic!(),
            };
            let fence = repo.trusted_main_root().join(".fgos/locks/activation.lock");
            fs::create_dir_all(&fence).unwrap();
            fs::write(
                fence.join("TOMBSTONE"),
                r#"{"lock":"activation","by":"fgos git","at":"fixture"}"#,
            )
            .unwrap();
            let w = Wal::open(&repo).unwrap();
            let text = |bytes: Vec<u8>| String::from_utf8(bytes).unwrap().trim().to_owned();
            let tree = text(git(&t.0, &["mktree"], Some(b"")));
            let oid = text(git(
                &t.0,
                &[
                    "-c",
                    "user.name=T",
                    "-c",
                    "user.email=t@example.invalid",
                    "commit-tree",
                    "-m",
                    "candidate",
                    &tree,
                ],
                None,
            ));
            let mut i = intent(&w);
            i.object_format = repo.object_format();
            i.next = Tip::Oid(oid.clone());
            let c = match w.begin("real", i, &Authority).unwrap() {
                Begin::Created(c) => c,
                _ => panic!(),
            };
            let read = crate::WalReader {
                driver: &driver,
                repo: &repo,
            };
            let pin = "refs/fgos/git-operations/real/candidate";
            git(&t.0, &["update-ref", pin, &oid], None);
            let c = w.append(&c, Phase::Prepared).unwrap();
            assert_eq!(
                w.recover("real", &read).unwrap(),
                Recovery::FirstAttemptEligible
            );
            // The candidate must be a commit: a tree or a blob is never intact.
            for not_a_commit in [
                tree.clone(),
                text(git(&t.0, &["hash-object", "-w", "--stdin"], Some(b"blob"))),
            ] {
                let mut other = c.intent().clone();
                other.next = Tip::Oid(not_a_commit);
                assert!(!read.candidate_intact(&other).unwrap());
            }
            let c = w
                .append(
                    &c,
                    Phase::TargetAttempt {
                        prior_target_attempt: None,
                        expected: Tip::Absent,
                        next: Tip::Oid(oid.clone()),
                    },
                )
                .unwrap();
            assert_eq!(
                w.recover("real", &read).unwrap(),
                Recovery::RecoveryRequired
            );
            git(
                &t.0,
                &["update-ref", &c.intent().resource_set[0], &oid],
                None,
            );
            assert_eq!(
                w.recover("real", &read).unwrap(),
                Recovery::EffectObservedOnly
            );
            git(&t.0, &["pack-refs", "--all"], None);
            assert_eq!(
                w.recover("real", &read).unwrap(),
                Recovery::EffectObservedOnly
            );
            git(&t.0, &["update-ref", "-d", pin, &oid], None);
            assert_eq!(
                w.recover("real", &read).unwrap(),
                Recovery::PinReconciliationRequired
            );
            git(&t.0, &["update-ref", pin, &oid], None);
            git(
                &t.0,
                &[
                    "symbolic-ref",
                    &c.intent().resource_set[0],
                    "refs/heads/dangling",
                ],
                None,
            );
            assert_eq!(
                w.recover("real", &read).unwrap(),
                Recovery::RecoveryRequired
            );
            git(
                &t.0,
                &["symbolic-ref", "--delete", &c.intent().resource_set[0]],
                None,
            );
            git(
                &t.0,
                &["update-ref", &c.intent().resource_set[0], &oid],
                None,
            );
            // ABA does not restore eligibility.
            git(
                &t.0,
                &["update-ref", "-d", &c.intent().resource_set[0], &oid],
                None,
            );
            assert_eq!(
                w.recover("real", &read).unwrap(),
                Recovery::RecoveryRequired
            );
        }
    }
    #[test]
    fn compaction_crash_keeps_chain_or_ledger_and_id_binding() {
        for point in 1..=25 {
            let t = Temp::new();
            let w = Wal::with_filesystem(
                &t.0,
                Fault {
                    fail: AtomicUsize::new(usize::MAX),
                    count: AtomicUsize::new(0),
                },
            )
            .unwrap();
            let c = success(&w, &attempted(&w, "one"));
            let c = w
                .append(
                    &c,
                    Phase::PinReleaseAttempt {
                        prior_target_attempt: None,
                        expected: c.intent().next.clone(),
                        next: Tip::Absent,
                    },
                )
                .unwrap();
            let c = w.append(&c, Phase::PinReleased).unwrap();
            let mut r = reader(c.intent());
            r.pin = ObservedRef::Direct(Tip::Absent);
            w.fs.count.store(0, Ordering::SeqCst);
            w.fs.fail.store(point, Ordering::SeqCst);
            let _ = w.compact(&c, &r, &Authority);
            let reopened = Wal::open_existing(&t.0, OsFileSystem).unwrap();
            assert!(
                reopened.inspect("one").is_ok() || reopened.compacted("one").unwrap().is_some()
            );
            if reopened.compacted("one").unwrap().is_some() {
                reopened
                    .resume_compaction("one", &r, c.intent(), &Authority)
                    .unwrap();
                assert!(!reopened.root.path().join("one").exists());
            }
            let mut i = intent(&reopened);
            i.request_digest = "f".repeat(64);
            assert!(matches!(
                reopened.begin("one", i, &Authority),
                Err(WalError::OperationIdConflict)
            ));
        }
    }
    #[test]
    fn compact_superseded_and_maximum_ids_fit_512_bytes() {
        let o = Outcome::Superseded {
            later_operation_id: "z".repeat(80),
            later_receipt_digest: "a".repeat(64),
            attribution: Attribution::Uncertain,
        };
        let c = CompactReceipt {
            v: 2,
            id: "x".repeat(80),
            request: "b".repeat(64),
            binding: "c".repeat(64),
            expected: "e".repeat(64),
            next: "f".repeat(64),
            receipt: compact_outcome(&o),
            reference: None,
            digest: "d".repeat(64),
        };
        let bytes = serde_json::to_vec(&c).unwrap();
        assert!(bytes.len() < 512, "{} bytes", bytes.len());
        let restored: CompactReceipt = serde_json::from_slice(&bytes).unwrap();
        assert_eq!(restored.expected, c.expected);
        assert_eq!(restored.next, c.next);
        assert_eq!(restored.receipt, c.receipt);
    }
    #[test]
    fn ten_thousand_terminal_operations_have_no_record_directories() {
        // Linux owns the scale proof. Each operation costs several fsyncs and
        // directory renames on NTFS, so Windows proves the same
        // no-record-directories property at a tenth of the count in CI time.
        #[cfg(windows)]
        const OPERATIONS: usize = 1_000;
        #[cfg(not(windows))]
        const OPERATIONS: usize = 10_000;
        let t = Temp::new();
        let w = Wal::with_filesystem(&t.0, OsFileSystem).unwrap();
        for n in 0..OPERATIONS {
            let id = format!("op-{n}");
            let c = success(&w, &attempted(&w, &id));
            let c = w
                .append(
                    &c,
                    Phase::PinReleaseAttempt {
                        prior_target_attempt: None,
                        expected: c.intent().candidate().clone(),
                        next: Tip::Absent,
                    },
                )
                .unwrap();
            let c = w.append(&c, Phase::PinReleased).unwrap();
            let mut r = reader(c.intent());
            r.pin = ObservedRef::Direct(Tip::Absent);
            w.compact(&c, &r, &Authority).unwrap();
        }
        assert_eq!(fs::read_dir(w.root.path()).unwrap().count(), 0);
        let scan = w.scan(OPERATIONS + 1).unwrap();
        assert!(scan.complete);
        assert_eq!(scan.unresolved, 0);
        assert!(scan.ledger_bytes <= OPERATIONS as u64 * 512);
        assert_eq!(scan.entries.len(), OPERATIONS);
    }
    #[test]
    fn missing_borrow_refuses_before_intent_and_doctor_never_writes() {
        struct Missing;
        impl PublicationAuthority for Missing {
            fn validate_publication_borrow(&self, _: &Intent) -> WalResult<()> {
                Err(WalError::PublicationBorrowUnavailable)
            }
        }
        let t = Temp::new();
        let w = Wal::with_filesystem(&t.0, OsFileSystem).unwrap();
        assert!(matches!(
            w.begin("no-borrow", intent(&w), &Missing),
            Err(WalError::PublicationBorrowUnavailable)
        ));
        assert_eq!(fs::read_dir(w.root.path()).unwrap().count(), 0);
        let read = Wal::open_existing(
            &t.0,
            Fault {
                fail: AtomicUsize::new(1),
                count: AtomicUsize::new(0),
            },
        )
        .unwrap();
        assert!(read.scan(10).unwrap().complete);
        assert_eq!(read.fs.count.load(Ordering::SeqCst), 0);
    }
    #[test]
    fn intent_crash_boundaries_ignore_uninstalled_intent_but_preserve_evidence() {
        for point in 1..=12 {
            let t = Temp::new();
            let w = Wal::with_filesystem(
                &t.0,
                Fault {
                    fail: AtomicUsize::new(usize::MAX),
                    count: AtomicUsize::new(0),
                },
            )
            .unwrap();
            w.fs.count.store(0, Ordering::SeqCst);
            w.fs.fail.store(point, Ordering::SeqCst);
            let _ = w.begin("one", intent(&w), &Authority);
            let reopened = Wal::open_existing(&t.0, OsFileSystem).unwrap();
            let installed = reopened
                .root
                .path()
                .join("one")
                .join(record_name(0))
                .exists();
            assert_eq!(
                reopened.scan(100).unwrap().unresolved,
                usize::from(installed)
            );
            assert_eq!(reopened.active(100).unwrap().len(), usize::from(installed));
            match reopened.inspect("one") {
                Ok(c) => assert!(matches!(c.last_state(), Phase::Intent(_))),
                Err(WalError::Corrupt(_)) => (),
                other => panic!("unexpected recovery: {other:?}"),
            }
        }
    }
}
