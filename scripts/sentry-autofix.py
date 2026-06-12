#!/usr/bin/env python3
"""
STP Sentry Auto-Fix Script
Usage: SENTRY_TOKEN=<token> python3 scripts/sentry-autofix.py

Fetches unresolved Sentry issues, applies safe code fixes (optional chaining,
missing React imports), commits one fix per issue, pushes, deploys backend
to Railway if server/ files changed, and marks issues resolved in Sentry.
"""
import os, re, subprocess, sys
import requests

TOKEN = os.environ.get("SENTRY_TOKEN") or sys.exit("Set SENTRY_TOKEN env var")
ORG = "stp-jb"
BASE = "https://sentry.io/api/0"
H = {"Authorization": f"Bearer {TOKEN}"}


def sget(path):
    r = requests.get(f"{BASE}{path}", headers=H, timeout=30)
    r.raise_for_status()
    return r.json()


def sput(path, data):
    r = requests.put(f"{BASE}{path}", headers={**H, "Content-Type": "application/json"}, json=data, timeout=30)
    return r.ok


def error_info(event):
    for e in event.get("entries", []):
        if e.get("type") == "exception":
            vals = e.get("data", {}).get("values", [])
            if vals:
                ex = vals[-1]
                frames = ex.get("stacktrace", {}).get("frames", [])
                return ex.get("type", ""), ex.get("value", ""), frames
    return "", "", []


def first_party_frame(frames):
    SKIP = ["node_modules", "webpack", "chunk", "<anonymous>", "native code", "eval"]
    for f in reversed(frames):
        fn = f.get("filename", "")
        if any(s in fn for s in SKIP) or fn.startswith("http"):
            continue
        if f.get("lineNo"):
            return f
    return None


def find_file(filename):
    fn = filename.replace("\\", "/")
    for pfx in ["/app/", "app/"]:
        if fn.startswith(pfx):
            fn = fn[len(pfx):]
    if os.path.exists(fn):
        return fn
    base = os.path.basename(fn)
    if not base:
        return None
    r = subprocess.run(
        ["find", ".", "-name", base,
         "-not", "-path", "*/node_modules/*",
         "-not", "-path", "*/.git/*",
         "-not", "-path", "*/dist/*"],
        capture_output=True, text=True
    )
    paths = [p.strip() for p in r.stdout.split("\n") if p.strip()]
    if not paths:
        return None
    fn_parts = fn.split("/")
    best, best_score = None, -1
    for p in paths:
        score = sum(1 for a, b in zip(reversed(fn_parts), reversed(p.split("/"))) if a == b)
        if score > best_score:
            best_score, best = score, p
    return best


def extract_prop(msg):
    for pat in [r"reading '([^']+)'", r"Cannot read property '([^']+)' of", r"evaluating '[^']*\.([^'.])+'"]:
        m = re.search(pat, msg)
        if m:
            return m.group(1)
    return None


def opt_chain_fix(content, lno, prop):
    lines = content.split("\n")
    if not (0 < lno <= len(lines)):
        return None, None
    line = lines[lno - 1]
    s = line.strip()
    if s.startswith("//") or s.startswith("*"):
        return None, None
    pat = r'(?<!\?)\.(' + re.escape(prop) + r')(?=[\s\(\[.,;:\)\]!]|$)'
    if not re.search(pat, line):
        return None, None
    new = re.sub(pat, r'?.\1', line, count=1)
    if new == line:
        return None, None
    lines[lno - 1] = new
    return "\n".join(lines), f"add optional chaining for .{prop}"


REACT_EXPORTS = {
    "useState", "useEffect", "useCallback", "useMemo", "useRef",
    "useContext", "useReducer", "useLayoutEffect", "forwardRef",
    "createContext", "Fragment", "memo", "lazy", "Suspense"
}


