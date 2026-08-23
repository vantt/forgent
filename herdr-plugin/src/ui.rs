use std::io;
use std::time::Duration;

use crossterm::event::{
    self, DisableMouseCapture, EnableMouseCapture, Event, KeyCode, KeyEventKind, KeyModifiers,
    MouseEventKind,
};
use crossterm::execute;
use crossterm::terminal::{
    disable_raw_mode, enable_raw_mode, EnterAlternateScreen, LeaveAlternateScreen,
};
use ratatui::backend::CrosstermBackend;
use ratatui::layout::{Constraint, Direction, Layout, Rect};
use ratatui::style::{Color, Modifier, Style};
use ratatui::text::{Line, Span};
use ratatui::widgets::{Block, Borders, Clear, Paragraph, Row, Table, TableState, Tabs};
use ratatui::{Frame, Terminal};

use crate::app::{App, InProcessTask, Panel, WorkTab};
use crate::fgos::{merge_tree_node_count, MergeTreeNode};
use crate::ports::{TerminalUi as TerminalUiPort, UiEvent};

/// tsk-jo1 D1 palette (ANSI-16): the Work Items panel's optional Status
/// column color-code — `None` renders with the table's default style.
fn status_color(status: &str) -> Option<Color> {
    match status {
        "doing" => Some(Color::Yellow),
        "blocked" => Some(Color::Red),
        "awaiting-human" => Some(Color::Magenta),
        "awaiting-approval" => Some(Color::Green),
        "delivered" | "retrospective" | "cleanup" | "done" | "wontfix" => Some(Color::DarkGray),
        _ => None,
    }
}

const TAB_ORDER: [WorkTab; 5] = [
    WorkTab::Backlog,
    WorkTab::Todo,
    WorkTab::Doing,
    WorkTab::Review,
    WorkTab::Done,
];

/// tsk-1eu D1 / tsk-3wl D1: the same focused-vs-unfocused border style
/// `draw()` already applies to the WorkItems/InProcess boxes, shared here
/// so the 3 view-only boxes (NeedAnswer/MergeList/AfterDeliver, tsk-3wl
/// D1) highlight identically when they gain focus.
fn box_border_style(app: &App, panel: Panel) -> Style {
    if app.focused_panel == panel {
        Style::default().fg(Color::Cyan).add_modifier(Modifier::BOLD)
    } else {
        Style::default()
    }
}

/// tsk-bvh D1: same `ratatui::layout::Rect` → domain `ButtonRect` copy
/// `draw_detail_modal`'s `pick_button_rect`/`discover_button_rect`
/// already do inline (`ui.rs:605-610`) — pulled into one helper here
/// since 5 boxes need it instead of 2 buttons.
fn rect_of(area: Rect) -> crate::app::ButtonRect {
    crate::app::ButtonRect {
        x: area.x,
        y: area.y,
        width: area.width,
        height: area.height,
    }
}

/// tsk-bvh D1: hit-tests a left-click against every box's own `Rect`
/// (`app.*_rect`, written every frame `draw` renders below), in the same
/// spatial order `Panel::next`/`prev` already cycle through. `None` when
/// the click landed outside all 5 (e.g. the bottom status bar).
fn click_target(app: &App, col: u16, row: u16) -> Option<UiEvent> {
    if let Some(rect) = app.work_items_rect {
        if rect.contains(col, row) {
            return Some(row_click_event(Panel::WorkItems, rect, row, app.visible_work_items().len()));
        }
    }
    if let Some(rect) = app.in_process_rect {
        if rect.contains(col, row) {
            return Some(row_click_event(Panel::InProcess, rect, row, app.in_process.len()));
        }
    }
    if app.need_answer_rect.is_some_and(|rect| rect.contains(col, row)) {
        return Some(UiEvent::ClickFocus(Panel::NeedAnswer));
    }
    if app.merge_list_rect.is_some_and(|rect| rect.contains(col, row)) {
        return Some(UiEvent::ClickFocus(Panel::MergeList));
    }
    if app.after_deliver_rect.is_some_and(|rect| rect.contains(col, row)) {
        return Some(UiEvent::ClickFocus(Panel::AfterDeliver));
    }
    None
}

