# remix-data/item_effects.json -> remix-data/signature_items.json
# A signature item is one with a species-gated rule in the calc's item effects ("species": [...]).
# For each: who it works for (calc names; "Minior-*" style wildcards expanded against the Pokedex)
# and the abilities those rules grant. Run after editing item_effects.json.
import json, os, re

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, "..", "remix-data")
effects = json.load(open(os.path.join(DATA, "item_effects.json"), encoding="utf8"))
dex = json.load(open(os.path.join(DATA, "pokedex.json"), encoding="utf8"))
renames = json.load(open(os.path.join(DATA, "species_renames.json"), encoding="utf8"))
# every calc name we know of (Pokedex names + renamed names)
known = set()
for e in dex:
    known.add(e["species"] + ("-" + e["form"].replace(" ", "-") if e.get("form") else ""))
known |= set((renames.get("rename") or {}).values())


def expand(name):
    if name.endswith("*"):
        base = name[:-1].rstrip("-")
        hits = sorted(n for n in known if n == base or n.startswith(base + "-"))
        return hits or [base]
    return [name]


out = {}
for item, rules in effects.items():
    if item.startswith("_") or not isinstance(rules, list):
        continue
    holders, abilities = [], []
    for r in rules:
        if not isinstance(r, dict) or not r.get("species"):
            continue
        for sp in r["species"]:
            holders += expand(sp)
        for a in r.get("abilities", []):
            if a not in abilities:
                abilities.append(a)
    if holders:
        out[item] = {"holders": sorted(set(holders)), "abilities": abilities}

# Second pass: item descriptions that name who it's for ("An item to be held by Cubone or Marowak",
# "If held by the Mienshao line...") - vanilla species items the calc handles itself (Thick Club,
# Metal Powder) and effects that aren't damage rules (Terrain Seeds, Memories). "X line"/"X family"
# = X's whole family (from the dex order).
descs = json.load(open(os.path.join(DATA, "item_descs.json"), encoding="utf8"))
fams = json.load(open(os.path.join(DATA, "dex_order.json"), encoding="utf8"))["main"]["families"]
family_of = {}
for f in fams:
    for mem in f["members"]:
        family_of.setdefault(mem, f["members"])
names = sorted(known | {n.split("-")[0] for n in known}, key=len, reverse=True)
NAME_RE = re.compile(r"(?<![A-Za-z])(" + "|".join(re.escape(n) for n in names) + r")(?![A-Za-z])")
ability_names = sorted({a[0] for a in json.load(open(os.path.join(DATA, "abilities.json"), encoding="utf8"))
                        if a and a[0] and not a[0].startswith("OLD")}, key=len, reverse=True)
HELD = re.compile(r"\bheld by (?!a Pok|any |the holder)(.{1,120}?)(?:[.:;]|$| (?:they|it|this|also)\b)", re.I)
for item, d in descs.items():
    m = HELD.search(d)
    if not m:
        continue
    phrase = m.group(1)
    plural = re.search(r"\b(lines|families)\b", phrase, re.I)
    found = []
    for nm in NAME_RE.finditer(phrase):
        whole = bool(re.match(r"\s+(line|family)", phrase[nm.end():nm.end() + 9], re.I)) or bool(plural and nm.start() < plural.start())
        n = nm.group(1)
        # a plain name also covers that Pokemon's forms (Marowak -> Marowak-Alola)
        found += family_of.get(n, [n]) if whole else sorted(k for k in known if k == n or k.split("-")[0] == n)
    if not found:
        continue
    entry = out.setdefault(item, {"holders": [], "abilities": []})
    entry["holders"] = sorted(set(entry["holders"]) | set(found))
    if not entry["abilities"]:
        rest = d[m.end():]
        entry["abilities"] = [a for a in ability_names if re.search(r"(?<![A-Za-z])" + re.escape(a) + r"(?![A-Za-z])", rest)]

# items whose description only says "a certain species": Memories (Silvally), Drives (Genesect)
for item in descs:
    owner = "Silvally" if item.endswith(" Memory") else "Genesect" if item.endswith(" Drive") else None
    if owner and item not in out:
        out[item] = {"holders": sorted(k for k in known if k.split("-")[0] == owner), "abilities": []}

# Items whose description does not say "held by <species>" (seed lists, Tropius' Banana Bunch) or whose holders the
# text parse misses: listed by hand (2026-11-22, from the item descriptions). Terrain Seeds: the Tapu Bibi/Koko/Lele/
# Bulu/Fini set it as before, plus the new holders (Cherrim = Overcast, Kanto Exeggutor only).
MANUAL = {
    "Banana Bunch": ["Tropius"],
    "Electric Seed": ["Tapu Bibi", "Tapu Koko", "Cherrim"],
    "Psychic Seed": ["Tapu Bibi", "Tapu Lele", "Exeggcute", "Exeggutor"],
    "Misty Seed": ["Tapu Bibi", "Tapu Fini", "Morelull", "Shiinotic"],
    "Grassy Seed": ["Tapu Bibi", "Tapu Bulu", "Skiddo", "Gogoat"],
    "Fairy Flower": ["Floette-Eternal"],
}
for item, hs in MANUAL.items():
    for h in hs:
        if h not in known:
            print("WARNING: manual holder not a known calc name:", h)
    entry = out.setdefault(item, {"holders": [], "abilities": []})
    entry["holders"] = sorted(set(entry["holders"]) | set(hs))

# Holders the text parse gets wrong (an old evolution line from the evo data): removed by hand.
# Venonat no longer evolves into Venomoth in Remix (Caterpie/Metapod do), so it doesn't get Aurora Crystal.
NOT_HOLDERS = {"Aurora Crystal": ["Venonat"]}
for item, hs in NOT_HOLDERS.items():
    if item in out:
        out[item]["holders"] = [h for h in out[item]["holders"] if h not in hs]
# Not listed at all: Silvally's Memories and Genesect's Drives (form items, nothing to show), Metal Powder (only
# hosts Strange Souvenir's effect in code).
# Only these holders show (the item works for the others in code, but the list is about the signature holder).
ONLY_HOLDERS = {"Buried Idol": ["Darmanitan-Zen"]}
for item, hs in ONLY_HOLDERS.items():
    if item in out:
        out[item]["holders"] = hs
for item in [i for i in out if i.endswith(" Memory") or i.endswith(" Drive")] + ["Metal Powder"]:
    out.pop(item, None)

json.dump(out, open(os.path.join(DATA, "signature_items.json"), "w", encoding="utf8"), ensure_ascii=False, indent=1)
print(len(out), "signature items")

# the calc page reads it as a script
js = ("// Generated by tools/build_signature_items.py from remix-data/item_effects.json. Do not edit.\n"
      "// Signature items: item -> {holders: [calc names], abilities: [granted abilities]}\n"
      "var REMIX_SIGNATURE_ITEMS = " + json.dumps(out, ensure_ascii=False) + ";\n")
open(os.path.join(HERE, "..", "src", "js", "remix_signature_items.js"), "w", encoding="utf8").write(js)
