//! Identity's terminal port over herdr: the tab label a query names, read
//! live through the terminal-control herdr driver (a label is renamed
//! freely, so Identity never stores it). Used by `fgos identity resolve` and
//! the mailbox's `--to`; a caller without herdr gets no tab and the lookup
//! goes on as if the label named none.
use fgos_identity::directory::TerminalPort;
use fgos_terminal_control::driver::herdr::{tab_ids_labelled, HerdrConfig};

/// How long one `herdr tab list` may take: a lookup a person waits on.
const TAB_LIST_TIMEOUT_MS: u64 = 3_000;

/// The herdr of this process's environment (`FGOS_HERDR_BIN`, `HERDR_SESSION`,
/// `HERDR_SOCKET_PATH`), the variables the supervisor's backend reads too.
#[derive(Debug, Clone, Copy, Default)]
pub struct HerdrTabs;

impl TerminalPort for HerdrTabs {
    fn tab_ids(&self, label: &str) -> Vec<String> {
        let var = |name: &str| std::env::var(name).ok().filter(|v| !v.is_empty());
        let mut config = HerdrConfig::new(var("FGOS_HERDR_BIN").unwrap_or_default());
        config.session = var("HERDR_SESSION");
        config.socket_path = var("HERDR_SOCKET_PATH");
        config.timeout_ms = TAB_LIST_TIMEOUT_MS;
        tab_ids_labelled(&config, label).unwrap_or_default()
    }
}