/// tsk-bvh D1: WorkItems/InProcess only — "click item = select" from the
/// original ask. Row data starts 2 lines below the box's own top border
/// (1 border line + 1 header line, both tables render a header via
/// `.header(...)`); a click above that (the border/header itself) or past
/// the last visible row still focuses the box, just without selecting a
/// row — same as clicking empty space inside a box with no rows at all.
fn row_click_event(panel: Panel, rect: crate::app::ButtonRect, click_row: u16, visible_len: usize) -> UiEvent {
    let first_row_y = rect.y + 2;
    if click_row < first_row_y {
        return UiEvent::ClickFocus(panel);
    }
    let index = (click_row - first_row_y) as usize;
    if index < visible_len {
        UiEvent::ClickSelectRow(panel, index)
    } else {
        UiEvent::ClickFocus(panel)
    }
}

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
        // tsk-40t D5: real mouse capture — without this, the terminal
        // handles clicks itself (text selection) and crossterm never sees
        // an `Event::Mouse` at all.
        execute!(stdout, EnterAlternateScreen, EnableMouseCapture)?;
        let backend = CrosstermBackend::new(stdout);
        let terminal = Terminal::new(backend)?;
        Ok(Self { terminal })
    }

    pub fn teardown(mut self) -> io::Result<()> {
        disable_raw_mode()?;
        execute!(
            self.terminal.backend_mut(),
            DisableMouseCapture,
            LeaveAlternateScreen
        )?;
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
    /// `crossterm` type crosses this port's boundary. tsk-64z D8: while
    /// `app.filter_input_active`, every printable key routes to the
    /// filter-input events instead of its normal binding (checked FIRST,
    /// before any of the normal single-key matches below) — this is the
    /// one place a raw keypress means something different depending on
    /// domain state.
    fn poll_event(&mut self, app: &App, timeout: Duration) -> io::Result<Option<UiEvent>> {
        if !event::poll(timeout)? {
            return Ok(None);
        }
        let event = event::read()?;

        // tsk-40t D5: a left-click hit-tests against the detail modal's
        // button `Rect`s (`app.pick_button_rect`/`discover_button_rect`,
        // written every frame `draw_detail_modal` renders) and, on a hit,
        // fires the SAME domain event the matching key already does
        // (`UiEvent::Pick`/`Discover`) — no separate "mouse click"
        // variant, so `main.rs`'s handlers stay the one place either
        // input method's effect is decided. Only meaningful while the
        // modal is open; a click anywhere else (or with no button
        // `Rect` recorded) is inert.
        if let Event::Mouse(mouse) = event {
            if mouse.kind != MouseEventKind::Down(crossterm::event::MouseButton::Left) {
                return Ok(None);
            }
            if app.detail_modal_open {
                if app
                    .pick_button_rect
                    .is_some_and(|rect| rect.contains(mouse.column, mouse.row))
                {
                    return Ok(Some(UiEvent::Pick));
                }
                if app
                    .discover_button_rect
                    .is_some_and(|rect| rect.contains(mouse.column, mouse.row))
                {
                    return Ok(Some(UiEvent::Discover));
                }
                return Ok(None);
            }
            // tsk-bvh D1: same domain-event discipline as the modal click
            // above — a hit only ever produces `ClickFocus`/
            // `ClickSelectRow`, never mutates `app` here (`poll_event`
            // only has `&App`; `main.rs`'s run loop is the one place
            // either input method's effect is decided).
            return Ok(click_target(app, mouse.column, mouse.row));
        }

        let Event::Key(key) = event else {
            return Ok(None);
        };
        if key.kind != KeyEventKind::Press {
            return Ok(None);
        }
        let is_ctrl_c =
            key.code == KeyCode::Char('c') && key.modifiers.contains(KeyModifiers::CONTROL);
        if is_ctrl_c {
            return Ok(Some(UiEvent::Quit));
        }

        if app.filter_input_active {
            return Ok(match key.code {
                KeyCode::Esc => Some(UiEvent::FilterCancel),
                KeyCode::Enter => Some(UiEvent::FilterSubmit),
                KeyCode::Backspace => Some(UiEvent::FilterBackspace),
                KeyCode::Char(c) => Some(UiEvent::FilterChar(c)),
                _ => None,
            });
        }

        Ok(match key.code {
            KeyCode::Char('q') | KeyCode::Esc => Some(UiEvent::Quit),
            KeyCode::Down | KeyCode::Char('j') => Some(UiEvent::Down),
            KeyCode::Up | KeyCode::Char('k') => Some(UiEvent::Up),
            KeyCode::Enter => Some(UiEvent::Pick),
            KeyCode::Tab => Some(UiEvent::SwitchPanel),
            KeyCode::BackTab => Some(UiEvent::SwitchPanelPrev),
            KeyCode::Char('d') => Some(UiEvent::Discover),
            KeyCode::Char(']') => Some(UiEvent::NextTab),
            KeyCode::Char('[') => Some(UiEvent::PrevTab),
            KeyCode::Char('/') => Some(UiEvent::ActivateFilter),
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

    // tsk-64z D1: the tab strip is a nested vertical split inside the left
    // column only — it never touches the right-side In-process panel's own
    // area (`columns[1]`, untouched below).
    let work_items_area = Layout::default()
        .direction(Direction::Vertical)
        .constraints([Constraint::Length(3), Constraint::Min(0)])
        .split(columns[0]);

    let selected_tab_index = TAB_ORDER.iter().position(|t| *t == app.active_tab).unwrap_or(0);
    let tabs = Tabs::new(TAB_ORDER.iter().map(|t| t.label()).collect::<Vec<_>>())
        .select(selected_tab_index)
        .highlight_style(Style::default().add_modifier(Modifier::REVERSED))
        .block(
            Block::default()
                .borders(Borders::ALL)
                .border_style(if app.focused_panel == Panel::WorkItems {
                    focused_border_style
                } else {
                    unfocused_border_style
                })
                .title("[ prev · ] next"),
        );
    frame.render_widget(tabs, work_items_area[0]);

    let work_items_header =
        Row::new(["ID", "Tier", "Pri", "Status", "Stage", "Blocked By", "Blocks", "Title"]).style(header_style);
    let visible_work_items = app.visible_work_items();
    let work_items_rows: Vec<Row> = visible_work_items
        .iter()
        .map(|item| {
            let priority = item
                .priority
                .map(|p| p.to_string())
                .unwrap_or_else(|| "-".into());
            let blocked_by = if item.blocked_by.is_empty() {
                "-".to_string()
            } else {
                item.blocked_by.join(",")
            };
            let row_style = status_color(&item.status)
                .map(|color| Style::default().fg(color))
                .unwrap_or_default();
            Row::new([
                item.id.clone(),
                item.goal_tier.clone(),
                priority,
                item.status.clone(),
                item.stage.clone(),
                blocked_by,
                item.blocks.to_string(),
                item.title.clone(),
            ])
            .style(row_style)
        })
        .collect();
    let mut work_items_state = TableState::default();
    work_items_state.select(app.selected);
    frame.render_stateful_widget(
        Table::new(
            work_items_rows,
            [
                Constraint::Length(12),
                Constraint::Length(6),
                Constraint::Length(5),
                Constraint::Length(16),
                Constraint::Length(10),
                Constraint::Length(14),
                Constraint::Length(6),
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
                    "Work items — ↑/↓ select, Enter for details",
                    Style::default().add_modifier(Modifier::BOLD),
                )),
        )
        .row_highlight_style(Style::default().add_modifier(Modifier::REVERSED)),
        work_items_area[1],
        &mut work_items_state,
    );
    // tsk-bvh D1: recorded every frame — click-to-focus/click-to-select
    // hit-tests against this in `poll_event`'s `click_target`.
    app.work_items_rect = Some(rect_of(work_items_area[1]));

    // tsk-417 D3: the right column stacks the existing In-process panel
    // above 3 NEW, separate action-queue boxes — never merged into one
    // table (D3's own "3 box riêng biệt không merge" instruction).
    let right_column = Layout::default()
        .direction(Direction::Vertical)
        .constraints([
            Constraint::Percentage(30),
            Constraint::Percentage(24),
            Constraint::Percentage(23),
            Constraint::Percentage(23),
        ])
        .split(columns[1]);

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
                    "In process — Enter to jump",
                    Style::default().add_modifier(Modifier::BOLD),
                )),
        )
        .row_highlight_style(Style::default().add_modifier(Modifier::REVERSED)),
        right_column[0],
        &mut in_process_state,
    );
    app.in_process_rect = Some(rect_of(right_column[0]));

    draw_need_answer_box(frame, app, right_column[1]);
    app.need_answer_rect = Some(rect_of(right_column[1]));
    draw_merge_list_box(frame, app, right_column[2]);
    app.merge_list_rect = Some(rect_of(right_column[2]));
    draw_after_deliver_box(frame, app, right_column[3]);
    app.after_deliver_rect = Some(rect_of(right_column[3]));

    // tsk-64z D8: while typing, the filter input takes over the bottom
    // bar entirely (never a permanent fixture — bung 1 dòng đè status bar
    // only while active, per the locked TUI-convention decision).
    let status = if app.filter_input_active {
        Paragraph::new(format!("/{}", app.filter_query))
            .style(Style::default().fg(Color::Yellow).add_modifier(Modifier::BOLD))
    } else if let Some(err) = &app.last_error {
        Paragraph::new(format!("fgos poll error: {err}")).style(Style::default().fg(Color::Red))
    } else if let Some(status) = &app.pick_status {
        Paragraph::new(status.as_str()).style(Style::default().fg(Color::Green))
    } else if !app.filter_query.is_empty() {
        Paragraph::new(format!(
            "filter: \"{}\" (/ to edit, clear via Esc while editing) · ↑/↓ select · Enter: details · q/Esc: quit",
            app.filter_query
        ))
        .style(Style::default().fg(Color::Yellow))
    } else {
        // tsk-3wl D1 / tsk-bvh D1: Tab/Shift+Tab cycle all 5 boxes, click
        // focuses/selects the same way — the footer names every
        // keybinding (keyboard AND mouse) in play so none of it has to be
        // discovered by trial and error.
        Paragraph::new(
            "Tab/Shift+Tab or click: focus box · ↑/↓ select/scroll · click row: select · Enter: details · [/]: tabs · /: filter · q/Esc: quit",
        )
    };
    frame.render_widget(status, rows[1]);

    if app.detail_modal_open {
        // tsk-40t D5: clone the selected item BEFORE the mutable borrow
        // `draw_detail_modal` needs (to write the button `Rect`s) — ends
        // the immutable `selected_work_item()` borrow first, same
        // shape any other "read then mutate" split in this file uses.
        if let Some(item) = app.selected_work_item().cloned() {
            draw_detail_modal(frame, app, &item);
        }
    }
}

