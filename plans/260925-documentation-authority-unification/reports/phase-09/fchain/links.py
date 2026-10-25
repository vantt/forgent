"""Clickable local Markdown targets, with source coordinates preserved.

Records-only counterpart of check-doc-candidate-status.relativeLinkTargets:
retain offsets (for prepared diffs), handle matching code delimiters and
reference links, and resolve against the move set rather than the checkout.
No document rendering, product imports or alternate patch engine.
"""
import html
import posixpath
import re
from urllib.parse import unquote, urlsplit


def prose(text):
    """Mask fenced/inline code and comments without changing any coordinates."""
    out = list(text)
    def blank(a, b):
        out[a:b] = ['\n' if c == '\n' else ' ' for c in text[a:b]]
    fence = None
    offset = 0
    for line in text.splitlines(True):
        # A quote container may contain a fence too.
        body = re.sub(r'^(?: {0,3}> ?)*', '', line)
        marker = re.match(r' {0,3}(`{3,}|~{3,})(.*)', body)
        if fence:
            blank(offset, offset + len(line))
            if marker and marker[1][0] == fence[0] and len(marker[1]) >= len(fence) and not marker[2].strip():
                fence = None
        elif marker and (marker[1][0] != '`' or '`' not in marker[2]):
            fence = marker[1]
            blank(offset, offset + len(line))
        offset += len(line)
    masked = ''.join(out)
    for match in re.finditer(r'<!--[\s\S]*?(?:-->|\Z)', masked):
        blank(*match.span())
    masked = ''.join(out)
    i = 0
    while i < len(masked):
        if masked[i] != '`' or (i and len(re.search(r'\\*$', masked[:i])[0]) % 2):
            i += 1
            continue
        run = re.match(r'`+', masked[i:])[0]
        end = re.search(r'(?<!`)`{' + str(len(run)) + r'}(?!`)', masked[i + len(run):])
        if end:
            z = i + len(run) + end.end()
            blank(i, z)
            i = z
        else:
            i += len(run)
    return ''.join(out)


def local_path(file, target):
    value = urlsplit(html.unescape(target))
    if value.scheme or value.netloc or not value.path:
        return None
    path = unquote(re.sub(r'\\([!"#$%&\'()*+,\-./:;<=>?@\[\]\\^_`{|}~])', r'\1', value.path))
    if path.startswith('repo/docs/'):
        path = path[5:]
    if path.startswith(('docs/', '/')):
        return posixpath.normpath(path.lstrip('/'))
    return posixpath.normpath(posixpath.join(posixpath.dirname(file), path))


def clickable(text):
    """Yield full-link and destination spans, including used reference definitions."""
    masked = prose(text)
    destination = r'<([^<>\n]*)>|((?:\\.|[^\s()<>]|\((?:\\.|[^()])*\))+)'
    definitions = {}
    definition_spans = []
    for m in re.finditer(r'^ {0,3}\[([^\]\n]+)\]:\s*(?:' + destination + r')', masked, re.M):
        key = ' '.join(m[1].split()).casefold()
        definitions.setdefault(key, (m, 2 if m[2] is not None else 3))
        definition_spans.append(m.span())
    occupied = []
    for m in re.finditer(r'(?<![\\!])\[(?:\\.|[^\]\\])*\]\(\s*(?:' + destination + r')(?:\s+["\'][^\n]*?["\'])?\s*\)', masked):
        group = 1 if m[1] is not None else 2
        occupied.append(m.span())
        yield dict(start=m.start(), end=m.end(), targetStart=m.start(group), targetEnd=m.end(group), target=text[m.start(group):m.end(group)])
    used = set()
    for m in re.finditer(r'(?<![\\!])\[([^\]\n]+)\](?:\[([^\]\n]*)\])?', masked):
        if any(a <= m.start() < b for a, b in occupied + definition_spans):
            continue
        key = ' '.join((m[2] or m[1]).split()).casefold()
        if key in definitions and key not in used:
            used.add(key)
            definition, group = definitions[key]
            yield dict(start=definition.start(), end=definition.end(), targetStart=definition.start(group), targetEnd=definition.end(group), target=text[definition.start(group):definition.end(group)], reference=key)
    for m in re.finditer(r'<(?:a|area)\b[^>]*?\bhref\s*=\s*(["\'])(.*?)\1[^>]*>|<((?:\.?\.?/|/|docs/)[^<>\s]+)>', masked, re.I):
        group = 2 if m[2] is not None else 3
        yield dict(start=m.start(), end=m.end(), targetStart=m.start(group), targetEnd=m.end(group), target=text[m.start(group):m.end(group)])


def into_move_set(file, text, moving):
    for link in clickable(text):
        path = local_path(file, link['target'])
        if path in moving:
            yield dict(link, file=file, line=text.count('\n', 0, link['targetStart']) + 1, oldPath=path)


def scan(pin, states, shard, root):
    """All pinned platform Markdown plus new files materialized by the F chain."""
    paths = set(shard.subprocess.check_output(['git', '--no-optional-locks', 'ls-tree', '-r', '--name-only', pin, '--', 'docs/platform/'], cwd=root, text=True).splitlines()) | set(states)
    moving = {r['oldPath']: r for r in shard.load(shard.P8 / 'step-05-cutover-move-set.json')['paths']}
    findings = []
    for file in sorted(paths):
        if not file.startswith('docs/platform/') or not file.endswith('.md'):
            continue
        text = states[file]['text'] if file in states else (shard.blob(pin, file) or b'').decode()
        findings.extend(dict(kind='linkIntoMoveSet', **link) for link in into_move_set(file, text, moving))
    return findings
