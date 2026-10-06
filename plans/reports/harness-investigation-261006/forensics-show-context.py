#!/usr/bin/env python3
"""Print the assistant text immediately before (and after) a given transcript line,
so a correction candidate can be read in context. Secrets redacted; output truncated.

Usage: python3 -I forensics-show-context.py <transcript.jsonl> <line> [chars]
"""
import json, re, sys

SECRET = re.compile(r"(sk-[A-Za-z0-9_-]{10,}|ghp_[A-Za-z0-9]{10,}|xox[abp]-[A-Za-z0-9-]+|AKIA[0-9A-Z]{12,}|eyJ[A-Za-z0-9_-]{20,})")

def text_of(rec):
    c = (rec.get("message") or {}).get("content")
    if isinstance(c, str):
        return c
    if isinstance(c, list):
        out = []
        for p in c:
            if not isinstance(p, dict):
                continue
            if p.get("type") == "text":
                out.append(p.get("text", ""))
            elif p.get("type") == "tool_use":
                out.append("[tool_use " + p.get("name", "") + " " + json.dumps(p.get("input", {}), ensure_ascii=False)[:300] + "]")
        return "\n".join(out)
    return ""

path, target = sys.argv[1], int(sys.argv[2])
n = int(sys.argv[3]) if len(sys.argv) > 3 else 1500
recs = []
with open(path, errors="replace") as f:
    for i, line in enumerate(f, 1):
        if i > target + 40:
            break
        if i < target - 400:
            continue
        try:
            recs.append((i, json.loads(line)))
        except Exception:
            pass
before = [(i, r) for i, r in recs if i < target and r.get("type") == "assistant" and text_of(r).strip()]
after = [(i, r) for i, r in recs if i > target and r.get("type") == "assistant" and text_of(r).strip()]
for i, r in before[-3:]:
    print(f"--- ASSISTANT before @{i}\n" + SECRET.sub("[REDACTED]", text_of(r))[: n // 3])
tgt = [r for i, r in recs if i == target]
if tgt:
    print(f"=== USER @{target}\n" + SECRET.sub("[REDACTED]", text_of(tgt[0]))[:n])
for i, r in after[:2]:
    print(f"--- ASSISTANT after @{i}\n" + SECRET.sub("[REDACTED]", text_of(r))[: n // 2])
