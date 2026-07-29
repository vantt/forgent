use std::io;
use std::time::{Duration, Instant};

use crossterm::event::{self, Event, KeyCode, KeyEventKind, KeyModifiers};
use crossterm::execute;
use crossterm::terminal::{
    disable_raw_mode, enable_raw_mode, EnterAlternateScreen, LeaveAlternateScreen,
};
use ratatui::backend::CrosstermBackend;
use ratatui::Terminal;

use herdr_fgos::app::App;
use herdr_fgos::fgos;
use herdr_fgos::ui::draw;

/// Same poll cadence as the existing STR40 bash cockpit's dashboard pane.
const POLL_INTERVAL: Duration = Duration::from_secs(5);

fn main() -> io::Result<()> {
    enable_raw_mode()?;
    let mut stdout = io::stdout();
    execute!(stdout, EnterAlternateScreen)?;
    let backend = CrosstermBackend::new(stdout);
    let mut terminal = Terminal::new(backend)?;

    let mut app = App::empty();
    let root = fgos::repo_root();
    if let Ok(root) = &root {
        app.refresh_from_fgos(root);
    } else if let Err(err) = &root {
        app.last_error = Some(format!("could not resolve fgOS repo root: {err}"));
    }

    let result = run(&mut terminal, &mut app, root.ok());

    disable_raw_mode()?;
    execute!(terminal.backend_mut(), LeaveAlternateScreen)?;
    terminal.show_cursor()?;

    result
}

fn run<B: ratatui::backend::Backend<Error = io::Error>>(
    terminal: &mut Terminal<B>,
    app: &mut App,
    root: Option<std::path::PathBuf>,
) -> io::Result<()> {
    let mut last_poll = Instant::now();
    loop {
        terminal.draw(|frame| draw(frame, app))?;

        if event::poll(Duration::from_millis(250))? {
            if let Event::Key(key) = event::read()? {
                if key.kind != KeyEventKind::Press {
                    continue;
                }
                let is_ctrl_c =
                    key.code == KeyCode::Char('c') && key.modifiers.contains(KeyModifiers::CONTROL);
                if key.code == KeyCode::Char('q') || key.code == KeyCode::Esc || is_ctrl_c {
                    return Ok(());
                }
            }
        }

        if let Some(root) = &root {
            if last_poll.elapsed() >= POLL_INTERVAL {
                app.refresh_from_fgos(root);
                last_poll = Instant::now();
            }
        }
    }
}