/// tsk-417 D3 / tsk-jo1 D1: NEED ANSWER box — `status: blocked` gets
/// `[ERR]` red, `status: awaiting-human` gets `[ASK]` magenta, same box,
/// distinct per-row tag (D3 locks the shared box; the palette locks the
/// two sub-tags).
fn draw_need_answer_box(frame: &mut Frame, app: &App, area: Rect) {
    let rows: Vec<Line> = app
        .need_answer
        .iter()
        .map(|task| {
            let (tag, color) = if task.status == "blocked" {
                ("[ERR]", Color::Red)
            } else {
                ("[ASK]", Color::Magenta)
            };
            Line::from(vec![
                Span::styled(tag, Style::default().fg(color)),
                Span::raw(format!(" {}  {}", task.id, task.title)),
            ])
        })
        .collect();
    let body = if rows.is_empty() {
        Paragraph::new("(empty)")
    } else {
        // tsk-3wl D1: no row-select for this box — Up/Down scroll instead.
        Paragraph::new(rows).scroll((app.need_answer_scroll, 0))
    };
    frame.render_widget(
        body.block(
            Block::default()
                .borders(Borders::ALL)
                .border_style(box_border_style(app, Panel::NeedAnswer))
                .title(Span::styled(
                    format!("NEED ANSWER ({})", app.need_answer.len()),
                    Style::default().add_modifier(Modifier::BOLD),
                )),
        ),
        area,
    );
}

