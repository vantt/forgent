//! Real child-process fixture. Faults are injected through FileSystem, never env.
use fgos_event_store::{
    append::{append_with_fs, AppendRequest, Positions},
    fsio::{FileSystem, Point},
    layout::{Layout, StreamId},
    rotate::rotate_with_fs,
};
use std::{
    fs::File,
    io::{self, Write},
    path::Path,
};
#[path = "../common/mod.rs"]
mod common;
struct Fault {
    point: String,
    prefix: Option<usize>,
}
impl Fault {
    fn stop(&self) -> io::Result<()> {
        println!("STOP");
        io::stdout().flush()?;
        let mut line = String::new();
        io::stdin().read_line(&mut line)?;
        Err(io::Error::new(
            io::ErrorKind::Interrupted,
            "fault driver released without kill",
        ))
    }
}
impl FileSystem for Fault {
    fn checkpoint(&self, p: Point) -> io::Result<()> {
        if format!("{p:?}") == self.point {
            self.stop()?;
        }
        Ok(())
    }
    fn write_batch(&self, file: &mut File, bytes: &[u8]) -> io::Result<usize> {
        if let Some(prefix) = self.prefix {
            file.write_all(&bytes[..prefix.min(bytes.len())])?;
            self.stop()?;
            unreachable!()
        }
        file.write(bytes)
    }
}
fn main() {
    let args: Vec<String> = std::env::args().collect();
    if args.get(3).is_some_and(|s| s == "barrier") {
        println!("READY");
        io::stdout().flush().unwrap();
        let mut go = String::new();
        io::stdin().read_line(&mut go).unwrap();
        assert_eq!(go.trim(), "GO");
    }
    let layout = Layout::from_common_dir(Some(Path::new(&args[2]))).unwrap();
    let stream = StreamId::parse("project").unwrap();
    let fault = Fault {
        point: args.get(3).cloned().unwrap_or_default(),
        prefix: args.get(4).map(|p| p.parse().unwrap()),
    };
    match args[1].as_str() {
        "append" => {
            let a = append_with_fs(
                &layout,
                &common::registry(),
                AppendRequest {
                    stream: &stream,
                    events: &common::inputs(3),
                    cursor: &Positions::new(),
                    writer: "child-writer",
                    machine: "test-aa2345",
                    held_ranks: &[],
                },
                &fault,
            )
            .unwrap();
            println!("ACK {}", a.ack.last_seq);
        }
        "rotate" => {
            rotate_with_fs(&layout, "test-aa2345", &stream, &[], &fault).unwrap();
            println!("ROTATED");
        }
        _ => panic!("unknown operation"),
    }
}
