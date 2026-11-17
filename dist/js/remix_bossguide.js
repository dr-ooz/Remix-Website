// Detailed Team Layout (Boss Guide): the enemy trainer's team, then your team, as big cards under the calc
// (same width as the 3 calc columns; the small team boxes stay). Header toggle "Detailed Team Layout".
// Each layout is drawn at a fixed design width (like the boss-guide sheet) and scaled to fit.
// Data: SETDEX_SM (trainer sets) + REMIX_TRAINER_INFO / REMIX_MOVE_BLURBS / REMIX_ITEM_DESCS...
// from remix_guide_data.js (tools/build_remix_trainers.js).
// Move BP shown = what the switch-in AI sees (REMIX_MOVE_AI_BP), underlined when hits/crit change it.
// Art: img/art/<id>.webp (tools/import_art.py) -> PokemonDB dream-world ("vector") art -> minisprite.
// Edit mode (only on localhost or with ?edit=1 in the URL): type in any cell, resize text/art/item icon,
// Alt+drag any part to move it on every card, drag moves to reorder them. Edits are kept
// in this browser (localStorage remixGuideEdits); "Save to file" downloads guide_edits.json -> put it in
// remix-data/ and rebuild to make them permanent.
var remixDetailed = true; // on by default; turning it off is remembered
try { remixDetailed = localStorage.getItem("remixDetailedLayout") !== "0"; } catch (e) {}
var bgEditing = false, bgSelected = null;
var BG_CAN_EDIT = /^(localhost|127\.0\.0\.1|\[::1\]|)$/.test(location.hostname) || /[?&]edit=1/.test(location.search);
var bgShowMine = true;
try { bgShowMine = localStorage.getItem("remixGuideMine") !== "0"; } catch (e) {}
$(document).on("click", "#bg-row .bg-mine-toggle", function () {
	bgShowMine = !bgShowMine;
	try { localStorage.setItem("remixGuideMine", bgShowMine ? "1" : "0"); } catch (e) {}
	remixRenderBossGuide();
});
var BG_DESIGN_W = 1620; // px width the layout is designed at (3 cards across, like the sheet)

// Type colors (.bg-t-<Type> classes) come from js/remix_type_colors.js.
var BG_STATS = [["hp", "HP"], ["at", "Atk"], ["df", "Def"], ["sa", "Sp. A"], ["sd", "Sp. D"], ["sp", "Spe"]];
var BG_EV_NAMES = {hp: "HP", at: "Atk", df: "Def", sa: "Sp. Atk", sd: "Sp. Def", sp: "Speed"};

function bgId(s) { return String(s || "").normalize("NFD").toLowerCase().replace(/[^a-z0-9]/g, ""); }
function bgEsc(s) {
	return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
		return {"&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;"}[c];
	});
}

// ---- edits (baked file + this browser) ----
var bgEdits = {};
try { bgEdits = JSON.parse(localStorage.getItem("remixGuideEdits") || "{}"); } catch (e) {}
function bgAllEdits() { return typeof REMIX_GUIDE_EDITS !== "undefined" ? REMIX_GUIDE_EDITS : {}; }
function bgEdit(k) { return $.extend({}, bgAllEdits()[k] || {}, bgEdits[k] || {}); }
function bgSaveEdits() { try { localStorage.setItem("remixGuideEdits", JSON.stringify(bgEdits)); } catch (e) {} }
function bgSetEdit(k, field, val) {
	bgEdits[k] = bgEdits[k] || {};
	if (val == null || val === "") delete bgEdits[k][field]; else bgEdits[k][field] = val;
	bgSaveEdits();
}
// Editable text cell. fit = shrink to one line. data-tk = its part name (for Alt+drag positioning).
function bgEd(tag, cls, key, text, fit) {
	var e = bgEdit(key), t = e.t != null ? e.t : text;
	return "<" + tag + " class='bg-ed " + cls + (fit ? " bg-fit" : "") + "' data-tk='" + cls.split(" ")[0] + "' data-ek='" +
		bgEsc(key) + "' data-def='" + bgEsc(text) + "'" + (e.fs ? " data-fs='" + e.fs + "' style='font-size:" + e.fs + "px'" : "") + ">" +
		bgEsc(t) + "</" + tag + ">";
}

// Template edits ("tpl:<part>": dx/dy offset, size) apply to that part on every card
function bgTplStyle() {
	var all = $.extend({}, bgAllEdits(), bgEdits), css = "";
	Object.keys(all).forEach(function (k) {
		if (k.indexOf("tpl:") !== 0) return;
		var e = bgEdit(k), part = k.slice(4).replace(/[^\w-]/g, "");
		if (e.dx || e.dy) css += "#bg-row ." + part + "{position:relative;left:" + (e.dx || 0) + "px;top:" + (e.dy || 0) + "px}\n";
		if (e.fs && part === "bg-itemicon") css += "#bg-row .bg-itemicon{width:" + e.fs + "px;height:" + e.fs + "px}\n";
	});
	$("#bg-tpl-style").text(css);
}

// ---- stat colors: the site-wide palette in remix_stat_colors.js (finalized, no in-page editor) ----
function bgStatColor(v) { return remixStatColor(v); }

function bgEvText(evs) {
	var parts = [], max = [];
	BG_STATS.forEach(function (st) {
		var v = evs && evs[st[0]] || 0;
		if (v >= 252) max.push(BG_EV_NAMES[st[0]]);
		else if (v) parts.push(v + " " + BG_EV_NAMES[st[0]]);
	});
	if (max.length) parts.unshift("Max " + max.join("/"));
	var text = parts.join(", ") || "No EVs";
	if (parts.length <= 2 && text.length <= 28) return text;
	// long or uneven spreads: short stat names and slashes, so they still fit (and wrap if needed)
	var sp = [], smax = [];
	BG_STATS.forEach(function (st) {
		var v = evs && evs[st[0]] || 0;
		if (v >= 252) smax.push(BG_EV_SHORT[st[0]]);
		else if (v) sp.push(v + " " + BG_EV_SHORT[st[0]]);
	});
	if (smax.length) sp.unshift("Max " + smax.join("/"));
	if (sp.length <= 3) return sp.join(" / ");
	// 4+ parts: two even rows (e.g. 3 + 3), each shrunk to fit the cell's width
	var half = Math.ceil(sp.length / 2);
	return sp.slice(0, half).join(" / ") + String.fromCharCode(10) + sp.slice(half).join(" / ");
}
var BG_EV_SHORT = {hp: "HP", at: "Atk", df: "Def", sa: "Sp. A", sd: "Sp. D", sp: "Spe"};

