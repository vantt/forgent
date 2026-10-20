mod common;
use common::*;
use fgos_secrets::{
    ExpandError, Origin, RedactionSet, Registry, RegistryError, ResolveError, Resolver,
    SecretSource,
};

const ORDER: [Origin; 3] = Origin::DEFAULT_ORDER;

fn resolver<'a>(
    reg: &'a Registry,
    e: &'a std::collections::HashMap<String, String>,
    project: &'a MemorySource,
    global: &'a MemorySource,
) -> Resolver<'a> {
    Resolver::new(
        reg,
        ORDER.to_vec(),
        e,
        Some(project as &dyn SecretSource),
        Some(global as &dyn SecretSource),
    )
}

#[test]
fn environment_wins_over_project_over_global() {
    let reg = registry("API_KEY", &["pi"]);
    let project = MemorySource::new("project", &[("API_KEY", "from-project")]);
    let global = MemorySource::new("global", &[("API_KEY", "from-global")]);

    let e = env(&[("API_KEY", "from-env")]);
    let r = resolver(&reg, &e, &project, &global)
        .resolve("API_KEY", "pi")
        .unwrap();
    assert_eq!(
        (r.value.expose(), r.origin),
        ("from-env", Origin::Environment)
    );

    let e = env(&[]);
    let r = resolver(&reg, &e, &project, &global)
        .resolve("API_KEY", "pi")
        .unwrap();
    assert_eq!(
        (r.value.expose(), r.origin),
        ("from-project", Origin::ProjectFile)
    );

    let empty = MemorySource::new("project", &[]);
    let r = resolver(&reg, &e, &empty, &global)
        .resolve("API_KEY", "pi")
        .unwrap();
    assert_eq!(
        (r.value.expose(), r.origin),
        ("from-global", Origin::GlobalFile)
    );
}

#[test]
fn order_is_a_parameter() {
    let reg = registry("API_KEY", &["pi"]);
    let project = MemorySource::new("project", &[("API_KEY", "from-project")]);
    let global = MemorySource::new("global", &[]);
    let e = env(&[("API_KEY", "from-env")]);
    let r = Resolver::new(
        &reg,
        vec![Origin::ProjectFile, Origin::Environment],
        &e,
        Some(&project),
        Some(&global),
    );
    assert_eq!(
        r.resolve("API_KEY", "pi").unwrap().origin,
        Origin::ProjectFile
    );
    let r = Resolver::new(
        &reg,
        vec![Origin::GlobalFile],
        &e,
        Some(&project),
        Some(&global),
    );
    assert!(matches!(
        r.resolve("API_KEY", "pi"),
        Err(ResolveError::Unresolved { .. })
    ));
}

#[test]
fn unavailable_source_is_skipped_to_the_next() {
    let reg = registry("API_KEY", &["pi"]);
    let mut project = MemorySource::new("project", &[("API_KEY", "from-project")]);
    project.unavailable = true;
    let global = MemorySource::new("global", &[("API_KEY", "from-global")]);
    let e = env(&[]);
    let r = resolver(&reg, &e, &project, &global)
        .resolve("API_KEY", "pi")
        .unwrap();
    assert_eq!(r.origin, Origin::GlobalFile);
}

#[test]
fn missing_reference_names_variable_and_files_and_no_value() {
    let reg = registry("API_KEY", &["pi"]);
    let project = MemorySource::new("file /work/.fgos/secrets.local.env", &[("OTHER", FAKE)]);
    let global = MemorySource::new("file /home/u/.fgos/secrets.env", &[]);
    let e = env(&[("SOMETHING_ELSE", FAKE)]);
    let err = resolver(&reg, &e, &project, &global)
        .expand("Bearer ${API_KEY}", "pi")
        .unwrap_err();
    let text = err.to_string();
    assert!(text.contains("API_KEY"), "{text}");
    assert!(text.contains("/work/.fgos/secrets.local.env"), "{text}");
    assert!(text.contains("/home/u/.fgos/secrets.env"), "{text}");
    assert!(!text.contains(FAKE) && !text.contains("fake"), "{text}");
}

#[test]
fn unresolved_reference_is_never_an_empty_string() {
    let reg = registry("API_KEY", &["pi"]);
    let project = MemorySource::new("project", &[]);
    let global = MemorySource::new("global", &[]);
    let e = env(&[("API_KEY", ""), ("PLAIN", "")]);
    let r = resolver(&reg, &e, &project, &global);
    assert!(matches!(
        r.expand("${API_KEY}", "pi"),
        Err(ExpandError::Resolve(ResolveError::Unresolved { .. }))
    ));
    assert!(matches!(
        r.expand("${PLAIN}", "pi"),
        Err(ExpandError::Resolve(ResolveError::Unresolved { .. }))
    ));
    assert!(matches!(
        r.expand("${NEVER_SET}", "pi"),
        Err(ExpandError::Resolve(ResolveError::Unresolved { .. }))
    ));
}

