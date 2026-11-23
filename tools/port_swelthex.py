"""Port the Remix game data into SweltHex (DSG's PKHeX fork, DarkShinyGiratina/DSGKHeX, cloned to SweltHex-Remix).

Usage:  python tools/port_swelthex.py "<!Remix Files romfs>" "<SweltHex-Remix folder>" [--dry]

PKHeX reads the Ultra Sun/Moon ("uu") data in the game's own formats, so everything comes straight from the romfs
(the same master the calc data is built from):
  personal_uu        <- a/0/1/7  personal (0x54 per entry: stats, types, abilities, TM/tutor bits, forms)
  lvlmove_uu.pkl     <- a/0/1/3  level-up learnsets   (BinLinker "uu")
  eggmove_uu.pkl     <- emptied: Remix has no egg moves, PKHeX ignores them (form index kept, count 0)
  evos_uu.pkl        <- a/0/1/4  evolutions           (BinLinker "uu")
  text_*_en.txt      <- a/0/3/2  English names (species, moves, abilities, items, forms): only the game's index range
                        is replaced; later-generation lines PKHeX keeps for other games stay as they are.
Each step prints how many entries differ from what's in the fork now (DSG's Sweltering Sun data).
"""
import json, os, re, struct, sys, unicodedata

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from refresh_ability_names import garc_files, text_lines  # noqa: E402


# game private-use glyphs -> the characters PKHeX uses
GLYPHS = {0xE08E: "♂", 0xE08F: "♀"}


def binlinker(entries, ident=b"uu"):
    head = 4 + 4 * (len(entries) + 1)
    out, offs, pos = bytearray(), [], head
    for e in entries:
        offs.append(pos)
        pos += len(e)
    offs.append(pos)
    out += ident + struct.pack("<H", len(entries)) + b"".join(struct.pack("<i", o) for o in offs)
    for e in entries:
        out += e
    return bytes(out)


def unlink(b):
    n = struct.unpack_from("<H", b, 2)[0]
    offs = struct.unpack_from("<%di" % (n + 1), b, 4)
    return [b[offs[i]:offs[i + 1]] for i in range(n)]


def find_text(files, first, second):
    """Index of the text file whose lines 1 and 2 are the given strings (names files start with a blank/--- line 0)."""
    hits = []
    for i, f in enumerate(files):
        try:
            t = text_lines(f)
        except Exception:
            continue
        if len(t) > 2 and t[1] == first and t[2] == second:
            hits.append(i)
    return hits


