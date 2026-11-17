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
var remixDetailed = false;
try { remixDetailed = localStorage.getItem("remixDetailedLayout") === "1"; } catch (e) {}
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

// The calc's own type colors (main.css select.type-pill): [top, bottom]
var BG_TYPE_COLORS = {
	Bug: ["#c7cf7e", "#afbb47"], Dark: ["#958076", "#67493c"], Dragon: ["#8182da", "#4b4dca"],
	Electric: ["#f7dd6b", "#f4cf2c"], Fairy: ["#eeb9ee", "#e79be7"], Fighting: ["#ce714d", "#b93401"],
	Fire: ["#f8974c", "#f56a00"], Flying: ["#9eaeeb", "#758be3"], Ghost: ["#908dcc", "#605cb6"],
	Grass: ["#93c86d", "#65b12f"], Ground: ["#e9b760", "#df981c"], Ice: ["#a6e4f6", "#80d9f2"],
	Normal: ["#c7c7bc", "#afaf9f"], Poison: ["#b86b98", "#9a2b6c"], Psychic: ["#ef92ba", "#e8649c"],
	Rock: ["#ddcfa7", "#cfbb81"], Steel: ["#b2b1bf", "#9190a3"], Water: ["#66a6e5", "#2480da"]
};
function bgDarken(hex, f) {
	var n = parseInt(hex.slice(1), 16);
	return "rgb(" + [n >> 16, n >> 8 & 255, n & 255].map(function (c) { return Math.round(c * f); }).join(",") + ")";
}
(function () {
	var css = "";
	for (var t in BG_TYPE_COLORS) {
		var c = BG_TYPE_COLORS[t];
		css += ".bg-t-" + t + "{background:linear-gradient(to bottom," + c[0] + "," + c[1] + ");color:" + bgDarken(c[1], 0.42) + "}\n";
	}
	document.head.insertAdjacentHTML("beforeend", "<style>" + css + "</style><style id='bg-tpl-style'></style>");
})();

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
	return parts.join(", ") || "No EVs";
}