def ref_error_fix(content, var):
    if var not in REACT_EXPORTS:
        return None, None
    lines = content.split("\n")
    for i, line in enumerate(lines):
        m = re.match(r'import \\{([^}]+)\\} from ['\"]react['\"]\', line)
        if m:
            imports = [s.strip() for s in m.group(1).split(",")]
            if var not in imports:
                imports.append(var)
                new_imp = "{ " + ", ".join(sorted(imports)) + " }"
                lines[i] = re.sub(r'\\{[^}]+\\}', new_imp, line)
                return "\n".join(lines), f"add {var} to React imports"
    lines.insert(0, f'import {{ {var} }} from "react";')
    return "\n".join(lines), f"add missing React import for {var}"


def git_commit(path, msg):
    subprocess.run(["git", "add", path], check=True)
    r = subprocess.run(["git", "commit", "-m", msg], capture_output=True, text=True)
    if r.returncode != 0:
        subprocess.run(["git", "restore", "--staged", path])
        print(f"  Commit failed: {r.stderr.strip()}")
        return False
    return True


def main():
    subprocess.run(["git", "config", "user.email", "sentry-agent@transportplattformen.se"], check=True)
    subprocess.run(["git", "config", "user.name", "STP Sentry Agent"], check=True)

    print("=== STP Sentry Auto-Fix ===")
    try:
        issues = sget(f"/organizations/{ORG}/issues/?limit=25&query=is:unresolved&sort=date")
    except Exception as e:
        print(f"Sentry fetch failed: {e}")
        sys.exit(1)

    print(f"Found {len(issues)} unresolved issues\n")
    fixed = []
    backend_changed = False

    for issue in issues:
        iid = issue["id"]
        print(f"#{iid}: {issue['title']}")
        try:
            event = sget(f"/issues/{iid}/events/latest/")
        except Exception as e:
            print(f"  Event error: {e}, skip\n")
            continue

        etype, evalue, frames = error_info(event)
        if not etype:
            print("  No exception info, skip\n")
            continue
        print(f"  {etype}: {evalue[:100]}")

        frame = first_party_frame(frames)
        if not frame:
            print("  No first-party frame, skip\n")
            continue

        fname = frame.get("filename", "")
        lno = frame.get("lineNo", 0)
        print(f"  Frame: {fname}:{lno}")

        if any(s in fname for s in ["schema.prisma", ".env"]):
            print("  Protected file, skip\n")
            continue

        fpath = find_file(fname)
        if not fpath:
            print("  File not found in repo, skip\n")
            continue
        print(f"  Local: {fpath}")

        try:
            original = open(fpath, encoding="utf-8").read()
        except Exception as e:
            print(f"  Read error: {e}, skip\n")
            continue

        fixed_content = fix_desc = None

        if etype == "TypeError" and any(
            x in evalue for x in ["Cannot read propert", "is not an object", "undefined is not", "null is not"]
        ):
            prop = extract_prop(evalue)
            if prop:
                fixed_content, fix_desc = opt_chain_fix(original, lno, prop)

        elif etype == "ReferenceError" and "is not defined" in evalue:
            m = re.match(r"(\w+) is not defined", evalue)
            if m:
                fixed_content, fix_desc = ref_error_fix(original, m.group(1))

        if not fixed_content:
            print("  No safe fix available, skip\n")
            continue

        open(fpath, "w", encoding="utf-8").write(fixed_content)
        msg = f"fix: {fix_desc} (Sentry #{iid})"
        if git_commit(fpath, msg):
            print(f"  OK: {msg}")
            fixed.append(iid)
            if "server/" in fpath:
                backend_changed = True
        else:
            open(fpath, "w", encoding="utf-8").write(original)
        print()

    print(f"\nFixed {len(fixed)} issues: {fixed}")

    if fixed:
        r = subprocess.run(["git", "push", "origin", "main"], capture_output=True, text=True)
        if r.returncode != 0:
            print(f"Push failed: {r.stderr}")
            sys.exit(1)
        print("Pushed successfully")
        for iid in fixed:
            ok = sput(f"/issues/{iid}/", {"status": "resolved"})
            print(f"Sentry #{iid} resolved: {ok}")

    if backend_changed:
        railway_token = os.environ.get("RAILWAY_TOKEN", "")
        if railway_token:
            print("Deploying backend to Railway...")
            env = {**os.environ, "RAILWAY_TOKEN": railway_token}
            subprocess.run(["railway", "up", "--service", "nodejs"], cwd="server", env=env)
        else:
            print("Set RAILWAY_TOKEN to deploy backend")

    print("Done!")


main()
