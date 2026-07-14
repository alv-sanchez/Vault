#!/usr/bin/env python3
"""Keep every epic folder physically inside its dedicated Sprint-N/ folder.

One epic folder, one location: Build-Overview/Sprint-<N>/BMS-<epic>-<slug>/.
N = the epic's current sprint if `sprint_status: active`, else the most
recent entry in `sprint_history` (its last real touch). Read from each
folder's overview.md frontmatter, falling back to SESSION.md's "**Sprint:**"
line for scaffold-only folders that have no overview.md yet.

This SCANS both the Build-Overview root (for folders not yet organized) and
every existing Sprint-N/ folder, and `mv`s anything that isn't already in its
correct target. Utility folders (build-map, understand-*) are left alone.

Run from the Build-Overview directory:  python3 gen-sprint-folders.py
Re-run any time sprint stamps change (e.g. right after /pulse or a pickup) —
idempotent: a folder already in the right place is left untouched.
"""
import os, re, shutil

ROOT = os.path.dirname(os.path.abspath(__file__))
SKIP_DIRS = {"build-map", "understand-EPICS", "understand-QUIZ", "understand-TICKETS"}
SPRINT_DIR_RE = re.compile(r"^Sprint-(\d+)$")


def find_epic_folders():
    """Yields (current_relpath, epic_dirname) for every epic folder, wherever it is now."""
    for d in sorted(os.listdir(ROOT)):
        p = os.path.join(ROOT, d)
        if not os.path.isdir(p) or d.startswith("."):
            continue
        if SPRINT_DIR_RE.match(d):
            for e in sorted(os.listdir(p)):
                ep = os.path.join(p, e)
                if os.path.isdir(ep) and not e.startswith("."):
                    yield os.path.join(d, e), e
        elif d not in SKIP_DIRS:
            yield d, d


def read_sprint_fields(epic_dir_abs):
    """Returns (current_sprint_or_None, status, history_list)."""
    p = os.path.join(epic_dir_abs, "overview.md")
    if os.path.isfile(p):
        with open(p, encoding="utf-8") as f:
            head = f.read(2000)
        fm = head.split("---")[1] if head.startswith("---") else ""
        sprint_m = re.search(r'^sprint:\s*"?([^"\n#]+?)"?\s*(?:#.*)?$', fm, re.M)
        status_m = re.search(r'^sprint_status:\s*"?([^"\n#]+?)"?\s*(?:#.*)?$', fm, re.M)
        hist_m = re.search(r'^sprint_history:\s*(\[[^\]]*\])', fm, re.M)
        sprint = sprint_m.group(1).strip() if sprint_m else None
        status = status_m.group(1).strip() if status_m else None
        history = []
        if hist_m:
            history = [s.strip().strip('"\'') for s in hist_m.group(1).strip("[]").split(",") if s.strip()]
        if sprint and sprint.upper() not in ("TBD", "NONE"):
            return sprint, status, history
        return None, status, history
    sp = os.path.join(epic_dir_abs, "SESSION.md")
    if os.path.isfile(sp):
        with open(sp, encoding="utf-8") as f:
            text = f.read(1500)
        m = re.search(r'\*\*Sprint:\*\*\s*(.+)', text)
        if m:
            line = m.group(1).strip()
            if re.search(r'dormant', line, re.I):
                return None, "dormant", []
            sm = re.match(r'([^(—-]+)', line)
            return (sm.group(1).strip() if sm else line), "active", []
    return None, None, []


def sprint_num(name):
    if not name:
        return None
    m = re.search(r'(\d+)', name)
    return int(m.group(1)) if m else None


def target_sprint_dir(epic_dir_abs):
    sprint, status, history = read_sprint_fields(epic_dir_abs)
    if sprint and status != "dormant":
        n = sprint_num(sprint)
        if n is not None:
            return f"Sprint-{n}"
    hist_nums = [n for n in (sprint_num(h) for h in history) if n is not None]
    if hist_nums:
        return f"Sprint-{max(hist_nums)}"
    return None  # no sprint data at all — leave wherever it is


def main():
    moved, unresolved = 0, []
    for current_rel, epic_name in list(find_epic_folders()):
        epic_dir_abs = os.path.join(ROOT, current_rel)
        target = target_sprint_dir(epic_dir_abs)
        if target is None:
            unresolved.append(epic_name)
            continue
        current_sprint_dir = os.path.dirname(current_rel) if os.sep in current_rel else ""
        if current_sprint_dir == target:
            continue
        dest_dir = os.path.join(ROOT, target)
        os.makedirs(dest_dir, exist_ok=True)
        dest_path = os.path.join(dest_dir, epic_name)
        if os.path.exists(dest_path):
            print(f"⚠ skip {epic_name}: {dest_path} already exists — resolve manually")
            continue
        shutil.move(epic_dir_abs, dest_path)
        print(f"moved {epic_name}: {current_sprint_dir or '(root)'} → {target}")
        moved += 1

    # Prune any now-empty Sprint-N folders.
    for d in sorted(os.listdir(ROOT)):
        p = os.path.join(ROOT, d)
        if SPRINT_DIR_RE.match(d) and os.path.isdir(p) and not os.listdir(p):
            os.rmdir(p)
            print(f"removed empty {d}/")

    print(f"{moved} folder(s) moved." + (f" No sprint data for: {', '.join(unresolved)} — left in place." if unresolved else ""))


if __name__ == "__main__":
    main()
