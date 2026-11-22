"""Evolution levels from the game's evolution table (a/0/1/4) -> remix-data/evo_levels.json.

    python tools/refresh_evo_levels.py "<Citra mods romfs folder>"

Writes {species number: level it evolves at} for every species that evolves by level (the lowest level when it
has several). The DoozDex sidebar uses it to pick which family member's level a "who learns this move" row shows.
Read-only on the game files.
"""
import json, os, struct, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from refresh_move_extras import garc_files  # noqa: E402

OUT = os.path.join(HERE, "..", "remix-data", "evo_levels.json")


def main(romfs):
    files = garc_files(os.path.join(romfs, "a", "0", "1", "4"))
    out = {}
    for sp, b in enumerate(files):
        levels = []
        for i in range(len(b) // 8):
            method, arg, target, form, level = struct.unpack_from("<HHHbB", b, i * 8)
            if method and target and level:  # level-based evolutions carry their level here
                levels.append(level)
        if levels and sp:
            out[str(sp)] = min(levels)
    json.dump(out, open(OUT, "w"), indent=0, sort_keys=True)
    print("evo levels:", len(out), "species ->", os.path.normpath(OUT))


if __name__ == "__main__":
    main(sys.argv[1])
