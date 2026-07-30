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
use herdr_fgos::pick;
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

    let herdr_bin = pick::herdr_bin();
    let result = run(&mut terminal, &mut app, root.ok(), &herdr_bin);

    disable_raw_mode()?;
    execute!(terminal.backend_mut(), LeaveAlternateScreen)?;
    terminal.show_cursor()?;

    result
}

fn run<B: ratatui::backend::Backend<Error = io::Error>>(
    terminal: &mut Terminal<B>,
    app: &mut App,
    root: Option<std::path::PathBuf>,
    herdr_bin: &str,
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
                match key.code {
                    KeyCode::Char('q') | KeyCode::Esc => return Ok(()),
                    _ if is_ctrl_c => return Ok(()),
                    KeyCode::Down | KeyCode::Char('j') => {
                        app.pick_status = None;
                        app.select_next();
                    }
                    KeyCode::Up | KeyCode::Char('k') => {
                        app.pick_status = None;
                        app.select_previous();
                    }
                    KeyCode::Enter => {
                        app.pick_status = Some(match app.selected_id() {
                            Some(id) => match pick::open_pick_pane(herdr_bin, id) {
                                Ok(()) => format!("opened pane for /fgOS:pick {id}"),
                                Err(err) => format!("pick failed for {id}: {err}"),
                            },
                            None => "no row selected".to_string(),
                        });
                    }
                    _ => {}
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
