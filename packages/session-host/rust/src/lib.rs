//! Session Host: the one port that places an agent session (`open` then `launch`, `alive`, `front`,
//! `retire`), for a worker or a head session under the run supervisor, which builds its command late.
//!
//! The wire types are in `types` (contract: `packages/session-host/contracts/host-port.v1.json`),
//! the Terminal Control surface the terminal adapter needs is `panes::Panes`, the screenless
//! adapter's process door is `direct::Screenless`, and `host::SessionHost` decides. `pane_io::PaneIo`
//! is the agent protocol's port over a pane by key, so one delivery step types every opening text
//! and every worker brief. `route` is the `fgos internal session-host` door.

pub mod host;
pub mod pane_io;
pub mod panes;
pub mod route;
pub mod types;

pub use host::SessionHost;
pub use pane_io::{PaneIo, SendFailure};
pub use panes::Panes;
pub use types::*;