#[test]
fn consumer_not_listed_is_refused_without_a_value() {
    let reg = registry("API_KEY", &["pi"]);
    let project = MemorySource::new("project", &[("API_KEY", FAKE)]);
    let global = MemorySource::new("global", &[]);
    let e = env(&[]);
    let r = resolver(&reg, &e, &project, &global);
    let err = r.resolve("API_KEY", "codex").unwrap_err();
    assert_eq!(
        err,
        ResolveError::ConsumerRefused {
            name: "API_KEY".into(),
            consumer: "codex".into()
        }
    );
    assert!(!err.to_string().contains(FAKE));
    let err = r.expand("${API_KEY}", "codex").unwrap_err();
    assert!(matches!(
        err,
        ExpandError::Resolve(ResolveError::ConsumerRefused { .. })
    ));
    assert!(!err.to_string().contains(FAKE));
}

#[test]
fn expansion_returns_text_and_declared_names_used() {
    let reg = registry("API_KEY", &["pi"]);
    let project = MemorySource::new("project", &[("API_KEY", FAKE)]);
    let global = MemorySource::new("global", &[]);
    let e = env(&[("HOME", "/home/u")]);
    let r = resolver(&reg, &e, &project, &global);
    let x = r
        .expand("${HOME}/x ${API_KEY} ${API_KEY} $${HOME} $5 end$", "pi")
        .unwrap();
    assert_eq!(x.text, format!("/home/u/x {FAKE} {FAKE} ${{HOME}} $5 end$"));
    assert_eq!(x.used, vec!["API_KEY".to_owned()]);
}

#[test]
fn undeclared_name_never_reads_a_secrets_file() {
    let reg = registry("API_KEY", &["pi"]);
    let project = MemorySource::new("project", &[("UNDECLARED", FAKE)]);
    let global = MemorySource::new("global", &[]);
    let e = env(&[]);
    let r = resolver(&reg, &e, &project, &global);
    assert!(r.expand("${UNDECLARED}", "pi").is_err());
}

#[test]
fn malformed_reference_is_an_error() {
    let reg = registry("API_KEY", &["pi"]);
    let project = MemorySource::new("project", &[]);
    let global = MemorySource::new("global", &[]);
    let e = env(&[]);
    let r = resolver(&reg, &e, &project, &global);
    for bad in ["${", "${API_KEY", "${}", "${1BAD}", "${A B}"] {
        assert!(
            matches!(r.expand(bad, "pi"), Err(ExpandError::Malformed { .. })),
            "{bad}"
        );
    }
}

#[test]
fn no_output_path_carries_the_value() {
    let reg = registry("API_KEY", &["pi"]);
    let project = MemorySource::new("project", &[("API_KEY", FAKE)]);
    let resolved = resolver(&reg, &env(&[]), &project, &MemorySource::new("g", &[]))
        .resolve("API_KEY", "pi")
        .unwrap();
    let debug = format!("{resolved:?} {:?}", resolved.value);
    assert!(!debug.contains(FAKE) && !debug.contains("fake"), "{debug}");
    let mut set = RedactionSet::new();
    set.add("API_KEY", &resolved.value);
    let debug = format!("{set:?}");
    assert!(!debug.contains(FAKE) && !debug.contains("fake"), "{debug}");
}

#[test]
fn redaction_masks_names_and_values() {
    let mut set = RedactionSet::new();
    let v = fgos_secrets::SecretValue::new(FAKE);
    set.add("API_KEY", &v);
    set.add("EMPTY", &fgos_secrets::SecretValue::new(""));
    let line = format!("curl -H key={FAKE} using API_KEY twice {FAKE}");
    let masked = set.mask(&line);
    assert!(
        !masked.contains(FAKE) && !masked.contains("API_KEY"),
        "{masked}"
    );
    assert_eq!(
        masked,
        "curl -H key=[redacted] using [redacted] twice [redacted]"
    );
    assert_eq!(set.mask("plain text"), "plain text");
}

#[test]
fn registry_rejects_bad_declarations() {
    assert_eq!(
        Registry::new(vec![declaration("1X", &[])]).unwrap_err(),
        RegistryError::InvalidName("1X".into())
    );
    assert_eq!(
        Registry::new(vec![declaration("A", &[]), declaration("A", &[])]).unwrap_err(),
        RegistryError::Duplicate("A".into())
    );
    let mut d = declaration("A", &[]);
    d.redact = false;
    assert_eq!(
        Registry::new(vec![d]).unwrap_err(),
        RegistryError::RedactDisabled("A".into())
    );
}
