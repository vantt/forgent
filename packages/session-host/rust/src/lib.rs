//! Session Host: the one port that places an agent session (`start`, `alive`, `front`,
//! `retire`, and for a controller that builds its command late, `open` then `launch`), for a worker under the run supervisor and for a long-lived head session.
//!
//! The wire types are in `types` (contract: `packages/session-host/contracts/host-port.v1.json`),
//! the Terminal Control surface the terminal adapter needs is `panes::Panes`, the screenless
//! adapter's process door is `direct::Screenless`, and `host::SessionHost` decides. `pane_io::PaneIo`
//! is the agent protocol's port over a pane by key, so one delivery step types every opening text
//! and every worker brief. `route` is the `fgos internal session-host` door.

pub mod direct;
pub mod host;
pub mod pane_io;
pub mod panes;
pub mod route;
pub mod types;

pub use host::{SessionHost, DEFAULT_GRACE_MS, DEFAULT_READY_MS};
pub use pane_io::PaneIo;
pub use panes::Panes;
pub use types::*;
