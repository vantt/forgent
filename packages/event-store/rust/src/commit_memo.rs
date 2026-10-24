//! Answers that depend only on one commit of one repository, kept for the life
//! of the process. A commit's content never changes, so the key is the
//! repository, the commit and the question asked; a moved HEAD names another
//! commit and so never meets a stale answer. A failure is never kept.
use crate::errors::Error;
use fgos_git::{Oid, RepoHandle};
use std::{collections::HashMap, path::PathBuf, sync::Mutex};

/// Most answers kept per memo: the repositories a process works on at once are
/// few, so a full memo is simply emptied.
const LIMIT: usize = 16;

type Key = (PathBuf, String, Vec<u8>);

pub(crate) struct CommitMemo<V> {
    answers: Mutex<Option<HashMap<Key, V>>>,
}

impl<V: Clone> CommitMemo<V> {
    pub(crate) const fn new() -> Self {
        Self {
            answers: Mutex::new(None),
        }
    }

    /// The answer for `question` at `commit`, computed by `compute` the first time.
    pub(crate) fn get_or_compute(
        &self,
        repo: &RepoHandle,
        commit: &Oid,
        question: &[u8],
        compute: impl FnOnce() -> Result<V, Error>,
    ) -> Result<V, Error> {
        let key = (
            repo.common_dir().to_path_buf(),
            commit.as_str().to_owned(),
            question.to_vec(),
        );
        if let Some(known) = self.lock().as_ref().and_then(|memo| memo.get(&key)) {
            return Ok(known.clone());
        }
        let answer = compute()?;
        let mut guard = self.lock();
        let memo = guard.get_or_insert_with(HashMap::new);
        if memo.len() >= LIMIT {
            memo.clear();
        }
        memo.insert(key, answer.clone());
        Ok(answer)
    }

    fn lock(&self) -> std::sync::MutexGuard<'_, Option<HashMap<Key, V>>> {
        self.answers
            .lock()
            .unwrap_or_else(|poisoned| poisoned.into_inner())
    }
}