def main(romfs, hexdir, dry, calc=None):
    core = os.path.join(hexdir, "PKHeX.Core", "Resources")
    a = lambda *p: os.path.join(romfs, "a", *p)
    report = []

    def write(path, data, label, old_parts=None, new_parts=None):
        old = open(path, "rb").read() if os.path.exists(path) else b""
        diff = ""
        if old_parts is not None:
            n = sum(1 for i in range(max(len(old_parts), len(new_parts)))
                    if i >= len(old_parts) or i >= len(new_parts) or old_parts[i] != new_parts[i])
            diff = " | %d of %d entries differ from the fork's" % (n, len(new_parts))
        report.append("%-20s %7d -> %7d bytes%s" % (label, len(old), len(data), diff))
        if not dry:
            open(path, "wb").write(data)

    # ---- personal table
    # the GARC's last file is the compiled table (= all entries back to back), the same layout as personal_uu
    pers = garc_files(a("0", "1", "7"))
    sz = 0x54
    path = os.path.join(core, "byte", "personal", "personal_uu")
    old = open(path, "rb").read()
    count = len(old) // sz
    if len(pers[-1]) != len(old):
        raise SystemExit("compiled personal table is %d bytes, PKHeX's is %d" % (len(pers[-1]), len(old)))
    entries = [pers[-1][i * sz:(i + 1) * sz] for i in range(count)]
    if any(len(e) != sz for e in entries):
        raise SystemExit("personal entries aren't 0x54 bytes")
    # Remix: male-only species (gender ratio byte 0x12 = 0). PKHeX side only: the game's own table isn't changed here.
    for sp in MALE_ONLY:
        e = bytearray(entries[sp])
        e[0x12] = 0
        entries[sp] = bytes(e)
    growth = {e[0x15] for e in entries[1:]}
    report.append("personal growth rates in use: %s (5 = Slow)" % sorted(growth))
    write(path, b"".join(entries), "personal_uu",
          [old[i * sz:(i + 1) * sz] for i in range(count)], entries)

    # ---- learnsets / egg moves / evolutions
    for g, name, folder in (("3", "lvlmove_uu.pkl", "levelup"), ("2", "eggmove_uu.pkl", "eggmove"),
                            ("4", "evos_uu.pkl", "evolve")):
        files = garc_files(a("0", "1", g))
        if g == "4":  # blank out evolution rows that point at species 0 (PKHeX would build a tree into "nothing")
            files = [b"".join(f[k:k + 8] if struct.unpack_from("<H", f, k + 4)[0] else bytes(8)
                              for k in range(0, len(f), 8)) for f in files]
        if g == "2":  # Remix has no egg moves (user 2026-11-22): PKHeX ignores them -> every entry keeps its form index, count 0
            files = [(f[:2] if len(f) >= 2 else bytes(2)) + bytes(2) for f in files]
        path = os.path.join(core, "byte", folder, name)
        oldp = unlink(open(path, "rb").read())
        if len(files) != len(oldp):
            report.append("%s: game has %d entries, fork has %d (using the game's)" % (name, len(files), len(oldp)))
        write(path, binlinker(files), name, oldp, files)

    # ---- English text
    tf = garc_files(a("0", "3", "2"))
    # game text file, expected line count, PKHeX file (Remix renamed some first entries, so fixed indices + a size check)
    texts = {
        "species": (60, 808, os.path.join(core, "text", "other", "en", "text_Species_en.txt")),
        "moves": (118, 729, os.path.join(core, "text", "other", "en", "text_Moves_en.txt")),
        "abilities": (101, 234, os.path.join(core, "text", "other", "en", "text_Abilities_en.txt")),
        "items": (40, 960, os.path.join(core, "text", "items", "text_Items_en.txt")),
    }
    for key, (idx, nlines, path) in texts.items():
        hits = [idx]
        if len(text_lines(tf[idx])) != nlines:
            report.append("text %s: game file %d isn't %d lines - skipped" % (key, idx, nlines))
            continue
        game = text_lines(tf[hits[0]])
        lines = open(path, encoding="utf-8").read().split("\n")
        newl = list(lines)
        changed = []
        for i in range(1, min(len(game), len(lines))):
            g = game[i].replace("\n", " ").strip().translate(GLYPHS)
            if g and g != lines[i]:
                changed.append("%d: %s -> %s" % (i, lines[i], g))
                newl[i] = g
        report.append("text %-9s game file %d (%d lines): %d names changed" % (key, hits[0], len(game), len(changed)))
        report.extend("    " + c for c in changed[:400])
        if not dry:
            open(path, "w", encoding="utf-8", newline="").write("\n".join(newl))

    move_pp(romfs, hexdir, dry, report)
    if calc:
        calc_species_names(calc, hexdir, dry, report)
        remix_forms(calc, hexdir, dry, report)
        remix_learnsets(calc, hexdir, dry, report)
        sprites(calc, hexdir, dry, report)
        type_theme(calc, hexdir, dry, report)
    print("\n".join(report))


# ---- species names: the calc's straight species renames (remix-data/species_renames.json). Renames that move a
# name between forms (Geodude -> Georupt-Magma, Meowth-Alola -> Meowth, Minior colours...) are calc display choices
# and are skipped; PKHeX names whole species.
SPECIES_KEY = {"Nidoran-F": "Nidoran\u2640", "Nidoran-M": "Nidoran\u2642"}


def calc_species_names(calc, hexdir, dry, report):
    path = os.path.join(hexdir, "PKHeX.Core", "Resources", "text", "other", "en", "text_Species_en.txt")
    lines = open(path, encoding="utf-8").read().split("\n")
    ren = json.load(open(os.path.join(calc, "remix-data", "species_renames.json"), encoding="utf-8"))["rename"]
    done, skipped = [], []
    for old, new in ren.items():
        key = SPECIES_KEY.get(old, old)
        if "-" in key or "-" in new or key not in lines[1:808]:
            skipped.append("%s -> %s" % (old, new))
            continue
        i = lines.index(key, 1)
        lines[i] = new
        done.append("%d: %s -> %s" % (i, key, new))
    report.append("calc species renames: %d applied, %d form renames skipped: %s" % (len(done), len(skipped), "; ".join(skipped)))
    report.extend("    " + d for d in done)
    if not dry:
        open(path, "w", encoding="utf-8", newline="").write("\n".join(lines))