// What each nature does (shown when hovering the nature)
var BG_NATURES = {
	Lonely: ["Atk", "Def"], Brave: ["Atk", "Spe"], Adamant: ["Atk", "Sp. Atk"], Naughty: ["Atk", "Sp. Def"],
	Bold: ["Def", "Atk"], Relaxed: ["Def", "Spe"], Impish: ["Def", "Sp. Atk"], Lax: ["Def", "Sp. Def"],
	Timid: ["Spe", "Atk"], Hasty: ["Spe", "Def"], Jolly: ["Spe", "Sp. Atk"], Naive: ["Spe", "Sp. Def"],
	Modest: ["Sp. Atk", "Atk"], Mild: ["Sp. Atk", "Def"], Quiet: ["Sp. Atk", "Spe"], Rash: ["Sp. Atk", "Sp. Def"],
	Calm: ["Sp. Def", "Atk"], Gentle: ["Sp. Def", "Def"], Sassy: ["Sp. Def", "Spe"], Careful: ["Sp. Def", "Sp. Atk"]
};
function bgNatureTip(n) {
	var e = BG_NATURES[n];
	return e ? n + ": +10% " + e[0] + ", -10% " + e[1] : (n || "Hardy") + ": no stat changes";
}

// pokemondb names its art differently for these (base forms with a form name, renamed Remix mons
// that kept the original look); Totems use their normal form's art
var BG_ART_SLUG = {
	"lycanroc": "lycanroc-midday", "oricorio": "oricorio-baile", "meowstic-f": "meowstic-female", "nidoran": "nidoran-m",
	"drugtrio": "dugtrio", "drumtrio": "dugtrio-alolan", "burmy-sand": "burmy-sandy", "wormadam-sand": "wormadam-sandy",
	"silvally": "silvally-normal"
};
function bgArt(species) {
	var id = bgId(species), list = typeof REMIX_ART !== "undefined" ? REMIX_ART : [];
	var mini = "./img/pokesprite/" + remixSpriteFile(species) + ".png";
	var slug = species.toLowerCase().normalize("NFD").replace(/[^a-z0-9 -]/g, "").replace(/ +/g, "-").replace(/-totem$/, "").replace(/-alola$/, "-alolan");
	slug = BG_ART_SLUG[slug] || slug;
	var urls = ["https://img.pokemondb.net/artwork/vector/large/" + slug + ".png",
		"https://img.pokemondb.net/artwork/vector/" + slug + ".png", mini];
	// local art: under the Pokemon's name, or its original name if Remix renamed it (Meloetta-Techno -> meloetta)
	var old = typeof REMIX_OLD_NAME_SEARCH !== "undefined" && REMIX_OLD_NAME_SEARCH[species] ? bgId(REMIX_OLD_NAME_SEARCH[species]) : "";
	if (list.indexOf(id) !== -1) urls.unshift("./img/art/" + id + ".webp");
	else if (old && list.indexOf(old) !== -1) urls.unshift("./img/art/" + old + ".webp");
	var e = bgEdit("art:" + species);
	return "<img class='bg-art' data-tk='bg-art' data-ek='art:" + bgEsc(species) + "' src='" + bgEsc(urls[0]) + "' data-fb='" +
		bgEsc(urls.slice(1).join("|")) + "' onerror='bgArtFail(this)' alt='' draggable='false'" +
		(e.fs ? " style='height:" + e.fs + "px;max-height:none'" : "") + ">";
}
function bgArtFail(img) {
	var fb = (img.getAttribute("data-fb") || "").split("|").filter(Boolean);
	if (!fb.length) { img.onerror = null; return; }
	img.setAttribute("data-fb", fb.slice(1).join("|"));
	if (fb[0].indexOf("pokesprite") !== -1) img.classList.add("bg-mini");
	img.src = fb[0];
}

// Stat bars in their own box under the nature row (same gradient bars as the sidebar). The box's
// top is 150, or the team's highest stat when one is higher (set per team in bgRenderSide). No BST.
// Bar scale: the box top is the team's highest stat (up to 150); a Pokemon with a stat over 150 uses its own.
function bgMonTop(bs) {
	var own = 0;
	BG_STATS.forEach(function (st) { if (bs && bs[st[0]] > own) own = bs[st[0]]; });
	return own > 150 ? own : Math.max(1, Math.min(150, bgTeamTop || 150));
}
var bgTeamTop = 150;
function bgSetTeamTop(cards) {
	bgTeamTop = 0;
	cards.forEach(function (c) {
		var bs = (pokedex[c.species] || {}).bs || {};
		BG_STATS.forEach(function (st) { if ((bs[st[0]] || 0) > bgTeamTop) bgTeamTop = bs[st[0]]; });
	});
	bgTeamTop = Math.min(150, bgTeamTop || 150);
}

// Abilities that boost certain moves: the ability name is underlined, and so are (in italics) the
// boosted moves. PLACEHOLDER lists (standard pulse / bite / punch moves) until Dooz sends the
// Remix move flags.
var BG_BOOSTED_MOVES = {
	"Mega Launcher": ["Aura Sphere", "Dark Pulse", "Dragon Pulse", "Water Pulse", "Origin Pulse", "Heal Pulse"],
	"Strong Jaw": ["Bite", "Crunch", "Fire Fang", "Ice Fang", "Thunder Fang", "Poison Fang", "Psychic Fangs", "Hyper Fang"],
	"Iron Fist": ["Bullet Punch", "Comet Punch", "Dizzy Punch", "Drain Punch", "Dynamic Punch", "Fire Punch", "Focus Punch",
		"Hammer Arm", "Ice Hammer", "Ice Punch", "Mach Punch", "Mega Punch", "Meteor Mash", "Power-Up Punch", "Shadow Punch",
		"Sky Uppercut", "Thunder Punch", "Plasma Fists"]
};

// Z-crystals and the berries that weaken a super-effective hit: item name bold, in its type's color.
var BG_ITEM_TYPES = {
	Normalium: "Normal", Firium: "Fire", Waterium: "Water", Electrium: "Electric", Grassium: "Grass", Icium: "Ice",
	Fightinium: "Fighting", Poisonium: "Poison", Groundium: "Ground", Flyinium: "Flying", Psychium: "Psychic",
	Buginium: "Bug", Rockium: "Rock", Ghostium: "Ghost", Dragonium: "Dragon", Darkinium: "Dark", Steelium: "Steel", Fairium: "Fairy",
	Chilan: "Normal", Occa: "Fire", Passho: "Water", Wacan: "Electric", Rindo: "Grass", Yache: "Ice", Chople: "Fighting",
	Kebia: "Poison", Shuca: "Ground", Coba: "Flying", Payapa: "Psychic", Tanga: "Bug", Charti: "Rock", Kasib: "Ghost",
	Haban: "Dragon", Colbur: "Dark", Babiri: "Steel", Roseli: "Fairy"
};
// "#1. Blastoise (Mega)": base name plus the form small and in italics, like the sidebar
function bgNameHtml(n, label, species) {
	var key = "nm:" + label + ":" + species, plain = "#" + n + ". " + species, html = bgEd("div", "bg-name", key, plain, true);
	var base = (pokedex[species] || {}).baseSpecies;
	if (bgEdit(key).t != null || !base || base === species || species.indexOf(base + "-") !== 0) return html;
	var form = species.slice(base.length + 1).replace(/-/g, " ");
	return html.replace(">" + bgEsc(plain) + "<", ">" + bgEsc("#" + n + ". " + base) + " <span class='bg-form'>(" + bgEsc(form) + ")</span><");
}

