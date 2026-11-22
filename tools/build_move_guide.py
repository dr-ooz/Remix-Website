"""Import the Move Guide from the Google Sheets web-page export (File > Download > Web page (.zip)).

    python tools/build_move_guide.py "<folder with Move Guide.html + resources/>"

Writes src/moveguide/move_guide.json (+ the sheet's own images into src/moveguide/img/). The page
(src/moveguide.template.html + src/js/remix_moveguide.js) draws it 1:1 like the sheet: same cells,
merges, colors and rich text, in Comfortaa. After this first import the JSON is the source: edit it
on the site (localhost: Edit guide -> Save to file) instead of re-importing, or re-import to start over.
"""
import html as H, json, os, re, shutil, sys

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
OUT_DIR = os.path.join(ROOT, "src", "moveguide")
MOVES = json.load(open(os.path.join(ROOT, "remix-data", "moves.json"), encoding="utf8"))
CATS = {m["name"].lower(): ["status", "physical", "special"][m["category"]] for m in MOVES}
CAT_ICON = "https://img.pokemondb.net/images/icons/move-%s.png"  # the icons the sheet's =image() uses

# Table of contents groups (from the sheet's own contents). Each name is a top-level category; the
# headers inside it become its sub-categories. CAT_MATCH = how the header itself starts, when it differs.
TOC_GROUPS = [
    ("Main Categories", ["Priority Attacking Moves", "Debuffing Moves", "Setup Moves"]),
    ("Attacking Moves With Drawbacks", ["Draco Meteor Variants", "Inaccurate Moves", "Recoil Moves",
        "Negative Priority Attacks", "Moves That Can't Be Used 2x in a Row"]),
    ("Other Damaging Moves", ["50% Critical Hit Rate Moves", "Multi-Hit Moves", "HP Draining Attacks", "Trapping Moves",
        "Generic Drawback Free Attacks", "Hex & Venoshock Variants", "Freeze-Dry Variants", "Changes Type", "Uses Higher Stat"]),
    ("Status Inflicting Moves", ["Sleep Inducing Moves", "Paralysis Inducing Moves", "Burn Inducing Moves", "Poison Inducing Moves"]),
    ("Other Miscellaneous Utility Moves", ["Pivot Moves", "Protect Variants", "Soak Variants", "Entry Hazards",
        "New Recovery Moves", "Weather & Terrain Interactions", "Move Choice Related", "Screens & Protective Effects",
        "Retaliation & Sacrificial Moves", "Misc. Field Moves", "Ability Changing", "Weather & Terrain Setting",
        "Redirection & Doubles Only Moves", "Assorted Status Moves", "AI / Trainer Only Moves", "Unused Moves/Animations"]),
]
CAT_MATCH = {"Inaccurate Moves": "Inaccurate Damaging Moves", "Negative Priority Attacks": "Negative Priority Moves",
    "50% Critical Hit Rate Moves": "50% Crit Rate Moves", "Changes Type": "Moves That Change Type",
    "Uses Higher Stat": "Moves That Use The Higher Stat", "Sleep Inducing Moves": "Sleep Moves",
    "Paralysis Inducing Moves": "Reliable Paralyzing Moves", "Burn Inducing Moves": "Reliable Burning Moves",
    "Poison Inducing Moves": "Reliable Poisoning Moves", "New Recovery Moves": "Recovery Moves",
    "Weather & Terrain Interactions": "Weather Interactions & Terrain Interactions", "Move Choice Related": "Move Choice Related Moves",
    "Retaliation & Sacrificial Moves": "Retaliation and Sacrificial Moves", "Misc. Field Moves": "Misc. Field Effects",
    "Ability Changing": "Ability Changing Moves", "Debuffing Moves": "\x00", "Setup Moves": "\x00"}


def font_pt(style):
    m = re.search(r"font-size:(\d+(?:\.\d+)?)pt", style or "")
    return float(m.group(1)) if m else 0


