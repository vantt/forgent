//! Input grammars shared by the targets and the seed writer, so a seed is exactly what the target
//! decodes. Nothing here is part of the crate under test.

use fgos_yaml_doc::{Profile, Segment, Value};

/// The first byte picks the profile; the rest is the YAML text.
pub fn split_profile(data: &[u8]) -> Option<(Profile, &[u8])> {
    let (first, rest) = data.split_first()?;
    Some((Profile::ALL[usize::from(first & 1)], rest))
}

/// Number of operations `edit_reparse` knows (`op % OPS`).
pub const OPS: u8 = 4;

/// Layout of an `edit_reparse` input: `[profile, op, pick, acknowledge]`, the document, a NUL
/// byte, then the small text the operation writes.
pub struct EditInput<'a> {
    pub profile: Profile,
    pub op: u8,
    pub pick: u8,
    pub acknowledge: bool,
    pub document: &'a [u8],
    pub text: String,
}

pub fn decode_edit(data: &[u8]) -> Option<EditInput<'_>> {
    let [profile, op, pick, ack, rest @ ..] = data else {
        return None;
    };
    let split = rest.iter().position(|b| *b == 0).unwrap_or(rest.len());
    let (document, tail) = rest.split_at(split);
    let text: String = String::from_utf8_lossy(tail.get(1..).unwrap_or(&[]))
        .chars()
        .take(48)
        .collect();
    Some(EditInput {
        profile: Profile::ALL[usize::from(profile & 1)],
        op: op % OPS,
        pick: *pick,
        acknowledge: ack & 1 == 1,
        document,
        text,
    })
}

pub fn encode_edit(
    profile: u8,
    op: u8,
    pick: u8,
    ack: bool,
    document: &[u8],
    text: &str,
) -> Vec<u8> {
    let mut out = vec![profile, op, pick, u8::from(ack)];
    out.extend_from_slice(document);
    out.push(0);
    out.extend_from_slice(text.as_bytes());
    out
}

/// Every path of a value, parents before children, at most `limit` of them.
pub fn paths_of(value: &Value, limit: usize) -> Vec<Vec<Segment>> {
    let mut out = vec![Vec::new()];
    let mut next = 0;
    while next < out.len() && out.len() < limit {
        let path = out[next].clone();
        next += 1;
        let mut here = value;
        let mut ok = true;
        for segment in &path {
            match (here, segment) {
                (Value::Map(entries), Segment::Key(k)) => {
                    match entries.iter().find(|(key, _)| key == k) {
                        Some((_, v)) => here = v,
                        None => ok = false,
                    }
                }
                (Value::Seq(items), Segment::Index(i)) => match items.get(*i) {
                    Some(v) => here = v,
                    None => ok = false,
                },
                _ => ok = false,
            }
            if !ok {
                break;
            }
        }
        if !ok {
            continue;
        }
        match here {
            Value::Map(entries) => {
                for (key, _) in entries {
                    let mut child = path.clone();
                    child.push(Segment::Key(key.clone()));
                    out.push(child);
                }
            }
            Value::Seq(items) => {
                for index in 0..items.len() {
                    let mut child = path.clone();
                    child.push(Segment::Index(index));
                    out.push(child);
                }
            }
            _ => {}
        }
    }
    out.truncate(limit);
    out
}

pub fn value_at<'a>(value: &'a Value, path: &[Segment]) -> Option<&'a Value> {
    let mut here = value;
    for segment in path {
        here = match (here, segment) {
            (Value::Map(entries), Segment::Key(k)) => &entries.iter().find(|(key, _)| key == k)?.1,
            (Value::Seq(items), Segment::Index(i)) => items.get(*i)?,
            _ => return None,
        };
    }
    Some(here)
}

// ---- merge input: a byte grammar over a four-key alphabet, so inputs collide and merge ----

pub const KEYS: [&str; 4] = ["a", "b", "c", "d"];
pub const MAX_LAYER_DEPTH: usize = 5;

/// Bytes of the merge input: `[rule seed, layer count, layers...]`; a value is a tag byte, then
/// its payload (see `decode_value`). Reading past the end yields zero bytes.
pub struct Reader<'a> {
    data: &'a [u8],
    at: usize,
}

impl<'a> Reader<'a> {
    pub fn new(data: &'a [u8]) -> Reader<'a> {
        Reader { data, at: 0 }
    }
    pub fn byte(&mut self) -> u8 {
        let b = self.data.get(self.at).copied().unwrap_or(0);
        self.at += 1;
        b
    }
}

pub fn decode_value(reader: &mut Reader<'_>, depth: usize) -> Value {
    let tag = reader.byte() % if depth >= MAX_LAYER_DEPTH { 4 } else { 6 };
    match tag {
        0 => Value::Null,
        1 => Value::Bool(reader.byte() & 1 == 1),
        2 => Value::Int(i64::from(reader.byte() as i8)),
        3 => Value::Str(KEYS[usize::from(reader.byte() % 4)].to_string()),
        4 => {
            let count = reader.byte() % 4;
            Value::Seq(
                (0..count)
                    .map(|_| decode_value(reader, depth + 1))
                    .collect(),
            )
        }
        _ => {
            let count = reader.byte() % 4;
            let mut entries: Vec<(String, Value)> = Vec::new();
            for _ in 0..count {
                let key = KEYS[usize::from(reader.byte() % 4)].to_string();
                let value = decode_value(reader, depth + 1);
                if !entries.iter().any(|(k, _)| *k == key) {
                    entries.push((key, value));
                }
            }
            Value::Map(entries)
        }
    }
}

pub fn encode_value(value: &Value, depth: usize, out: &mut Vec<u8>) {
    let key_index = |key: &str| KEYS.iter().position(|k| *k == key).unwrap_or(0) as u8;
    match value {
        Value::Null => out.push(0),
        Value::Bool(b) => out.extend([1, u8::from(*b)]),
        Value::Int(i) => out.extend([2, *i as i8 as u8]),
        Value::Float(_) => out.push(0),
        Value::Str(s) => out.extend([3, key_index(s)]),
        Value::Seq(items) if depth < MAX_LAYER_DEPTH => {
            out.extend([4, items.len().min(3) as u8]);
            items
                .iter()
                .take(3)
                .for_each(|v| encode_value(v, depth + 1, out));
        }
        Value::Map(entries) if depth < MAX_LAYER_DEPTH => {
            out.extend([5, entries.len().min(3) as u8]);
            for (key, value) in entries.iter().take(3) {
                out.push(key_index(key));
                encode_value(value, depth + 1, out);
            }
        }
        _ => out.push(0),
    }
}

/// Equality that treats two NaNs as equal: `.nan` reads back as NaN, and NaN != NaN.
pub fn same_value(a: &Value, b: &Value) -> bool {
    match (a, b) {
        (Value::Float(x), Value::Float(y)) => x == y || (x.is_nan() && y.is_nan()),
        (Value::Seq(x), Value::Seq(y)) => {
            x.len() == y.len() && x.iter().zip(y).all(|(p, q)| same_value(p, q))
        }
        (Value::Map(x), Value::Map(y)) => {
            x.len() == y.len()
                && x.iter()
                    .zip(y)
                    .all(|(p, q)| p.0 == q.0 && same_value(&p.1, &q.1))
        }
        _ => a == b,
    }
}
