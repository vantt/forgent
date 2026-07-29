use ratatui::backend::TestBackend;
use ratatui::Terminal;

use herdr_fgos::app::App;
use herdr_fgos::ui::draw;

#[test]
fn dashboard_renders_without_panicking() {
    let backend = TestBackend::new(80, 24);
    let mut terminal = Terminal::new(backend).expect("terminal init");
    let mut app = App::mock();

    terminal
        .draw(|frame| draw(frame, &mut app))
        .expect("draw should not panic");
}