# ---- form names: PKHeX builds form lists in code (FormConverter) from shared text lines, so the calc's form names go
# into a generated override table (RemixForms.cs) that GetFormList applies for Gen 7: species -> (form index, name).
MINIOR = ["Twinkle", "Blaze", "Surge", "Verdant", "Frost", "Tidal", "Draco"]  # game colour order Red/Pink..Violet, the calc's names
EXTRA_FORMS = {412: [(1, "Sand"), (2, "Snow")],  # Burmy cloaks (not separate calc entries; see species_renames.json)
               # Raticate: form 0 = Rabid, form 1 = an unused dummy, form 2 = Plague (the game's Totem slot, a real form now)
               20: [(0, "Rabid"), (1, "Unused"), (2, "Plague")],
               # Minior: the 7 Meteor shells (forms 0-6) and 7 cores (7-13) all use the calc's colour names
               774: [(i, "M-" + n) for i, n in enumerate(MINIOR)] + [(7 + i, n) for i, n in enumerate(MINIOR)]}


def remix_forms(calc, hexdir, dry, report):
    from sync_personal import FORM_MAP
    data = os.path.join(calc, "remix-data")
    dex = json.load(open(os.path.join(data, "pokedex.json"), encoding="utf-8"))
    ren = {to_id(k): v for k, v in json.load(open(os.path.join(data, "species_renames.json"), encoding="utf-8"))["rename"].items()}
    sp = open(os.path.join(hexdir, "PKHeX.Core", "Resources", "text", "other", "en", "text_Species_en.txt"),
              encoding="utf-8").read().split("\n")
    seen, forms = {}, {}
    for e in dex:
        num, form = e["num"], e.get("form") or ""
        k = seen.get(num, 0)
        seen[num] = k + 1
        n = FORM_MAP[num][form] if num in FORM_MAP and form in FORM_MAP[num] else k
        raw = e["species"] + ("-" + form.replace(" ", "-") if form else "")
        name = ren.get(to_id(raw), raw)
        base = sp[num]
        label = name[len(base) + 1:] if name.startswith(base + "-") else ("" if name == base else name)
        if label:
            forms.setdefault(num, {})[n] = label
    for num, rows in EXTRA_FORMS.items():
        for n, label in rows:
            forms.setdefault(num, {})[n] = label
    esc = lambda t: t.replace("\\", "\\\\").replace('"', '\\"')
    rows = ["        [%d] = new (int, string)[] { %s }," % (num, ", ".join('(%d, "%s")' % (n, esc(l)) for n, l in sorted(v.items())))
            for num, v in sorted(forms.items())]
    cs = ("// Generated by tools/port_swelthex.py in the Remix calc repo: the calc's form names (Gen 7).\n"
          "using System.Collections.Generic;\n\nnamespace PKHeX.Core;\n\n"
          "public static class RemixForms\n{\n"
          "    public static readonly Dictionary<ushort, (int Form, string Name)[]> Names = new()\n    {\n"
          + "\n".join(rows) + "\n    };\n\n"
          "    public static string[] Apply(ushort species, string[] list)\n    {\n"
          "        if (!Names.TryGetValue(species, out var names))\n            return list;\n"
          "        var result = new List<string>(list);\n"
          "        foreach (var (form, name) in names)\n        {\n"
          "            if (FormInfo.IsTotemForm(species, (byte)form, EntityContext.Gen7) && !(species == 20 && form == 2))\n"
          "                continue; // Remix: Totem forms can't be picked (except Raticate's Plague form, which uses that slot)\n"
          "            while (result.Count <= form)\n                result.Add(string.Empty);\n"
          "            result[form] = name;\n        }\n"
          "        return result.ToArray();\n    }\n}\n")
    report.append("form names: %d species with calc form names" % len(forms))
    if not dry:
        open(os.path.join(hexdir, "PKHeX.Core", "PKM", "Util", "Conversion", "RemixForms.cs"), "w", encoding="utf-8").write(cs)