/// tsk-59b: MERGE LIST box — renders `fgos merge list --json`'s `tree`
/// field (`mergeTree`, tsk-2x9k) as an actual nested tree, replacing the
/// old three-flat-list rendering (D2/D3, CONTEXT.md). Indented by depth,
/// one status badge per node: `[MRG]` green `ready` (mergeable right now),
/// `[wait]` dim `waiting`, `[sync]` yellow `blocked-sync`, `[CFL]` red
/// `conflicted`, `[SUP]` dim `superseded`, no badge for `container` (a
/// real ancestor item that is not itself a merge candidate — exists only
/// so its children have somewhere to nest, D2/D3). A blocked/conflicted/
/// superseded node's `reason` (D7 — the specific cause and counterpart
/// item, not a bare status word) renders as its own dim line directly
/// under the node. Never re-sorts or re-groups here — the tree already
/// arrives sorted and nested exactly as the JS engine computed it (D4:
/// Rust only renders, never re-derives merge order).
fn push_merge_tree_lines(rows: &mut Vec<Line<'static>>, nodes: &[MergeTreeNode], depth: usize) {
    for node in nodes {
        let indent = "  ".repeat(depth);
        let branch = if depth == 0 { String::new() } else { "└─ ".to_string() };
        let (tag, tag_color) = match node.status.as_str() {
            "ready" => ("[MRG] ", Color::Green),
            "waiting" => ("[wait] ", Color::DarkGray),
            "blocked-sync" => ("[sync] ", Color::Yellow),
            "conflicted" => ("[CFL] ", Color::Red),
            "superseded" => ("[SUP] ", Color::DarkGray),
            _ => ("", Color::DarkGray), // "container": a real ancestor, not a candidate
        };
        rows.push(Line::from(vec![
            Span::raw(format!("{indent}{branch}")),
            Span::styled(tag, Style::default().fg(tag_color)),
            Span::raw(format!("{}  {}", node.id, node.title)),
        ]));
        if let Some(reason) = &node.reason {
            rows.push(Line::from(Span::styled(
                format!("{indent}    {reason}"),
                Style::default().fg(Color::DarkGray),
            )));
        }
        push_merge_tree_lines(rows, &node.children, depth + 1);
    }
}

