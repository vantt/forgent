"""Guard 3's local links over the composed tree, with source coordinates.

Code stays literal except the document's Related metadata (the same population
as check-doc-candidate-status.relatedPaths). Anchors delegate to listAnchors,
which uses the unit extractor; no copied slug algorithm or patch engine.
"""
import html
import json
import posixpath
import re
import subprocess
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
    if value.scheme or value.netloc:
        return None
    if not value.path:
        return file if value.fragment else None
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
    for m in re.finditer(r'(?<!\\)\[(?:\\.|[^\]\\])*\]\(\s*(?:' + destination + r')(?:\s+["\'][^\n]*?["\'])?\s*\)', masked):
        group = 1 if m[1] is not None else 2
        occupied.append(m.span())
        yield dict(start=m.start(), end=m.end(), targetStart=m.start(group), targetEnd=m.end(group), target=text[m.start(group):m.end(group)])
    used = set()
    for m in re.finditer(r'(?<!\\)\[([^\]\n]+)\](?:\[([^\]\n]*)\])?', masked):
        if any(a <= m.start() < b for a, b in occupied + definition_spans):
            continue
        key = ' '.join((m[2] or m[1]).split()).casefold()
        if key in definitions and key not in used:
            used.add(key)
            definition, group = definitions[key]
            yield dict(start=definition.start(), end=definition.end(), targetStart=definition.start(group), targetEnd=definition.end(group), target=text[definition.start(group):definition.end(group)], reference=key)
    for m in re.finditer(r'<[A-Za-z][\w:-]*\b[^>]*?\bhref\s*=\s*(["\'])(.*?)\1[^>]*>|<((?:\.?\.?/|/|docs/)[^<>\s]+)>', masked, re.I):
        if any(a <= m.start() < b for a, b in occupied + definition_spans) or re.fullmatch(r'</[A-Za-z][\w:-]*\s*>', m[0]):
            continue  # Neither a nested <destination> nor an HTML closing tag is an autolink.
        group = 2 if m[2] is not None else 3
        yield dict(start=m.start(), end=m.end(), targetStart=m.start(group), targetEnd=m.end(group), target=text[m.start(group):m.end(group)])


def into_move_set(file, text, moving):
    for link in clickable(text):
        path = local_path(file, link['target'])
        if path in moving:
            yield dict(link, file=file, line=text.count('\n', 0, link['targetStart']) + 1, oldPath=path)


def related(text):
    """Coordinate-preserving equivalent of headerBlock + relatedPaths."""
    header = re.search(r'^# .+\n+```txt\n([\s\S]*?)\n```', text, re.M)
    if not header:
        return
    lines = re.finditer(r'[^\n]*(?:\n|$)', header[1])
    active = False
    for line in lines:
        value = re.match(r'Related:\s*(.*)', line[0]) if not active else re.match(r'\s*-\s+(.+)', line[0])
        if not value:
            if active:
                break
            continue
        active = True
        token = re.match(r'`([^`]+)`|([^\s]+)', value[1])
        if not token:
            continue
        group = 1 if token[1] is not None else 2
        target = token[group].rstrip(',;')
        if ('/' not in target and not re.search(r'\.md$', target)) or '*' in target or re.match(r'^[a-z][a-z0-9+.-]*:', target, re.I):
            continue
        start = header.start(1) + line.start() + value.start(1) + token.start(group)
        yield dict(start=start, end=start + len(target), targetStart=start,
                   targetEnd=start + len(target), target=target, related=True)


def tree(pin, states, shard, root):
    """Post-F files only: pin objects, minus moves/removals, plus composed bytes."""
    paths = set(subprocess.check_output(['git', '--no-optional-locks', 'ls-tree', '-r', '--name-only', pin], cwd=root, text=True).splitlines())
    moving = {r['oldPath']: r for r in shard.load(shard.P8 / 'step-05-cutover-move-set.json')['paths']}
    paths = (paths - set(moving)) | set(states)
    cache = {file: state['text'] for file, state in states.items()}
    def read(file):
        if file not in cache:
            cache[file] = (shard.blob(pin, file) or b'').decode('utf-8', errors='replace')
        return cache[file]
    return paths, moving, read


def anchor_index(contents, root):
    """Batch the owning extractor, including its accepted GitHub heading slugs."""
    script = '''import {listAnchors} from './scripts/list-doc-anchors.mjs';
let input = ''; for await (const chunk of process.stdin) input += chunk;
const result = Object.fromEntries(Object.entries(JSON.parse(input)).map(([file, text]) =>
  [file, [...new Set(listAnchors(text).flatMap(a => [a.anchor, a.githubSlug]).filter(Boolean))]]));
process.stdout.write(JSON.stringify(result));'''
    result = subprocess.run(['node', '--no-addons', '--input-type=module', '-e', script],
        cwd=root, input=json.dumps(contents), text=True, capture_output=True, check=True)
    return json.loads(result.stdout)


def population(pin, states, shard, root):
    paths, moving, read = tree(pin, states, shard, root)
    directories = {path[:i] for path in paths for i, c in enumerate(path) if c == '/'}
    existing = paths | directories
    links = []
    for file in sorted(paths):
        if not file.startswith('docs/platform/') or not file.endswith('.md'):
            continue
        text = read(file)
        for link in [*clickable(text), *related(text)]:
            path = local_path(file, link['target'])
            if path is None:
                continue
            if link.get('related') and link['target'].split('#')[0] in existing:
                path = link['target'].split('#')[0]
            fragment = unquote(urlsplit(html.unescape(link['target'])).fragment)
            links.append(dict(link, file=file, line=text.count('\n', 0, link['targetStart']) + 1,
                              oldPath=path, fragment=fragment))
    anchors = anchor_index({link['oldPath']: read(link['oldPath']) for link in links
                            if link['fragment'] and link['oldPath'] in paths}, root)
    for link in links:
        path = link['oldPath']
        if path not in existing:
            link['reason'] = 'moved-target' if path in moving else 'missing-file'
        elif link['fragment'] and link['fragment'] not in anchors.get(path, []):
            link['reason'] = 'missing-anchor'
    return links


def scan(pin, states, shard, root):
    return [dict(kind='linkGuard', **link) for link in population(pin, states, shard, root) if 'reason' in link]
