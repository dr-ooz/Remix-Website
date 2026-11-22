"""Builds the DoozDex sidebar's data from the calc's own files, so the sidebar
shows exactly what the calc uses (no live download, works offline).

Run after `vite build` (it empties the output folder). `npm run build` does both.

In:  ../remix-data/pokedex.json, moves.json, abilities.json, species_renames.json
     ../remix-data/learnsets.json (extractor; row i = pokedex entry i)
     ../dist/img/pokesprite/*.png (the calc's minisprites)
Out: ../src/doozdex-sidebar/data.json   (Alia's {pokedex, moves, sheetId} format + spriteW)
     ../src/doozdex-sidebar/calcsprites/<id>.png  (minisprites cropped to their visible width)
"""
import json
import os
import re
import unicodedata

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
CALC = os.path.dirname(HERE)
DATA = os.path.join(CALC, "remix-data")
OUT = os.path.join(CALC, "src", "doozdex-sidebar")
SPRITES_IN = os.path.join(CALC, "dist", "img", "pokesprite")
SPRITES_OUT = os.path.join(OUT, "calcsprites")

TYPES = ["Normal", "Fighting", "Flying", "Poison", "Ground", "Rock", "Bug", "Ghost", "Steel",
         "Fire", "Water", "Grass", "Electric", "Psychic", "Ice", "Dragon", "Dark", "Fairy"]
CATEGORIES = ["Status", "Physical", "Special"]


def read(name):
    with open(os.path.join(DATA, name), encoding="utf8") as f:
        return json.load(f)


def to_id(name):
    """Exactly Alia's nameToId: lowercase, then drop anything not a-z/0-9
    (so "Flabébé" -> "flabb", same as the sidebar computes it)."""
    return re.sub(r"[^a-z0-9]+", "", name.lower())


def sprite_file(name):
    """Port of remixSpriteFile() in src/js/remix_minisprite.js."""
    n = name.lower()
    n = re.sub(r"[ _]+", "-", n)
    n = re.sub(r"[.’':%]", "", n)
    n = n.replace("minior-pink", "minior-red").replace("dusk-mane", "dusk").replace("dawn-wings", "dawn").replace("-totem", "")
    n = "".join(c for c in unicodedata.normalize("NFD", n) if not unicodedata.combining(c))
    return {"aegislash-shield": "aegislash", "vivillon-pokeball": "vivillon-poke-ball",
            "minior-meteor": "minior", "starvia": "staravia"}.get(n, n)


dex = read("pokedex.json")
learnsets = read("learnsets.json")
moves_raw = read("moves.json")
move_effects = read("move_effects.json")
abilities = [str(a[0]).replace("’", "'") for a in read("abilities.json")]
renames = read("species_renames.json")
# Matched loosely (letters/digits only), like the calc does: "NidoranF" = "Nidoran-F".
removed = {to_id(n) for n in renames.get("remove", [])}
rename_by_id = {to_id(k): v for k, v in renames.get("rename", {}).items()}


def renamed(raw):
    return rename_by_id.get(to_id(raw), raw)


# Not shown in the sidebar at all.
SKIP = {"gourgeist", "gourgeistlarge", "mimikyubusted"}  # Gourgeist: only Small + Super
# Kept in the calc (boss fights) but not listed in the sidebar (unusable): final names after renames.
SIDEBAR_HIDE = {"giratina", "giratinaorigin", "necrozmadawnwings", "necrozmaduskmane", "necrozmaultra", "mewtwomega"}

# Base forms that should still show their form name.
FORM_LABEL = {"oricorio": "Baile", "lycanroc": "Midday"}

# Calc sprite files whose names don't follow the usual pattern.
SPRITE_ALIAS = {"nidoranf": "nidoran-f", "nidoranm": "nidoran-m", "basculinblue": "basculin-blue-striped",
                "zygarde50": "zygarde", "mimikyubusted": "mimikyu", "mimikyubustedtotem": "mimikyu",
                # seasonal mons: Summer is the default picture
                "deerling": "deerling-summer", "sawsbuck": "sawsbuck-summer"}

# Moves, keyed by id like the extension.
HIDDEN_MOVES = {"Arm Thrust", "Swallow", "Ally Switch", "Mirror Move", "Snatch", "Secret Power", "Metronome"}
moves, move_id_by_num = {}, {}
for m in moves_raw:
    # retired / unused moves aren't shown (OLD Comet Punch = the old slot; the rest are Dooz's unused list)
    if not m.get("name") or m["name"].startswith("OLD ") or m["name"] in HIDDEN_MOVES:
        continue
    mid = to_id(m["name"])
    move_id_by_num[m["num"]] = mid
    move = {"num": m["num"], "name": m["name"], "type": TYPES[m["type"]],
            "category": CATEGORIES[m["category"]], "power": m["power"], "acc": m["acc"],
            "pp": m["pp"], "desc": m.get("desc", "")}
    if m.get("zPower"):
        move["zPower"] = m["zPower"]
    # moves that use the higher attacking stat (Grass Knot, Gold Rush, ...) show both category icons
    if move["category"] != "Status" and ((move_effects.get(m["name"]) or {}).get("remix") or {}).get("useHigherStat"):
        move["mixed"] = True
    moves[mid] = move