function bgItemName(item) {
	var name = item || "", w = name.split(" ")[0];
	var t = (/ Z$/.test(name) || / Berry$/.test(name)) && BG_ITEM_TYPES[w];
	var html = bgEd("span", "bg-itname" + (t ? " bg-ittyped" : ""), "it:" + name, name || "No item", true);
	return t && typeof REMIX_TYPE_COLORS !== "undefined" ? html.replace("<span ", "<span style='color:" + REMIX_TYPE_COLORS[t] + "' ") : html;
}
function bgBars(bs, top) {
	if (!bs) return "";
	return "<div class='bg-bars'>" + BG_STATS.map(function (st) {
		var v = bs[st[0]] || 0, c = bgStatColor(v);
		return "<div class='bg-bar' title='" + st[1] + "'><div class='bg-barfill' style='height:" + (Math.min(v, top) / top * 100) +
			"%;background:" + bgShade(c) + ";box-shadow:inset 0 3px 0 " + c + "'></div><span>" + v + "</span></div>";
	}).join("") + "</div>";
}

// Bar fill (same as the sidebar): a darker full-saturation shade at the bottom, the mid shade at
// 35% up, the full stat color from 87% up.
function bgShade(c) {
	return "linear-gradient(to top, " + bgShadeDark(c, 0.61) + " 0%, " + bgShadeDark(c) + " 35%, " + c + " 87%)";
}
function bgShadeDark(c, f) {
	f = f || 0.72;
	var n = parseInt(c.slice(1), 16), r = (n >> 16 & 255) / 255, g = (n >> 8 & 255) / 255, b = (n & 255) / 255;
	var mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn, h = 0, s = 0;
	if (d) { s = d / (1 - Math.abs(2 * l - 1)); h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h = (h * 60 + 360) % 360; }
	l *= f; s = d ? 1 : 0;
	var cc = (1 - Math.abs(2 * l - 1)) * s, x = cc * (1 - Math.abs((h / 60) % 2 - 1)), m = l - cc / 2;
	var rgb = h < 60 ? [cc, x, 0] : h < 120 ? [x, cc, 0] : h < 180 ? [0, cc, x] : h < 240 ? [0, x, cc] : h < 300 ? [x, 0, cc] : [cc, 0, x];
	return "#" + rgb.map(function (v) { return ("0" + Math.round((v + m) * 255).toString(16)).slice(-2); }).join("");
}

// The type a move really has for this set, worked out by the calc's own engine, so Revelation Dance
// (the user's primary type), -ate abilities and other Remix type changes show the right color.
var bgMoveTypeCache = {};
function bgMoveType(species, set, mv, fallback) {
	var key = species + "|" + (set.ability || "") + "|" + (set.item || "") + "|" + mv;
	if (key in bgMoveTypeCache) return bgMoveTypeCache[key];
	var type = fallback;
	try {
		var atk = new calc.Pokemon(gen, species, {ability: set.ability, item: set.item, nature: set.nature, level: 50});
		var def = new calc.Pokemon(gen, "Mew", {level: 50});
		var r = calc.calculate(gen, atk, def, new calc.Move(gen, mv), new calc.Field());
		if (r && r.move && r.move.type && r.move.type !== "???") type = r.move.type;
	} catch (e) {}
	return (bgMoveTypeCache[key] = type);
}

// a long Z-move name splits into two lines at the space nearest its middle ("Supersonic / Skystrike")
function bgZLines(name) {
	if (name.length <= 14 || name.indexOf(" ") === -1) return name;
	var mid = name.length / 2, best = -1;
	for (var i = 0; i < name.length; i++) if (name[i] === " " && (best < 0 || Math.abs(i - mid) < Math.abs(best - mid))) best = i;
	return name.slice(0, best) + String.fromCharCode(10) + name.slice(best + 1);
}

// ---- Z-crystals: show any eligible move as its Z-move (checkbox on the move, or all at once on the crystal) ----
var bgZOn = {};  // "label|species|slot" -> true while shown as a Z-move (this page view only)
var BG_GENERIC_Z = ["Breakneck Blitz", "All-Out Pummeling", "Supersonic Skystrike", "Acid Downpour", "Tectonic Rage",
	"Continental Crush", "Savage Spin-Out", "Never-Ending Nightmare", "Corkscrew Crash", "Inferno Overdrive", "Hydro Vortex",
	"Bloom Doom", "Gigavolt Havoc", "Shattered Psyche", "Subzero Slammer", "Devastating Drake", "Black Hole Eclipse", "Twinkle Tackle"];
// Remix items that work as Z-crystals: Gift Bag (Delibird: any Z-crystal, + Z-Celebrate), Clanging Scale
// (Kommo-o line: Drakonic Wave -> Clangorous Soulblaze), Light Ball (Pikachu: Catastropika)
var BG_SIG_Z = {
	"Gift Bag": {species: /^Delibird/, any: true},
	"Clanging Scale": {species: /^(Jangmo-o|Hakamo-o|Kommo-o)/, moves: {"Drakonic Wave": "Clangorous Soulblaze"}},
	"Light Ball": {species: /^Pikachu/, moves: {"Volt Tackle": "Catastropika"}}
};
var BG_TYPE_Z = {};
Object.keys(BG_ITEM_TYPES).forEach(function (w) { if (/ium$/.test(w)) BG_TYPE_Z[BG_ITEM_TYPES[w]] = w + " Z"; });
function bgZBlurb(name) { return (REMIX_MOVE_BLURBS[name] || "").replace(/^(\d+|Varies) BP(, | \| |$)/, "").replace(/^\| /, ""); }
function bgZMove(species, set, mv, type) {
	var item = set.item || "", sz = BG_SIG_Z[item];
	if (sz) {
		if (!sz.species.test(species)) return null;
		if (sz.moves) {
			var zn = sz.moves[mv];
			if (!zn) return null;
			var ai = REMIX_MOVE_AI_BP[zn];
			return {name: zn, bp: ai ? ai[1] : ((moves[zn] || {}).bp || 0), note: bgZBlurb(zn)};
		}
		// any type: use that type's crystal
		var md0 = moves[mv] || {}, mt = md0.type || type;
		if (md0.category === "Status") return bgZStatus(mv);
		return bgZMove(species, $.extend({}, set, {item: BG_TYPE_Z[type] || BG_TYPE_Z[mt]}), mv, type);
	}
	if (!/ Z$/.test(item)) return null;
	var md = moves[mv] || {}, crystalType = BG_ITEM_TYPES[item.split(" ")[0]];
	try {
		var z = new calc.Move(gen, mv, {useZ: true, item: item, species: species, ability: set.ability});
		// a type crystal (Groundium Z) only powers moves of its type; a signature crystal only its own Z-move
		var fits = crystalType ? crystalType === type : z && BG_GENERIC_Z.indexOf(z.name) === -1;
		if (fits && z && z.name && z.name !== mv && z.bp) {
			var blurb = (REMIX_MOVE_BLURBS[z.name] || "").replace(/^(\d+|Varies) BP(, | \| |$)/, "").replace(/^\| /, "");
			return {name: z.name, bp: z.bp, note: blurb};
		}
	} catch (e) {}
	// status moves: a Z-crystal of the move's type gives the move's Z-Effect
	var ztype = BG_ITEM_TYPES[item.split(" ")[0]];
	if (md.category === "Status" && ztype && ztype === (md.type || type)) return bgZStatus(mv);
	return null;
}
function bgZStatus(mv) {
	var desc = REMIX_MOVE_DESCS[mv] || "", m = desc.match(/Z[- ]?(?:Effect|Power|Move)?:?\s*(.+?)\.?$/i);
	return {name: "Z-" + mv, bp: 0, note: m ? "Z-Effect: " + m[1] : "Z-Effect"};
}
function bgZAllBox(species, label, set) {
	if (!/ Z$/.test(set.item || "") && !BG_SIG_Z[set.item]) return "";
	var slots = [0, 1, 2, 3].filter(function (i) { var mv = (set.moves || [])[i]; return mv && bgZMove(species, set, mv, (moves[mv] || {}).type); });
	if (!slots.length) return "";
	var all = slots.every(function (i) { return bgZOn[label + "|" + species + "|" + i]; });
	return "<label class='bg-zall" + (BG_SIG_Z[set.item] ? " bg-zall-side" : "") + "' title='Show all eligible moves as Z-moves'><input type='checkbox' data-zall='" + bgEsc(label + "|" + species) +
		"' data-slots='" + slots.join(",") + "'" + (all ? " checked" : "") + ">All Z</label>";
}
$(document).on("click", "#bg-row .bg-zchk, #bg-row .bg-zall", function (e) { e.stopPropagation(); });
$(document).on("change", "#bg-row .bg-zchk input", function () {
	var k = this.getAttribute("data-z");
	if (this.checked) bgZOn[k] = true; else delete bgZOn[k];
	remixRenderBossGuide();
});
$(document).on("change", "#bg-row .bg-zall input", function () {
	var base = this.getAttribute("data-zall"), on = this.checked;
	this.getAttribute("data-slots").split(",").forEach(function (i) { if (on) bgZOn[base + "|" + i] = true; else delete bgZOn[base + "|" + i]; });
	remixRenderBossGuide();
});

