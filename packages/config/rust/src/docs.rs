//! The comment renderer for an existing file (spec section 7): where the `@fgos:doc` lines differ
//! from what the schema and the standard render, and the block each such key gets instead. The
//! per-key render is `grammar::doc_lines` (the one a door uses when it writes a key); this module
//! only applies it across a whole file. `@fgos:why` lines and free notes keep their text and order.
//! Rewriting is the write transaction's `Edit::Docs`; nothing here writes.
use fgos_yaml_doc::{parse, Document, Profile, Segment};

use crate::files::JSON_NAME;
use crate::grammar::{doc_lines, is_doc_line, parse_block};
use crate::schema::descend;
use crate::snapshot::Context;
use crate::ConfigRefusal;

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum DocKind {
    /// The key has a described schema node and carries no `@fgos:doc` line.
    Missing,
    /// The doc lines differ from the render.
    Drift,
}

/// One key whose doc lines are not the render. Never a value.
#[derive(Clone, Debug, PartialEq, Eq)]
pub struct DocFinding {
    pub path: Vec<Segment>,
    pub line: u32,
    pub column: u32,
    pub kind: DocKind,
}

/// A finding with the whole comment block the key gets: the render, then the old lines minus the
/// old doc run, in their original order.
pub(crate) struct DocChange {
    pub finding: DocFinding,
    pub block: Vec<String>,
}

/// The existing comment lines without the doc run `parse_block` read (its first `count` doc lines).
fn without_doc_run(above: &[String], count: usize) -> Vec<String> {
    let mut skip = count;
    above
        .iter()
        .filter(|line| {
            let doc = is_doc_line(line) && skip > 0;
            skip -= usize::from(doc);
            !doc
        })
        .cloned()
        .collect()
}

/// Every key of `doc` whose doc lines differ from the render. A key the schema does not describe,
/// or describes without a description, has no expectation and is never listed; keys inside a list
/// are not addressed by a door and are left alone.
pub(crate) fn plan(ctx: &Context, doc: &Document) -> Result<Vec<DocChange>, ConfigRefusal> {
    let json = doc.to_json().map_err(ConfigRefusal::parse)?;
    let mut paths = Vec::new();
    descend(&json, &mut Vec::new(), &mut |path, node| {
        paths.push(path.to_vec());
        node.is_object()
    });
    let mut out = Vec::new();
    for path in paths {
        let Some(resolved) = ctx.schemas.resolve(&path) else {
            continue;
        };
        let want = doc_lines(resolved.node, ctx.standard.value_at(&path));
        let comments = doc.comments_at(&path).map_err(ConfigRefusal::parse)?;
        let held = parse_block(&comments);
        if want.is_empty() || want == held.doc {
            continue;
        }
        let at = crate::schema::key_span(doc, &path);
        out.push(DocChange {
            finding: DocFinding {
                kind: if held.doc.is_empty() {
                    DocKind::Missing
                } else {
                    DocKind::Drift
                },
                line: at.map_or(0, |s| s.line),
                column: at.map_or(0, |s| s.column),
                path,
            },
            block: want
                .into_iter()
                .chain(without_doc_run(&comments.above, held.doc.len()))
                .collect(),
        });
    }
    Ok(out)
}

/// The doc findings of one config file. A legacy `config.json` has no comments to hold a doc line,
/// so it has no findings (its own row is `config-format-legacy-json`).
pub fn scan(ctx: &Context, name: &str, bytes: &[u8]) -> Result<Vec<DocFinding>, ConfigRefusal> {
    if name.ends_with(JSON_NAME) {
        return Ok(Vec::new());
    }
    let doc = parse(bytes, Profile::StrictConfig, name).map_err(ConfigRefusal::parse)?;
    Ok(plan(ctx, &doc)?.into_iter().map(|c| c.finding).collect())
}
