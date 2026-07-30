use std::io;
use std::time::{Duration, Instant};

use herdr_fgos::app::App;
use herdr_fgos::fgos::{self, FgosCliSource};
use herdr_fgos::pick::{self, HerdrPaneAdapter};
use herdr_fgos::ports::{PaneOrchestrator, TerminalUi, UiEvent, WorkItemSource};
use herdr_fgos::ui::RatatuiTerminalUi;

/// Same poll cadence as the existing STR40 bash cockpit's dashboard pane.
const POLL_INTERVAL: Duration = Duration::from_secs(5);

fn main() -> io::Result<()> {
    let mut ui = RatatuiTerminalUi::init()?;

    let mut app = App::empty();
    let root = fgos::repo_root();
    let source: Option<FgosCliSource> = match &root {
        Ok(root) => Some(FgosCliSource {
            root: root.clone(),
        }),
        Err(err) => {
            app.last_error = Some(format!("could not resolve fgOS repo root: {err}"));
            None
        }
    };
    if let Some(source) = &source {
        app.refresh_from_fgos(source);
    }

    let pane_orchestrator = HerdrPaneAdapter {
        herdr_bin: pick::herdr_bin(),
    };

    let result = run(
        &mut ui,
        &mut app,
        source.as_ref().map(|s| s as &dyn WorkItemSource),
        &pane_orchestrator,
    );

    ui.teardown()?;

    result
}

fn run(
    ui: &mut impl TerminalUi,
    app: &mut App,
    source: Option<&dyn WorkItemSource>,
    pane_orchestrator: &impl PaneOrchestrator,
) -> io::Result<()> {
    let mut last_poll = Instant::now();
    loop {
        ui.draw(app)?;

        if let Some(event) = ui.poll_event(Duration::from_millis(250))? {
            match event {
                UiEvent::Quit => return Ok(()),
                UiEvent::Down => {
                    app.pick_status = None;
                    app.select_next();
                }
                UiEvent::Up => {
                    app.pick_status = None;
                    app.select_previous();
                }
                UiEvent::Pick => {
                    app.pick_status = Some(match app.selected_id() {
                        Some(id) => match pane_orchestrator.open_pick_pane(id) {
                            Ok(()) => format!("opened pane for /fgOS:pick {id}"),
                            Err(err) => format!("pick failed for {id}: {err}"),
                        },
                        None => "no row selected".to_string(),
                    });
                }
            }
        }

        if let Some(source) = source {
            if last_poll.elapsed() >= POLL_INTERVAL {
                app.refresh_from_fgos(source);
                last_poll = Instant::now();
            }
        }
    }
}
