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
            (r"only works (on )?(the )?(first|1st) turn|first turn out|only works( on)? turn 1|(can )?only (be used|works) (on )?(the )?(turn 1|1st turn|first turn)|only works the 1st turn", "Turn 1 Only"),
            (r"removes? (the target's|its|the foe's) (held )?item|hits the target's held item off|knocks? (off|away)", "Removes Item"),
            (r"steals?", "Steals Item"),
            (r"ignores? (the target.s )?abilit", "Ignores Abilities"),
            (r"ignores? (stat changes|stat boosts)", "Ignores Stat Boosts"),
            (r"bypass(es)? protect|through protect|breaks protect|ignores protect", "Breaks Protect"),
            (r"(can.?t|cannot|no)( be)?( use[ds]?)? (2x|twice) in a row|fails consecutively", "No 2x in a row"),
            (r"protects? (itself|the user)|blocks? (all )?(attacks|moves)", "Protects"),
            (r"lays? (spikes|floating stones|toxic spikes|a sticky web)|sets? (spikes|stealth rock|sticky web)", "Hazard"),
            (r"removes? (hazards|spikes|entry hazards)|clears? (hazards|spikes)", "Clears Hazards"),
            (r"\bsun\b|harsh sunlight", None), (r"user faints|user to faint", "User Faints"),
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
    else:
        # priority only on certain turns ("+4 Priority only on turn 1", "+1 priority on the 3rd turn")
        tp = re.search(r"([+-]\d) priority[^.]*?(?:turn (\d)|(first|1st|2nd|3rd) turn)", m["desc"], re.I)
        if tp:
            turn = tp.group(2) or {"first": "1", "1st": "1", "2nd": "2", "3rd": "3"}[tp.group(3).lower()]
            head.append("%s Prio on Turn %s" % (tp.group(1), turn))
        else:
            # priority only in some weather/terrain ("In Misty Terrain, this gains +1 priority")
            wp = re.search(r"in (the )?(rain|sun|sand(?:storm)?|snow|hail|(?:grassy|misty|electric|psychic) terrain)[^.]*?([+-]\d) priority", m["desc"], re.I) \
                or re.search(r"([+-]\d) priority[^.]*? in (the )?(rain|sun|sand(?:storm)?|snow|hail|(?:grassy|misty|electric|psychic) terrain)", m["desc"], re.I)
            if wp:
                g = wp.groups()
                n, cond = (g[2], g[1]) if g[0] is None or not g[0].startswith(("+", "-")) else (g[0], g[2])
                head.append("%s Prio in %s" % (n, cond.title()))
    lo, hi = hits & 0xF, hits >> 4
    if hi > 1: fx.append("%d Hits" % hi if lo == hi else "%d-%d Hits" % (lo, hi))
    if crit >= 6: fx.append("Always Crits")
    elif crit: fx.append("High Crit")
    if drain > 0: fx.append("%d%% Drain" % drain)
    if drain < 0: fx.append("%d%% Recoil" % -drain)
    if heal and not dmg:
        # weather/terrain heal boosts ("Heals 2/3 in the rain", "2/3 HP under Grassy Terrain", "If Lunar Aura is active, heals 2/3")
        hb = re.search(r"(2/3|full)(?: of its)?(?: max)?(?: hp)? (?:in|under|during) (?:the )?(rain|sun(?:light)?|sand(?:storm)?|snow|hail|grassy terrain|electric terrain|misty terrain|psychic terrain)", m["desc"], re.I) \
            or re.search(r"if (lunar aura) is active,? (?:it )?heals (2/3|full)", m["desc"], re.I)
        note = ""
        if hb:
            amt, cond = (hb.group(1), hb.group(2)) if hb.re.pattern.startswith("(2/3") else (hb.group(2), hb.group(1))
            cond = {"sunlight": "Sun", "sandstorm": "Sand", "rain": "Rain", "sun": "Sun", "sand": "Sand", "snow": "Snow", "hail": "Snow"}.get(cond.lower(), cond.title())
            note = " (%s in %s)" % ("Full" if amt.lower() == "full" else amt, cond)
        fx.append("Heals %d%%%s" % (heal, note))
    if inflict in STATUS:
        name = "Toxic" if inflict == 5 and "badly" in m["desc"] else STATUS[inflict]
        if dmg and ipct and ipct < 100: fx.append("%d%% %s" % (ipct, name))
        elif inflict == 8: fx.append("Traps")
        else: fx.append(("ALWAYS " if dmg else "") + {"Para": "Paralyzes", "Sleep": "Sleep", "Freeze": "Freezes",
                    "Burn": "Burns", "Poison": "Poisons", "Toxic": "Badly Poisons", "Confuse": "Confuses",
                    "Infatuate": "Infatuates"}[name])
    if flinch: fx.append("%d%% Flinch" % flinch if flinch < 100 else "ALWAYS Flinches")
    # stat changes: the same change to several stats is written once ("+1 Atk, Sp. Atk, Spe");
    # different amounts stay separate ("+1 Atk, +2 Spe")
    groups = []  # [(prefix, stage, [stats])]
    for sid, stage, pct in zip(e[21:24], struct.unpack_from("<3b", e, 24), e[27:30]):
        if not sid or not stage: continue
        pre = ""
        if dmg and quality == 7 and stage < 0: pre = "User "
        elif dmg and quality == 6 and stage > 0: pre = "User "
        if dmg and pct and pct < 100: pre = "%d%% %s" % (pct, pre)
        elif dmg and quality == 6 and stage < 0: pre = "ALWAYS " + pre
        same = next((g for g in groups if g[0] == pre and g[1] == stage), None)
        if same: same[2].append(STAT.get(sid, "?"))
        else: groups.append((pre, stage, [STAT.get(sid, "?")]))
    for pre, stage, stats in groups:
        fx.append("%s%+d %s" % (pre, stage, ", ".join(stats)))
    d = re.sub(r"\s+", " ", m["desc"]).split("Z-Effect")[0].lower()
    for pat, note in KEYWORDS:
        if not dmg and note in ("2-Turn", "Must Recharge"): continue  # status moves (Recharge heals) don't charge/recharge
        if re.search(pat, d) and note not in fx: fx.append(note)
    for note in extra_notes(re.sub(r"\s+", " ", m["desc"]).split("Z-Effect")[0], dmg):
        if note not in fx: fx.append(note)
    # what the power condition actually is (wording approved by Dooz 2026-11-17)
    if m["name"] in POWER_NOTES:
        fx = [f for f in fx if f != "Conditional Power"]
        note = POWER_NOTES[m["name"]]
        if note.startswith("="): fx = [note[1:]]  # replaces the effects entirely
        else: fx.append(note)
    return ", ".join(head), ", ".join(fx)