// Display order of a set's 4 moves (drag to reorder in edit mode)
function bgMoveOrder(key) {
	var o = bgEdit(key).v;
	return Array.isArray(o) && o.length === 4 ? o : [0, 1, 2, 3];
}

function bgCard(n, species, label, set, info) {
	var p = pokedex[species] || {}, types = p.types || [];
	var itemDesc = set.item ? (REMIX_ITEM_DESCS[set.item] || "") : "";
	var summary = set.item ? (REMIX_ITEM_SUMMARIES[set.item] || "") : "";
	var icon = set.item ? remixItemIcon(set.item) : "";
	var sigInfo = set.item && typeof REMIX_SIGNATURE_ITEMS !== "undefined" && REMIX_SIGNATURE_ITEMS[set.item];
	var sig = sigInfo && sigInfo.holders.indexOf(species) !== -1 ? (set.item === "Thick Club" ? "Doubles Attack" : "Signature Item!" + String.fromCharCode(10) + "Hover to see effects!") : "";
	var monNote = (info.mons || {})[species] || "";
	var ordKey = "ord:" + label + ":" + species;
	var h = "<div class='bg-card'>";
	h += "<div class='bg-head'>" + bgNameHtml(n, label, species) +
		"<div class='bg-types'>" + types.map(function (t) {
			return "<span class='bg-type bg-t-" + bgEsc(t) + "'>" + bgEsc(t) + "</span>";
		}).join("") + "</div></div>";
	h += "<div class='bg-body'><div class='bg-artbox' data-set='" + bgEsc(species + " (" + label + ")") +
		"' title='Click: load into the calc'>" + bgArt(species) + "</div><div class='bg-side'>";
	var abDesc = REMIX_ABILITY_DESCS[set.ability] || "", boosts = BG_BOOSTED_MOVES[set.ability];
	h += "<div class='bg-ability' data-tip='" + bgEsc(abDesc) + "'>" +
		bgEd("div", "bg-abname" + (boosts ? " bg-abboost" : ""), "ab:" + (set.ability || ""), set.ability || "—", true) +
		(boosts ? "<div class='bg-abhint'>(Underlined = Boosted)</div>" : "") + "</div>";
	// signature Z items (Gift Bag, Clanging Scale, Light Ball): "All Z" sits under the icon, leaving the note its room
	var sigZ = !!BG_SIG_Z[set.item], iconImg = icon ? "<img class='bg-itemicon' data-tk='bg-itemicon' src='" + icon + "' alt='' draggable='false'>" : "";
	h += "<div class='bg-item' data-tip='" + bgEsc(itemDesc) + "'>" +
		(sigZ ? "<div class='bg-iconcol'>" + iconImg + bgZAllBox(species, label, set) + "</div>" : iconImg) +
		"<div class='bg-itemtext'>" + bgItemName(set.item) + (sigZ ? "" : bgZAllBox(species, label, set)) +
		(sig || summary || bgEditing ? bgEd("small", "bg-itsum", "is:" + (set.item || ""), sig || summary, false) : "") + "</div></div>";
	h += "<div class='bg-natrow'>" + bgEd("div", "bg-natname", "natn:" + label + ":" + species, set.nature || "Hardy", true)
		.replace("<div ", "<div data-tip='" + bgEsc(bgNatureTip(set.nature)) + "' ") +
		bgEd("div", "bg-evs bg-wrapfit", "evs:" + label + ":" + species, bgEvText(set.evs), false) + "</div>";
	h += "<div class='bg-statbox'>" + bgBars(p.bs, bgMonTop(p.bs)) + "</div>";
	h += "</div></div>";
	h += "<div class='bg-moves' data-ord='" + bgEsc(ordKey) + "'>";
	bgMoveOrder(ordKey).forEach(function (slot) {
		var mv = (set.moves || [])[slot];
		var drag = bgEditing ? "<span class='bg-drag' draggable='true' title='Drag to move'>&#10303;</span>" : "";
		if (!mv) { h += "<div class='bg-move bg-empty' data-slot='" + slot + "'>" + drag + "—</div>"; return; }
		var md = moves[mv] || {}, type = bgMoveType(species, set, mv, md.type || "Normal");
		var ai = REMIX_MOVE_AI_BP[mv], bp = ai ? ai[0] : 0, boosted = ai && ai[0] !== ai[1];
		var why = ai ? "Switch-in AI power: " + ai[1] + (ai[2] > 1 ? " x" + ai[2] + " hits" : "") + (ai[3] ? " x1.5 always-crit" : "") +
			(boosted ? " = " + ai[0] : "") + ". " : "";
		var note = (REMIX_MOVE_BLURBS[mv] || "").replace(/^(\d+|Varies) BP(, | \| |$)/, "").replace(/^\| /, "");
		var zm = bgZMove(species, set, mv, type), zKey = label + "|" + species + "|" + slot, zOn = zm && bgZOn[zKey];
		var shown = mv, tip = why + (REMIX_MOVE_DESCS[mv] || "");
		if (zOn) { shown = zm.name; bp = zm.bp; boosted = false; note = zm.note; tip = zm.name + (zm.note ? ": " + zm.note : ""); }
		var zBox = "";
		h += "<div class='bg-move bg-t-" + bgEsc(type) + (zOn ? " bg-zon" : "") + "' data-slot='" + slot + "' data-tip='" + bgEsc(tip) + "'>" + drag + zBox +
			(zOn ? "<div class='bg-mvtop bg-wrapfit bg-zname' data-start='25'>" : "<div class='bg-mvtop bg-fit' data-tk='bg-mvtop'>") +
			(zOn ? "<b class='bg-mvname'>" + bgEsc(bgZLines(shown)) + "</b>" :
				bgEd("b", "bg-mvname" + (boosts && boosts.indexOf(mv) !== -1 ? " bg-boosted" : ""), "mv:" + mv + ":name", mv, false)) +
			(bp ? " <span class='bg-bp" + (boosted ? " bg-boost" : "") + "'>(" + bp + " BP)</span>" : "") + "</div>" +
			(zOn ? "<div class='bg-mvnote'>" + bgEsc(note) + "</div>" : bgEd("div", "bg-mvnote", "mv:" + mv + ":note", note, true)) + "</div>";
	});
	h += "</div>";
	if (monNote || bgEditing || bgEdit("mn:" + label + ":" + species).t) h += bgEd("div", "bg-note", "mn:" + label + ":" + species, monNote, false);
	return h + "</div>";
}

