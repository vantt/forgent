use super::DirectAdapter;

pub struct Claude;

impl DirectAdapter for Claude {
    fn cli(&self) -> &'static str {
        "claude"
    }
}
