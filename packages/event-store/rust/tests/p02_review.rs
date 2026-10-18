mod common;
use common::{inputs, Repo};
use fgos_event_store::{
    append::{append_with_fs, AppendRequest, Positions},
    fsio::{FileSystem, Point},
    open_read::{decode, read_in_gate, read_in_gate_with_fs, read_own},
    rotate::rotate,
};
use std::{cell::Cell, fs, io, path::Path};

#[test]
fn complete_damaged_batches_refuse_without_changing_any_bytes() {
    for middle in [false, true] {
        let r = Repo::new();
        let a = r.append(1);
        r.append(1);
        if middle {
            r.append(1);
        }
        let p = r.layout.stream(&r.stream);
        let mut bytes = fs::read(p.active()).unwrap();
        let second = bytes
            .split_inclusive(|b| *b == b'\n')
            .take(2)
            .map(|l| l.len())
            .sum::<usize>();
        bytes[second] = b'!'; // damaged event, complete marker still follows
        fs::write(p.active(), &bytes).unwrap();
        for strict in [false, true] {
            assert_eq!(
                decode(&bytes, &a.ack.origin, &r.stream, strict)
                    .unwrap_err()
                    .code
                    .as_str(),
                "event-store-integrity"
            );
        }
        assert!(read_own(&r.layout, &a.ack.origin, &r.stream).is_err());
        assert!(read_in_gate(&r.layout, &a.ack.origin, &r.stream, 0).is_err());
        assert!(r.append_cursor(1, &Positions::new()).is_err());
        assert_eq!(fs::read(p.active()).unwrap(), bytes);
        assert!(rotate(&r.layout, "test-aa2345", &r.stream, &[]).is_err());
        assert_eq!(fs::read(p.active()).unwrap(), bytes);
    }
}
#[test]
fn unbacked_hint_refuses_before_truncating_torn_tail() {
    let r = Repo::new();
    r.append(1);
    let p = r.layout.stream(&r.stream);
    let mut bytes = fs::read(p.active()).unwrap();
    bytes.extend(b"torn");
    fs::write(p.active(), &bytes).unwrap();
    fs::write(p.hwm(), b"{\"lastSeq\":9}").unwrap();
    assert!(r.append_cursor(1, &Positions::new()).is_err());
    assert_eq!(fs::read(p.active()).unwrap(), bytes);
}
#[test]
fn garbage_hint_is_rewritten_and_stray_closed_path_is_named() {
    let r = Repo::new();
    r.append(1);
    let p = r.layout.stream(&r.stream);
    fs::write(p.hwm(), b"garbage").unwrap();
    assert_eq!(r.append(1).ack.first_seq, 2);
    assert_eq!(
        serde_json::from_slice::<serde_json::Value>(&fs::read(p.hwm()).unwrap()).unwrap()
            ["lastSeq"],
        0
    );
    let stray = p.closed().join("stray.tmp");
    fs::write(&stray, b"x").unwrap();
    let err = r.append_cursor(1, &Positions::new()).unwrap_err();
    assert!(format!("{err:?}").contains(stray.to_str().unwrap()));
}
#[test]
fn steady_append_performs_two_real_fsyncs_and_no_hint_replacement() {
    struct Count(Cell<usize>);
    impl FileSystem for Count {
        fn sync_file(&self, f: &fs::File) -> io::Result<()> {
            self.0.set(self.0.get() + 1);
            f.sync_all()
        }
        fn sync_directory(&self, p: &Path) -> io::Result<()> {
            self.0.set(self.0.get() + 1);
            fgos_durable_file::sync_directory(p)
        }
        fn checkpoint(&self, p: Point) -> io::Result<()> {
            assert_ne!(p, Point::BeforeHwm);
            Ok(())
        }
    }
    let r = Repo::new();
    r.append(1);
    for _ in 0..3 {
        let count = Count(Cell::new(0));
        append_with_fs(
            &r.layout,
            &r.registry,
            AppendRequest {
                stream: &r.stream,
                events: &inputs(1),
                cursor: &Positions::new(),
                writer: "writer",
                machine: "test-aa2345",
                held_ranks: &[],
            },
            &count,
        )
        .unwrap();
        assert_eq!(count.0.get(), 2); // active file + predecessor-safe stream directory
    }
}
#[test]
fn vanished_already_folded_range_does_not_bounce_the_gate() {
    struct Delete<'a>(&'a Path);
    impl FileSystem for Delete<'_> {
        fn checkpoint(&self, p: Point) -> io::Result<()> {
            if p == Point::AfterClosedList {
                fs::remove_file(self.0)?;
            }
            Ok(())
        }
    }
    for cursor in [0, 3] {
        let r = Repo::new();
        let a = r.append(3);
        let segment = rotate(&r.layout, "test-aa2345", &r.stream, &[])
            .unwrap()
            .segment
            .unwrap();
        let got = read_in_gate_with_fs(
            &r.layout,
            &a.ack.origin,
            &r.stream,
            cursor,
            &Delete(&segment),
        );
        if cursor == 3 {
            assert!(got.unwrap().events.is_empty());
        } else {
            assert_eq!(got.unwrap_err().code.as_str(), "catch-up-required");
        }
    }
}