function bgToolbar() {
	if (!BG_CAN_EDIT) return "";
	return "<div class='bg-tools'><button type='button' class='btn bg-edit-btn'>" + (bgEditing ? "&#10003; Done editing" : "&#9998;&#65039; Edit layout") + "</button>" +
		(bgEditing ? "<span class='bg-tool-help'>Click a cell to type. A&minus;/A+ or Ctrl+wheel resizes text, art and the item icon. " +
			"Alt+drag moves a part on every card. Drag &#10303; to reorder moves.</span>" +
			"<button type='button' class='btn bg-size' data-d='-1'>A&minus;</button><button type='button' class='btn bg-size' data-d='1'>A+</button>" +
			"<button type='button' class='btn bg-reset' title='Undo your edits (text, size and position) on the selected part'>Reset selected</button>" +
			"<button type='button' class='btn bg-export' title='Download guide_edits.json: put it in remix-data/ and rebuild to make these edits permanent for everyone'>&#128190; Save to file</button>" : "") +
		"</div>";
}

// Trainer list for the title dropdown (enemy side)
function bgTrainerOptions(current) {
	if (typeof REMIX_TRAINER_INFO === "undefined") return "";
	return Object.keys(REMIX_TRAINER_INFO).sort(function (a, b) {
		return REMIX_TRAINER_INFO[a].id - REMIX_TRAINER_INFO[b].id;
	}).map(function (l) {
		var inf = REMIX_TRAINER_INFO[l], title = bgEdit("tt:" + l).t || inf.title;
		return "<option value='" + bgEsc(l) + "'" + (l === current ? " selected" : "") + ">" + bgEsc(title + " (#" + inf.id + ")") + "</option>";
	}).join("");
}

// One layout. side "p2" = enemy trainer team, "p1" = your box.
function bgTeam(side) {
	var cards = [], title, label = "", info = {mons: {}, notes: ""}, maxLv = 0, key;
	if (side === "p2") {
		var mons = typeof CURRENT_OPPOSING_MONS !== "undefined" ? CURRENT_OPPOSING_MONS || [] : [];
		if (!mons.length) return {empty: "Pick an enemy trainer set to see their team here."};
		label = get_current_trainer().replace(/\)$/, "");
		info = (typeof REMIX_TRAINER_INFO !== "undefined" && REMIX_TRAINER_INFO[label]) || {title: label, notes: "", mons: {}};
		title = info.title; key = label;
		mons.forEach(function (full) {
			var name = full.split("[")[0], species = name.substring(0, name.indexOf(" ("));
			var set = setdex[species] && setdex[species][label];
			if (set) cards.push({species: species, label: label, set: set, sub: set.sub_index || 0});
		});
		cards.sort(function (a, b) { return a.sub - b.sub; });
	} else {
		$(".player-poks img.trainer-pok").each(function () {
			var id = this.getAttribute("data-id") || "", species = id.substring(0, id.indexOf(" ("));
			var setName = id.substring(id.indexOf("(") + 1, id.lastIndexOf(")"));
			var set = setdex[species] && setdex[species][setName];
			if (set && !cards.some(function (c) { return c.species === species && c.label === setName; })) {
				cards.push({species: species, label: setName, set: set});
			}
		});
		if (!cards.length) return {empty: "Import your team (Import Sets From PkHex) to see it here."};
		title = "Your Team"; key = "__player";
	}
	cards.forEach(function (c) { maxLv = Math.max(maxLv, c.set.level || 0); });
	return {cards: cards, title: title, key: key, label: label, info: info, maxLv: maxLv};
}

// ---- Your Team: player layouts (Simple / Stats / Moves / Full), filled in by the player ----
// Everything typed here (title, notes, nicknames, flavor text, layout) is kept in this
// browser only (localStorage "remixPlayerTeam"); it's never part of the site's data.
var PL_KEY = "remixPlayerTeam";
// Layouts, from least to most info. Each lists the parts its cards show.
var PL_MODES = [["simple", "Simple"], ["stats", "Stats"], ["moves", "Moves"], ["movesstats", "Moves + Stats"],
	["items", "Items"], ["natures", "Natures + EVs"], ["guide", "Full w/o Move Data"], ["full", "Full"]];
var PL_PARTS = {
	simple: {}, stats: {bars: 1}, moves: {moves: 1}, movesstats: {bars: 1, moves: 1},
	items: {bars: 1, moves: 1, item: 1}, natures: {bars: 1, moves: 1, item: 1, nature: 1}
};
var plData = {};
try { plData = JSON.parse(localStorage.getItem(PL_KEY) || "{}") || {}; } catch (e) { plData = {}; }
function plSave() { try { localStorage.setItem(PL_KEY, JSON.stringify(plData)); } catch (e) {} }
function plMode() { return plData.mode || "full"; }
function plGet(group, k, def) { var g = plData[group] || {}; return g[k] != null ? g[k] : def; }
function plSet(group, k, v) { (plData[group] = plData[group] || {})[k] = v; plSave(); }

// contenteditable text the player owns; data-pl = "group|key", empty ones show their placeholder
function plEd(tag, cls, group, key, text, placeholder) {
	return "<" + tag + " class='pl-ed " + cls + "' contenteditable='true' spellcheck='false' data-pl='" + bgEsc(group + "|" + key) +
		"' data-ph='" + bgEsc(placeholder || "") + "'>" + bgEsc(text) + "</" + tag + ">";
}

function plHeader(t) {
	var modes = PL_MODES.map(function (m) {
		return "<button type='button' class='pl-mode" + (plMode() === m[0] ? " on" : "") + "' data-mode='" + m[0] + "'>" + m[1] + "</button>";
	}).join("");
	return "<div class='pl-bar'><span class='pl-bar-label'>Layout:</span>" + modes + "</div>" +
		"<div class='bg-title pl-title'>" + plEd("span", "pl-tt", "top", "title", plGet("top", "title", "Player's Team"), "Player's Team") +
		(t.maxLv ? " - <u>Level " + t.maxLv + "</u>" : "") + "</div>" +
		plEd("div", "pl-sub", "top", "sub", plGet("top", "sub", ""), "Click to write your rules or notes here (e.g. No changing team members unless one dies.)");
}

