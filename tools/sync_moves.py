"""Update remix-data/moves.json (name, type, category, power, accuracy, PP, description) straight from the game.

Usage:  python tools/sync_moves.py "<!Remix Files romfs folder>"   [--dry]
Then rebuild the calc (npm run compile).

Reads a/0/1/1 (40-byte move records: type@0, category@2, power@3, accuracy@4, PP@5), text file 118 (names) and
117 (descriptions).  Row i of moves.json is game move i ('num').  zPower is kept as it is, except when a move's
power changed: then it is set from the standard Z-move power table.  Accuracy 0 in the game = never misses = 101.
"""
import json, os, re, struct, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from refresh_move_extras import garc_files
from refresh_ability_names import text_lines

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "remix-data", "moves.json")
Z_TABLE = [(55, 100), (65, 120), (75, 140), (85, 160), (95, 175), (100, 180), (110, 185), (125, 190), (130, 195)]


def z_power(bp):
    if bp >= 140:
        return 200
    for hi, z in Z_TABLE:
        if bp <= hi:
            return z
    return 195


def main():
    romfs = sys.argv[1]
    dry = "--dry" in sys.argv
    a = os.path.join(romfs, "a", "0")
    g = garc_files(os.path.join(a, "1", "1"))[0]
    n = struct.unpack_from("<H", g, 2)[0]
    offs = [struct.unpack_from("<I", g, 4 + 4 * i)[0] for i in range(n + 1)]
    names = text_lines(garc_files(os.path.join(a, "3", "2"))[118])
    descs = text_lines(garc_files(os.path.join(a, "3", "2"))[117])
    moves = json.load(open(OUT, encoding="utf-8"))
    changed = 0
    for m in moves:
        i = m["num"]
        r = g[offs[i]:offs[i + 1]]
        new = {"name": names[i], "type": r[0], "category": r[2], "power": r[3],
               "acc": 101 if r[4] == 0 else r[4], "pp": r[5],
               "desc": re.sub(r"\s+", " ", descs[i].replace("\\n", " ").replace("\\r", " ")).strip()}
        diff = {k: (m[k], v) for k, v in new.items() if k != "desc" and m[k] != v}
        if re.sub(r"\s+", " ", m["desc"]).strip() != new["desc"]:
            diff["desc"] = (m["desc"], new["desc"])
        if diff:
            changed += 1
            print(i, new["name"], {k: v for k, v in diff.items() if k != "desc"}, "desc changed" if "desc" in diff else "")
            if not dry:
                m.update({k: v[1] for k, v in diff.items()})
                if "power" in diff and new["category"] != 0:
                    m["zPower"] = z_power(new["power"])
    if not dry:
        json.dump(moves, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
    print("moves changed:", changed)


main()