COND = r"(rain|sun(?:light)?|harsh sunlight|sand(?:storm)?|snow(?:storm)?|hail|(?:grassy|misty|electric|psychic) terrain|lunar aura|terrain|gravity)"
COND_NAME = {"sunlight": "Sun", "harsh sunlight": "Sun", "sandstorm": "Sand", "snowstorm": "Snow", "hail": "Snow",
             "rain": "Rain", "sun": "Sun", "sand": "Sand", "snow": "Snow"}


def cond_name(c):
    c = c.lower()
    return COND_NAME.get(c, c.title())


def extra_notes(d, dmg):
    """Weather/terrain effects and a few common extras the raw move data doesn't show."""
    out = []
    if dmg:
        # power boosts: "Boosted by 50% in Sun", "50% stronger in sand", "1.5x under terrain", "25% boost in a snowstorm"
        for m in re.finditer(r"(?:boosted(?: by)?(?: an additional)? (\d+)%|(\d+)% (?:stronger|boost)|(1\.\d+|2)x|boosted)(?: if it is| while| under| in| during)? (?:a |the )?" + COND
                             + r"(?:(?: and| ?/ ?)(?: in)? " + COND + r")?", d, re.I):
            pct, pct2, mult = m.group(1), m.group(2), m.group(3)
            x = "%gx" % (1 + int(pct or pct2) / 100) if (pct or pct2) else (mult + "x" if mult else "Boosted")
            conds = cond_name(m.group(4)) + ("/" + cond_name(m.group(5)) if m.group(5) else "")
            out.append("%s in %s" % (x, conds))
            break
        else:
            # condition first: "In Grassy Terrain, this is boosted by an additional 50%"
            m = re.search(r"\b(?:in|under|during) (?:a |the )?" + COND + r",? (?:this|it)(?: is)? (?:boosted|stronger)(?: by)?(?: an additional)? (\d+)%", d, re.I)
            if m: out.append("%gx in %s" % (1 + int(m.group(2)) / 100, cond_name(m.group(1))))
        a = re.search(r"(?:never misses|can'?t miss|cannot miss)[^.]*?" + COND, d, re.I)
        if a: out.append("Can't miss in %s" % cond_name(a.group(1)))
        c = re.search(r"(?:no charge|doesn'?t need to charge|no charging)[^.]*?" + COND, d, re.I)
        if c: out.append("No charge in %s" % cond_name(c.group(1)))
        se = re.search(r"[Ss]uper[- ][Ee]ffective (?:on|against|vs\.?) ([A-Z][a-z]+)", d)
        if se: out.append("SE vs %s" % se.group(1))
        if re.search(r"breaks? screens", d, re.I): out.append("Breaks Screens")
        if re.search(r"matches (?:the )?user'?s?'? (?:primary )?type|matches user type", d, re.I): out.append("Matches User Type")
        if re.search(r"uses? (?:the )?(?:user'?s )?higher (?:offensive )?stat|whichever stat is higher", d, re.I): out.append("Uses Higher Atk Stat")
    t = re.search(r"(?:summons?|sets?|creates?) (grassy|misty|electric|psychic) terrain", d, re.I)
    if t: out.append("Sets %s Terrain" % t.group(1).title())
    return out


