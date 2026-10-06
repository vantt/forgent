#!/usr/bin/env python3
"""Extract human-typed user turns from Claude Code session transcripts and flag
those that contain a correction marker (user telling the agent it did wrong).

Population = every human-typed user turn (string content, not tool_result, not
a <command-*>/<local-command-*>/system-reminder wrapper, not an injected
skill/agent prompt). A turn is a "correction candidate" when it matches one of
CORRECTION_PATTERNS. Output: JSONL of candidates + a population summary.
Read-only over transcripts; secrets are redacted before writing.

Usage: python3 -I forensics-extract-corrections.py <transcripts_dir> <out_jsonl>
"""
import json, os, re, sys

CORRECTION_PATTERNS = [
    r"đã có (sẵn|rồi)", r"có sẵn rồi", r"tự chế", r"reinvent", r"sao (em|lại|mày)",
    r"tùm lum", r"lung tung", r"làm (bừa|thừa|thiếu)", r"không phải (vậy|thế|chỗ|đó)",
    r"sai (rồi|chỗ|path|tên)", r"nhầm", r"lại (nữa|quên)", r"đã nói", r"nói (bao|mấy) lần",
    r"tại sao (em|lại|mày)", r"ai (bảo|cho phép|kêu)", r"đâu có (cửa|cần|bảo)",
    r"why did you", r"already exists", r"wrong (path|place|file|branch|dir)",
    r"không (cần|được) (tạo|làm|thêm)", r"bịa", r"đoán mò", r"chả lẻ|chẳng lẽ",
]
RX = re.compile("|".join(CORRECTION_PATTERNS), re.I)
SECRET = re.compile(r"(sk-[A-Za-z0-9_-]{10,}|ghp_[A-Za-z0-9]{10,}|xox[abp]-[A-Za-z0-9-]+|AKIA[0-9A-Z]{12,}|eyJ[A-Za-z0-9_-]{20,})")

def human_text(rec):
    if rec.get("type") != "user" or rec.get("isMeta") or rec.get("isSidechain"):
        return None
    msg = rec.get("message") or {}
    c = msg.get("content")
    if isinstance(c, list):
        parts = [p.get("text", "") for p in c if isinstance(p, dict) and p.get("type") == "text"]
        if any(isinstance(p, dict) and p.get("type") == "tool_result" for p in c):
            return None
        c = "\n".join(parts)
    if not isinstance(c, str) or not c.strip():
        return None
    s = c.strip()
    if s.startswith(("<command-", "<local-command", "<system-reminder", "<task-notification", "Base directory for this skill", "Caveat:", "[Request interrupted")):
        return None
    if len(s) > 4000:  # pasted briefs / skill bodies, not a conversational correction
        return None
    return s

def main(d, out):
    total_turns = 0; sessions = 0; hits = []
    for fn in sorted(os.listdir(d)):
        if not fn.endswith(".jsonl"):
            continue
        sessions += 1
        with open(os.path.join(d, fn), errors="replace") as f:
            for i, line in enumerate(f):
                try:
                    rec = json.loads(line)
                except Exception:
                    continue
                t = human_text(rec)
                if t is None:
                    continue
                total_turns += 1
                m = RX.search(t)
                if m:
                    hits.append({"session": fn[:8], "line": i + 1, "ts": rec.get("timestamp", ""),
                                 "match": m.group(0), "text": SECRET.sub("[REDACTED]", t)[:700]})
    with open(out, "w") as o:
        for h in hits:
            o.write(json.dumps(h, ensure_ascii=False) + "\n")
    print(json.dumps({"sessions": sessions, "human_turns": total_turns, "correction_candidates": len(hits)}))

if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
