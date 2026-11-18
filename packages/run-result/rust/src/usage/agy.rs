//! agy (gemini): the CLI exposes no counts. A run served through omp is read by the shape of its stream.
use super::{pi, Usage};

pub(super) fn parse(stdout: &str) -> Usage {
    pi::parse(stdout, "agy").unwrap_or_else(|| Usage::absent("agy", "agy-exposes-no-counts"))
}