POWER_NOTES = {
    "Pursuit": "2x if foe switches out", "Assurance": "2x if foe was already hit this turn",
    "Decompose": "2x vs foe below 50% HP", "Brainwave": "1.5x vs sleeping foe", "Thief": "1.5x if it steals",
    "Overload": "2x vs paralyzed foe", "Afterburner": "2x vs burned foe", "Lash Out": "2x if last move failed",
    "Facade": "2x if user is burned/poisoned/paralyzed", "Smelling Salts": "2x vs Para",
    "Temper Flare": "2x if last move failed", "Stomping Tantrum": "2x if last move failed",
    "Venoshock": "2x vs poisoned foe", "Acrobatics": "2x with no held item",
    "Retaliate": "2x if an ally fainted last turn", "Covet": "1.5x if it steals",
    "Shroom Smack": "Leech Seed, 1.5x if asleep (wakes)", "Weather Ball": "2x in Weather",
    "Bide": "=2x damage taken after 2 turns",
    # moves whose blurb showed only BP (written from their descriptions, 2026-11-17)
    "High Jump Kick": "Loses 10% HP if it misses", "Divebomb": "Loses 10% HP if it misses",
    "Rolling Kick": "Switches Out", "Hit N' Run": "Switches Out",
    "Counter": "2x Physical damage taken back", "Mirror Coat": "2x Special damage taken back",
    "Metal Burst": "1.5x damage taken back", "Struggle": "50% Recoil",
    "Flail": "Stronger at low HP (max 200)", "Reversal": "Stronger at low HP (max 200)",
    "Cheap Shot": "2x vs statused foe", "Hex": "2x vs statused foe",
    "Knockout Punch": "Foe falls asleep next turn (2 turns)",
    "Future Sight": "Hits 2 turns later", "Doom Desire": "Hits 2 turns later",
    "Endeavor": "Cuts foe's HP to user's HP", "Eruption": "Weaker at lower HP", "Water Spout": "Weaker at lower HP",
    "Pollen Puff": "Clears foe's stat changes, heals ally 50%", "Sky Uppercut": "SE vs Flying",
    "Chromosome Crush": "120 BP at full HP, weaker lower", "Last Resort": "Only after using all other moves",
    "Sucker Punch": "Fails if foe isn't attacking", "Shadow Sneak": "Bypasses Substitute",
    "Bone Rush": "Hits airborne foes", "Psyshock": "Hits Physical Defense", "Body Press": "Uses Def to attack",
    "Foul Play": "Uses foe's Atk", "Circle Throw": "Forces Switch", "Final Gambit": "User faints, deals its HP",
    "Water Pledge": "Combos with another Pledge", "Fire Pledge": "Combos with another Pledge",
    "Grass Pledge": "Combos with another Pledge", "Sacred Sword": "Ignores Stat Boosts",
    "Metronome": "=Uses a random move", "Nature Power": "=Move changes with terrain", "Role Play": "=Copies foe's ability",
    "Skill Swap": "=Swaps abilities with foe", "Power Trick": "=Swaps Atk and Def", "Simple Beam": "=Foe's ability becomes Simple",
    "Entrainment": "=Foe's ability becomes user's",
    # signature Z-moves with their own effects (the generic type Z-moves need no blurb)
    "Malicious Moonsault": "+1 Atk before hitting", "Soul-Stealing 7-Star Strike": "=Pivots",
    "Splintered Stormshards": "Sets Stealth Rock",
    "Pulverizing Pancake": "=+3 Spe, Paralyzes, 50% Recoil", "Genesis Supernova": "=+1 All Stats, Psychic Terrain",
    "Teleport": "Switches Out", "Smoke Out": "Switches Out",
    # set by the 2026-11-16 move batch (in game, confirmed); their game descriptions are still placeholders
    "Fusion Flare": "Sets Sun (5 turns)", "Fusion Bolt": "Sets Electric Terrain (5 turns)",
}


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
