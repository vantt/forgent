//! Pure storage-location port: Git resolves the common directory outside this crate.
use crate::{
    envelope::Scope,
    errors::{Error, ErrorCode},
};
use std::path::{Path, PathBuf};

pub fn valid_slug(value: &str) -> bool {
    !value.is_empty()
        && value.len() <= 128
        && value
            .bytes()
            .all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == b'-')
        && value.as_bytes()[0].is_ascii_alphanumeric()
        && value.as_bytes()[value.len() - 1].is_ascii_alphanumeric()
}
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct StreamId(String);
impl StreamId {
    pub fn parse(value: &str) -> Result<Self, Error> {
        if value == "project"
            || value == "local"
            || value
                .strip_prefix("project:")
                .or_else(|| value.strip_prefix("branch:"))
                .is_some_and(valid_slug)
        {
            Ok(Self(value.into()))
        } else {
            Err(Error::new(
                ErrorCode::EventStoreIntegrity,
                "invalid stream id",
            ))
        }
    }
    pub fn as_str(&self) -> &str {
        &self.0
    }
    pub fn scope(&self) -> Scope {
        if self.0.starts_with("project") {
            Scope::Project
        } else if self.0 == "local" {
            Scope::Local
        } else {
            Scope::Branch
        }
    }
}
#[derive(Debug, Clone)]
pub struct Layout {
    pub common_dir: PathBuf,
    pub root: PathBuf,
}
impl Layout {
    /// None is the caller's non-repository result; no fallback or override exists.
    pub fn from_common_dir(common_dir: Option<&Path>) -> Result<Self, Error> {
        let dir = common_dir.filter(|p| p.is_absolute()).ok_or_else(|| {
            Error::new(
                ErrorCode::EventStoreNoRepository,
                "absolute resolved Git common directory required",
            )
        })?;
        let dir = dir
            .canonicalize()
            .map_err(|e| Error::new(ErrorCode::EventStoreNoRepository, e.to_string()))?;
        if !dir.is_dir() {
            return Err(Error::new(
                ErrorCode::EventStoreNoRepository,
                "common directory is not a directory",
            ));
        }
        Ok(Self {
            root: dir.join("fgos/events"),
            common_dir: dir,
        })
    }
    pub fn store(&self) -> PathBuf {
        self.root.join("store.json")
    }
    pub fn append_lock(&self) -> PathBuf {
        self.root.join("locks/event-append.lock")
    }
    pub fn seal_lock(&self) -> PathBuf {
        self.root.join("locks/event-seal.lock")
    }
    pub fn stream(&self, stream: &StreamId) -> StreamLayout {
        StreamLayout {
            root: self.root.join(stream.as_str()),
        }
    }
}
#[derive(Debug, Clone)]
pub struct StreamLayout {
    pub root: PathBuf,
}
impl StreamLayout {
    pub fn active(&self) -> PathBuf {
        self.root.join("active.jsonl")
    }
    pub fn closed(&self) -> PathBuf {
        self.root.join("closed")
    }
    pub fn segment(&self, first: u64, last: u64) -> Result<PathBuf, Error> {
        if first == 0 || last < first {
            return Err(Error::new(
                ErrorCode::EventStoreIntegrity,
                "invalid closed segment range",
            ));
        }
        Ok(self.closed().join(format!("{first}-{last}.jsonl")))
    }
    pub fn hwm(&self) -> PathBuf {
        self.root.join("hwm.json")
    }
    pub fn sealed(&self) -> PathBuf {
        self.root.join("sealed.json")
    }
}
