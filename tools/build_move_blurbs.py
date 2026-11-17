"""Build short move blurbs ("125 BP, 85% Acc | 30% Para") for the Boss Guide from the game's move file.

Reads a/0/1/1 (raw move data: priority, hits, status chance, stat changes, recoil...) + remix-data/moves.json.
Hand-written notes in remix-data/move_blurb_overrides.json win over the generated text
("Move Name": "full blurb") or add to it ("Move Name": "+extra note").

Writes remix-data/move_blurbs.json.  Usage:  python tools/build_move_blurbs.py "<Citra mods romfs folder>"
"""
import json, os, re, struct, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from refresh_move_extras import garc_files, mini_pack

DATA = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "remix-data")
STATUS = {1: "Para", 2: "Sleep", 3: "Freeze", 4: "Burn", 5: "Poison", 6: "Confuse", 7: "Infatuate", 8: "Traps"}
# Desc phrases -> short note (only effects the raw data doesn't already show)
KEYWORDS = [(r"switch(es)? places|switches out|switch out|before switching", "Switches Out"),
            (r"forces the (target|foe)s? out|forced out", "Forces Switch"),
            (r"on the next turn|charges|first turn,? then|two turns|2 turns to", "2-Turn"),
            (r"must recharge|can't move next turn|recharge", "Must Recharge"),
            (r"only works on the first turn|first turn out", "First Turn Only"),
            (r"removes? (the target's|its|the foe's) (held )?item|hits the target's held item off|knocks? (off|away)", "Removes Item"),
            (r"steals?", "Steals Item"),
            (r"ignores? (the target's )?(abilit|stat changes|protect)", "Ignores Abilities/Stats"),
            (r"bypass(es)? protect|through protect|breaks protect", "Breaks Protect"),
            (r"protects? (itself|the user)|blocks? (all )?(attacks|moves)", "Protects"),
            (r"lays? (spikes|floating stones|toxic spikes|a sticky web)|sets? (spikes|stealth rock|sticky web)", "Hazard"),
            (r"removes? (hazards|spikes|entry hazards)|clears? (hazards|spikes)", "Clears Hazards"),
            (r"sun|harsh sunlight", None), (r"user faints|user to faint", "User Faints"),
            (r"1\.5x damage if|2x damage if|double(s|d)? (in )?(power|damage) if|power doubles", "Conditional Power")]
KEYWORDS = [k for k in KEYWORDS if k[1]]
STAT = {1: "Atk", 2: "Def", 3: "Sp. Atk", 4: "Sp. Def", 5: "Spe", 6: "Acc", 7: "Eva", 8: "All Stats"}


def blurb(m, e):
    quality, power, acc, prio, hits = e[1], m["power"], m["acc"], struct.unpack_from("<b", e, 6)[0], e[7]
    inflict, ipct, crit, flinch = struct.unpack_from("<H", e, 8)[0], e[10], e[14], e[15]
    drain, heal = struct.unpack_from("<b", e, 18)[0], e[19]
    dmg = m["category"] != 0
    head, fx = [], []
    if dmg: head.append("%d BP" % power if power > 1 else "Varies BP")
    if acc <= 100 and acc != 100: head.append("%d%% Acc" % acc)
    if prio: head.append("%+d Priority" % prio)
    lo, hi = hits & 0xF, hits >> 4
    if hi > 1: fx.append("%d Hits" % hi if lo == hi else "%d-%d Hits" % (lo, hi))
    if crit >= 6: fx.append("Always Crits")
    elif crit: fx.append("High Crit")
    if drain > 0: fx.append("%d%% Drain" % drain)
    if drain < 0: fx.append("%d%% Recoil" % -drain)
    if heal and not dmg: fx.append("Heals %d%%" % heal)
    if inflict in STATUS:
        name = "Toxic" if inflict == 5 and "badly" in m["desc"] else STATUS[inflict]
        if dmg and ipct and ipct < 100: fx.append("%d%% %s" % (ipct, name))
        elif inflict == 8: fx.append("Traps")
        else: fx.append(("ALWAYS " if dmg else "") + {"Para": "Paralyzes", "Sleep": "Sleep", "Freeze": "Freezes",
                    "Burn": "Burns", "Poison": "Poisons", "Toxic": "Badly Poisons", "Confuse": "Confuses",
                    "Infatuate": "Infatuates"}[name])
    if flinch: fx.append("%d%% Flinch" % flinch if flinch < 100 else "ALWAYS Flinches")
    for sid, stage, pct in zip(e[21:24], struct.unpack_from("<3b", e, 24), e[27:30]):
        if not sid or not stage: continue
        txt = "%+d %s" % (stage, STAT.get(sid, "?"))
        if dmg and quality == 7 and stage < 0: txt = "User " + txt
        elif dmg and quality == 6 and stage > 0: txt = "User " + txt
        if dmg and pct and pct < 100: txt = "%d%% %s" % (pct, txt)
        elif dmg and quality == 6 and stage < 0: txt = "ALWAYS " + txt
        fx.append(txt)
    d = re.sub(r"\s+", " ", m["desc"]).split("Z-Effect")[0].lower()
    for pat, note in KEYWORDS:
        if re.search(pat, d) and note not in fx: fx.append(note)
    return ", ".join(head), ", ".join(fx)


def main(romfs):
    raw = mini_pack(garc_files(os.path.join(romfs, "a", "0", "1", "1"))[0])
    over_path = os.path.join(DATA, "move_blurb_overrides.json")
    over = json.load(open(over_path, encoding="utf-8")) if os.path.exists(over_path) else {}
    out = {}
    for m in json.load(open(os.path.join(DATA, "moves.json"), encoding="utf-8")):
        if not m["name"] or m["name"].startswith("OLD ") or m["num"] >= len(raw): continue
        head, fx = blurb(m, raw[m["num"]])
        o = over.get(m["name"], "")
        if o.startswith("+"): fx = ", ".join(x for x in (fx, o[1:].strip()) if x)
        elif o: head, fx = o, ""
        out[m["name"]] = " | ".join(x for x in (head, fx) if x)
    json.dump(out, open(os.path.join(DATA, "move_blurbs.json"), "w", encoding="utf-8"), ensure_ascii=False, indent=0)
    print("wrote %d move blurbs" % len(out))


if __name__ == "__main__":
    main(sys.argv[1])
