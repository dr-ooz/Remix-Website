"""Export every trainer in the game (a/1/0/6 trainer data + a/1/0/7 teams) for the calc's Boss Guide.

Writes:
  remix-data/trainers.json          - all trainers (the guide page loads this; "boss" marks named characters)
  remix-data/trainers_showdown.txt  - same teams as Showdown/PKHeX text (drag-drop into the guide or calc)

Teams with no moves set get the game's default moves (last 4 level-up moves at that level).

Usage:  python tools/export_trainers.py "<Citra mods romfs folder>"
Then rebuild the calc (npm run compile).
"""
import json, os, struct, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from refresh_ability_names import garc_files, text_lines, clean

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, "..", "remix-data")
read = lambda f: json.load(open(os.path.join(DATA, f), encoding="utf-8"))

# Trainer classes treated as bosses (named characters). Edit freely.
BOSS_CLASSES = {"Captain", "Island Kahuna", "Elite Four", "Team Skull Boss", "Aether President",
                "Hack Creator", "Team Skull Admin", "Aether Branch Chief", "Pokémon Professor",
                "Trial Guide", "Ultra Recon Squad", "GAME FREAK", "Pokémon Trainer", "Champion",
                "Gym Leader", "Rival", "Team Rainbow Rocket"}
NATURES = ["Hardy", "Lonely", "Brave", "Adamant", "Naughty", "Bold", "Docile", "Relaxed", "Impish", "Lax",
           "Timid", "Hasty", "Serious", "Jolly", "Naive", "Modest", "Mild", "Quiet", "Bashful", "Rash",
           "Calm", "Gentle", "Sassy", "Careful", "Quirky"]
STATS = ["HP", "Atk", "Def", "SpA", "SpD", "Spe"]


def main(romfs):
    a = lambda *p: os.path.join(romfs, "a", *p)
    text = garc_files(a("0", "3", "2"))
    tr_names = [clean(x) for x in text_lines(text[110])]
    tr_classes = [clean(x) for x in text_lines(text[111])]
    items = [clean(x) for x in text_lines(text[40])]
    moves = {m["num"]: m["name"] for m in read("moves.json")}
    abilities = [str(x[0]).replace("’", "'") for x in read("abilities.json")]
    dex = read("pokedex.json")
    renames = read("species_renames.json").get("rename", {})
    by_num = {}
    for d in sorted(dex, key=lambda d: d.get("id", 10**9)):  # forms added by sync_personal (no id) go last
        by_num.setdefault(d["num"], []).append(d)  # form index = order within the species
    levelup = garc_files(a("0", "1", "3"))

    def default_moves(pid, level):
        b, out = levelup[pid], []
        for k in range(0, len(b) - 3, 4):
            mv, lv = struct.unpack_from("<hh", b, k)
            if mv == -1: break
            if lv <= level:
                if mv in out: out.remove(mv)
                out.append(mv)
        return out[-4:]

    tdata, tpoke = garc_files(a("1", "0", "6")), garc_files(a("1", "0", "7"))
    out, sd = [], []
    for i, (d, p) in enumerate(zip(tdata, tpoke)):
        if i == 0 or not p: continue
        name = tr_names[i] if i < len(tr_names) else ""
        if not name or name == "뷿": name = "Trainer %d" % i
        cls = tr_classes[d[0]] if d[0] < len(tr_classes) else "?"
        team = []
        for k in range(0, len(p) - 31, 32):
            e = p[k:k + 32]
            level, spec, form, item = struct.unpack_from("<HHHH", e, 14)
            forms = by_num.get(spec) or []
            ent = forms[form] if form < len(forms) else (forms[0] if forms else None)
            if not ent: continue
            raw = ent["species"] + ("-" + ent["form"].replace(" ", "-") if ent.get("form") else "")
            abil_slot = e[0] >> 4
            ab = (list(ent.get("abilities") or []) + [0, 0, 0])[:3]
            ab = [x or ab[0] for x in ab]
            ab_id = ab[min(abil_slot - 1, 2)] if abil_slot else ab[0]
            mv = [m for m in struct.unpack_from("<4H", e, 24) if m]
            default = not mv
            if default: mv = default_moves(ent["id"], level)
            ivw = struct.unpack_from("<I", e, 8)[0]
            ivs = [(ivw >> (5 * s)) & 31 for s in range(6)]  # stored HP Atk Def Spe SpA SpD
            evs = list(e[2:8])  # stored HP Atk Def SpA SpD Spe
            team.append({
                "species": renames.get(raw, raw), "level": level,
                "ability": abilities[ab_id] if ab_id < len(abilities) else "",
                "item": items[item] if 0 < item < len(items) else "",
                "nature": NATURES[e[1] % 25],
                "gender": "MF"[(e[0] & 3) - 1] if e[0] & 3 in (1, 2) else "",
                "moves": [moves.get(m, "?") for m in mv], "defaultMoves": default,
                "ivs": {"hp": ivs[0], "at": ivs[1], "df": ivs[2], "sp": ivs[3], "sa": ivs[4], "sd": ivs[5]},
                "evs": {"hp": evs[0], "at": evs[1], "df": evs[2], "sa": evs[3], "sd": evs[4], "sp": evs[5]},
            })
        if not team: continue
        out.append({"id": i, "name": name, "class": cls, "boss": cls in BOSS_CLASSES,
                    "doubles": d[2] == 1, "team": team})
        sd.append("=== [gen7] %s %s (#%d) ===\n" % (cls, name, i))
        for m in team:
            line = m["species"] + (" (%s)" % m["gender"] if m["gender"] else "") + (" @ " + m["item"] if m["item"] else "")
            o = [line, "Ability: " + m["ability"], "Level: %d" % m["level"]]
            ev = " / ".join("%d %s" % (m["evs"][s], n) for s, n in zip(["hp", "at", "df", "sa", "sd", "sp"], STATS) if m["evs"][s])
            if ev: o.append("EVs: " + ev)
            o.append(m["nature"] + " Nature")
            iv = " / ".join("%d %s" % (m["ivs"][s], n) for s, n in zip(["hp", "at", "df", "sa", "sd", "sp"], STATS) if m["ivs"][s] != 31)
            if iv: o.append("IVs: " + iv)
            o += ["- " + x for x in m["moves"]]
            sd.append("\n".join(o) + "\n")
        sd.append("")
    json.dump(out, open(os.path.join(DATA, "trainers.json"), "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
    open(os.path.join(DATA, "trainers_showdown.txt"), "w", encoding="utf-8").write("\n".join(sd))
    print("exported %d trainers (%d bosses)" % (len(out), sum(t["boss"] for t in out)))


if __name__ == "__main__":
    main(sys.argv[1])
