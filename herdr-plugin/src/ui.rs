use ratatui::layout::{Constraint, Direction, Layout};
use ratatui::style::{Color, Modifier, Style};
use ratatui::text::Span;
use ratatui::widgets::{Block, Borders, List, ListItem};
use ratatui::Frame;

use crate::app::App;

pub fn draw(frame: &mut Frame, app: &App) {
    let columns = Layout::default()
        .direction(Direction::Horizontal)
        .constraints([Constraint::Percentage(60), Constraint::Percentage(40)])
        .split(frame.area());

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
            ListItem::new(format!("{} — {} [{}]", task.id, task.title, task.status)).style(
                Style::default().fg(Color::Yellow),
            )
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
}