// Simple / Stats / Moves cards: nickname, types, flavor line, art (+ stat bars, + move names)
function plCard(n, c, mode) {
	var p = pokedex[c.species] || {}, types = p.types || [], k = c.species + "|" + c.label, part = PL_PARTS[mode] || {};
	// nickname: typed here, else the imported one (kept with the set), else the species
	var nick = plGet("nick", k, c.set.nickname || c.species);
	var h = "<div class='bg-card pl-card'>";
	h += plEd("div", "pl-nick bg-fit", "nick", k, nick, c.species);
	h += "<div class='bg-types pl-types'>" + types.map(function (t) {
		return "<span class='bg-type bg-t-" + bgEsc(t) + "'>" + bgEsc(t) + "</span>";
	}).join("") + "</div>";
	h += plEd("div", "pl-flavor bg-fit", "note", k, plGet("note", k, ""), "Click to add a note (e.g. Our \"Starter\", After Kiawe)");
	// stat bars sit inside the bottom of the art box, behind the art: 200 reaches a quarter of the way up
	// held item: just its icon in the art's top corner (hover for the name and effect)
	var itemIcon = part.item && c.set.item ? remixItemIcon(c.set.item) : "";
	h += "<div class='bg-artbox pl-art" + (part.bars ? " pl-hasbars" : "") + "' data-set='" + bgEsc(c.species + " (" + c.label + ")") + "' title='Click: load into the calc'>" + bgArt(c.species) +
		(itemIcon ? "<img class='pl-itemcorner' src='" + itemIcon + "' alt='' draggable='false' data-tip='" +
			bgEsc(c.set.item + ": " + (REMIX_ITEM_DESCS[c.set.item] || "")) + "'>" : "") +
		(part.bars && p.bs ? "<div class='pl-artbars'>" + bgBars(p.bs, 200) + "</div>" : "") + "</div>";
	if (part.nature) {
		h += "<div class='bg-natrow pl-natrow'><div class='bg-natname' data-tip='" + bgEsc(bgNatureTip(c.set.nature)) + "'>" + bgEsc(c.set.nature || "Hardy") + "</div>" +
			"<div class='bg-evs bg-wrapfit'>" + bgEsc(bgEvText(c.set.evs)) + "</div></div>";
	}
	if (part.moves) {
		h += "<div class='bg-moves pl-moves'>" + [0, 1, 2, 3].map(function (i) {
			var mv = (c.set.moves || [])[i];
			if (!mv) return "<div class='bg-move bg-empty'>&mdash;</div>";
			var type = bgMoveType(c.species, c.set, mv, (moves[mv] || {}).type || "Normal");
			return "<div class='bg-move bg-t-" + bgEsc(type) + "' data-tip='" + bgEsc(REMIX_MOVE_DESCS[mv] || "") + "'><b class='bg-mvtop bg-fit'>" + bgEsc(mv) + "</b></div>";
		}).join("") + "</div>";
	}
	return h + "</div>";
}
function plRenderHtml(t) {
	var mode = plMode(), h = plHeader(t) + "<div class='bg-grid pl-grid pl-" + mode + "'>", seen = {};
	plShared = {};
	t.cards.forEach(function (c) { if (seen[c.label]) plShared[c.label] = true; seen[c.label] = true; });
	t.cards.forEach(function (c, i) {
		// Guide = the boss guide card with move names only (CSS hides BP and blurbs); Full = the boss guide card
		h += mode === "full" || mode === "guide" ? bgCard(i + 1, c.species, c.label, c.set, t.info) : plCard(i + 1, c, mode);
	});
	return h + "</div>";
}

$(document).on("click", "#bg-row .pl-mode", function () {
	plData.mode = this.getAttribute("data-mode"); plSave(); bgRenderSide("p1"); bgScaleAll();
});
$(document).on("input", "#bg-row .pl-ed", function () {
	var parts = this.getAttribute("data-pl").split("|"), group = parts.shift();
	plSet(group, parts.join("|"), this.textContent);
});
// Enter finishes a line instead of adding new lines
$(document).on("keydown", "#bg-row .pl-ed", function (e) { if (e.key === "Enter") { e.preventDefault(); this.blur(); } });

function bgRenderSide(side) {
	var box = $(side === "p2" ? "#boss-guide" : "#boss-guide-p");
	var t = bgTeam(side), h;
	if (!t.empty) bgSetTeamTop(t.cards);
	if (t.empty && side === "p2") h = "<div class='bg-title'><span class='bg-tpick' title='Pick a trainer'><u class='bg-tt'>Choose a Trainer</u>" +
		"<span class='bg-caret'>&#9662;</span><span class='bg-tpick-hint'>Click to pick a trainer</span></span></div>" +
		"<div class='bg-empty-msg'>" + t.empty + "</div>";
	else if (t.empty) h = "<div class='bg-empty-msg'>" + t.empty + "</div>";
	else if (side === "p1" && !bgEditing) h = plRenderHtml(t);
	else {
		var title = bgEd("u", "bg-tt", "tt:" + t.key, t.title, false);
		if (side === "p2" && !bgEditing && t.info.id) {
			title = "<span class='bg-tpick' title='Pick another trainer'>" + title + "<span class='bg-caret'>&#9662;</span>" +
				"<span class='bg-tpick-hint'>Click to see another trainer</span></span>";
		}
		h = "<div class='bg-title'>" + title + (t.maxLv ? " - <u>Level " + t.maxLv + "</u>" : "") +
			(t.info.doubles ? " <span class='bg-dbl'>Doubles</span>" : "") + "</div>" +
			(side === "p2" ? "<div class='bg-guideinfo'>Hover over any Ability, Item or Move to see what it does in detail. " +
				"Click a Pok&eacute;mon to jump to its Pok&eacute;mon changes.</div>" : "") + "<div class='bg-grid'>";
		t.cards.forEach(function (c, i) { h += bgCard(i + 1, c.species, c.label, c.set, t.info); });
		h += "</div>";
		if (t.info.notes || bgEditing || bgEdit("tn:" + t.key).t) h += bgEd("div", "bg-notes", "tn:" + t.key, t.info.notes || "", false);
	}
	box.find(".bg-scale").html(h);
	box.find(".bg-ed").attr("contenteditable", bgEditing ? "true" : null);
}

function remixRenderBossGuide() {
	var row = $("#bg-row");
	if (!remixDetailed) { row.hide(); return; }
	if (!row.length) {
		row = $("<div id='bg-row'><div class='bg-toolbar-slot'></div>" +
			"<div id='boss-guide' class='bg-panel' data-side='p2'><div class='bg-scale'></div></div>" +
			"<div class='bg-mine-bar'><button type='button' class='btn bg-mine-toggle'></button></div>" +
			"<div id='boss-guide-p' class='bg-panel' data-side='p1'><div class='bg-scale'></div></div></div>");
		var dai = $(".wrapper > #dai-panel");
		if (dai.length) row.insertBefore(dai); else $(".wrapper").append(row);
	}
	row.toggleClass("bg-editing", bgEditing).show();
	row.find(".bg-mine-toggle").html(bgShowMine ? "Hide your team" : "Show your team");
	row.find("#boss-guide-p").toggle(bgShowMine);
	row.find(".bg-toolbar-slot").html(bgToolbar());
	bgTplStyle();
	bgRenderSide("p2");
	if (bgShowMine) bgRenderSide("p1");
	bgScaleAll();
}

