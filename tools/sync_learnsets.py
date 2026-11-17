"""Update the level-up part of remix-data/learnsets.json straight from the game's learnset GARC (a/0/1/3).

Usage:  python tools/sync_learnsets.py "<romfs folder>"   (the !Remix Files romfs is the master copy)
Then rebuild the sidebar (npm run build in doozdex-sidebar) / the calc.

Row i of learnsets.json belongs to pokedex.json entry i (same form mapping as sync_personal.py).
Entries are [move index, level] (move index = game move id - 1, the extractor's format);
TM / tutor entries ([move index, "tm"|"tutor"...]) are kept as they are.
"""
import json, os, struct, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from refresh_ability_names import garc_files
from sync_personal import FORM_MAP, personal_index

DATA = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "remix-data")


def levelup(f, idx):
    out, d = [], f[idx]
    for k in range(0, len(d) - 3, 4):
        mv, lv = struct.unpack_from("<hh", d, k)
        if mv == -1:
            break
        out.append([mv - 1, lv])
    return out


def main(romfs):
    pers = garc_files(os.path.join(romfs, "a", "0", "1", "7"))
    learn = garc_files(os.path.join(romfs, "a", "0", "1", "3"))
    dex = json.load(open(os.path.join(DATA, "pokedex.json"), encoding="utf-8"))
    path = os.path.join(DATA, "learnsets.json")
    rows = json.load(open(path, encoding="utf-8"))
    rows += [[] for _ in range(len(dex) - len(rows))]
    seen, changed = {}, 0
    for i, e in enumerate(dex):
        num, form = e["num"], e.get("form", "")
        k = seen.get(num, 0)
        seen[num] = k + 1
        n = FORM_MAP[num][form] if num in FORM_MAP and form in FORM_MAP[num] else k
        new = levelup(learn, personal_index(pers, num, n)) + [x for x in (rows[i] or []) if not isinstance(x[1], int)]
        if new != rows[i]:
            changed += 1
        rows[i] = new
    json.dump(rows, open(path, "w", encoding="utf-8"), separators=(",", ":"))
    print("learnsets.json: %d rows, %d updated from the game's level-up data" % (len(rows), changed))


if __name__ == "__main__":
    main(sys.argv[1])
