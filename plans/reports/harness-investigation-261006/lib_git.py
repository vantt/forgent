import subprocess
def git(*a):
    return subprocess.run(['git','-C','/home/vantt/projects/forgentX',*a],capture_output=True,text=True,check=True).stdout
def added_md():
    """yield (date, sha, subject, path) for every .md file ADDED in history (A status, renames excluded -> counted as new path via R? use --no-renames)"""
    out=git('log','--no-renames','--diff-filter=A','--name-only','--format=@@%H|%aI|%s','--','*.md')
    rows=[];cur=None
    for l in out.splitlines():
        if l.startswith('@@'):
            h,d,s=l[2:].split('|',2);cur=(h,d,s)
        elif l.strip() and cur:
            rows.append((cur[1],cur[0],cur[2],l.strip()))
    return rows
def tracked_md():
    return [p for p in git('ls-files','*.md').split('\n') if p]
