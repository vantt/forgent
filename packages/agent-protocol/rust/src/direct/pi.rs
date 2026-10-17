use super::DirectAdapter;

pub struct Pi;

impl DirectAdapter for Pi {
    fn cli(&self) -> &'static str {
        "pi"
    }
}