# ---- type colors + type icons: the calc's palette (src/js/remix_type_colors.js) and its type-pill look
# (gradient from 30% toward white at the top down to the colour, rounded, bold white text with a dark shadow)
TYPE_ORDER = ["Normal", "Fighting", "Flying", "Poison", "Ground", "Rock", "Bug", "Ghost", "Steel",
              "Fire", "Water", "Grass", "Electric", "Psychic", "Ice", "Dragon", "Dark", "Fairy"]


def type_theme(calc, hexdir, dry, report):
    from PIL import Image, ImageDraw, ImageFont
    src = open(os.path.join(calc, "src", "js", "remix_type_colors.js"), encoding="utf-8").read()
    colors = json.loads(re.search(r"var REMIX_TYPE_COLORS = (\{.*?\});", src).group(1))
    rgb = {t: tuple(int(colors[t][i:i + 2], 16) for i in (1, 3, 5)) for t in TYPE_ORDER}

    # TypeColor.cs: the colour PKHeX tints type things with (Hidden Power box, slot backgrounds)
    path = os.path.join(hexdir, "PKHeX.Drawing.PokeSprite", "Util", "TypeColor.cs")
    cs = open(path, encoding="utf-8").read()
    for t in TYPE_ORDER:
        cs = re.sub(r"(\n\s*%s\s*=> Color\.FromArgb\()[^)]*\)" % t, lambda m: m.group(1) + "%03d, %03d, %03d)" % rgb[t], cs)
    if not dry:
        open(path, "w", encoding="utf-8", newline="").write(cs)

    fonts = os.path.join(os.environ.get("WINDIR", r"C:\Windows"), "Fonts")
    font = ImageFont.truetype(os.path.join(fonts, "verdanab.ttf"), 11)
    out = os.path.join(hexdir, "PKHeX.Drawing.Misc", "Resources", "img", "types", "wide")
    for i, t in enumerate(TYPE_ORDER):
        w, h, r = 100, 20, 9
        top = tuple(round(c + (255 - c) * 0.3) for c in rgb[t])
        grad = Image.new("RGBA", (w, h))
        gd = ImageDraw.Draw(grad)
        for y in range(h):
            k = y / (h - 1)
            gd.line([(0, y), (w, y)], fill=tuple(round(top[j] + (rgb[t][j] - top[j]) * k) for j in range(3)) + (255,))
        mask = Image.new("L", (w, h))
        ImageDraw.Draw(mask).rounded_rectangle([0, 0, w - 1, h - 1], r, fill=255)
        pill = Image.new("RGBA", (w, h))
        pill.paste(grad, (0, 0), mask)
        d = ImageDraw.Draw(pill)
        d.rounded_rectangle([0, 0, w - 1, h - 1], r, outline=(0, 0, 0, 150))
        label = t.upper()
        tw = d.textlength(label, font=font)
        x, y = (w - tw) / 2, 3
        for dx, dy in ((0, 1), (1, 1), (-1, 0), (1, 0), (0, -1)):
            d.text((x + dx, y + dy), label, font=font, fill=(0, 0, 0, 170))
        d.text((x, y), label, font=font, fill=(255, 255, 255, 255))
        if not dry:
            pill.save(os.path.join(out, "type_wide_%02d.png" % i))
    report.append("type colors + %d calc-style type icons" % len(TYPE_ORDER))
    # stat colour palette (one colour per 10 base-stat points) for the base-stat bars
    stat = open(os.path.join(calc, "src", "js", "remix_stat_colors.js"), encoding="utf-8").read()
    pal = json.loads(re.search(r"var REMIX_STAT_COLORS = (\[.*?\]);", stat).group(1))
    cols = ", ".join("Color.FromArgb(%d, %d, %d)" % tuple(int(h[i:i + 2], 16) for i in (1, 3, 5)) for h in pal)
    scs = ("// Generated by tools/port_swelthex.py in the Remix calc repo from src/js/remix_stat_colors.js (one colour per 10 points).\n"
           "using System;\nusing System.Drawing;\n\nnamespace PKHeX.WinForms;\n\npublic static class RemixStatColors\n{\n"
           "    private static readonly Color[] Palette = { " + cols + " };\n\n"
           "    public static Color Get(int stat) => Palette[Math.Clamp(stat / 10, 0, Palette.Length - 1)];\n}\n")
    if not dry:
        open(os.path.join(hexdir, "PKHeX.WinForms", "Util", "RemixStatColors.cs"), "w", encoding="utf-8").write(scs)