def main(src):
    s = open(os.path.join(src, "Move Guide.html"), encoding="utf8").read()
    s = s.replace("docs-Comfortaa", "Comfortaa")
    classes = dict(re.findall(r"\.ritz \.waffle \.(s\d+)\{([^}]*)\}", s))
    cols = [int(w) for w in re.findall(r'<th id="\d+C\d+" style="width:(\d+)px;"', s)]
    defs = re.search(r'<svg style="display:none;".*?</svg>', s, re.S).group(0)

    # rich-text span styles -> short shared classes (the export repeats the same style thousands of times)
    span_cls = {}

    def span_class(m):
        st = m.group(1)
        if st not in span_cls:
            span_cls[st] = "r%d" % len(span_cls)
        return '<span class="%s">' % span_cls[st]

    rows, img_votes, imgs = [], {}, []
    for tr in re.finditer(r'<tr(?: style="height: (\d+)px")?>(.*?)</tr>', s[s.find("<tbody>"):], re.S):
        height = int(tr.group(1) or 21)
        cells = []
        for td in re.finditer(r'<td class="(s\d+)"((?: (?:colspan|rowspan)="\d+")*)>(.*?)</td>', tr.group(2), re.S):
            cs = re.search(r'colspan="(\d+)"', td.group(2))
            rs = re.search(r'rowspan="(\d+)"', td.group(2))
            inner = re.sub(r'<span style="([^"]*)">', span_class, td.group(3))
            cells.append([td.group(1), int(cs.group(1)) if cs else 1, int(rs.group(1)) if rs else 1, inner])
        rows.append({"h": height, "c": cells})

    # category icons: the export has Google-hosted copies; work out which is which from the move in the row
    def text(h): return H.unescape(re.sub(r"<[^>]+>", "", h)).strip()
    def move_name(cell):
        t = text(cell[3]).split("\n")[0]
        t = t.split(">")[-1].split("(")[0].strip()
        return t.lower()
    for r in rows:
        for c in r["c"]:
            for url in re.findall(r'<img src="(https://lh3[^"]+)"', c[3]):
                base = url.split("=")[0]
                cat = CATS.get(move_name(r["c"][0])) if r["c"] else None
                if cat:
                    img_votes.setdefault(base, {}).setdefault(cat, 0)
                    img_votes[base][cat] += 1
    img_cat = {b: max(v, key=v.get) for b, v in img_votes.items()}
    for r in rows:
        for c in r["c"]:
            def fix_img(m):
                url = m.group(1)
                if url.startswith("https://lh3"):
                    cat = img_cat.get(url.split("=")[0])
                    return '<img class="mg-cat" src="%s" alt="%s">' % (CAT_ICON % cat, cat) if cat else ""
                name = os.path.basename(url)
                if not os.path.exists(os.path.join(src, "resources", name)):  # left out of the zip: a category icon
                    cat = CATS.get(move_name(r["c"][0])) if r["c"] else None
                    return '<img class="mg-cat" src="%s" alt="%s">' % (CAT_ICON % cat, cat) if cat else ""
                imgs.append(name)
                return '<img class="mg-img" src="./moveguide/img/%s" alt="">' % name
            c[3] = re.sub(r'<div style="width:\d+px;height:\d+px;"><img src="([^"]+)"[^>]*/></div>', fix_img, c[3])
            c[3] = re.sub(r'<img src="([^"]+)"[^>]*/>', fix_img, c[3])
            # "return to the top" links go to the site's table of contents; other sheet range links are dropped
            c[3] = re.sub(r'<a target="_blank" href="#rangeid=\d+">(.*?)</a>', r'<a href="#mg-toc">\1</a>', c[3], flags=re.S)

    # row kinds: big full-width cells are collapsible headers (h1 = type / big category, h2 = sub-category)
    def kind(r):
        if len(r["c"]) != 1 or r["c"][0][1] < 8:
            return "row"
        c = r["c"][0]
        pt = max([font_pt(classes.get(c[0]))] + [font_pt(st) for st, k in span_cls.items() if 'class="%s"' % k in c[3]])
        t = text(c[3])
        if t.startswith("Click here to return"):
            return "top"
        if pt >= 45:
            return "h1"
        if pt >= 25:
            return "h2"
        return "row"
    toc_at = next(i for i, r in enumerate(rows) if r["c"] and text(r["c"][0][3]).startswith("Table of Contents"))
    body_at = next(i for i, r in enumerate(rows) if r["c"] and re.match(r"All Normal Type Moves", text(r["c"][0][3])))
    for i, r in enumerate(rows):
        r["k"] = "intro" if i < toc_at else "toc" if i < body_at else kind(r)
    # the sheet's own table of contents stays (its cells link to their category, matched by text below)

    # ---- categories (after the 18 types): each sheet table-of-contents entry is its own top-level category,
    # every other header inside it is a sub-category; long "headers" are really notes.
    def title(r): return re.split(r"\n", text(r["c"][0][3].replace("<br>", "\n")))[0].strip()
    first_cat = next(i for i, r in enumerate(rows) if r["k"] in ("h1", "h2") and title(r).startswith("Priority Attacking Moves"))
    cat_names = [n for g in TOC_GROUPS for n in g[1]]
    def cat_of(t):
        for n in cat_names:
            if t.lower().startswith(CAT_MATCH.get(n, n).lower()):
                return n
    for i, r in enumerate(rows):
        if r["k"] not in ("h1", "h2"):
            continue
        t = title(r)
        if not t or len(t) > 60 or t.startswith("Misc. Status Moves"):
            r["k"] = "row"  # an empty spacer / a note set in header-sized text / a banner with nothing of its own under it
        elif i >= first_cat:
            r["k"] = "h1" if cat_of(t) else "h2"
            if cat_of(t):
                r["cat"] = cat_of(t)  # its name in the table of contents
    # Debuffing Moves / Setup Moves had no header of their own in the sheet: add one above their first part
    tpl = rows[first_cat]
    for name, before in (("Debuffing Moves", "Stat Debuffing Attacking Moves"), ("Setup Moves", "Stat Boosting Attacking Moves")):
        at = next(i for i, r in enumerate(rows) if r["k"] in ("h1", "h2") and title(r).startswith(before))
        rows.insert(at, {"k": "h1", "cat": name, "h": tpl["h"], "c": [[tpl["c"][0][0], tpl["c"][0][1], 1, name]]})
    toc = [{"name": g[0], "cats": g[1]} for g in TOC_GROUPS]
    norm = lambda t: re.sub(r"[^a-z0-9%&']+", " ", t.lower()).strip()
    for r in rows:
        if r["k"] != "toc":
            continue
        for c in r["c"]:
            c[3] = re.sub(r"<a [^>]*>(.*?)</a>", lambda m: m.group(1), c[3], flags=re.S)
            t = norm(text(c[3].replace("<br>", " ")).replace("->", ""))
            hit = next((n for n in cat_names if t.startswith(norm(n))), None)
            if hit:
                c.append({"go": hit})
    # one big dropdown around the 18 type sections
    at = next(i for i, r in enumerate(rows) if r["k"] == "h1" and title(r).startswith("All Normal Type Moves"))
    rows.insert(at, {"k": "h0", "h": tpl["h"], "c": [[tpl["c"][0][0], tpl["c"][0][1], 1, "All Moves Organized by Type"]]})

    css = "".join(".mg .%s{%s}" % (k, v) for k, v in classes.items()) + \
          "".join(".mg .%s{%s}" % (k, st) for st, k in span_cls.items())
    os.makedirs(os.path.join(OUT_DIR, "img"), exist_ok=True)
    for name in set(imgs):
        shutil.copy(os.path.join(src, "resources", name), os.path.join(OUT_DIR, "img", name))
    # the sheet's old logo -> the new full Ultra Remix logo
    shutil.copy(os.path.join(src, "RemixLogoFull.png"), os.path.join(OUT_DIR, "img", "RemixLogoFull.png"))
    for r in rows:
        for c in r["c"]:
            c[3] = c[3].replace("./moveguide/img/cellImage_2078001082_0.jpg", "./moveguide/img/RemixLogoFull.png")
    out = {"cols": cols, "css": css, "defs": defs, "rows": rows, "toc": toc, "theme": {}}
    # keep what was already edited on the site: the intro rows and the colors
    old_path = os.path.join(OUT_DIR, "move_guide.json")
    if os.path.exists(old_path):
        old = json.load(open(old_path, encoding="utf8"))
        old_intro = [r for r in old["rows"] if r["k"] == "intro"]
        if old_intro and len(old_intro) == len([r for r in rows if r["k"] == "intro"]):
            out["rows"] = old_intro + [r for r in rows if r["k"] != "intro"]
        out["theme"] = old.get("theme") or {}
    json.dump(out, open(os.path.join(OUT_DIR, "move_guide.json"), "w", encoding="utf8"), ensure_ascii=False, separators=(",", ":"))
    kinds = {}
    for r in rows:
        kinds[r["k"]] = kinds.get(r["k"], 0) + 1
    print("move guide:", len(rows), "rows", kinds, "| icons:", img_cat, "| size", os.path.getsize(os.path.join(OUT_DIR, "move_guide.json")))


if __name__ == "__main__":
    main(sys.argv[1])
