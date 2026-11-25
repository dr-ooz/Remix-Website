"""Bring every in-game text edit (ability / item / move names and descriptions) onto the website, automatically.

    python tools/sync_game_text.py            (only does anything when the game text changed since the last run)
    python tools/sync_game_text.py --force

Source = the !Remix Files romfs (pk3DS's working copy). Runs on every site build (`node build view` / `node build`):
it fingerprints the game's text archive (a/0/3/2) and, when that changed, refreshes:
  abilities.json, item_names/item_descs.json, moves.json (names, descriptions...), move blurbs,
  signature item holders (read from the item descriptions), the calc's generated data (+ compiles the calc),
  the boss guide's item text, and the DoozDex sidebar's data.
If the Remix Files folder isn't there (another PC), it does nothing and the build carries on.
"""
import hashlib, os, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, ".."))
ROMFS = r"D:/3ds Hacking Stuff/PackEnglishV9/PackEnglishV9/!Remix Files/romfs"
STAMP = os.path.join(ROOT, "remix-data", ".game_text_stamp")
WATCH = [os.path.join("a", "0", "3", "2"), os.path.join("a", "0", "1", "1")]  # text + move data (blurbs)


def fingerprint():
    h = hashlib.md5()
    for rel in WATCH:
        p = os.path.join(ROMFS, rel)
        with open(p, "rb") as f:
            for b in iter(lambda: f.read(1 << 22), b""):
                h.update(b)
    return h.hexdigest()


def run(cmd):
    print("  >", " ".join(os.path.basename(c) if i < 2 else c for i, c in enumerate(cmd)))
    r = subprocess.run(cmd, cwd=ROOT)
    if r.returncode:
        raise SystemExit("game text sync: step failed: " + " ".join(cmd))


def main():
    if not os.path.isdir(ROMFS):
        print("game text sync: Remix Files not found, skipped")
        return
    fp = fingerprint()
    old = open(STAMP).read().strip() if os.path.exists(STAMP) else ""
    if fp == old and "--force" not in sys.argv:
        print("game text sync: no in-game text changes")
        return
    print("game text sync: in-game text changed, updating the website data")
    py, node = sys.executable, "node"
    run([py, "tools/refresh_ability_names.py", ROMFS])
    run([py, "tools/refresh_item_names.py", ROMFS])
    run([py, "tools/sync_moves.py", ROMFS])
    run([py, "tools/refresh_move_extras.py", ROMFS])  # trapping, contact, priority, hits... from the move data
    run([py, "tools/build_move_blurbs.py", ROMFS])
    run([py, "tools/build_signature_items.py"])
    run([node, "tools/build_remix_items.js"])
    run([node, "tools/build_remix_species.js"])
    run([node, "tools/build_remix_moves.js"])
    run([node, "tools/build_remix_trainers.js"])
    npm = "npm.cmd" if os.name == "nt" else "npm"
    run([npm, "--prefix", "calc", "run", "compile"])  # the calc's own TypeScript (installed inside calc/)
    # the sidebar's full build (its data + its code: the signature item list is built into the code, not loaded)
    run([npm, "--prefix", "doozdex-sidebar", "run", "build"])
    open(STAMP, "w").write(fp)
    print("game text sync: done")


if __name__ == "__main__":
    main()