# ---- legal moves per Pokemon (for SweltHex's "Only legal moves"): RemixLearn.bin, embedded in SweltHex.
# Records: species u16, form u8, count u16, move ids u16 x count (level-up + TM + tutor from remix-data/learnsets.json).
def remix_learnsets(calc, hexdir, dry, report):
    from sync_personal import FORM_MAP
    data = os.path.join(calc, "remix-data")
    dex = json.load(open(os.path.join(data, "pokedex.json"), encoding="utf-8"))
    learn = json.load(open(os.path.join(data, "learnsets.json"), encoding="utf-8"))
    seen, out, rows = {}, bytearray(), 0
    for e, row in zip(dex, learn):
        num, form = e["num"], e.get("form") or ""
        k = seen.get(num, 0)
        seen[num] = k + 1
        n = FORM_MAP[num][form] if num in FORM_MAP and form in FORM_MAP[num] else k
        moves = sorted({m[0] + 1 for m in row if isinstance(m, list) and m and m[0] >= 0})
        out += struct.pack("<HBH", num, n, len(moves)) + b"".join(struct.pack("<H", m) for m in moves)
        rows += 1
    report.append("legal move lists: %d Pokemon/forms" % rows)
    if not dry:
        open(os.path.join(hexdir, "PKHeX.WinForms", "Resources", "RemixLearn.bin"), "wb").write(out)


# ---- move PP: PKHeX keeps the Gen 7 base PP in code (MoveInfo7.MovePP_SM); rebuilt from the game's move data (a/0/1/1, byte 5 = PP)
def move_pp(romfs, hexdir, dry, report):
    from refresh_move_extras import mini_pack
    path = os.path.join(hexdir, "PKHeX.Core", "Moves", "MoveInfo7.cs")
    src = open(path, encoding="utf-8").read()
    m = re.search(r"(MovePP_SM => new byte\[\]\s*\{)(.*?)(\};)", src, re.S)
    old = [int(x) for x in re.findall(r"\d+", m.group(2))]
    moves = mini_pack(garc_files(os.path.join(romfs, "a", "0", "1", "1"))[0])
    pp = {i: m[5] for i, m in enumerate(moves)}
    # move types too (byte 0, PKHeX type order), for the type-coloured move pills
    types = ", ".join(str(m[0]) for m in moves)
    tcs = ("// Generated by tools/port_swelthex.py in the Remix calc repo: each move's type from the game's move data.\n"
           "using System;\n\nnamespace PKHeX.Core;\n\npublic static class RemixMoveTypes\n{\n"
           "    public static ReadOnlySpan<byte> Types => new byte[] { " + types + " };\n\n"
           "    public static int Get(ushort move) => move < Types.Length ? Types[move] : -1;\n}\n")
    if not dry:
        open(os.path.join(hexdir, "PKHeX.Core", "Moves", "RemixMoveTypes.cs"), "w", encoding="utf-8").write(tcs)
    new = [pp.get(i, old[i]) if i else 0 for i in range(len(old))]
    rows = [", ".join("%02d" % v for v in new[k:k + 20]) for k in range(0, len(new), 20)]
    body = "\n" + ",\n".join("        " + r for r in rows) + ",\n    "
    report.append("move PP: %d of %d moves changed" % (sum(1 for a, b in zip(old, new) if a != b), len(new)))
    if not dry:
        open(path, "w", encoding="utf-8", newline="").write(src[:m.start(2)] + body + src[m.end(2):])


# ---- sprites: the calc's Remix minisprites and item icons (same naming as the DoozDex sidebar build)
SPRITE_ALIAS = {"nidoranf": "nidoran-f", "nidoranm": "nidoran-m", "basculinblue": "basculin-blue-striped",
                "zygarde50": "zygarde", "mimikyubusted": "mimikyu", "mimikyubustedtotem": "mimikyu",
                "deerling": "deerling-summer", "sawsbuck": "sawsbuck-summer"}


def to_id(n):
    return re.sub(r"[^a-z0-9]", "", n.lower())


