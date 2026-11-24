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
FORM_LABEL = {"oricorio": "Baile", "lycanroc": "Midday", "raticate": "Rabid"}

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
        continue  # no Totem forms (judged by the final name: Raticate-Plague is a Totem slot)
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

# Form-change move swaps (remix-data/form_moves.json, from code.bin via tools/refresh_form_moves.py): changing
# form turns a row's move into the new form's move, so every form "learns" its own column of a row at the
# earliest way any form of the species gets a move from that row (learn Scald as Wash at Lv1 -> Heat Wave as Heat).
FORM_COLUMNS = {  # species number -> the sidebar form for each table column ("" = the base entry)
    479: ["", "Heat", "Wash", "Frost", "Fan", "Mow"],
    492: ["", "Sky"],
    586: ["", "Summer", "Autumn", "Winter"],
    774: ["Twinkle", "Blaze", "Surge", "Verdant", "Frost", "Tidal", "Draco"],
}
fm_path = os.path.join(CALC, "remix-data", "form_moves.json")
if os.path.exists(fm_path):
    with open(fm_path, encoding="utf8") as f:
        form_moves = json.load(f)

    def how_rank(h):
        return h if isinstance(h, int) else 1000 if h == "tm" else 1001

    for sp, rows in form_moves.items():
        cols = FORM_COLUMNS.get(int(sp))
        if not cols:
            continue
        entries = {}
        for p in pokedex.values():
            if p["num"] == int(sp):
                entries[p.get("form") or ""] = p
        if not entries:
            continue
        for row in rows:
            ids = {move_id_by_num.get(m) for m in row if m} - {None}
            hows = [how for p in entries.values() for mv, how in p.get("learntMoves", []) if mv in ids]
            if not hows:
                continue
            best = min(hows, key=how_rank)
            for c, mv in enumerate(row):
                mid = move_id_by_num.get(mv)
                # a season / form the sidebar has no entry for (Sawsbuck's seasons) goes on the base entry
                p = entries.get(cols[c] if c < len(cols) else None) or entries.get("")
                if not mid or p is None:
                    continue
                have = next((e for e in p.setdefault("learntMoves", []) if e[0] == mid), None)
                if have is None:
                    p["learntMoves"].append([mid, best])
                elif how_rank(best) < how_rank(have[1]):  # e.g. Heat Wave by TM -> Lv1 through the Scald swap
                    have[1] = best

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
# Moves list "Effect" order: the order moves first appear in the Move Guide's category sections
# (Priority Attacking Moves ... Assorted Status Moves; the by-type sections are skipped).
guide_path = os.path.join(CALC, "src", "moveguide", "move_guide.json")
if os.path.exists(guide_path):
    import html as _html
    with open(guide_path, encoding="utf8") as f:
        guide = json.load(f)

    def _plain(h):
        return _html.unescape(re.sub(r"<[^>]+>", "", h))

    in_cat, eff, cats = False, [], []  # cats: [{name, moves}] in guide order (for the sidebar's Effect categories window)
    for r in guide["rows"]:
        if r.get("zone") not in (None, "body"):
            continue
        if r["k"] == "h0":
            in_cat = False
        if r["k"] == "h1" and r.get("cat"):
            in_cat = True
            cname = re.split(r"\s*\(", _plain(re.split(r"<br>|\n", r["c"][0][3])[0]).strip())[0].strip()
            cats.append({"name": cname, "moves": [], "prio": cname.startswith("Priority Attacking")})
        # Priority Attacking Moves splits into its 3 groups (regular priority, First Impression variants, Fake Out
        # variants) by its sub-headers
        if in_cat and r["k"] == "h2" and cats and cats[-1].get("prio"):
            sub = _plain(re.split(r"<br>|\n", r["c"][0][3])[0]).lower()
            nm = "First Impression Variants" if "impression" in sub else "Fake Out Variants" if "fake out" in sub else "Priority Attacks"
            if not any(c["name"] == nm for c in cats):
                cats.append({"name": nm, "moves": [], "prio": True})
            else:
                cats.append(cats.pop(next(i for i, c in enumerate(cats) if c["name"] == nm)))
        if in_cat and r["k"] == "row" and len(r["c"]) >= 8:
            first = _plain(re.split(r"<br>|\n", r["c"][0][3])[0])
            if re.match(r"(?i)^move name$", first.strip()):
                continue
            mid = to_id(first.split(">")[-1].replace("*", "").strip())
            if mid in moves and mid not in eff:
                eff.append(mid)
            if mid in moves and cats and mid not in cats[-1]["moves"]:
                cats[-1]["moves"].append(mid)
    for i, mid in enumerate(eff):
        moves[mid]["effectOrder"] = i
    with open(os.path.join(OUT, "effect_cats.json"), "w", encoding="utf8") as f:
        json.dump([{"name": c["name"], "moves": c["moves"]} for c in cats if c["moves"]], f, ensure_ascii=False, separators=(",", ":"))

