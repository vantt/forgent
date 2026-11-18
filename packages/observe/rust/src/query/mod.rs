//! The query engine: one grammar over every `RecordSource`, for the CLI and the Rust API alike.
//!
//! Observe knows no consumer concepts. A detection or a measure is a `Query` value written by its owner; the engine
//! only filters, groups, aggregates and compares. The pipeline runs in a fixed order:
//!
//! 1. read the sources that declare a needed kind, and drop records whose `id` repeats;
//! 2. keep records of the wanted `kind`s inside `ref`, `since` and `until`;
//! 3. `where` (before `latest_per`), then `latest_per` (newest record per key), then `where_latest`;
//! 4. `join` adds measures of records that share a ref; `without` drops records that have a matching record;
//! 5. group by `by` and `bucket`, aggregate, drop groups that fail `having`.

mod aggregate;
mod error;
mod exec;
mod model;
mod result;
mod time;

pub use error::QueryError;
pub use exec::{run, QueryContext};
pub use model::{
    Agg, Anchor, Bucket, Cmp, Cond, Having, Join, LatestPer, Op, Operand, Query, RefSel, WindowOn,
    Without,
};
pub use result::{AggValue, Coverage, QueryResult, ResultRow};
pub use time::bucket_start;
