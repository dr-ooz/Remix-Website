"""Update remix-data/pokedex.json (types, base stats, abilities) straight from the game's personal data.

Usage:  python tools/sync_personal.py "<Citra mods romfs folder>"
Then rebuild the calc (npm run compile).

pokedex.json lists each species' forms in game order, so the k-th entry of a species is personal form k.
The extractor skips forms that share a name, so a few species need their forms mapped by name (FORM_MAP),
and forms it never lists are added (ADD_FORMS).
"""
import json, os, struct, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from refresh_ability_names import garc_files

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "remix-data", "pokedex.json")

# species number -> {extractor form name ("" = base): personal form number}
FORM_MAP = {
    150: {"": 0, "Mega-Y": 2},                     # Mewtwo (form 1 = Mega X, removed)
    658: {"": 0, "Ash": 2},                       # Greninja (form 1 = Battle Bond copy)
    670: {"": 0, "Eternal": 5},                   # Floette (forms 1-4 = colours)
    711: {"": 0, "Small": 1, "Large": 2, "Super": 3},  # Gourgeist
    718: {"50%": 0, "10%": 1, "Core": 2, "Complete": 4},  # Zygarde (form 3 = 50% that can go Complete)
    774: {"": 0, "Red": 7, "Orange": 8, "Yellow": 9, "Green": 10, "Blue": 11, "Indigo": 12, "Violet": 13},  # Minior
}
# forms the extractor doesn't list: (species name, number, form name)
ADD_FORMS = [("Mewtwo", 150, ""), ("Mewtwo", 150, "Mega-Y"), ("Gourgeist", 711, ""), ("Gourgeist", 711, "Large"), ("Zygarde", 718, "Core"), ("Zygarde", 718, "Complete")]


def personal_index(f, num, form):
    if form == 0:
        return num
    return struct.unpack_from("<H", f[num], 0x1C)[0] + form - 1


def read(f, idx):
    d = f[idx]
    hp, at, df, sp, sa, sd = d[0:6]
    abilities = []
    for x in d[0x18:0x1B]:  # ability ids; pokedex.json uses id - 1 (index into abilities.json)
        if x and (x - 1) not in abilities:
            abilities.append(x - 1)
    return {"types": [d[6]] if d[6] == d[7] else [d[6], d[7]],
            "baseStats": [hp, at, df, sa, sd, sp], "abilities": abilities}


def main(romfs):
    f = garc_files(os.path.join(romfs, "a", "0", "1", "7"))
    dex = json.load(open(OUT, encoding="utf-8"))
    have = {(e["num"], e.get("form", "")) for e in dex}
    for name, num, form in ADD_FORMS:
        if (num, form) not in have:
            e = {"species": name, "num": num}
            if form:
                e["form"] = form
            dex.append(e)
    seen, changed = {}, 0
    for e in dex:
        num, form = e["num"], e.get("form", "")
        k = seen.get(num, 0)
        seen[num] = k + 1
        n = FORM_MAP[num][form] if num in FORM_MAP and form in FORM_MAP[num] else k
        new = read(f, personal_index(f, num, n))
        if any(e.get(key) != val for key, val in new.items()):
            changed += 1
        e.update(new)
    json.dump(dex, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
    print("pokedex.json: %d entries, %d updated from personal data" % (len(dex), changed))


if __name__ == "__main__":
    main(sys.argv[1])