# Pokemon. Raw name = the game's species + form; the calc renames some of them.
raw_names = [d["species"] + ("-" + d["form"].replace(" ", "-") if d.get("form") else "") for d in dex]
pokedex = {}
os.makedirs(SPRITES_OUT, exist_ok=True)
sprites_done = 0


def save_sprite(pid, p, file_name):
    """Calc minisprite cropped to its visible pixels left-to-right (full height
    kept so feet stay aligned). The sidebar centres it and slides it left."""
    global sprites_done
    src = os.path.join(SPRITES_IN, file_name + ".png")
    if not os.path.exists(src):
        return
    img = Image.open(src).convert("RGBA")
    box = img.getbbox()
    if box and img.height != 30:
        # Odd canvas (season forms are 68x56): cut a 30px-tall strip with the
        # feet on the same line as the normal 40x30 sprites (row 28).
        top = box[3] - 28
        img = img.crop((0, top, img.width, top + 30))
        box = img.getbbox()
    if box:
        img = img.crop((box[0], 0, box[2], img.height))
        # Outlines: most icons use dark grey 33,33,33, but imported sprites (season forms) and some
        # of the game's own icons (Pachirisu 0,0,8; Arbok 8,8,8; Beedrill 0,8,16...) use near-black.
        # Any near-black pixel becomes the standard grey so every outline matches.
        img.putdata([(33, 33, 33, a) if a and max(r, g, b) <= 20 else (r, g, b, a) for r, g, b, a in img.getdata()])
        img.save(os.path.join(SPRITES_OUT, pid + ".png"), optimize=True)
        p["spriteW"] = box[2] - box[0]
        p["spriteY"] = [box[1], box[3]]  # visible rows (top, bottom) of the 30px-tall sprite
        sprites_done += 1


# Forms the calc adds itself (calc/src/data/species.ts), living in borrowed
# personal slots once the game data is written there:
#   Mega Latios slot   -> Sandy Castform, once it is Flying type
#   Alolan Rattata slot -> Georupt-Steam, once it is Fire or Water type
def slot_form(raw, types):
    if to_id(raw) == "latiosmega" and "Flying" in types:
        return "Castform-Sandy"
    if to_id(raw) == "rattataalola" and ("Fire" in types or "Water" in types):
        return "Geodude-Steam"
    return raw


for i, d in enumerate(dex):
    if not d.get("species"):
        continue
    types = list(dict.fromkeys(TYPES[t] for t in d["types"]))
    raw = slot_form(raw_names[i], types)
    if to_id(raw) in removed:
        continue
    name = renamed(raw)
    if "Totem" in name:
        continue  # no Totem forms (judged by the final name: Raticate-Mega was a Totem slot)
    pid = to_id(name)
    if pid in pokedex or pid in SKIP or pid in SIDEBAR_HIDE:
        continue  # first entry wins (duplicate form slots)
    p = {"num": d["num"], "name": name, "types": types, "baseStats": d["baseStats"],
         "abilities": list(dict.fromkeys(abilities[a] for a in d["abilities"] if a < len(abilities) and abilities[a]))}
    if "-" in name and (name != raw or raw != raw_names[i]):
        # Renamed / slot forms (Georupt-Magma, Persian-Mega, Castform-Sandy...) show as name + small (Form).
        p["baseSpecies"], p["form"] = name.split("-", 1)
    elif name != raw:
        pass  # renamed to a whole new name (Shellos-East -> Neurego): its own species, like in the calc
    elif d.get("form"):
        p["baseSpecies"], p["form"] = d["species"], d["form"]
    elif pid in FORM_LABEL:
        p["baseSpecies"], p["form"] = d["species"], FORM_LABEL[pid]
    if to_id(raw) != pid and name not in renames.get("noOldNameSearch", []):
        p["oldNames"] = [raw]  # the game's own name, so searching it still finds the renamed mon
    if d.get("prevo") is not None:
        p["prevo"] = renamed(raw_names[d["prevo"]])
    if d.get("evos"):
        p["evos"] = [renamed(raw_names[e]) for e in d["evos"]]
    # learnsets.json stores move INDEXES (0-based); moves.json "num" is the game's move id (index + 1)
    p["learntMoves"] = [[move_id_by_num[mv + 1], how] for mv, how in ((learnsets[i] if i < len(learnsets) else None) or [])
                        if mv + 1 in move_id_by_num]
    pokedex[pid] = p
    save_sprite(pid, p, SPRITE_ALIAS.get(to_id(raw), sprite_file(raw)))

