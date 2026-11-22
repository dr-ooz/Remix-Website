"""Form-change move swaps from the game's code.bin -> remix-data/form_moves.json.

    python tools/refresh_form_moves.py "<Citra mods folder that holds code.bin>"

The code.bin form-change hook (CoreParam::ChangeFormNo) swaps moves when a Pokemon changes form: each table row
holds one move per form, and a move from any column turns into the new form's column. The tables:
  - a descriptor list in rodata at 0x666C40: {species u32, ncols u32, nrows u32, table address u32}, 0-terminated
    (Rotom, Sawsbuck, Shaymin, and any species added later)
  - Minior's own table at 0x5B9C44 (7 colors x 2 rows; the hook handles Minior separately)
Writes {species number: [[move per column], ...rows]}. The DoozDex sidebar uses it so a form shows the moves it can
get by changing form. Read-only on the game files.
"""
import json, os, struct, sys

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "remix-data", "form_moves.json")
BASE = 0x100000  # code.bin file offset = address - 0x100000
DESCRIPTORS = 0x666C40
MINIOR = (774, 0x5B9C44, 7, 2)


def table(b, addr, ncols, nrows):
    o = addr - BASE
    vals = struct.unpack_from("<%dH" % (ncols * nrows), b, o)
    return [list(vals[r * ncols:(r + 1) * ncols]) for r in range(nrows)]


def main(folder):
    b = open(os.path.join(folder, "code.bin"), "rb").read()
    out = {}
    o = DESCRIPTORS - BASE
    while True:
        sp, ncols, nrows, addr = struct.unpack_from("<4I", b, o)
        if not sp:
            break
        out[str(sp)] = table(b, addr, ncols, nrows)
        o += 16
    sp, addr, ncols, nrows = MINIOR
    out[str(sp)] = table(b, addr, ncols, nrows)
    json.dump(out, open(OUT, "w"), indent=1)
    print("form moves:", ", ".join(f"{k} ({len(v)} rows)" for k, v in out.items()), "->", os.path.normpath(OUT))


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else r"C:\Users\doozc\AppData\Roaming\Citra\load\mods\00040000001B5000\exefs")
