use std::io;
use std::time::Duration;

use crossterm::event::{self, Event, KeyCode, KeyEventKind, KeyModifiers};
use crossterm::execute;
use crossterm::terminal::{
    disable_raw_mode, enable_raw_mode, EnterAlternateScreen, LeaveAlternateScreen,
};
use ratatui::backend::CrosstermBackend;
use ratatui::layout::{Constraint, Direction, Layout, Rect};
use ratatui::style::{Color, Modifier, Style};
use ratatui::text::{Line, Span};
use ratatui::widgets::{Block, Borders, Clear, Paragraph, Row, Table, TableState};
use ratatui::{Frame, Terminal};

use crate::app::{App, InProcessTask, Panel};
use crate::ports::{TerminalUi as TerminalUiPort, UiEvent};

/// tsk-4zo D2: an orphaned task (no matching herdr pane found by the most
/// recent scan) gets an explicit `[pane missing]` badge in its Title cell
/// — no jump-to-pane affordance exists yet for any row (that's
/// `tsk-1eu`'s job), so there is nothing else to disable here today.
fn in_process_title_cell(task: &InProcessTask) -> String {
    if task.pane.is_some() {
        task.title.clone()
    } else {
        format!("[pane missing] {}", task.title)
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

    // tsk-4vo: both lists render as a `Table` — its header row is
    // structurally separate from the scrollable body, so it stays fixed
    // ("sticky") without any custom logic, unlike the plain `List` this
    // replaces.
    let header_style = Style::default().add_modifier(Modifier::BOLD);

    let work_items_header = Row::new(["Tier", "ID", "Title"]).style(header_style);
    let work_items_rows: Vec<Row> = app
        .work_items
        .iter()
        .map(|item| Row::new([item.goal_tier.clone(), item.id.clone(), item.title.clone()]))
        .collect();
    let mut work_items_state = TableState::default();
    work_items_state.select(app.selected);
    frame.render_stateful_widget(
        Table::new(
            work_items_rows,
            [
                Constraint::Length(10),
                Constraint::Length(16),
                Constraint::Fill(1),
            ],
        )
        .header(work_items_header)
        .block(
            Block::default()
                .borders(Borders::ALL)
                .border_style(if app.focused_panel == Panel::WorkItems {
                    focused_border_style
                } else {
                    unfocused_border_style
                })
                .title(Span::styled(
                    "Work items (by impact) — ↑/↓ select, Enter for details",
                    Style::default().add_modifier(Modifier::BOLD),
                )),
        )
        .row_highlight_style(Style::default().add_modifier(Modifier::REVERSED)),
        columns[0],
        &mut work_items_state,
    );

    let in_process_header = Row::new(["ID", "Title"]).style(header_style);
    let in_process_rows: Vec<Row> = app
        .in_process
        .iter()
        .map(|task| {
            Row::new([task.id.clone(), in_process_title_cell(task)])
                .style(Style::default().fg(Color::Yellow))
        })
        .collect();
    let mut in_process_state = TableState::default();
    in_process_state.select(app.in_process_selected);
    frame.render_stateful_widget(
        Table::new(
            in_process_rows,
            [Constraint::Length(16), Constraint::Fill(1)],
        )
        .header(in_process_header)
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
        .row_highlight_style(Style::default().add_modifier(Modifier::REVERSED)),
        columns[1],
        &mut in_process_state,
    );

    let status = if let Some(err) = &app.last_error {
        Paragraph::new(format!("fgos poll error: {err}")).style(Style::default().fg(Color::Red))
    } else if let Some(status) = &app.pick_status {
        Paragraph::new(status.as_str()).style(Style::default().fg(Color::Green))
    } else {
        Paragraph::new("↑/↓ select · Enter: details · q/Esc: quit")
    };
    frame.render_widget(status, rows[1]);

    if app.detail_modal_open {
        if let Some(item) = app.selected_work_item() {
            draw_detail_modal(frame, item);
        }
    }
}

/// A blocking dialog for the selected work item — opened by Enter on the
/// "Work items" panel instead of picking directly. Its only action today
/// is the Pick button, which runs the same `/fgOS:pick` flow Enter used to
/// trigger immediately.
fn draw_detail_modal(frame: &mut Frame, item: &crate::app::WorkItem) {
    let area = centered_rect(60, 40, frame.area());
    frame.render_widget(Clear, area);

    let sections = Layout::default()
        .direction(Direction::Vertical)
        .constraints([Constraint::Min(0), Constraint::Length(3)])
        .split(area);

    let detail = Paragraph::new(vec![
        Line::from(format!("ID: {}", item.id)),
        Line::from(format!("Title: {}", item.title)),
        Line::from(format!("Goal tier: {}", item.goal_tier)),
    ])
    .block(
        Block::default()
            .borders(Borders::ALL)
            .title(Span::styled(
                "Task detail",
                Style::default().add_modifier(Modifier::BOLD),
            )),
    );
    frame.render_widget(detail, sections[0]);

    let buttons = Paragraph::new(Line::from(Span::styled(
        " Pick ",
        Style::default().add_modifier(Modifier::REVERSED),
    )))
    .block(
        Block::default()
            .borders(Borders::ALL)
            .title("Enter: pick · Esc: close"),
    );
    frame.render_widget(buttons, sections[1]);
}

/// Carves an `area`-relative popup rect out of `area`'s center —
/// `percent_x`/`percent_y` of `area`'s width/height.
fn centered_rect(percent_x: u16, percent_y: u16, area: Rect) -> Rect {
    let vertical = Layout::default()
        .direction(Direction::Vertical)
        .constraints([
            Constraint::Percentage((100 - percent_y) / 2),
            Constraint::Percentage(percent_y),
            Constraint::Percentage((100 - percent_y) / 2),
        ])
        .split(area);

    Layout::default()
        .direction(Direction::Horizontal)
        .constraints([
            Constraint::Percentage((100 - percent_x) / 2),
            Constraint::Percentage(percent_x),
            Constraint::Percentage((100 - percent_x) / 2),
        ])
        .split(vertical[1])[1]
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::pane_scan::PaneIdentity;

    #[test]
    fn dashboard_table_orphan_task_gets_pane_missing_badge_in_title_cell() {
        let task = InProcessTask {
            id: "tsk-b".into(),
            title: "Missing".into(),
            pane: None,
        };
        assert_eq!(in_process_title_cell(&task), "[pane missing] Missing");
    }

    #[test]
    fn dashboard_table_found_task_gets_no_badge_in_title_cell() {
        let task = InProcessTask {
            id: "tsk-a".into(),
            title: "Found".into(),
            pane: Some(PaneIdentity {
                pane_id: "wS:p1".into(),
                tab_id: "wS:t1".into(),
            }),
        };
        assert_eq!(in_process_title_cell(&task), "Found");
    }
}
