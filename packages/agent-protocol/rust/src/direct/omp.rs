use super::DirectAdapter;

pub struct Omp;

impl DirectAdapter for Omp {
    fn cli(&self) -> &'static str {
        "omp"
    }
}
