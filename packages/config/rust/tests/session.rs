//! The session class reads one marker through the caller's lookup.

use fgos_config::session::{session_class, CONFINED_MARKER};
use fgos_config::snapshot::SessionClass;

fn class_of(value: Option<&str>) -> SessionClass {
    session_class(|name| {
        assert_eq!(name, CONFINED_MARKER, "only the marker is looked up");
        value.map(str::to_string)
    })
}

#[test]
fn marker_one_is_confined_and_everything_else_is_unconfined() {
    assert_eq!(class_of(Some("1")), SessionClass::Confined);
    for other in [None, Some("0"), Some(""), Some("true"), Some(" 1")] {
        assert_eq!(class_of(other), SessionClass::Unconfined, "{other:?}");
    }
}
