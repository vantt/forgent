use ratatui::layout::{Constraint, Direction, Layout};
use ratatui::style::{Color, Modifier, Style};
use ratatui::text::Span;
use ratatui::widgets::{Block, Borders, List, ListItem, Paragraph};
use ratatui::Frame;

use crate::app::App;

pub fn draw(frame: &mut Frame, app: &App) {
    let rows = Layout::default()
        .direction(Direction::Vertical)
        .constraints([Constraint::Min(0), Constraint::Length(1)])
        .split(frame.area());

    let columns = Layout::default()
        .direction(Direction::Horizontal)
        .constraints([Constraint::Percentage(60), Constraint::Percentage(40)])
        .split(rows[0]);

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
    frame.render_widget(
        List::new(work_items).block(
            Block::default()
                .borders(Borders::ALL)
                .title(Span::styled(
                    "Work items (by impact)",
                    Style::default().add_modifier(Modifier::BOLD),
                )),
        ),
        columns[0],
    );

    let in_process: Vec<ListItem> = app
        .in_process
        .iter()
        .map(|task| {
            ListItem::new(format!("{} — {}", task.id, task.title))
                .style(Style::default().fg(Color::Yellow))
        })
        .collect();
    frame.render_widget(
        List::new(in_process).block(
            Block::default()
                .borders(Borders::ALL)
                .title(Span::styled(
                    "In process",
                    Style::default().add_modifier(Modifier::BOLD),
                )),
        ),
        columns[1],
    );

    let status = match &app.last_error {
        Some(err) => Paragraph::new(format!("fgos poll error: {err}"))
            .style(Style::default().fg(Color::Red)),
        None => Paragraph::new("q/Esc to quit"),
    };
    frame.render_widget(status, rows[1]);
}
