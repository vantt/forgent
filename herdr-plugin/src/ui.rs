use std::io;
use std::time::Duration;

use crossterm::event::{self, Event, KeyCode, KeyEventKind, KeyModifiers};
use crossterm::execute;
use crossterm::terminal::{
    disable_raw_mode, enable_raw_mode, EnterAlternateScreen, LeaveAlternateScreen,
};
use ratatui::backend::CrosstermBackend;
use ratatui::layout::{Constraint, Direction, Layout};
use ratatui::style::{Color, Modifier, Style};
use ratatui::text::Span;
use ratatui::widgets::{Block, Borders, List, ListItem, ListState, Paragraph};
use ratatui::{Frame, Terminal};

use crate::app::{App, InProcessTask, Panel};
use crate::ports::{TerminalUi as TerminalUiPort, UiEvent};

/// tsk-4zo D2: an orphaned task (no matching herdr pane found by the most
/// recent scan) gets an explicit `[pane missing]` badge — no jump-to-pane
/// affordance exists yet for any row (that's `tsk-1eu`'s job), so there is
/// nothing else to disable here today.
fn in_process_label(task: &InProcessTask) -> String {
    if task.pane.is_some() {
        format!("{} — {}", task.id, task.title)
    } else {
        format!("[pane missing] {} — {}", task.id, task.title)
    }
}

/// The render-framework adapter (tsk-3t9 D1): owns the ratatui `Terminal`
/// and its raw-mode/alternate-screen lifecycle (moved from `main.rs`).
/// `draw`'s free-function signature below stays `(frame, app)` unchanged —
/// `tests/render_smoke.rs` calls it directly — so this struct never stores
/// a `ListState` across frames; D2's plain `app.selected: Option<usize>`
/// is converted to a fresh `ListState` inside `draw` on every call.
pub struct RatatuiTerminalUi {
    terminal: Terminal<CrosstermBackend<io::Stdout>>,
}

impl RatatuiTerminalUi {
    pub fn init() -> io::Result<Self> {
        enable_raw_mode()?;
        let mut stdout = io::stdout();
        execute!(stdout, EnterAlternateScreen)?;
        let backend = CrosstermBackend::new(stdout);
        let terminal = Terminal::new(backend)?;
        Ok(Self { terminal })
    }

    pub fn teardown(mut self) -> io::Result<()> {
        disable_raw_mode()?;
        execute!(self.terminal.backend_mut(), LeaveAlternateScreen)?;
        self.terminal.show_cursor()
    }
}

impl TerminalUiPort for RatatuiTerminalUi {
    fn draw(&mut self, app: &mut App) -> io::Result<()> {
        self.terminal.draw(|frame| draw(frame, app))?;
        Ok(())
    }

    /// Translates a raw crossterm key event into the domain-level
    /// `UiEvent` the event loop (`main.rs`) actually matches on — no
    /// `crossterm` type crosses this port's boundary.
    fn poll_event(&mut self, timeout: Duration) -> io::Result<Option<UiEvent>> {
        if !event::poll(timeout)? {
            return Ok(None);
        }
        let Event::Key(key) = event::read()? else {
            return Ok(None);
        };
        if key.kind != KeyEventKind::Press {
            return Ok(None);
        }
        let is_ctrl_c =
            key.code == KeyCode::Char('c') && key.modifiers.contains(KeyModifiers::CONTROL);
        Ok(match key.code {
            KeyCode::Char('q') | KeyCode::Esc => Some(UiEvent::Quit),
            _ if is_ctrl_c => Some(UiEvent::Quit),
            KeyCode::Down | KeyCode::Char('j') => Some(UiEvent::Down),
            KeyCode::Up | KeyCode::Char('k') => Some(UiEvent::Up),
            KeyCode::Enter => Some(UiEvent::Pick),
            KeyCode::Tab => Some(UiEvent::SwitchPanel),
            _ => None,
        })
    }
}

pub fn draw(frame: &mut Frame, app: &mut App) {
    let rows = Layout::default()
        .direction(Direction::Vertical)
        .constraints([Constraint::Min(0), Constraint::Length(1)])
        .split(frame.area());

    let columns = Layout::default()
        .direction(Direction::Horizontal)
        .constraints([Constraint::Percentage(60), Constraint::Percentage(40)])
        .split(rows[0]);

    // tsk-1eu D1: the focused panel's border stands out from the
    // unfocused one, so it's visible which panel Up/Down/Enter apply to.
    let focused_border_style = Style::default().fg(Color::Cyan).add_modifier(Modifier::BOLD);
    let unfocused_border_style = Style::default();

    let work_items: Vec<ListItem> = app
        .work_items
        .iter()
        .map(|item| {
            ListItem::new(format!(
                "[{}] {} — {}",
                item.goal_tier, item.id, item.title
            ))
        })
        .collect();
    let mut list_state = ListState::default();
    list_state.select(app.selected);
    frame.render_stateful_widget(
        List::new(work_items)
            .block(
                Block::default()
                    .borders(Borders::ALL)
                    .border_style(if app.focused_panel == Panel::WorkItems {
                        focused_border_style
                    } else {
                        unfocused_border_style
                    })
                    .title(Span::styled(
                        "Work items (by impact) — ↑/↓ select, Enter to pick",
                        Style::default().add_modifier(Modifier::BOLD),
                    )),
            )
            .highlight_style(Style::default().add_modifier(Modifier::REVERSED)),
        columns[0],
        &mut list_state,
    );

    let in_process: Vec<ListItem> = app
        .in_process
        .iter()
        .map(|task| ListItem::new(in_process_label(task)).style(Style::default().fg(Color::Yellow)))
        .collect();
    let mut in_process_list_state = ListState::default();
    in_process_list_state.select(app.in_process_selected);
    frame.render_stateful_widget(
        List::new(in_process)
            .block(
                Block::default()
                    .borders(Borders::ALL)
                    .border_style(if app.focused_panel == Panel::InProcess {
                        focused_border_style
                    } else {
                        unfocused_border_style
                    })
                    .title(Span::styled(
                        "In process — Tab to focus, Enter to jump",
                        Style::default().add_modifier(Modifier::BOLD),
                    )),
            )
            .highlight_style(Style::default().add_modifier(Modifier::REVERSED)),
        columns[1],
        &mut in_process_list_state,
    );

    let status = if let Some(err) = &app.last_error {
        Paragraph::new(format!("fgos poll error: {err}")).style(Style::default().fg(Color::Red))
    } else if let Some(status) = &app.pick_status {
        Paragraph::new(status.as_str()).style(Style::default().fg(Color::Green))
    } else {
        Paragraph::new("↑/↓ select · Enter: pick · q/Esc: quit")
    };
    frame.render_widget(status, rows[1]);
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::pane_scan::PaneIdentity;

    #[test]
    fn orphan_task_gets_pane_missing_badge() {
        let task = InProcessTask {
            id: "tsk-b".into(),
            title: "Missing".into(),
            pane: None,
        };
        assert_eq!(in_process_label(&task), "[pane missing] tsk-b — Missing");
    }

    #[test]
    fn found_task_gets_no_badge() {
        let task = InProcessTask {
            id: "tsk-a".into(),
            title: "Found".into(),
            pane: Some(PaneIdentity {
                pane_id: "wS:p1".into(),
                tab_id: "wS:t1".into(),
            }),
        };
        assert_eq!(in_process_label(&task), "tsk-a — Found");
    }
}
