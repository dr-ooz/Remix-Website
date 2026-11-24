"""Vanilla Ultra Sun types for every Pokemon / form in remix-data/pokedex.json -> remix-data/vanilla_types.json.

    python tools/refresh_vanilla_types.py "<Vanilla USun romfs folder>"

Reads the untouched game's personal data (a/0/1/7) with the same form mapping as sync_personal.py, so each entry is
compared with its own vanilla slot. The DoozDex sidebar's "Type Changed" filter compares Remix types with these
(the calc's species data came from original Sweltering Sun, which already had type changes). Read-only.
"""
import json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from refresh_ability_names import garc_files  # noqa: E402
from sync_personal import FORM_MAP, personal_index  # noqa: E402

DEX = os.path.join(HERE, "..", "remix-data", "pokedex.json")
OUT = os.path.join(HERE, "..", "remix-data", "vanilla_types.json")
DEFAULT = r"D:/3ds Hacking Stuff/PackEnglishV9/PackEnglishV9/Vanilla USun/romfs"


def main(romfs):
    f = garc_files(os.path.join(romfs, "a", "0", "1", "7"))
    dex = json.load(open(DEX, encoding="utf-8"))
    seen, out = {}, {}
    for e in dex:
        num, form = e["num"], e.get("form", "")
        k = seen.get(num, 0)
        seen[num] = k + 1
        n = FORM_MAP[num][form] if num in FORM_MAP and form in FORM_MAP[num] else k
        idx = personal_index(f, num, n)
        if idx >= len(f):
            continue
        d = f[idx]
        raw = e["species"] + ("-" + form.replace(" ", "-") if form else "")
        out[raw] = [d[6]] if d[6] == d[7] else [d[6], d[7]]  # type ids (same order as the game / pokedex.json)
    json.dump(out, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=0)
    print("vanilla types:", len(out), "entries ->", os.path.normpath(OUT))


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else DEFAULT)
