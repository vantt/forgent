use std::process::Command;

pub struct Port {
    bin: String,
}

#[napi]
impl Port {
    #[napi(constructor)]
    pub fn new(bin: String) -> Self {
        Self { bin }
    }

    pub fn run(&self) {
        let _ = Command::new(&self.bin).arg("commit").status();
    }
}
