use super::DirectAdapter;

pub struct Agy;

impl DirectAdapter for Agy {
    fn cli(&self) -> &'static str {
        "agy"
    }
}