def sprite_file(name):
    """Port of remixSpriteFile() in src/js/remix_minisprite.js (same as doozdex-sidebar/build_data.py)."""
    n = re.sub(r"[ _]+", "-", name.lower())
    n = re.sub(r"[.’':%]", "", n)
    n = n.replace("minior-pink", "minior-red").replace("dusk-mane", "dusk").replace("dawn-wings", "dawn").replace("-totem", "")
    n = "".join(c for c in unicodedata.normalize("NFD", n) if not unicodedata.combining(c))
    return {"aegislash-shield": "aegislash", "vivillon-pokeball": "vivillon-poke-ball",
            "minior-meteor": "minior", "starvia": "staravia"}.get(n, n)


MALE_ONLY = [519, 520, 521, 667, 668]  # Pidove, Tranquill, Unfezant, Litleo, Pyroar

EXTRA_SPRITES = {(19, 1): "geodude-steam", (201, 0): "unown-u", (201, 20): "unown-u"}
VIVILLON = ["icy-snow", "polar", "tundra", "continental", "garden", "elegant", "", "modern", "marine", "archipelago",
            "high-plains", "sandstorm", "river", "monsoon", "savanna", "sun", "ocean", "jungle", "fancy", "poke-ball"]
SILVALLY = ["", "fighting", "flying", "poison", "ground", "rock", "bug", "ghost", "steel", "fire", "water", "grass",
            "electric", "psychic", "ice", "dragon", "dark", "fairy"]


def extra_sprites():
    out = dict(EXTRA_SPRITES)
    for n, v in enumerate(VIVILLON):
        out[(666, n)] = "vivillon-" + v if v else "vivillon"
    for n, t in enumerate(SILVALLY):
        out[(773, n)] = "silvally"  # every type uses the default Gen 7 Silvally sprite (for now)
    return out


def register_sprites(hexdir, dry, report):
    """PKHeX only loads a box sprite that is listed in the sprite project's Resources.resx (b_20-2.png -> "b_20_2").
    Sprites for forms vanilla PKHeX never had (Raticate's Plague form in the Totem slot...) are added here; without
    an entry PKHeX shows its fallback (the base sprite with a Poke Ball)."""
    resx = os.path.join(hexdir, "PKHeX.Drawing.PokeSprite", "Properties", "Resources.resx")
    folder = os.path.join(hexdir, "PKHeX.Drawing.PokeSprite", "Resources", "img", "Big Pokemon Sprites")
    text = open(resx, encoding="utf-8").read()
    have = set(re.findall(r'<data name="(b_[^"]+)"', text))
    add = []
    for f in sorted(os.listdir(folder)):
        m = re.match(r"(b_[\w-]+)\.png$", f)
        if m and m.group(1).replace("-", "_") not in have:
            add.append((m.group(1).replace("-", "_"), f))
    entry = ('  <data name="%s" type="System.Resources.ResXFileRef, System.Windows.Forms">\n'
             '    <value>..\\Resources\\img\\Big Pokemon Sprites\\%s;System.Drawing.Bitmap, System.Drawing, Version=4.0.0.0, '
             'Culture=neutral, PublicKeyToken=b03f5f7f11d50a3a</value>\n  </data>\n')
    if add and not dry:
        text = text.replace("</root>", "".join(entry % a for a in add) + "</root>", 1)
        open(resx, "w", encoding="utf-8", newline="").write(text)
    report.append("sprite resources: %d new box sprites registered (%s)" % (len(add), ", ".join(a[0] for a in add[:12])))