# Filters: "Type Changed" (types differ from the original game's) and "Doozian Form" (Dooz's new / renamed
# Pokemon and forms). The original types come from the calc's species data before the Remix data is applied.
species_src = os.path.join(CALC, "calc", "src", "data", "species.ts")
if os.path.exists(species_src):
    vanilla, cur = {}, None
    for line in open(species_src, encoding="utf8"):
        if "REMIX_PERSONAL_UNMATCHED" in line:
            break
        m = re.match(r"^  (['\"]?)([^'\":]+)\1: \{", line)
        if m:
            cur = m.group(2)
        t = re.search(r"types: \[([^\]]*)\]", line)
        if t and cur:
            vanilla[cur] = [a or b for a, b in re.findall(r"'([^']+)'|\"([^\"]+)\"", t.group(1))]
    dz_path = os.path.join(CALC, "remix-data", "doozian_forms.json")
    dz_list = json.load(open(dz_path, encoding="utf8")) if os.path.exists(dz_path) else None
    # names that only differ in label from the original game (not new Pokemon)
    LABEL_ONLY = {"Farfetch’d", "Nidoran", "Burmy-Plant", "Burmy-Sand", "Burmy-Snow", "Wormadam-Plant", "Wormadam-Sand",
                  "Wormadam-Snow", "Gastrodon-West", "Basculin-Blue", "Aegislash", "Zygarde-50%", "Oricorio-Pa'u",
                  "Wishiwashi-Solo", "Type: Null", "Minior", "Minior-Red", "Minior-Twinkle", "Minior-Blaze", "Minior-Surge",
                  "Minior-Verdant", "Minior-Frost", "Minior-Tidal", "Minior-Draco"}
    # "Type Changed" compares with the REAL vanilla Ultra Sun types (remix-data/vanilla_types.json, from the untouched
    # game's personal data via tools/refresh_vanilla_types.py), not the calc's species data (that came from original
    # Sweltering Sun, which already changed types). Each entry is compared with its own game slot; forms living in
    # another species' slot (Sandy Castform, Georupt-Steam) aren't compared.
    vt_path = os.path.join(CALC, "remix-data", "vanilla_types.json")
    real_vanilla = {k: list(dict.fromkeys(TYPES[t] for t in v))
                    for k, v in (json.load(open(vt_path, encoding="utf8")).items() if os.path.exists(vt_path) else [])}
    NOT_COMPARED = {"Castform-Sandy", "Georupt-Steam"}
    for p in pokedex.values():
        old = None
        if p["name"] not in NOT_COMPARED:
            for cand in [*p.get("oldNames", []), p["name"]]:
                if cand in real_vanilla:
                    old = real_vanilla[cand]
                    break
            if old is None and not real_vanilla:  # no vanilla file: fall back to the calc's data
                old = vanilla.get(p["name"])
        if old and old != p["types"]:
            p["typeChanged"] = True
            p["vanillaTypes"] = old
        # Doozian forms (Dooz's list, remix-data/doozian_forms.json); without the list: anything not in the original game
        if dz_list is not None:
            if p["name"] in dz_list["doozian"] or p["name"] in dz_list["new"]:
                p["doozian"] = True
            if p["name"] in dz_list["new"]:
                p["doozianNew"] = dz_list["new"].index(p["name"]) + 1  # its place in the new section (Dooz's order)
            if p["name"] in dz_list["redesigned"]:
                p["redesigned"] = True
        elif p["name"] not in vanilla and p["name"] not in LABEL_ONLY:
            p["doozian"] = True

