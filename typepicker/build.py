# Assemble typepicker/index.html: icons (white symbols from the sidebar copy) + calc colors + image colors.
import json, os, re
here = os.path.dirname(os.path.abspath(__file__)); calc = os.path.dirname(here)
types = "Normal Fire Grass Water Ice Electric Psychic Ghost Dark Fairy Fighting Rock Ground Steel Poison Bug Flying Dragon".split()
icons = {t: open(os.path.join(calc, "doozdex-sidebar/alia/public/icons", t + ".svg"), encoding="utf8").read().strip() for t in types}
css = open(os.path.join(calc, "src/css/main.css"), encoding="utf8").read()
calc_c = dict(re.findall(r'select\.type-pill option\[value="(\w+)"\] \{ background: (#[0-9a-fA-F]+)', css))
image = json.load(open(os.path.join(here, "image_colors.json"), encoding="utf8"))
s = open(os.path.join(here, "picker.src.html"), encoding="utf8").read()
s = s.replace("__ICONS__", json.dumps(icons)).replace("__CALC__", json.dumps({t: calc_c[t].lower() for t in types})).replace("__IMAGE__", json.dumps(image))
open(os.path.join(here, "index.html"), "w", encoding="utf8").write(s)
print("ok", len(s))