def write_sprite(icon, num, n, img, dry):
    """b_<num>[-<form>].png: the minisprite at box scale, bottom-centre on PKHeX's 68x56 canvas. Any stock female
    variant (b_<num>f.png, e.g. Hippopotas) gets the same Remix sprite."""
    from PIL import Image
    icon = icon.convert("RGBA")
    box = icon.getbbox()
    if not box:
        return
    icon = box_scale(icon.crop(box))
    canvas = Image.new("RGBA", (68, 56))
    canvas.paste(icon, ((68 - icon.width) // 2, 56 - icon.height))
    if dry:
        return
    folder = os.path.join(img, "Big Pokemon Sprites")
    base = "b_%d%s" % (num, "-%d" % n if n else "")
    canvas.save(os.path.join(folder, base + ".png"))
    if os.path.exists(os.path.join(folder, base + "f.png")):
        canvas.save(os.path.join(folder, base + "f.png"))


def box_scale(icon):
    """Box sprites: every minisprite at 2x (same scale for all, so evolutions grow like in the DoozDex sidebar);
    the few that would overflow the 68x56 slot shrink just enough to fit (big ones touch the top)."""
    from PIL import Image
    s = min(2.0, 68 / icon.width, 56 / icon.height)
    return icon.resize((max(1, round(icon.width * s)), max(1, round(icon.height * s))), Image.NEAREST)


ITEM_ICON_OVERRIDE = {}  # e.g. {154: 458} while an item's own icon isn't in the game yet


def sprites(calc, hexdir, dry, report):
    from PIL import Image
    from sync_personal import FORM_MAP
    img = os.path.join(hexdir, "PKHeX.Drawing.PokeSprite", "Resources", "img")
    data = os.path.join(calc, "remix-data")
    dex = json.load(open(os.path.join(data, "pokedex.json"), encoding="utf-8"))
    ren = json.load(open(os.path.join(data, "species_renames.json"), encoding="utf-8")).get("rename", {})
    ren = {to_id(k): v for k, v in ren.items()}
    src = os.path.join(calc, "dist", "img", "pokesprite")
    seen, done, missing = {}, 0, []
    for e in dex:
        num, form = e["num"], e.get("form") or ""
        k = seen.get(num, 0)
        seen[num] = k + 1
        n = FORM_MAP[num][form] if num in FORM_MAP and form in FORM_MAP[num] else k
        raw = e["species"] + ("-" + form.replace(" ", "-") if form else "")
        name = ren.get(to_id(raw), raw)
        # renamed species keep their OLD sprite file (like the calc: Meowth-Alola -> "Meowth" uses meowth-alola.png);
        # default forms (Burmy-Plant, Gastrodon-West...) fall back to the base one
        cands = [raw, name] + ([e["species"]] if form and "Mega" not in form else [])
        f = next((c for c in (os.path.join(src, SPRITE_ALIAS.get(to_id(x), sprite_file(x)) + ".png") for x in cands)
                  if os.path.exists(c)), "")
        if not f:
            missing.append(name)
            continue
        write_sprite(Image.open(f), num, n, img, dry)
        done += 1
    # slots the calc has no entry for (Georupt Steam in the Alolan Rattata slot, Unown U, Vivillon/Silvally forms)
    silv = Image.open(os.path.join(src, "silvally.png")).convert("RGBA")
    silv_size = silv.crop(silv.getbbox()).size
    for (num, n), fname in extra_sprites().items():
        path = os.path.join(src, fname + ".png")
        if not os.path.exists(path):
            missing.append(fname)
            continue
        icon = Image.open(path).convert("RGBA")
        if num == 773:  # the recoloured Silvally sprites get the default Silvally's size
            icon = icon.crop(icon.getbbox()).resize(silv_size, Image.NEAREST)
        write_sprite(icon, num, n, img, dry)
        done += 1
    report.append("species sprites: %d written, %d without a calc sprite: %s" % (done, len(missing), ", ".join(missing[:40])))
    register_sprites(hexdir, dry, report)
    isrc, idone = os.path.join(calc, "dist", "img", "items"), 0
    for f in os.listdir(isrc):
        if not re.match(r"bitem_\d+\.png$", f):
            continue
        icon = Image.open(os.path.join(isrc, f)).convert("RGBA")
        box = icon.getbbox()
        if box and not dry:
            icon.crop(box).save(os.path.join(img, "Big Items", f))
        idone += bool(box)
    # items whose game icon isn't swapped yet: use another item's icon (Geothermal Rock 154 -> Magma Stone 458)
    for item, src_item in ITEM_ICON_OVERRIDE.items():
        icon = Image.open(os.path.join(isrc, "bitem_%d.png" % src_item)).convert("RGBA")
        if not dry:
            icon.crop(icon.getbbox()).save(os.path.join(img, "Big Items", "bitem_%d.png" % item))
    report.append("item icons: %d written (cropped like PKHeX's)" % idone)


if __name__ == "__main__":
    args = [x for x in sys.argv[1:] if not x.startswith("--")]
    main(args[0], args[1], "--dry" in sys.argv, args[2] if len(args) > 2 else None)