fn draw_merge_list_box(frame: &mut Frame, app: &App, area: Rect) {
    let mut rows: Vec<Line> = Vec::new();
    push_merge_tree_lines(&mut rows, &app.merge_list.tree, 0);
    let body = if rows.is_empty() {
        Paragraph::new("(empty)")
    } else {
        Paragraph::new(rows).scroll((app.merge_list_scroll, 0))
    };
    let count = merge_tree_node_count(&app.merge_list.tree);
    frame.render_widget(
        body.block(
            Block::default()
                .borders(Borders::ALL)
                .border_style(box_border_style(app, Panel::MergeList))
                .title(Span::styled(
                    format!("MERGE LIST ({count})"),
                    Style::default().add_modifier(Modifier::BOLD),
                )),
        ),
        area,
    );
}

/// tsk-417 D3 / tsk-jo1 D1: AFTER DELIVER box — `status: retrospective`
/// gets `[RTR]` cyan, `status: cleanup` gets `[POL]` dim/gray (lowest
/// priority, AGENTS.md "Polish Sau DoD" tier 3).
fn draw_after_deliver_box(frame: &mut Frame, app: &App, area: Rect) {
    let rows: Vec<Line> = app
        .after_deliver
        .iter()
        .map(|task| {
            let (tag, color) = if task.status == "retrospective" {
                ("[RTR]", Color::Cyan)
            } else {
                ("[POL]", Color::DarkGray)
            };
            Line::from(vec![
                Span::styled(tag, Style::default().fg(color)),
                Span::raw(format!(" {}  {}", task.id, task.title)),
            ])
        })
        .collect();
    let body = if rows.is_empty() {
        Paragraph::new("(empty)")
    } else {
        Paragraph::new(rows).scroll((app.after_deliver_scroll, 0))
    };
    frame.render_widget(
        body.block(
            Block::default()
                .borders(Borders::ALL)
                .border_style(box_border_style(app, Panel::AfterDeliver))
                .title(Span::styled(
                    format!("AFTER DELIVER ({})", app.after_deliver.len()),
                    Style::default().add_modifier(Modifier::BOLD),
                )),
        ),
        area,
    );
}

