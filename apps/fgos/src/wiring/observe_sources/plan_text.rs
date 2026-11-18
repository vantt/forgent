//! Pure readers of the two plan texts the sources project: a plan's front matter (`status`, `priority`) and a board
//! log line (`- YYYY-MM-DD HH:MM LANE: text`, newest first).

/// The `status` and `priority` of a plan file's front matter. A key the file does not hold is `None`.
#[derive(Debug, Clone, PartialEq, Eq, Default)]
pub struct PlanFields {
    pub status: Option<String>,
    pub priority: Option<String>,
}

fn scalar(value: &str) -> Option<String> {
    let value = value.split(" #").next().unwrap_or(value).trim();
    let value = value.trim_matches(|c| c == '"' || c == '\'').trim();
    (!value.is_empty()).then(|| value.to_owned())
}

/// Reads the top-level scalar `status:` and `priority:` between the opening `---` line and the next one.
pub fn plan_fields(text: &str) -> PlanFields {
    let mut lines = text.lines();
    let mut fields = PlanFields::default();
    if lines.next().map(str::trim_end) != Some("---") {
        return fields;
    }
    for line in lines {
        if line.trim_end() == "---" {
            break;
        }
        if let Some(value) = line.strip_prefix("status:") {
            fields.status = scalar(value);
        } else if let Some(value) = line.strip_prefix("priority:") {
            fields.priority = scalar(value);
        }
    }
    fields
}

/// One board log line: its local wall-clock stamp, the lane that wrote it and the text after the lane.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct LogLine<'a> {
    pub date: (i64, u32, u32),
    pub hour_minute: (u32, u32),
    pub lane: &'a str,
    pub text: &'a str,
}

/// `- 2026-11-18 15:16 lead:S6A-LAND: text`; any other line is not a log entry.
pub fn log_line(line: &str) -> Option<LogLine<'_>> {
    let rest = line.trim_start().strip_prefix("- ")?;
    let (date, rest) = rest.split_once(' ')?;
    let (clock, rest) = rest.split_once(' ')?;
    let mut d = date.split('-');
    let year = d.next()?.parse::<i64>().ok()?;
    let month = d.next()?.parse::<u32>().ok()?;
    let day = d.next()?.parse::<u32>().ok()?;
    if d.next().is_some() || date.len() != 10 {
        return None;
    }
    let (h, m) = clock.split_once(':')?;
    let hour = h.parse::<u32>().ok().filter(|h| *h < 24)?;
    let minute = m.parse::<u32>().ok().filter(|m| *m < 60)?;
    let (lane, text) = rest.split_once(": ")?;
    Some(LogLine {
        date: (year, month, day),
        hour_minute: (hour, minute),
        lane: lane.trim(),
        text,
    })
}

/// Every plan directory name in `text`: `YYMMDD-HHMM-slug`, as the plan convention names a directory.
pub fn plan_dir_names(text: &str) -> Vec<&str> {
    let mut found: Vec<&str> = Vec::new();
    let bytes = text.as_bytes();
    let is_slug = |b: u8| b.is_ascii_lowercase() || b.is_ascii_digit() || b == b'-';
    let mut i = 0;
    while i + 12 < bytes.len() {
        let head_ok = bytes[i..i + 6].iter().all(u8::is_ascii_digit)
            && bytes[i + 6] == b'-'
            && bytes[i + 7..i + 11].iter().all(u8::is_ascii_digit)
            && bytes[i + 11] == b'-'
            && (i == 0 || !is_slug(bytes[i - 1]));
        if head_ok {
            let mut end = i + 12;
            while end < bytes.len() && is_slug(bytes[end]) {
                end += 1;
            }
            let name = text[i..end].trim_end_matches('-');
            if name.len() > 12 && !found.contains(&name) {
                found.push(name);
            }
            i = end;
        } else {
            i += 1;
        }
    }
    found
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn front_matter_status_and_priority_are_read_and_the_body_is_ignored() {
        let text = "---\ncontract: plan-v1\nstatus: ready\npriority: \"P1\"  # top\nblockedBy: []\n---\nstatus: done\n";
        let fields = plan_fields(text);
        assert_eq!(fields.status.as_deref(), Some("ready"));
        assert_eq!(fields.priority.as_deref(), Some("P1"));
        assert_eq!(
            plan_fields("no front matter\nstatus: done"),
            PlanFields::default()
        );
    }

    #[test]
    fn a_board_log_line_gives_its_stamp_lane_and_text_and_prose_gives_none() {
        let line =
            log_line(" - 2026-11-18 15:16 lead:S6A-LAND: S6a validated (plans/261118-1455-s6a)")
                .unwrap();
        assert_eq!(line.date, (2026, 11, 18));
        assert_eq!(line.hour_minute, (15, 16));
        assert_eq!(line.lane, "lead:S6A-LAND");
        assert!(line.text.starts_with("S6a validated"));
        assert!(log_line("# Program board log").is_none());
        assert!(log_line("- 2026-13-18 25:99 x: y").is_none());
    }

    #[test]
    fn plan_directories_are_found_whole_and_once_in_free_text() {
        let names = plan_dir_names(
            "plan 261118-0936-ops-metrics, see plans/261118-0936-ops-metrics/plan.md and 261017-1313-fgos-platform-program-board.",
        );
        assert_eq!(
            names,
            [
                "261118-0936-ops-metrics",
                "261017-1313-fgos-platform-program-board"
            ]
        );
        assert!(plan_dir_names("commit 1234567-8901 x").is_empty());
    }
}
