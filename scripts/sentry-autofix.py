#!/usr/bin/env python3
"""
STP Sentry Auto-Fix
Usage: cd /path/to/STP && SENTRY_TOKEN=<token> python3 scripts/sentry-autofix.py

Hämtar olösta Sentry-issues, tillämpar säkra kodfixar (optional chaining,
saknade React-importer) på en NY BRANCH och öppnar en PR för granskning.

VIKTIGT — pushar ALDRIG till main, deployar ALDRIG, resolvar ALDRIG Sentry
automatiskt. Tidigare gjorde skriptet allt detta direkt, vilket orsakade tyst
divergens mot lokal main och maskerade fel. En människa granskar PR:en, mergar
och deployar med scripts/deploy.sh. Kräver `gh` CLI authenticerad för PR.
"""
import os, re, subprocess, sys, time
import requests

TOKEN = os.environ.get("SENTRY_TOKEN") or sys.exit("Sätt SENTRY_TOKEN miljövariabel")
ORG = "stp-jb"
BASE = "https://sentry.io/api/0"
H = {"Authorization": f"Bearer {TOKEN}"}


def sget(path):
    r = requests.get(f"{BASE}{path}", headers=H, timeout=30)
    r.raise_for_status()
    return r.json()


def sput(path, data):
    r = requests.put(
        f"{BASE}{path}",
        headers={**H, "Content-Type": "application/json"},
        json=data, timeout=30
    )
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
    for pat in [
        r"reading '([^']+)'",
        r"Cannot read property '([^']+)' of",
        r"evaluating '[^']*\.([^'.]+)'"
    ]:
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
        m = re.match(r"import \{([^}]+)\} from ['\"]react['\"]", line)
        if m:
            imports = [s.strip() for s in m.group(1).split(",")]
            if var not in imports:
                imports.append(var)
                new_imp = "{ " + ", ".join(sorted(imports)) + " }"
                lines[i] = re.sub(r'\{[^}]+\}', new_imp, line)
                return "\n".join(lines), f"add {var} to React imports"
    lines.insert(0, f'import {{ {var} }} from "react";')
    return "\n".join(lines), f"add missing React import for {var}"


def git_commit(path, msg):
    subprocess.run(["git", "add", path], check=True)
    r = subprocess.run(["git", "commit", "-m", msg], capture_output=True, text=True)
    if r.returncode != 0:
        subprocess.run(["git", "restore", "--staged", path])
        print(f"  Commit misslyckades: {r.stderr.strip()}")
        return False
    return True


def main():
    subprocess.run(["git", "config", "user.email", "sentry-agent@transportplattformen.se"], check=True)
    subprocess.run(["git", "config", "user.name", "STP Sentry Agent"], check=True)

    # Jobba på en NY branch från senaste main — aldrig direkt på main.
    subprocess.run(["git", "fetch", "origin", "main"], check=True)
    branch = f"autofix/sentry-{int(time.time())}"
    co = subprocess.run(["git", "checkout", "-b", branch, "origin/main"], capture_output=True, text=True)
    if co.returncode != 0:
        sys.exit(f"Kunde inte skapa branch {branch}: {co.stderr}")
    print(f"Arbetsbranch: {branch} (från origin/main)")

    print("=== STP Sentry Auto-Fix ===")
    try:
        issues = sget(f"/organizations/{ORG}/issues/?limit=25&query=is:unresolved&sort=date")
    except Exception as e:
        print(f"Sentry-hämtning misslyckades: {e}")
        sys.exit(1)

    print(f"Hittade {len(issues)} olösta issues\n")
    fixed = []
    backend_changed = False

    for issue in issues:
        iid = issue["id"]
        print(f"#{iid}: {issue['title']}")
        try:
            event = sget(f"/issues/{iid}/events/latest/")
        except Exception as e:
            print(f"  Händelse-fel: {e}, hoppar\n")
            continue

        etype, evalue, frames = error_info(event)
        if not etype:
            print("  Ingen exceptioninfo, hoppar\n")
            continue
        print(f"  {etype}: {evalue[:100]}")

        frame = first_party_frame(frames)
        if not frame:
            print("  Ingen first-party frame, hoppar\n")
            continue

        fname = frame.get("filename", "")
        lno = frame.get("lineNo", 0)
        print(f"  Frame: {fname}:{lno}")

        if any(s in fname for s in ["schema.prisma", ".env"]):
            print("  Skyddad fil, hoppar\n")
            continue

        fpath = find_file(fname)
        if not fpath:
            print("  Fil ej funnen i repot, hoppar\n")
            continue
        print(f"  Lokal sökväg: {fpath}")

        try:
            original = open(fpath, encoding="utf-8").read()
        except Exception as e:
            print(f"  Läsfel: {e}, hoppar\n")
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
            print("  Ingen säker fix hittad, hoppar\n")
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

    print(f"\nFixade {len(fixed)} issues: {fixed}")

    if not fixed:
        print("Inga fixar — ingen branch pushas, ingen PR skapas.")
        print("Klar!")
        return

    # Pusha BRANCHEN (aldrig main) och öppna PR. Deployar INTE, resolvar INTE Sentry.
    push = subprocess.run(["git", "push", "-u", "origin", branch], capture_output=True, text=True)
    if push.returncode != 0:
        print(f"Push av branch misslyckades: {push.stderr}")
        sys.exit(1)
    print(f"Branch pushad: {branch}")

    body = (
        "Automatiska säkra fixar (optional chaining / saknade React-importer) från "
        "`scripts/sentry-autofix.py`.\n\n"
        + "\n".join(f"- Sentry #{iid}" for iid in fixed)
        + "\n\nGranska, merga och deploya sedan med `scripts/deploy.sh`. "
        "Sentry-issues markeras INTE som resolved automatiskt — gör det efter verifierad deploy."
    )
    pr = subprocess.run(
        ["gh", "pr", "create", "--base", "main", "--head", branch,
         "--title", f"Sentry auto-fix: {len(fixed)} issue(s)", "--body", body],
        capture_output=True, text=True,
    )
    print((pr.stdout or pr.stderr).strip())
    if pr.returncode != 0:
        print("PR kunde inte skapas automatiskt (är gh authenticerad?). "
              f"Skapa den manuellt från branchen {branch}.")
    print("INGEN deploy, INGEN auto-resolve. Granska PR och deploya manuellt. Klar!")


if __name__ == "__main__":
    main()