function bgArt(species) {
	var id = bgId(species), list = typeof REMIX_ART !== "undefined" ? REMIX_ART : [];
	var mini = "./img/pokesprite/" + remixSpriteFile(species) + ".png";
	var slug = species.toLowerCase().normalize("NFD").replace(/[^a-z0-9 -]/g, "").replace(/ +/g, "-").replace(/-alola$/, "-alolan");
	var urls = ["https://img.pokemondb.net/artwork/vector/large/" + slug + ".png",
		"https://img.pokemondb.net/artwork/vector/" + slug + ".png", mini];
	if (list.indexOf(id) !== -1) urls.unshift("./img/art/" + id + ".webp");
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
	var monNote = (info.mons || {})[species] || "";
	var ordKey = "ord:" + label + ":" + species;
	var h = "<div class='bg-card'>";
	h += "<div class='bg-head'>" + bgEd("div", "bg-name", "nm:" + label + ":" + species, "#" + n + ". " + species, true) +
		"<div class='bg-types'>" + types.map(function (t) {
			return "<span class='bg-type bg-t-" + bgEsc(t) + "'>" + bgEsc(t) + "</span>";
		}).join("") + "</div></div>";
	h += "<div class='bg-body'><div class='bg-artbox' data-set='" + bgEsc(species + " (" + label + ")") +
		"' title='Click: load into the calc'>" + bgArt(species) + "</div><div class='bg-side'>";
	h += "<div class='bg-ability' data-tip='" + bgEsc(REMIX_ABILITY_DESCS[set.ability] || "") + "'>" +
		"<div class='bg-ablabel' data-tk='bg-ablabel'><u>Ability</u>:</div>" +
		bgEd("div", "bg-abname", "ab:" + (set.ability || ""), set.ability || "—", true) + "</div>";
	h += "<div class='bg-item' data-tip='" + bgEsc(itemDesc) + "'><div class='bg-itemrow'>" +
		(icon ? "<img class='bg-itemicon' data-tk='bg-itemicon' src='" + icon + "' alt='' draggable='false'>" : "") +
		bgEd("span", "bg-itname", "it:" + (set.item || ""), set.item || "No item", true) +
		"</div>" + (summary || bgEditing ? bgEd("small", "bg-itsum", "is:" + (set.item || ""), summary, true) : "") + "</div>";
	h += bgEd("div", "bg-nature", "nat:" + label + ":" + species, (set.nature || "Hardy") + " | " + bgEvText(set.evs), true);
	h += "</div></div>";
	if (p.bs) {
		h += "<div class='bg-stats bg-fit' data-tk='bg-stats'>" + BG_STATS.map(function (s) {
			return "<span style='color:" + bgStatColor(p.bs[s[0]]) + "'>" + p.bs[s[0]] + " " + s[1] + "</span>";
		}).join(" | ") + "</div>";
	}
	h += "<div class='bg-moves' data-ord='" + bgEsc(ordKey) + "'>";
	bgMoveOrder(ordKey).forEach(function (slot) {
		var mv = (set.moves || [])[slot];
		var drag = bgEditing ? "<span class='bg-drag' draggable='true' title='Drag to move'>&#10303;</span>" : "";
		if (!mv) { h += "<div class='bg-move bg-empty' data-slot='" + slot + "'>" + drag + "—</div>"; return; }
		var md = moves[mv] || {}, type = md.type || "Normal";
		var ai = REMIX_MOVE_AI_BP[mv], bp = ai ? ai[0] : 0, boosted = ai && ai[0] !== ai[1];
		var why = ai ? "Switch-in AI power: " + ai[1] + (ai[2] > 1 ? " x" + ai[2] + " hits" : "") + (ai[3] ? " x1.5 always-crit" : "") +
			(boosted ? " = " + ai[0] : "") + ". " : "";
		var note = (REMIX_MOVE_BLURBS[mv] || "").replace(/^(\d+|Varies) BP(, | \| |$)/, "").replace(/^\| /, "");
		h += "<div class='bg-move bg-t-" + bgEsc(type) + "' data-slot='" + slot + "' data-tip='" + bgEsc(why + (REMIX_MOVE_DESCS[mv] || "")) + "'>" + drag +
			"<div class='bg-mvtop bg-fit' data-tk='bg-mvtop'>" + bgEd("b", "bg-mvname", "mv:" + mv + ":name", mv, false) +
			(bp ? " <span class='bg-bp" + (boosted ? " bg-boost" : "") + "'>(" + bp + " BP)</span>" : "") + "</div>" +
			bgEd("div", "bg-mvnote", "mv:" + mv + ":note", note, true) + "</div>";
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

function bgRenderSide(side) {
	var box = $(side === "p2" ? "#boss-guide" : "#boss-guide-p");
	var t = bgTeam(side), h;
	if (t.empty) h = "<div class='bg-empty-msg'>" + t.empty + "</div>";
	else {
		var title = bgEd("u", "bg-tt", "tt:" + t.key, t.title, false);
		if (side === "p2" && !bgEditing && t.info.id) {
			title = "<span class='bg-tpick' title='Pick another trainer'>" + title + "<span class='bg-caret'>&#9662;</span>" +
				"<select class='bg-tsel'>" + bgTrainerOptions(t.label) + "</select></span>";
		}
		h = "<div class='bg-title'>" + title + (t.maxLv ? " - <u>Level " + t.maxLv + "</u>" : "") +
			(t.info.doubles ? " <span class='bg-dbl'>Doubles</span>" : "") + "</div><div class='bg-grid'>";
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
	$(root).find(".bg-fit").each(function () {
		var el = this, fixed = el.getAttribute("data-fs") || $(el).find("[data-fs]").length;
		if (fixed) return;
		el.style.fontSize = "";
		var size = parseFloat(getComputedStyle(el).fontSize);
		while (el.scrollWidth > el.clientWidth + 1 && size > 8) { size -= 0.5; el.style.fontSize = size + "px"; }
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

// Title dropdown: load the picked trainer's first Pokemon on the enemy side
$(document).on("change", "#bg-row .bg-tsel", function () {
	var label = this.value, inf = REMIX_TRAINER_INFO[label];
	var sp = (inf.team || []).filter(function (s) { return setdex[s] && setdex[s][label]; })[0];
	if (!sp) return;
	var set = sp + " (" + label + ")";
	$("input.set-selector").last().val(set).change();
	$(".opposing .select2-chosen").text(set);
});

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