# Signature items that change type matchups (from the calc's item effects): immunities, resistances, Cell Battery's
# Trifecta, and abilities the item grants (Fairy Flower -> Sap Sipper). The sidebar's type chart loads them.
fx_path = os.path.join(CALC, "remix-data", "item_effects.json")
sig_path = os.path.join(CALC, "remix-data", "signature_items.json")
if os.path.exists(fx_path):
    with open(fx_path, encoding="utf8") as f:
        item_fx = json.load(f)
    sig = json.load(open(sig_path, encoding="utf8")) if os.path.exists(sig_path) else {}

    def holds(pats, p):
        for s in pats:
            if s == p["name"] or (s.endswith("-*") and p["name"].startswith(s[:-1])) or (s.endswith("*") and p["name"].startswith(s[:-1])):
                return True
        return False

    for item, effs in item_fx.items():
        if item.startswith("_") or not isinstance(effs, list):
            continue
        for e in effs:
            if not isinstance(e, dict) or not e.get("species"):
                continue
            chart = {t: 0 for t in e.get("immune", [])}
            for t, v in (e.get("resist") or {}).items():
                chart[t] = v
            if e.get("trifecta"):
                chart.update({"Fire": 0, "Ice": 0, "Electric": 0})
            abil = e.get("abilities", [])
            add_type = e.get("addType")
            if not chart and not abil and not add_type:
                continue
            pats = list(e["species"]) + list((sig.get(item) or {}).get("holders", []))
            for p in pokedex.values():
                if holds(pats, p):
                    entry = {"name": item, "chart": chart, "abilities": abil}
                    if add_type:
                        entry["addType"] = add_type
                    p.setdefault("typeItems", []).append(entry)

# Signature items for the Pokemon list's item groups: icon id (the site's img/items/bitem_<id>.png), the in-game
# description, and a rank for the "semi-signature" items that go first (everyone gets something from them; their
# holders get more): the 18 type boosters, weather rocks, terrain seeds, then the rest of Dooz's list.
# The items' "Featured" order (Dooz, 2026-11-22): the 18 type boosters in DoozDex type order, weather rocks, terrain
# seeds, Snowball / Cell Battery / Absorb Bulb; then the rest by the dex order of their first holder, except that
# every fossil item sits together (Treasure Chest, Sharp Bone, Old Amber, the gen 3-5 fossils, then Sail Fossil and
# the Primora family's items, Jaw Fossil and the Tyrunt family's items), and Leaf Fan follows Coconut.
# remix-data/item_order.json (from the item order board), when there, replaces all of this.
FEATURED_FIRST = ["Silk Scarf", "Charcoal", "Mystic Water", "Miracle Seed", "Magnet", "Never-Melt Ice", "Chi Bracelet",
                  "Poison Barb", "Soft Sand", "Sharp Beak", "Kaleidoscope", "Silver Powder", "Hard Stone", "Spell Tag",
                  "Dragon Fang", "Black Glasses", "Metal Coat", "Fairy Flower",
                  "Heat Rock", "Damp Rock", "Smooth Rock", "Icy Rock",
                  "Electric Seed", "Psychic Seed", "Misty Seed", "Grassy Seed",
                  "Snowball", "Cell Battery", "Absorb Bulb"]
FOSSILS = ["Treasure Chest", "Sharp Bone", "Old Amber", "Root Fossil", "Claw Fossil", "Skull Fossil", "Armor Fossil",
           "Cover Fossil", "Plume Fossil"]
icons_js = os.path.join(CALC, "src", "js", "remix_item_icons.js")
icon_ids = {}
if os.path.exists(icons_js):
    src = open(icons_js, encoding="utf8").read()
    m = re.search(r"REMIX_ITEM_ICON_IDS = (\{.*?\});", src)
    icon_ids = json.loads(m.group(1)) if m else {}
    # stand-in icons (remix_minisprite.js REMIX_ITEM_ICON_OVERRIDES)
    ms = os.path.join(CALC, "src", "js", "remix_minisprite.js")
    mtxt = open(ms, encoding="utf8").read() if os.path.exists(ms) else ""
    om = re.search(r"REMIX_ITEM_ICON_OVERRIDES = \{(.*?)\};", mtxt, re.S)
    for k, v in re.findall(r"(\w+): (\d+)", om.group(1) if om else ""):
        icon_ids[k] = int(v)