# Not written into the game slots yet: use the calc's stand-ins.
EXTRA = [
    # (new id, name, copy stats/abilities/moves from, types, abilities or None, sprite file)
    ("castformsandy", "Castform-Sandy", "castformsnowy", ["Flying", "Rock"], ["Forecast"], "castform-sandy"),
    ("georuptsteam", "Georupt-Steam", "georuptmagma", ["Fire", "Water"], None, "geodude-steam"),
    # Burmy's cloaks share one personal entry in the game
    ("burmysand", "Burmy-Sand", "burmyplant", None, None, "burmy-sandy"),
    ("burmysnow", "Burmy-Snow", "burmyplant", None, None, "burmy-trash"),
]
for pid, name, src_id, types, abil, sprite in EXTRA:
    if pid in pokedex or src_id not in pokedex:
        continue
    src = pokedex[src_id]
    p = {"num": src["num"], "name": name, "types": types or list(src["types"]), "baseStats": list(src["baseStats"]),
         "abilities": abil or list(src["abilities"]), "learntMoves": list(src["learntMoves"])}
    p["baseSpecies"], p["form"] = name.split("-", 1)
    pokedex[pid] = p
    save_sprite(pid, p, sprite)


# Megas and battle forms (Charizard-Mega-X, Castform-Rainy, Kyurem-White...) have no learnset of their
# own in the data; in the game they use the base form's moves, so show those.
for p in pokedex.values():
    if not p.get("learntMoves"):
        # same species only: a form of it (shares its base name), never a renamed mon in its slot (Vitabeat)
        base = p.get("baseSpecies") or p["name"]
        src = next((q for q in pokedex.values() if q["num"] == p["num"] and q.get("learntMoves")
                    and (q.get("baseSpecies") or q["name"]).split("-")[0] == base.split("-")[0]), None)
        if src:
            p["learntMoves"] = list(src["learntMoves"])

# Remix dex order (remix-data/dex_order.json, from the dex order board): dexOrder = position,
# family = family index, so the list can sort by it and draw a line between families.
order_path = os.path.join(CALC, "remix-data", "dex_order.json")
if os.path.exists(order_path):
    with open(order_path, encoding="utf8") as f:
        fams = json.load(f)["main"]["families"]
    by_id = {to_id(p["name"]): pid for pid, p in pokedex.items()}
    n = 0
    for fi, fam in enumerate(fams):
        for name in fam["members"]:
            pid = by_id.get(to_id(name)) or (to_id(name) if to_id(name) in pokedex else None)
            if pid and "dexOrder" not in pokedex[pid]:
                pokedex[pid]["dexOrder"], pokedex[pid]["family"] = n, fi
                n += 1
    unplaced = [p["name"] for p in pokedex.values() if "dexOrder" not in p]
    for p in pokedex.values():  # anything not on the board goes at the end, by number
        if "dexOrder" not in p:
            p["dexOrder"], p["family"] = 10000 + p["num"], 10000 + p["num"]
    if unplaced:
        print("not in dex order:", ", ".join(unplaced))
# Evolution levels (remix-data/evo_levels.json, from the game's a/0/1/4 via tools/refresh_evo_levels.py):
# evoAt = the level this Pokemon evolves at. "Who learns this move" uses it to show the level of whichever
# family member you'd actually have at that level.
evo_path = os.path.join(CALC, "remix-data", "evo_levels.json")
if os.path.exists(evo_path):
    with open(evo_path, encoding="utf8") as f:
        evo_at = json.load(f)
    for p in pokedex.values():
        if str(p.get("num")) in evo_at:
            p["evoAt"] = evo_at[str(p["num"])]
with open(os.path.join(OUT, "data.json"), "w", encoding="utf8") as f:
    json.dump({"pokedex": pokedex, "moves": moves, "sheetId": ""}, f, ensure_ascii=False, separators=(",", ":"))

print(f"DoozDex sidebar data: {len(pokedex)} Pokemon, {len(moves)} moves, {sprites_done} sprites -> {OUT}")
missing = [p["name"] for k, p in pokedex.items() if not os.path.exists(os.path.join(SPRITES_OUT, k + ".png"))]
if missing:
    print(f"No calc sprite for {len(missing)}: " + ", ".join(missing[:25]) + (" ..." if len(missing) > 25 else ""))
