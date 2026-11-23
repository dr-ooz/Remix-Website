"""Builds the Signature Item Order board (itemboard/index.html) from the sidebar's data.

    python tools/build_item_board.py

Cards = signature items in the site's current Featured order (src/doozdex-sidebar/items.json), each with its icon
(dist/img/items, src/img/items overrides first) and its holders' sidebar sprites (src/doozdex-sidebar/calcsprites).
Megas are left out (they hold their Mega Stone). The page's Submit writes db doc orders/items = {items: [...]};
save that to remix-data/item_order.json and build_data.py uses it as the Featured order.
"""
import base64, json, os, re, unicodedata

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, "..")
SB = os.path.join(ROOT, "src", "doozdex-sidebar")


def to_id(s):
    return re.sub(r"[^a-z0-9]", "", unicodedata.normalize("NFD", s).lower())


def uri(path):
    return "data:image/png;base64," + base64.b64encode(open(path, "rb").read()).decode()


info = json.load(open(os.path.join(SB, "items.json"), encoding="utf8"))
sig = json.load(open(os.path.join(ROOT, "remix-data", "signature_items.json"), encoding="utf8"))
dex = json.load(open(os.path.join(SB, "data.json"), encoding="utf8"))["pokedex"]
by_name = {p["name"]: (pid, p) for pid, p in dex.items()}

items, sprites = [], {}
for name in sorted(info, key=lambda n: info[n].get("order", 1e6)):
    icon_id = info[name].get("icon")
    icon = None
    for d in (os.path.join(ROOT, "src", "img", "items"), os.path.join(ROOT, "dist", "img", "items")):
        f = os.path.join(d, "bitem_%s.png" % icon_id)
        if icon_id and os.path.exists(f):
            icon = uri(f)
            break
    holders = []
    hs = [h for h in sig.get(name, {}).get("holders", []) if h in by_name and not re.search(r"-Mega(-[XY])?$", h)]
    for h in sorted(hs, key=lambda h: by_name[h][1].get("dexOrder", 1e6)):
        pid = by_name[h][0]
        f = os.path.join(SB, "calcsprites", pid + ".png")
        if os.path.exists(f):
            holders.append(pid)  # names only: the board shows items alone (no sprites)
    items.append({"name": name, "icon": icon or "", "holders": holders})

src = open(os.path.join(ROOT, "itemboard", "board.src.html"), encoding="utf8").read()
page = src.replace("__ITEMS__", json.dumps(items, ensure_ascii=False)).replace("__SPRITES__", json.dumps(sprites, ensure_ascii=False))
open(os.path.join(ROOT, "itemboard", "index.html"), "w", encoding="utf8").write(page)
print("item board:", len(items), "items,", len(sprites), "sprites,", len(page) // 1024, "KB")