// Fixed design width, scaled to the space available (zoom keeps clicks/editing working)
function bgScaleAll() {
	$("#bg-row .bg-scale").each(function () {
		var w = this.parentNode.clientWidth - 8;
		this.style.width = BG_DESIGN_W + "px";
		this.style.zoom = w > 0 ? Math.min(1, w / BG_DESIGN_W) : 1;
	});
	bgFitAll("#bg-row");
}

// Shrink one-line cells until they fit (cells you sized by hand keep your size)
function bgFitAll(root) {
	// Move name + BP: the BP is always 80% of the name (.bg-bp); a line that doesn't fit shrinks as a
	// whole, only as much as it needs (the .bg-fit pass below, in 0.25px steps).
	// EV spreads: one line, or two set rows (a line break in the text); shrink until every row fits
	$(root).find(".bg-wrapfit").each(function () {
		var el = this, rows = el.textContent.split(String.fromCharCode(10)).length;
		var start = el.getAttribute("data-start");
		el.style.fontSize = start ? start + "px" : rows > 1 ? "14px" : ""; el.style.whiteSpace = "pre";
		var size = parseFloat(getComputedStyle(el).fontSize);
		while ((el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1) && size > 9) { size -= 0.5; el.style.fontSize = size + "px"; }
	});
	$(root).find(".bg-fit").each(function () {
		var el = this, fixed = el.getAttribute("data-fs") || $(el).find("[data-fs]").length;
		if (fixed) return;
		el.style.fontSize = "";
		var size = parseFloat(getComputedStyle(el).fontSize);
		while (el.scrollWidth > el.clientWidth + 1 && size > 8) { size -= 0.25; el.style.fontSize = size + "px"; }
	});
}

function remixShowDetailedState() {
	$("body").toggleClass("detailed-layout", remixDetailed);
	$("#detailed-toggle").html("&#128203; Detailed Team Layout: " + (remixDetailed ? "On" : "Off"));
	remixRenderBossGuide();
}
function remixToggleDetailed() {
	remixDetailed = !remixDetailed;
	try { localStorage.setItem("remixDetailedLayout", remixDetailed ? "1" : "0"); } catch (e) {}
	remixShowDetailedState();
}