descs_path = os.path.join(CALC, "remix-data", "item_descs.json")
item_descs = json.load(open(descs_path, encoding="utf8")) if os.path.exists(descs_path) else {}
sig_items = json.load(open(os.path.join(CALC, "remix-data", "signature_items.json"), encoding="utf8"))
# featured order
by_name = {p["name"]: p for p in pokedex.values()}
def first_dex(item):
    return min([by_name[h].get("dexOrder", 1e6) for h in sig_items[item]["holders"] if h in by_name] or [1e6])
def fam_items(holder, skip):  # the other items held by that Pokemon's family, in dex order
    fam = by_name.get(holder, {}).get("family")
    its = [i for i in sig_items if i != skip and any(by_name.get(h, {}).get("family") == fam for h in sig_items[i]["holders"])]
    return sorted(its, key=first_dex)
fossil_block = [i for i in FOSSILS if i in sig_items]
for fossil, holder in (("Sail Fossil", "Primora"), ("Jaw Fossil", "Tyrunt")):
    if fossil in sig_items:
        fossil_block += [fossil] + [i for i in fam_items(holder, fossil) if i not in fossil_block]
rest = sorted([i for i in sig_items if i not in FEATURED_FIRST and i not in fossil_block and i != "Leaf Fan"], key=first_dex)
featured = [i for i in FEATURED_FIRST if i in sig_items]
fossil_at = min([first_dex(i) for i in FOSSILS if i in sig_items] or [1e6])  # where the fossils sit (not the family items)
placed = False
for i in rest:
    if not placed and first_dex(i) > fossil_at:
        featured += fossil_block
        placed = True
    featured.append(i)
    if i == "Coconut" and "Leaf Fan" in sig_items:
        featured.append("Leaf Fan")
if not placed:
    featured += fossil_block
order_path = os.path.join(CALC, "remix-data", "item_order.json")
if os.path.exists(order_path):  # the board's order wins; anything new goes at the end
    board = json.load(open(order_path, encoding="utf8")).get("items", [])
    featured = [i for i in board if i in sig_items] + [i for i in featured if i not in board]
SEMI_SIGNATURE = FEATURED_FIRST
semi_end = max([featured.index(i) for i in ("Cell Battery", "Solar Panel") if i in featured] or [-1])

item_info = {}
for name in sig_items:
    key = re.sub(r"[^a-z0-9]", "", unicodedata.normalize("NFD", name).lower())
    info = {"icon": icon_ids.get(key), "desc": item_descs.get(name, "")}
    info["order"] = featured.index(name) if name in featured else len(featured)
    # group 1 = semi-signature (works for any holder, more for certain Pokemon): everything up to Cell Battery /
    # Solar Panel in the Featured order (Dooz, 2026-11-22); group 2 = items that only work for their own Pokemon
    info["group"] = 1 if info["order"] <= semi_end else 2
    item_info[name] = info
with open(os.path.join(OUT, "items.json"), "w", encoding="utf8") as f:
    json.dump(item_info, f, ensure_ascii=False, separators=(",", ":"))

with open(os.path.join(OUT, "data.json"), "w", encoding="utf8") as f:
    json.dump({"pokedex": pokedex, "moves": moves, "sheetId": ""}, f, ensure_ascii=False, separators=(",", ":"))

print(f"DoozDex sidebar data: {len(pokedex)} Pokemon, {len(moves)} moves, {sprites_done} sprites -> {OUT}")
# type charts + effective move power from the calc's own engine (calc_data.json), so the sidebar matches the calc
import subprocess
subprocess.run(["node", os.path.join(CALC, "tools", "build_sidebar_calc.js")], check=False)
missing = [p["name"] for k, p in pokedex.items() if not os.path.exists(os.path.join(SPRITES_OUT, k + ".png"))]
if missing:
    print(f"No calc sprite for {len(missing)}: " + ", ".join(missing[:25]) + (" ..." if len(missing) > 25 else ""))