/// A blocking dialog for the selected work item — opened by Enter on the
/// "Work items" panel instead of picking directly. Two fixed actions
/// (tsk-1e3 D4): Pick (Enter, unconditional) and Discover (`d`, disabled/
/// dimmed — never hidden, so the layout never shifts — unless
/// `WorkItem::discover_eligible()` says the item is both the right stage
/// AND dependency-ready).
fn draw_detail_modal(frame: &mut Frame, app: &mut App, item: &crate::app::WorkItem) {
    // tsk-2x9: bumped from 40% to 70% height -- 8 detail lines (was 4) plus
    // the block's own 2 border rows plus the fixed 3-row button strip need
    // 13 rows minimum; 40% of a typical terminal clipped the new lines
    // silently (Paragraph has no scrollback here).
    let area = centered_rect(60, 70, frame.area());
    frame.render_widget(Clear, area);

    let sections = Layout::default()
        .direction(Direction::Vertical)
        .constraints([Constraint::Min(0), Constraint::Length(3)])
        .split(area);

    let priority_text = item
        .priority
        .map(|p| p.to_string())
        .unwrap_or_else(|| "-".into());
    let blocked_by_text = if item.blocked_by.is_empty() {
        "-".to_string()
    } else {
        item.blocked_by.join(", ")
    };
    let detail = Paragraph::new(vec![
        Line::from(format!("ID: {}", item.id)),
        Line::from(format!("Title: {}", item.title)),
        Line::from(format!("Goal tier: {}", item.goal_tier)),
        Line::from(format!("Stage: {}", item.stage)),
        Line::from(format!("Status: {}", item.status)),
        Line::from(format!("Priority: {}", priority_text)),
        Line::from(format!("Blocked by: {}", blocked_by_text)),
        Line::from(format!("Blocks: {}", item.blocks)),
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

    let discover_enabled = item.discover_eligible();
    let button_cells = Layout::default()
        .direction(Direction::Horizontal)
        .constraints([Constraint::Percentage(50), Constraint::Percentage(50)])
        .split(sections[1]);

    let pick_button = Paragraph::new(Line::from(Span::styled(
        " Pick ",
        Style::default().add_modifier(Modifier::REVERSED),
    )))
    .block(Block::default().borders(Borders::ALL).title("Enter: pick"));
    frame.render_widget(pick_button, button_cells[0]);
    // tsk-40t D5: recorded AFTER rendering so it reflects this frame's
    // real on-screen position — `poll_event` (ui.rs) reads it back next
    // event, hit-testing a mouse click against it.
    app.pick_button_rect = Some(crate::app::ButtonRect {
        x: button_cells[0].x,
        y: button_cells[0].y,
        width: button_cells[0].width,
        height: button_cells[0].height,
    });

    // tsk-jo1 D1 palette (ANSI-16): dim/gray (`Color::DarkGray`) when
    // disabled, same `Reversed` treatment as Pick when enabled — color
    // changes, layout never does.
    let discover_style = if discover_enabled {
        Style::default().add_modifier(Modifier::REVERSED)
    } else {
        Style::default().fg(Color::DarkGray)
    };
    let discover_button = Paragraph::new(Line::from(Span::styled(" Discover ", discover_style)))
        .block(
            Block::default()
                .borders(Borders::ALL)
                .title(if discover_enabled { "d: discover" } else { "d: discover (wrong stage or blocked)" }),
        );
    frame.render_widget(discover_button, button_cells[1]);
    app.discover_button_rect = Some(crate::app::ButtonRect {
        x: button_cells[1].x,
        y: button_cells[1].y,
        width: button_cells[1].width,
        height: button_cells[1].height,
    });
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
    use crate::app::{App, WorkItem};
    use crate::pane_scan::PaneIdentity;
    use ratatui::backend::TestBackend;

    /// tsk-64z D1: all 5 tab labels render, regardless of which is
    /// currently selected — proves the `Tabs` widget renders the full set,
    /// not just the active one.
    ///
    /// work-item-backlog-status D4: this doubles as the visibility proof
    /// for `BACKLOG`. `App::mock()` carries no `backlog` item, so asserting
    /// the label still renders is exactly the "an empty bucket must still
    /// advertise itself" bar — a person cannot promote `backlog -> todo`
    /// (a human-only edge) if the tab only appears once something is in it.
    #[test]
    fn work_items_panel_renders_five_tabs_backlog_todo_doing_review_done() {
        let mut app = App::mock();
        let backend = TestBackend::new(120, 30);
        let mut terminal = Terminal::new(backend).expect("terminal init");
        terminal
            .draw(|frame| draw(frame, &mut app))
            .expect("draw should not panic");
        let buffer = terminal.backend().buffer();
        let content: String = buffer.content().iter().map(|cell| cell.symbol()).collect();
        for label in ["BACKLOG", "TODO", "DOING", "REVIEW", "DONE"] {
            assert!(content.contains(label), "missing tab label {label}: {content}");
        }
    }

    /// tsk-4cxl D2: the Work Items table renders a `Stage` column right
    /// after `Status`, carrying each row's own `stage` value — `App::mock`'s
    /// default TODO-tab row (`tsk-19y-1`) has `stage: "discovery"`, the
    /// coding domain's real entry stage (tsk-1l9: the fixture used to say
    /// `clarify`, a stage retired out of the registry entirely, so the mock
    /// rendered a value no live item could hold).
    #[test]
    fn work_items_table_renders_stage_column_next_to_status() {
        let mut app = App::mock();
        let backend = TestBackend::new(120, 30);
        let mut terminal = Terminal::new(backend).expect("terminal init");
        terminal
            .draw(|frame| draw(frame, &mut app))
            .expect("draw should not panic");
        let buffer = terminal.backend().buffer();
        let content: String = buffer.content().iter().map(|cell| cell.symbol()).collect();
        assert!(content.contains("Stage"), "missing Stage header: {content}");
        assert!(content.contains("discovery"), "missing row's stage value: {content}");
    }

    /// tsk-417 D3: NEED ANSWER, MERGE LIST, AFTER DELIVER render as 3
    /// separate bordered boxes (their titles all appear, distinctly, in
    /// the rendered buffer) — never merged into one table.
    #[test]
    fn process_status_renders_three_separate_boxes() {
        let mut app = App::mock();
        let backend = TestBackend::new(140, 40);
        let mut terminal = Terminal::new(backend).expect("terminal init");
        terminal
            .draw(|frame| draw(frame, &mut app))
            .expect("draw should not panic");
        let buffer = terminal.backend().buffer();
        let content: String = buffer.content().iter().map(|cell| cell.symbol()).collect();
        for title in ["NEED ANSWER", "MERGE LIST", "AFTER DELIVER"] {
            assert!(content.contains(title), "missing box title {title}: {content}");
        }
        assert!(content.contains("[ERR]"), "mock has a blocked row: {content}");
        assert!(content.contains("[MRG]"), "mock has a ready-to-merge row: {content}");
        assert!(content.contains("[RTR]"), "mock has a retrospective row: {content}");
    }

    /// tsk-bvh D1: clicking inside NEED ANSWER (no row-select, per
    /// CONTEXT.md D1) focuses the box — never selects, since there is no
    /// row state to select.
    #[test]
    fn mouse_click_to_focus_on_need_answer_box_focuses_without_selecting() {
        let mut app = App::mock();
        let backend = TestBackend::new(140, 40);
        let mut terminal = Terminal::new(backend).expect("terminal init");
        terminal.draw(|frame| draw(frame, &mut app)).expect("draw should not panic");
        let rect = app.need_answer_rect.expect("NEED ANSWER box must record its rect after draw");
        let event = click_target(&app, rect.x + 1, rect.y + 1);
        assert_eq!(event, Some(UiEvent::ClickFocus(Panel::NeedAnswer)));
    }

    /// tsk-bvh D1: clicking a WorkItems row focuses the box AND selects
    /// that row — "click item = select" from the original ask.
    #[test]
    fn mouse_click_to_focus_on_work_items_row_selects_it() {
        let mut app = App::mock();
        let backend = TestBackend::new(140, 40);
        let mut terminal = Terminal::new(backend).expect("terminal init");
        terminal.draw(|frame| draw(frame, &mut app)).expect("draw should not panic");
        let rect = app.work_items_rect.expect("WorkItems box must record its rect after draw");
        // Row 0's data starts 2 lines below the box's own top-left corner
        // (1 border line + 1 header line) — `App::mock`'s default
        // `active_tab` (Todo) shows exactly one row, `tsk-19y-1`.
        let event = click_target(&app, rect.x + 1, rect.y + 2);
        assert_eq!(event, Some(UiEvent::ClickSelectRow(Panel::WorkItems, 0)));
    }

    /// tsk-bvh D1: a click landing on none of the 5 boxes (e.g. the
    /// bottom status bar) is inert.
    #[test]
    fn mouse_click_to_focus_outside_every_box_is_inert() {
        let mut app = App::mock();
        let backend = TestBackend::new(140, 40);
        let mut terminal = Terminal::new(backend).expect("terminal init");
        terminal.draw(|frame| draw(frame, &mut app)).expect("draw should not panic");
        let event = click_target(&app, 0, 39);
        assert_eq!(event, None);
    }

    fn render_modal_buffer(stage: &str) -> ratatui::buffer::Buffer {
        render_modal_buffer_with_item(WorkItem {
            id: "tsk-a".into(),
            title: "A".into(),
            goal_tier: "mvp".into(),
            stage: stage.into(),
            status: "doing".into(),
            blocked_by: Vec::new(),
            blocks: 0,
            priority: None,
        })
    }

    /// tsk-2x9: sibling of `render_modal_buffer` that renders a caller-built
    /// `WorkItem` verbatim, so a test can control fields (`status`,
    /// `priority`, `blocked_by`, `blocks`) `render_modal_buffer`'s own
    /// fixed defaults don't vary — added rather than widening
    /// `render_modal_buffer`'s signature, to leave its 3 existing call
    /// sites untouched.
    fn render_modal_buffer_with_item(item: WorkItem) -> ratatui::buffer::Buffer {
        let mut app = App::empty();
        let backend = TestBackend::new(80, 24);
        let mut terminal = Terminal::new(backend).expect("terminal init");
        terminal
            .draw(|frame| draw_detail_modal(frame, &mut app, &item))
            .expect("draw should not panic");
        terminal.backend().buffer().clone()
    }

    /// tsk-1e3 D4: both buttons always render, regardless of stage — only
    /// Discover's color changes (see
    /// `discover_button_disabled_when_stage_not_eligible` below).
    #[test]
    fn detail_modal_renders_pick_and_discover_buttons() {
        let buffer = render_modal_buffer("clarify");
        let content: String = buffer.content().iter().map(|cell| cell.symbol()).collect();
        assert!(content.contains("Pick"), "modal must render a Pick button: {content}");
        assert!(
            content.contains("Discover"),
            "modal must render a Discover button: {content}"
        );
    }

    /// tsk-2x9: the modal used to show only ID/Title/Goal tier/Stage — now
    /// also surfaces the `WorkItem` fields already fetched from
    /// `fgos triage --json` but previously unused in this view.
    #[test]
    fn detail_modal_renders_status_priority_blocked_by_and_blocks() {
        let buffer = render_modal_buffer_with_item(WorkItem {
            id: "tsk-a".into(),
            title: "A".into(),
            goal_tier: "mvp".into(),
            stage: "executing".into(),
            status: "doing".into(),
            blocked_by: vec!["tsk-b".into(), "tsk-c".into()],
            blocks: 2,
            priority: Some(150),
        });
        let content: String = buffer.content().iter().map(|cell| cell.symbol()).collect();
        assert!(content.contains("Status: doing"), "modal must render status: {content}");
        assert!(content.contains("Priority: 150"), "modal must render priority: {content}");
        assert!(
            content.contains("Blocked by: tsk-b, tsk-c"),
            "modal must render blocked-by ids: {content}"
        );
        assert!(content.contains("Blocks: 2"), "modal must render blocks count: {content}");
    }

    /// tsk-2x9: an item with no `blocked_by` and no computed `priority`
    /// (e.g. still `todo`, pre-`discover`) must render placeholders, not
    /// an empty string, a stray comma, or the literal `None`.
    #[test]
    fn detail_modal_renders_placeholders_for_empty_blocked_by_and_no_priority() {
        let buffer = render_modal_buffer_with_item(WorkItem {
            id: "tsk-a".into(),
            title: "A".into(),
            goal_tier: "mvp".into(),
            stage: "clarify".into(),
            status: "todo".into(),
            blocked_by: Vec::new(),
            blocks: 0,
            priority: None,
        });
        let content: String = buffer.content().iter().map(|cell| cell.symbol()).collect();
        assert!(content.contains("Priority: -"), "empty priority must render as '-': {content}");
        assert!(
            content.contains("Blocked by: -"),
            "empty blocked-by must render as '-': {content}"
        );
        assert!(!content.contains("None"), "must never render the literal 'None': {content}");
    }

    /// tsk-1e3 D4 / tsk-jo1 D1: Discover renders `Color::DarkGray` (never
    /// hidden, never a layout shift) when the item's stage is outside
    /// `discover_eligible`'s set (`clarify`/`discovery`/`exploring`).
    #[test]
    fn discover_button_disabled_when_stage_not_eligible() {
        let buffer = render_modal_buffer("executing");
        let discover_is_dimmed = buffer
            .content()
            .iter()
            .any(|cell| cell.symbol() == "D" && cell.fg == Color::DarkGray);
        assert!(
            discover_is_dimmed,
            "Discover button must render Color::DarkGray when stage is not discover-eligible"
        );

        let buffer = render_modal_buffer("clarify");
        let discover_is_dimmed_when_enabled = buffer
            .content()
            .iter()
            .any(|cell| cell.symbol() == "D" && cell.fg == Color::DarkGray);
        assert!(
            !discover_is_dimmed_when_enabled,
            "Discover button must not render dimmed when stage == clarify and not blocked"
        );
    }

    /// Companion to `discover_button_disabled_when_stage_not_eligible`:
    /// a right-stage item still renders Discover dimmed when it has an
    /// unmet dependency (`blocked_by` non-empty) — the gap that let
    /// herdr open a discover pane for an item `fgos take` would go on to
    /// refuse.
    #[test]
    fn discover_button_disabled_when_blocked_even_at_eligible_stage() {
        let buffer = render_modal_buffer_with_item(WorkItem {
            id: "tsk-a".into(),
            title: "A".into(),
            goal_tier: "mvp".into(),
            stage: "clarify".into(),
            status: "todo".into(),
            blocked_by: vec!["tsk-dep".into()],
            blocks: 0,
            priority: None,
        });
        let discover_is_dimmed = buffer
            .content()
            .iter()
            .any(|cell| cell.symbol() == "D" && cell.fg == Color::DarkGray);
        assert!(
            discover_is_dimmed,
            "Discover button must render Color::DarkGray when blocked_by is non-empty"
        );
    }

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