// Trainer picker: click the title for a search box. It matches anywhere in the trainer's name
// (typing "hapu" finds "Island Kahuna Hapu"), not just the start.
function bgFindKey(s) { return String(s || "").normalize("NFD").toLowerCase().replace(/[^a-z0-9#]+/g, " "); }
function bgTrainerList(q) {
	if (typeof REMIX_TRAINER_INFO === "undefined") return [];
	var words = bgFindKey(q).split(" ").filter(Boolean);
	return Object.keys(REMIX_TRAINER_INFO).sort(function (a, b) { return REMIX_TRAINER_INFO[a].id - REMIX_TRAINER_INFO[b].id; })
		.map(function (l) { var inf = REMIX_TRAINER_INFO[l]; return { label: l, text: (bgEdit("tt:" + l).t || inf.title) + " (#" + inf.id + ")" }; })
		.filter(function (o) { var k = bgFindKey(o.text + " " + o.label); return words.every(function (w) { return k.indexOf(w) !== -1; }); });
}
function bgFindRender(box, q) {
	var list = bgTrainerList(q).slice(0, 60);
	box.find(".bg-tfind-list").html(list.length ? list.map(function (o, i) {
		return "<div class='bg-tfind-opt" + (i === 0 ? " on" : "") + "' data-label='" + bgEsc(o.label) + "'>" + bgEsc(o.text) + "</div>";
	}).join("") : "<div class='bg-tfind-none'>No trainer matches</div>");
}
$(document).on("click", "#bg-row .bg-tpick", function (e) {
	if ($(e.target).closest(".bg-tfind").length) return;
	var pick = $(this), box = pick.find(".bg-tfind");
	if (box.length) { box.remove(); return; }
	box = $("<div class='bg-tfind'><input class='bg-tfind-in' placeholder='Search trainers...' spellcheck='false'><div class='bg-tfind-list'></div></div>").appendTo(pick);
	bgFindRender(box, "");
	box.find("input").focus();
});
$(document).on("input", "#bg-row .bg-tfind-in", function () { bgFindRender($(this).closest(".bg-tfind"), this.value); });
$(document).on("keydown", "#bg-row .bg-tfind-in", function (e) {
	var box = $(this).closest(".bg-tfind"), opts = box.find(".bg-tfind-opt"), i = opts.index(opts.filter(".on"));
	if ((e.key === "ArrowDown" || e.key === "ArrowUp") && opts.length) {
		e.preventDefault(); i = (i + (e.key === "ArrowDown" ? 1 : -1) + opts.length) % opts.length;
		opts.removeClass("on").eq(i).addClass("on")[0].scrollIntoView({ block: "nearest" });
	} else if (e.key === "Enter" && opts.length) { bgPickTrainer(opts.eq(Math.max(0, i)).attr("data-label")); }
	else if (e.key === "Escape") box.remove();
});
$(document).on("mousedown", "#bg-row .bg-tfind-opt", function (e) { e.preventDefault(); bgPickTrainer(this.getAttribute("data-label")); });
$(document).on("mousedown", function (e) { if (!$(e.target).closest(".bg-tpick").length) $("#bg-row .bg-tfind").remove(); });

// Load the picked trainer's first Pokemon on the enemy side
function bgPickTrainer(label) {
	$("#bg-row .bg-tfind").remove();
	var inf = REMIX_TRAINER_INFO[label];
	if (!inf) return;
	var sp = (inf.team || []).filter(function (s) { return setdex[s] && setdex[s][label]; })[0];
	if (!sp) return;
	var set = sp + " (" + label + ")";
	$("input.set-selector").last().val(set).change();
	$(".opposing .select2-chosen").text(set);
}

// ---- edit mode ----
function bgSelect(el) {
	$("#bg-row .bg-selected").removeClass("bg-selected");
	bgSelected = el;
	if (el) $(el).addClass("bg-selected");
}
function bgResize(el, d) {
	if (!el) return;
	if (el.classList.contains("bg-itemicon")) {
		var cur = bgEdit("tpl:bg-itemicon").fs || el.offsetWidth || 32;
		bgSetEdit("tpl:bg-itemicon", "fs", Math.max(12, cur + d * 4));
		bgTplStyle(); bgFitAll("#bg-row");
		return;
	}
	var k = el.getAttribute("data-ek");
	if (!k) return;
	if (el.classList.contains("bg-art")) {
		var hgt = Math.max(30, Math.round(el.offsetHeight) + d * 10);
		$("#bg-row [data-ek='" + k.replace(/'/g, "\\'") + "']").css({height: hgt + "px", "max-height": "none"});
		bgSetEdit(k, "fs", hgt);
		return;
	}
	var size = Math.max(6, Math.round(parseFloat(getComputedStyle(el).fontSize)) + d);
	$("#bg-row [data-ek='" + k.replace(/'/g, "\\'") + "']").css("font-size", size + "px").attr("data-fs", size);
	bgSetEdit(k, "fs", size);
}
$(document).on("click", "#bg-row .bg-edit-btn", function () {
	bgEditing = !bgEditing; bgSelected = null; $("#bg-tip").hide(); remixRenderBossGuide();
});
$(document).on("focus click", "#bg-row.bg-editing .bg-ed", function () { bgSelect(this); });
$(document).on("click", "#bg-row.bg-editing .bg-itemicon, #bg-row.bg-editing .bg-ablabel, #bg-row.bg-editing .bg-stats", function () { bgSelect(this); });
$(document).on("input", "#bg-row.bg-editing .bg-ed", function () {
	var k = this.getAttribute("data-ek"), t = this.innerText.replace(/\s+$/, "");
	bgSetEdit(k, "t", t === this.getAttribute("data-def") ? null : t);
});
$(document).on("keydown", "#bg-row.bg-editing .bg-ed", function (ev) {
	if (ev.key === "Enter" && !$(this).is(".bg-notes, .bg-note")) { ev.preventDefault(); this.blur(); }
});
$(document).on("mousedown", "#bg-row .bg-size, #bg-row .bg-reset", function (ev) { ev.preventDefault(); }); // keep the selection
$(document).on("click", "#bg-row .bg-size", function () { bgResize(bgSelected, +$(this).attr("data-d")); });
$(document).on("click", "#bg-row .bg-reset", function () {
	if (!bgSelected) return;
	var k = bgSelected.getAttribute("data-ek"), tk = bgSelected.getAttribute("data-tk");
	if (k) delete bgEdits[k];
	if (tk) delete bgEdits["tpl:" + tk];
	bgSaveEdits(); remixRenderBossGuide();
});
$(document).on("click", "#bg-row .bg-export", function () {
	var all = $.extend(true, {}, bgAllEdits(), bgEdits);
	var a = document.createElement("a");
	a.href = URL.createObjectURL(new Blob([JSON.stringify(all, null, 1)], {type: "application/json"}));
	a.download = "guide_edits.json"; a.click();
});
document.addEventListener("wheel", function (ev) {
	if (!bgEditing || !ev.ctrlKey) return;
	var el = ev.target.closest && ev.target.closest("#bg-row .bg-ed, #bg-row .bg-art, #bg-row .bg-itemicon");
	if (!el) return;
	ev.preventDefault(); bgSelect(el); bgResize(el, ev.deltaY < 0 ? 1 : -1);
}, {passive: false});

// Alt+drag: move that part (on every card). Offsets are in design px, so divide by the zoom.
var bgMove = null;
$(document).on("mousedown", "#bg-row.bg-editing [data-tk]", function (ev) {
	if (!ev.altKey || ev.button !== 0) return;
	ev.preventDefault(); ev.stopPropagation();
	var tk = this.getAttribute("data-tk"), e = bgEdit("tpl:" + tk);
	var zoom = parseFloat($(this).closest(".bg-scale")[0].style.zoom) || 1;
	bgSelect(this);
	bgMove = {tk: tk, x: ev.clientX, y: ev.clientY, dx: e.dx || 0, dy: e.dy || 0, zoom: zoom};
});
$(document).on("mousemove", function (ev) {
	if (!bgMove) return;
	var dx = Math.round(bgMove.dx + (ev.clientX - bgMove.x) / bgMove.zoom), dy = Math.round(bgMove.dy + (ev.clientY - bgMove.y) / bgMove.zoom);
	bgEdits["tpl:" + bgMove.tk] = $.extend(bgEdits["tpl:" + bgMove.tk] || {}, {dx: dx, dy: dy});
	bgTplStyle();
});
$(document).on("mouseup", function () { if (bgMove) { bgMove = null; bgSaveEdits(); } });

// Drag a move (by its handle) onto another move of the same Pokemon to swap their places
var bgDragFrom = null;
$(document).on("dragstart", "#bg-row .bg-drag", function (ev) {
	bgDragFrom = this.closest(".bg-move");
	ev.originalEvent.dataTransfer.effectAllowed = "move";
	ev.originalEvent.dataTransfer.setData("text/plain", "move");
});
$(document).on("dragover", "#bg-row.bg-editing .bg-move", function (ev) {
	if (bgDragFrom && bgDragFrom.parentNode === this.parentNode) { ev.preventDefault(); $(this).addClass("bg-dropto"); }
});
$(document).on("dragleave drop", "#bg-row .bg-move", function () { $(this).removeClass("bg-dropto"); });
$(document).on("drop", "#bg-row.bg-editing .bg-move", function (ev) {
	ev.preventDefault();
	var from = bgDragFrom; bgDragFrom = null;
	if (!from || from === this || from.parentNode !== this.parentNode) return;
	var list = this.parentNode, cells = $(list).children(".bg-move").get();
	var a = cells.indexOf(from), b = cells.indexOf(this);
	cells.splice(b, 0, cells.splice(a, 1)[0]);
	var order = cells.map(function (c) { return +c.getAttribute("data-slot"); });
	bgSetEdit(list.getAttribute("data-ord"), "v", order.join() === "0,1,2,3" ? null : order);
	remixRenderBossGuide();
});


// Hover text for abilities / items / moves (off while editing)
$(document).on("mouseenter", "#bg-row [data-tip]", function () {
	var t = this.getAttribute("data-tip");
	if (!t || bgEditing) return;
	var tip = $("#bg-tip");
	if (!tip.length) tip = $("<div id='bg-tip'></div>").appendTo("body");
	var r = this.getBoundingClientRect();
	tip.text(t).css({left: Math.min(r.left + window.scrollX, window.scrollX + document.documentElement.clientWidth - 330),
		top: r.bottom + window.scrollY + 4}).show();
}).on("mouseleave", "#bg-row [data-tip]", function () { $("#bg-tip").hide(); });

$(document).on("click", "#bg-row .bg-artbox", function (ev) {
	if (bgEditing) { if (!ev.altKey) bgSelect($(this).find(".bg-art")[0]); return; }
	var set = $(this).attr("data-set"), p1 = $(this).closest(".bg-panel").attr("data-side") === "p1";
	$("input.set-selector")[p1 ? "first" : "last"]().val(set).change();
	$(p1 ? ".player .select2-chosen" : ".opposing .select2-chosen").text(set);
});
// Re-render when the enemy trainer changes or your box changes
$(document).on("change", ".opposing", function () { setTimeout(remixRenderBossGuide, 0); });
var bgBoxTimer = null;
$(function () {
	setTimeout(remixShowDetailedState, 0);
	var box = document.querySelector(".player-poks");
	if (box && window.MutationObserver) {
		new MutationObserver(function () {
			if (bgEditing) return;
			clearTimeout(bgBoxTimer); bgBoxTimer = setTimeout(remixRenderBossGuide, 100);
		}).observe(box, {childList: true, subtree: true});
	}
});
var bgResizeTimer = null;
$(window).on("resize", function () {
	clearTimeout(bgResizeTimer);
	bgResizeTimer = setTimeout(bgScaleAll, 150);
});
