// Move Guide page: the Remix Move Guide sheet drawn 1:1 (cells, merges, colors, rich text, Comfortaa) from
// moveguide/move_guide.json (imported once by tools/build_move_guide.py; edit it on the site from then on).
//  - Headers collapse their section: h0 = the big "All Moves Organized by Type" dropdown, h1 = a type or a
//    category, h2 = a sub-category. Everything starts closed.
//  - The table of contents is the sheet's own (its cells jump to their category).
//  - Type sections use the website's type colors; every move row has one fixed height and at most two lines.
//  - Localhost: Edit guide (Sheets-style editor panel, src/js/remix_sheet_editor.js), Colors, move/resize the
//    logo, Save to file (put move_guide.json in src/moveguide/ and rebuild).
(function () {
	var CAN_EDIT = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
	var K_OPEN = "remixMoveGuideOpen", K_HIDE = "remixMoveGuideHide", K_DRAFT = "remixMoveGuideDraft";
	var data = null, editing = false, dirty = false, editor = null;
	var $ = function (s, r) { return (r || document).querySelector(s); };
	var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
	var load = function (k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } };
	var save = function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
	var plain = function (h) { var d = document.createElement("div"); d.innerHTML = h; return (d.textContent || "").replace(/\s+/g, " ").trim(); };
	// every dropdown starts closed on each visit (nothing remembered); clicks and links open what's needed
	var open = {}, hide = load(K_HIDE, {});
	var startOpen = false; try { startOpen = localStorage.getItem("remixMoveGuideStartOpen") === "1"; } catch (e) {}
	try { localStorage.removeItem(K_OPEN); } catch (e) {}
	var HEADS = {h0: 1, h1: 1, h2: 1};

	function headKey(r) { return plain(r.c[0][3].split(/<br>|\n/)[0]).slice(0, 80); }
	function headTitle(r) {
		var d = document.createElement("div"); d.innerHTML = r.c[0][3].replace(/<br\s*\/?>/g, "\n");
		return (d.textContent || "").split("\n")[0].replace(/[-–—]{4,}.*/, "").replace(/\s+/g, " ").trim();
	}
	function isColumnHead(r) { return /^Move Name$/i.test(plain(r.c[0][3])); }
	function emptyRow(r) { return r.c.every(function (c) { return !/<img/.test(c[3]) && !c[3].replace(/<[^>]+>|&nbsp;|\s/g, ""); }); }
	function isMoveRow(r) { return r.k === "row" && r.c.length >= 8 && !isColumnHead(r) && !emptyRow(r); }
	var TYPE_COLORS = typeof REMIX_TYPE_COLORS !== "undefined" ? REMIX_TYPE_COLORS : {};
	function typeOf(r) { var m = /^All (\w+) Type Moves/.exec(headTitle(r)); return m && TYPE_COLORS[m[1]] ? m[1] : null; }

	// one height for every move row (the most common one in the sheet) until you set a row's own height
	function moveH() {
		if (data.moveH) return data.moveH;
		var n = {};
		data.rows.forEach(function (r) { if (isMoveRow(r)) n[r.h] = (n[r.h] || 0) + 1; });
		return (data.moveH = +Object.keys(n).sort(function (a, b) { return n[b] - n[a]; })[0] || 46);
	}
	function rowH(r) { return isMoveRow(r) && !r.hSet ? moveH() : !r.hSet && isBlankRow(r) ? Math.max(4, Math.round(r.h * 0.15)) : r.h; }

	// A cell that is only rich-text spans: the cell's own font size would add a tall empty strut to every line
	// (the sheet sizes each line by its own text), so the cell gets size 0 and each span keeps its own size.
	var noSizeSpan = null;
	function richOnly(h) {
		if (!noSizeSpan) {
			noSizeSpan = {};
			data.css.replace(/\.mg \.(r\d+)\{([^}]*)\}/g, function (a, k, b) { if (b.indexOf("font-size") < 0) noSizeSpan[k] = 1; });
		}
		if (h.indexOf("<span") !== 0) return false;
		// every piece needs its own size (text typed or recolored in the editor has none: it'd vanish at size 0)
		var all = h.match(/<span[^>]*>/g) || [], sized = h.match(/<span class="(r\d+)">/g) || [];
		if (all.length !== sized.length) return false;
		if (sized.some(function (s) { return noSizeSpan[s.slice(13, -2)]; })) return false;
		return !h.replace(/<br\s*\/?>/g, "").replace(/<span[^>]*>[^<]*<\/span>/g, "").trim();
	}
	function cellExtra(c, r) {
		var cls = "", t = c[3].replace(/<[^>]+>/g, "").trim();
		if (richOnly(c[3])) cls += " mg-rich";
		if (c[3].indexOf("<span") >= 0) cls += " mg-runs"; // rich text: each part has its own strike/underline
		if (/^(?:[-—–]{2,}|—)$/.test(t)) cls += " mg-dash"; // "----" accuracy / power: never bold
		if (TYPE_COLORS[t] && isMoveRow(r)) cls += " mg-typecell"; // the Type column: one size everywhere
		if (c[4] && c[4].go) cls += " mg-go";
		return cls;
	}
	function cellHtml(c, r) {
		var h = c[3];
		if (isMoveRow(r)) {
			// the sheet pushed a second sentence onto line 2 with a run of spaces: make that a real line break
			h = h.replace(/(\S)[  ]{4,}(?=\S)/g, "$1<br>");
			// a blank line between two lines (tiny in the sheet, full height on a page): just one break
			for (var k = 0; k < 3; k++) h = h.replace(/(<br\s*\/?>)((?:<\/span>|<span[^>]*>|\s)*)<br\s*\/?>/g, "$1$2");
			// category icons: one size in every move row
			h = h.replace(/<img class="mg-cat"( style="[^"]*")?/g, "<img class=\"mg-cat\" style=\"height:" + Math.max(18, rowH(r) - 12) + "px\"");
			return "<div class='mg-in'>" + h + "</div>";
		}
		return h;
	}

	// which table a row is in: the info blurb, the table of contents, or the guide
	function zone(r) { return r.zone || (r.k === "intro" || r.k === "toc" ? r.k : "body"); }
	// the type grid in the contents: 2 rows of 9 clickable types, in the guide's own order
	function typeGridHtml() {
		if (!Object.keys(sheetMain).length) learnSheetColors();
		var types = data.rows.map(typeHead).filter(Boolean);
		return "<div class='mg-typegrid'>" + types.map(function (t) {
			return "<a href='#' class='mg-tg' data-type='" + t + "' style='background:" + (sheetMain[t] || TYPE_COLORS[t]) + ";color:#000'>" + t + "</a>";
		}).join("") + "</div>";
	}
	function typeHead(r) { return r.k === "h1" ? typeOf(r) : null; }
	// the type names fill their boxes: the longest one sets one size for all of them
	function fitTypeGrid() {
		var links = $$(".mg-tg");
		if (!links.length) return;
		links.forEach(function (a) { a.style.fontSize = "40px"; });
		var widest = links.reduce(function (m, a) { return a.scrollWidth > m.scrollWidth ? a : m; }, links[0]);
		var size = 40 * (widest.clientWidth - 10) / widest.scrollWidth;
		links.forEach(function (a) { a.style.fontSize = Math.max(10, Math.min(40, size)) + "px"; });
	}

	function stAttr(c) {
		var st = c[4] && c[4].st, cls = "", sty = "";
		if (!st) return ["", ""];
		var v = function (name, val) { cls += " rse-st-" + name; sty += "--rse-" + name + ":" + val + ";"; };
		if (st.bg) v("bg", st.bg);
		if (st.color) v("color", st.color);
		if (st.ff) v("ff", "'" + st.ff + "',Arial,sans-serif");
		if (st.fs) v("fs", st.fs + "pt");
		if (st.al) v("al", st.al);
		if (st.va) v("va", st.va);
		if (st.b != null) cls += " rse-st-b" + (st.b ? 1 : 0);
		if (st.i != null) cls += " rse-st-i" + (st.i ? 1 : 0);
		if (st.u != null || st.s != null) v("deco", (st.u ? "underline " : "") + (st.s ? "line-through" : "") || "none");
		if (st.wrap) cls += " rse-st-w-" + st.wrap;
		if (st.bd) ["t", "r", "b", "l"].forEach(function (k) { if (st.bd[k]) v("bd" + k, st.bd[k]); });
		return [cls, sty];
	}
	// the part of the guide after the 18 types (the categories), where headers are drawn as pills
	var catStart = 1e9;
	function findCatStart() { catStart = 1e9; for (var i = 0; i < data.rows.length; i++) if (data.rows[i].cat) { catStart = i; break; } }
	function groupIcon(cat) {
		if (TOC_LOOK[cat] && TOC_LOOK[cat].icon) return TOC_LOOK[cat].icon;
		var g = (data.toc || []).filter(function (x) { return x.cats.indexOf(cat) >= 0; })[0];
		return g && TOC_LOOK[g.name] ? TOC_LOOK[g.name].icon : "gear";
	}
	var CAT_ICONS = {
		"Priority Attacking Moves": [["chevrons-right"], ["phys", "spec"]],
		"Debuffing Moves": [["arrow-big-down", "arrow-big-down"], ["phys", "spec"]],
		"Setup Moves": [["arrow-big-up", "arrow-big-up"], ["phys", "spec"]],
		"Draco Meteor Variants": [["trending-down"], ["phys", "spec"]],
		"Negative Priority Attacks": [["turtle"], ["phys", "spec"]],
		"Inaccurate Moves": [["target"], ["phys", "spec"]],
		"Recoil Moves": [["heart-minus"], ["phys", "spec"]],
		"Moves That Can't Be Used 2x in a Row": [["repeat-off"], ["phys", "spec"]],
		"50% Critical Hit Rate Moves": [["swords"], ["phys", "spec"]],
		"Multi-Hit Moves": [["dices"], ["phys", "spec"]],
		"HP Draining Attacks": [["heart-plus"], ["phys", "spec"]],
		"Trapping Moves": [["lock"], ["phys", "spec"]],
		"Hex & Venoshock Variants": [["triangle-alert"], ["phys", "spec"]],
		"Freeze-Dry Variants": [["shield-alert"], ["phys", "spec"]],
		"Uses Higher Stat": [["phys", "shuffle"], ["shuffle", "spec"]],
		"Changes Type": [["arrow-right-left"], ["phys", "spec"]],
		"Generic Drawback Free Attacks": [["circle-check"], ["phys", "spec"]],
		"Sleep Inducing Moves": [["zzz"], ["status", "settings"]],
		"Paralysis Inducing Moves": [["zap"], ["status", "settings"]],
		"Burn Inducing Moves": [["flame"], ["status", "settings"]],
		"Poison Inducing Moves": [["skull"], ["status", "settings"]],
		"Pivot Moves": [["redo-2"], ["status", "settings"]],
		"New Recovery Moves": [["heart-plus"], ["status", "settings"]],
		"Soak Variants": [["arrow-right-left"], ["status", "settings"]],
		"Protect Variants": [["shield"], ["status", "settings"]],
		"Retaliation & Sacrificial Moves": [["heart-off"], ["status", "settings"]],
		"Weather & Terrain Interactions": [["weather-ground"], ["status", "settings"]],
		"Weather & Terrain Setting": [["weather-ground"], ["status", "settings"]],
		"Move Choice Related": [["help-off"], ["status", "settings"]],
		"Entry Hazards": [["spikes"], ["status", "settings"]],
		"Screens & Protective Effects": [["app-window"], ["status", "settings"]],
		"Misc. Field Moves": [["globe"], ["status", "settings"]],
		"Ability Changing Moves": [["dna"], ["status", "settings"]],
		"Redirection & Doubles Only Moves": [["users"], ["status", "settings"]],
		"Assorted Status Moves": [["puzzle"], ["status", "settings"]],
		"AI / Trainer Only Moves": [["bot"], ["status", "settings"]]
	};
	// sub-headers that get an icon (the weather / terrain ones)
	var SUB_ICONS = {"Sun": "sun", "Rain": "cloud-rain", "Snow": "snowflake", "Sand": "wind", "Terrain": "mountain", "Lunar Aura": "moon-star", "Mud Sport": "droplets"};
	function oneIcon(n) {
		if (n === "phys" || n === "spec" || n === "status") return "<img class='ci-img' src='" + ICON_URL.replace("%s", {phys: "physical", spec: "special", status: "status"}[n]) + "' alt=''>";
		// "a+b": b drawn over a (e.g. repeat with a ban sign over it)
		return "<span class='ci'>" + n.split("+").map(function (k, z) { return "<i class='ci-l" + (z ? " ci-over" : "") + "' style='--ci:url(" + new URL("./img/cat-icons/" + k + ".svg", location.href).href + ")'></i>"; }).join("") + "</span>";
	}
	function iconGroup(list) { return list && list.length ? "<span class='ci-grp'>" + list.map(oneIcon).join("") + "</span>" : ""; }
	function trimHtml(h) {
		var box = document.createElement("div"); box.innerHTML = h;
		var walk = document.createTreeWalker(box, NodeFilter.SHOW_TEXT), texts = [], n;
		while ((n = walk.nextNode())) texts.push(n);
		texts = texts.filter(function (x) { return x.nodeValue.replace(/\u00a0/g, " ").trim(); });
		if (texts.length) { texts[0].nodeValue = texts[0].nodeValue.replace(/^[\s\u00a0]+/, ""); var last = texts[texts.length - 1]; last.nodeValue = last.nodeValue.replace(/[\s\u00a0]+$/, ""); }
		box.querySelectorAll("br").forEach(function (b) { b.remove(); });
		return box.innerHTML;
	}
	function typeHeadHtml(r, c) {
		if (r.k !== "h1" || zone(r) !== "body") return "";
		var t = typeOf(r); if (!t) return "";
		if (!Object.keys(sheetMain).length) learnSheetColors();
		var pill = "<span class='mg-tpill' style='background:" + (sheetMain[t] || TYPE_COLORS[t]) + "'><img src='./doozdex-sidebar/icons/" + t + ".svg?v=2' alt=''></span>"; // the pill in the type's color
		return "<div class='mg-typehead'>" + pill + "<span class='mg-typehead-t'>" + trimHtml(c[3]) + "</span>" + pill + "</div>";
	}
	// a faint gradient through the category pills: the contents' blue to its muted purple and back, ~2.5 times over the list
	var catOrder = null;
	function pillTint(cat) {
		if (!catOrder) { catOrder = {}; var n = 0; data.rows.forEach(function (r) { if (r.k === "h1" && r.cat && !(r.cat in catOrder)) catOrder[r.cat] = n++; }); catOrder._n = n; }
		var i = catOrder[cat] || 0, cycles = 2.5, t = (1 - Math.cos(2 * Math.PI * cycles * i / Math.max(1, catOrder._n - 1))) / 2; // 0 = blue, 1 = purple
		var mix = function (a, b) { return "#" + [0, 2, 4].map(function (k) { var x = parseInt(a.substr(k + 1, 2), 16), y = parseInt(b.substr(k + 1, 2), 16); return ("0" + Math.round(x + (y - x) * t).toString(16)).slice(-2); }).join(""); };
		return "background:linear-gradient(" + mix("#21588a", "#4a3576") + "," + mix("#173f66", "#33245a") + ");border-color:" + mix("#8fc8ff", "#b9a3f0");
	}
	function pillHead(r, i) {
		if (zone(r) !== "body" || i < catStart || !(r.k === "h1" || r.k === "h2") || r.c.length !== 1) return "";
		var t = headTitle(r).replace(/&/g, "&amp;").replace(/</g, "&lt;");
		if (!t) return "";
		if (r.k === "h2") {
			var sub = Object.keys(SUB_ICONS).filter(function (k) { return headTitle(r).indexOf(k) === 0; })[0];
			return "<div class='mg-hpill mg-hpill-2'>" + (sub ? iconGroup([SUB_ICONS[sub]]) : "") + "<span class='mg-hpill-t'>" + t + "</span>" + (sub ? iconGroup([SUB_ICONS[sub]]) : "") + "</div>";
		}
		if (r.cat === "Unused Moves/Animations") return "<div class='mg-hmini'>" + t + " <small>(for Dooz)</small></div>"; // just a small note at the bottom
		var ic = CAT_ICONS[r.cat] || [[], []];
		return "<div class='mg-hpill mg-hpill-1' style='" + pillTint(r.cat) + "'>" + iconGroup(ic[0]) + "<span class='mg-hpill-t'>" + t + "</span>" + iconGroup(ic[1]) + "</div>";
	}
	// contents pills: a name that doesn't fit its pill shrinks just enough (instead of being cut off)
	function fitToc() {
		var items = $$("#mg-toc .tocx-item .tocx-lbl").filter(function (l) { return l.offsetParent && !/span/.test(l.parentNode.getAttribute("style") || ""); });
		items.forEach(function (l) { l.style.fontSize = ""; });
		items.forEach(function (l) { l._room = l.parentNode.clientWidth - l.previousElementSibling.offsetWidth - 34; l._w = l.scrollWidth; });
		items.forEach(function (l) { if (l._w > l._room) l.style.fontSize = (parseFloat(getComputedStyle(l).fontSize) * l._room / l._w) + "px"; });
		// window titles: one line, shrinking only if the window is too narrow
		$$("#mg-toc .tocx-head").forEach(function (h) { h.style.fontSize = ""; var room = h.clientWidth - 16; if (h.scrollWidth > room) h.style.fontSize = (parseFloat(getComputedStyle(h).fontSize) * room / h.scrollWidth) + "px"; });
	}
	// pills keep one size and only shrink when a name needs more room than its row
	function fitHeads(scope) {
		var list = scope ? scope.reduce(function (a, tr) { return a.concat($$(".mg-hpill", tr)); }, []) : $$("#mg-guide .mg-hpill");
		var todo = list.filter(function (p) { return p.offsetParent; });
		todo.forEach(function (p) { p.style.fontSize = ""; });
		todo.forEach(function (p) { p._w = p.scrollWidth; p._room = p.parentNode.clientWidth - 170; }); // room for the dropdown arrow, the glow + breathing space
		for (var round = 0; round < 4 && todo.length; round++) {
			todo.forEach(function (p) { if (p._w > p._room) p.style.fontSize = (parseFloat(getComputedStyle(p).fontSize) * Math.max(0.5, p._room / p._w) * 0.98) + "px"; });
			todo = todo.filter(function (p) { p._w = p.scrollWidth; return p._w > p._room; }); // check again: icons and padding don't shrink exactly with the text
		}
	}

	// does this header have headers inside it (so "open everything" means something)?
	var innerCache = null;
	function hasInner(i) {
		if (!innerCache) {
			innerCache = {};
			var sec = sections();
			data.rows.forEach(function (r, x) { var s0 = sec[x]; if (HEADS[r.k]) ["h0", "h1"].forEach(function (k) { if (s0[k] >= 0 && s0[k] !== x) innerCache[s0[k]] = 1; }); });
		}
		return !!innerCache[i];
	}
	// a blank divider row (nothing in it) is drawn at ~15% of its height
	function isBlankRow(r) { return r.k === "row" && zone(r) === "body" && r.c.length && emptyRow(r); }

	function rowHtml(r, i) {
		var head = HEADS[r.k];
		return "<tr data-i='" + i + "' class='mg-" + r.k + (isMoveRow(r) ? " mg-mv" : "") + (isBlankRow(r) && !r.hSet ? " mg-blank" : "") + (HEADS[r.k] && rowH(r) < 70 ? " mg-shortrow" : "") + "' data-h='" + rowH(r) + "' style='height:" + rowH(r) + "px'>" +
			(editing ? "<th class='rse-rn'>" + (i + 1) + "<span class='rse-rowgrip' title='Drag to resize the row'></span></th>" : "") + r.c.map(function (c, j) {
			var sa = stAttr(c);
			return "<td class='" + c[0] + cellExtra(c, r) + sa[0] + (head && j === 0 ? " mg-hd" : "") + "'" + (sa[1] ? " style=\"" + sa[1] + "\"" : "") + (c[1] > 1 ? " colspan='" + c[1] + "'" : "") +
				(c[2] > 1 ? " rowspan='" + c[2] + "'" : "") + " data-j='" + j + "'>" +
				(head && j === 0 ? (hasInner(i) ? "<span class='mg-caret2' contenteditable='false' title='Open (or close) everything inside'></span><span class='mg-lbl mg-lbl2' contenteditable='false'></span>" : "") +
					"<span class='mg-caret' contenteditable='false'></span><span class='mg-lbl mg-lbl1" + (hasInner(i) ? " mg-lbl-shift" : "") + "' contenteditable='false'></span>" : "") + (r.special === "types" ? typeGridHtml() : j === 0 && !editing && pillHead(r, i) ? pillHead(r, i) : j === 0 && !editing && typeHeadHtml(r, c) ? typeHeadHtml(r, c) : r.k === "top" && j === 0 ? "<a href='#mg-toc' class='mg-backpill'>↑ Back to the Table of Contents</a>" : cellHtml(c, r)) + "</td>";
		}).join("") + "</tr>";
	}
	function tableHtml(rows) {
		var L = typeof RemixSheetEditor !== "undefined" ? RemixSheetEditor.LETTERS : "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
		return "<table class='mg waffle" + (editing ? " rse-grid" : "") + "'><colgroup>" + (editing ? "<col style='width:46px'>" : "") +
			data.cols.map(function (w, x) { return "<col data-x='" + x + "' style='width:" + w + "px'>"; }).join("") + "</colgroup>" +
			(editing ? "<thead><tr><th class='rse-corner'></th>" + data.cols.map(function (w, x) {
				return "<th data-col='" + x + "'>" + L[x] + "<span class='rse-colgrip' data-col='" + x + "' title='Drag to resize the column'></span></th>";
			}).join("") + "</tr></thead>" : "") + "<tbody>" + rows.join("") + "</tbody></table>";
	}

	function render(only) {
		if (only && only.length && document.querySelector(".mg-page tr[data-i]")) {
			var fresh = [];
			only.forEach(function (i) {
				var tr = document.querySelector(".mg-page tr[data-i='" + i + "']");
				if (!tr || !data.rows[i]) return;
				var tmp = document.createElement("tbody");
				tmp.innerHTML = rowHtml(data.rows[i], i);
				var n = tmp.firstElementChild;
				n.style.display = tr.style.display;
				if (tr.classList.contains("mg-shut")) n.classList.add("mg-shut");
				tr.parentNode.replaceChild(n, tr);
				fresh.push(n);
			});
			fitMoves(fresh); fitHeads(fresh);
			if (editor && editor.on) editor.mark();
			return;
		}
		findCatStart(); innerCache = null;
		var intro = [], toc = [], chunks = [[]], tocDone = false;
		data.rows.forEach(function (r, i) {
			var z = zone(r), h = rowHtml(r, i);
			if (z === "intro") intro.push(h);
			else if (z === "toc") { if (r.endSection) tocDone = true; if (!tocDone) toc.push(h); } // the category links below are drawn as cards (tocCards)
			else {
				// the guide is one table per section (each type / category): a change only re-lays out its own section,
				// and sections off screen aren't drawn at all (content-visibility), so editing stays quick
				if ((r.k === "h0" || r.k === "h1") && !r.joinPrev && chunks[chunks.length - 1].length) chunks.push([]);
				if (!chunks[chunks.length - 1].length) { chunks[chunks.length - 1].group = r.k === "h1" ? (r.cat ? "cat" : "type") : ""; chunks[chunks.length - 1].unused = r.cat === "Unused Moves/Animations"; } // a dropdown chain = one rounded window
				chunks[chunks.length - 1].push(h);
			}
		});
		$("#mg-info").innerHTML = "<div class='mg-scroll'>" + tableHtml(intro) + "</div>";
		$("#mg-toc").innerHTML = "<div class='mg-scroll'>" + tableHtml(toc) + "</div>" + tocCards();
		$("#mg-guide").innerHTML = chunks.map(function (c) { return "<div class='mg-chunk" + (c.group ? " mg-group mg-group-" + c.group : "") + (c.unused ? " mg-group-unused" : "") + "'>" + tableHtml(c) + "</div>"; }).join("");
		placeLogo();
		applyColors();
		applyCollapse();
		applyHide();
		scale();
		fitMoves();
		fitTypeGrid();
		fitHeads();
		fitToc();
		if (editor && editor.on) editor.mark();
	}

	// "The order is: Normal, Fire, ..." in the contents: each type name jumps to its section
	function linkTypeNames() {
		$$("#mg-toc td").forEach(function (td) {
			if (!/The order is/.test(td.textContent)) return;
			var walk = document.createTreeWalker(td, NodeFilter.SHOW_TEXT), nodes = [];
			while (walk.nextNode()) nodes.push(walk.currentNode);
			nodes.forEach(function (n) {
				var re = new RegExp("\\b(" + Object.keys(TYPE_COLORS).join("|") + ")\\b", "g");
				if (!re.test(n.nodeValue)) return;
				var span = document.createElement("span");
				span.innerHTML = n.nodeValue.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(re, "<a href='#' class='mg-typelink' data-type='$1'>$1</a>");
				n.parentNode.replaceChild(span, n);
			});
		});
	}

	// sections: each row belongs to the h0 / h1 / h2 above it. A category h1 ends the "by type" h0.
	function sections() {
		var h0 = -1, h1 = -1, h2 = -1, out = [], z = null;
		data.rows.forEach(function (r, i) {
			if (zone(r) !== z || r.endSection) { z = zone(r); h0 = h1 = h2 = -1; } // endSection: this row is outside the dropdown above it
			if (r.k === "h0") { h0 = i; h1 = -1; h2 = -1; }
			else if (r.k === "h1") { if (r.cat) h0 = -1; h1 = i; h2 = -1; }
			else if (r.k === "h2") h2 = i;
			out.push({h0: h0, h1: h1, h2: h2});
		});
		return out;
	}
	function isOpen(i) { return !!open[headKey(data.rows[i])]; }
	function applyCollapse() {
		var sec = sections(), q = ($(".mg-search").value || "").trim().toLowerCase(), match = {};
		if (q) data.rows.forEach(function (r, i) {
			if (isMoveRow(r) && plain(r.c[0][3]).toLowerCase().indexOf(q) !== -1) {
				match[i] = 1; ["h0", "h1", "h2"].forEach(function (k) { if (sec[i][k] >= 0) match[sec[i][k]] = 1; });
			}
		});
		$$(".mg-page tr[data-i]").forEach(function (tr) {
			var i = +tr.getAttribute("data-i"), r = data.rows[i], s = sec[i], show;
			if (q && zone(r) === "body") show = match[i] || (isColumnHead(r) && match[s.h2 >= 0 ? s.h2 : s.h1]);
			else if (q) show = true;
			else show = ["h0", "h1", "h2"].every(function (k) {
				var h = s[k];
				if (h < 0 || h === i) return true;
				if (k === "h2" && HEADS[r.k] && r.k !== "row") return true; // a header isn't inside the h2 before it
				if (k === "h1" && r.k === "h0") return true;
				return isOpen(h);
			});
			tr.style.display = show ? "" : "none";
			if (HEADS[r.k]) tr.classList.toggle("mg-shut", !(q && zone(r) === "body") && !isOpen(i));
		});
		// the "open everything" arrows point up once everything inside is open (click again to close it all)
		$$(".mg-page tr[data-i]").forEach(function (tr) {
			if (!tr.querySelector(".mg-caret2")) return;
			var i = +tr.getAttribute("data-i");
			tr.classList.toggle("mg-allopen", inside(i).every(isOpen));
		});
		$$("#mg-guide .mg-chunk").forEach(function (ch) {
			ch.classList.toggle("mg-chunk-empty", !Array.prototype.some.call(ch.querySelectorAll("tr[data-i]"), function (tr) { return tr.style.display !== "none"; }));
		});
		fitMoves();
		fitTypeGrid();
	}
	function goTo(i) {
		var sec = sections()[i];
		[sec.h0, sec.h1, sec.h2, i].forEach(function (h) { if (h >= 0) open[headKey(data.rows[h])] = 1; });
		save(K_OPEN, open);
		applyCollapse();
		var tr = $(".mg-page tr[data-i='" + i + "']");
		if (tr) tr.scrollIntoView({block: "start"});
	}
	// open (or close) a header and every header inside it
	function inside(i) {
		var sec = sections(), out = [i], k = data.rows[i].k;
		for (var x = i + 1; x < data.rows.length; x++) {
			var s = sec[x], r = data.rows[x];
			if (!(s[k] === i || (k === "h0" && s.h0 === i) || (k === "h1" && s.h1 === i))) break;
			if (HEADS[r.k]) out.push(x);
		}
		return out;
	}
	function openAll(i) { inside(i).forEach(function (h) { open[headKey(data.rows[h])] = 1; }); }
	function closeAll(i) { inside(i).forEach(function (h) { delete open[headKey(data.rows[h])]; }); }
	// ---- the table of contents as cards and pills (layout + colors from Dooz's mockup) ----
	var ICON_URL = "https://img.pokemondb.net/images/icons/move-%s.png";
	var TOC_LOOK = {
		"Priority Attacking Moves": {icon: "prio", sub: "(Includes regular offensive priority moves, First Impression variants &amp; Fake Out variants)"},
		"Debuffing Moves": {icon: "down", sub: "(Includes all moves ~both status and offensive~ that <u>lower the opponent's</u> offensive stats, defensive stats, or Speed)"},
		"Setup Moves": {icon: "up", sub: "(Includes all moves ~both status and offensive~ that <u>boost the user's</u> offensive stats, defensive stats, or Speed)"},
		"Attacking Moves With Drawbacks": {icon: "physical", cols: 1, w: 0.82},
		"Other Damaging Moves": {icon: "special", cols: 2, colw: "1.75fr 1fr", w: 1},
		"Status Inflicting Moves": {icon: "status", cols: 1, w: 0.6},
		"Other Miscellaneous Utility Moves": {icon: "gear", cols: 3, colw: "1fr 1.42fr 1.12fr", w: 1.15, title: "Other Miscellaneous Utility Move Categories"}
	};
	var TOC_ICONS = {
		"Priority Attacking Moves": [["chevrons-right"], ["phys", "spec"]],
		"Attacking Moves With Drawbacks": [["exclaim", "phys"], ["exclaim", "spec"]],
		"Other Damaging Moves": [["plus-bold", "phys"], ["plus-bold", "spec"]]
	};
	function tocIcon(kind) {
		if (kind === "physical" || kind === "special" || kind === "status") return "<img class='tocx-ico' src='" + ICON_URL.replace("%s", kind) + "' alt=''>";
		if (kind === "down") return "<svg class='tocx-arrow' viewBox='0 0 24 24'><path d='M9 3h6v9h5l-8 9-8-9h5z' fill='#b78bee'/></svg>";
		if (kind === "up") return "<svg class='tocx-arrow' viewBox='0 0 24 24'><path d='M9 21h6v-9h5l-8-9-8 9h5z' fill='#6fe3ff'/></svg>";
		if (kind === "prio") return "<svg class='tocx-arrow' viewBox='0 0 24 24'><path d='M3 5l7 7-7 7M11 5l7 7-7 7' fill='none' stroke='#8fd3ff' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'/></svg>";
		return "<svg class='tocx-ico' viewBox='0 0 24 24'><path fill='#8fd3ff' d='M19.4 13a7.6 7.6 0 0 0 0-2l2.1-1.6-2-3.5-2.5 1a7.4 7.4 0 0 0-1.7-1L15 3h-4l-.4 2.9a7.4 7.4 0 0 0-1.7 1l-2.5-1-2 3.5L6.6 11a7.6 7.6 0 0 0 0 2l-2.1 1.6 2 3.5 2.5-1a7.4 7.4 0 0 0 1.7 1L11 21h4l.4-2.9a7.4 7.4 0 0 0 1.7-1l2.5 1 2-3.5zM13 15.5A3.5 3.5 0 1 1 13 8.5a3.5 3.5 0 0 1 0 7z'/></svg>";
	}
	function tocCards() {
		var groups = data.toc || [];
		if (!groups.length) return "";
		var esc = function (t) { return String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/'/g, "&#39;"); };
		var main = groups[0], rest = groups.slice(1);
		var h = "<div class='tocx'>";
		// the three main categories: big cards, all one style
		h += main.cats.map(function (c) {
			var L = TOC_LOOK[c] || {};
			var TI = TOC_ICONS[c];
			return "<a href='#' class='tocx-main' data-cat='" + esc(c) + "'><div class='tocx-main-t'>" + (TI ? iconGroup(TI[0]) : tocIcon(L.icon)) + "<span>" + esc(c) + "</span>" + (TI ? iconGroup(TI[1]) : tocIcon(L.icon)) + "</div>" +
				(L.sub ? "<div class='tocx-main-s'>" + L.sub + "</div>" : "") + "</a>";
		}).join("");
		// the groups: windows with a header bar and pill rows
		var win = function (g) {
			var L = TOC_LOOK[g.name] || {cols: 1}, n = g.cats.length, cols = L.cols || 1, rows = Math.ceil(n / cols);
			var lastCount = n - rows * (cols - 1); // a short last column: its first pill stretches to fill (like the mockup)
			var TI = TOC_ICONS[g.name];
			return "<div class='tocx-win'><div class='tocx-head'>" + (TI ? iconGroup(TI[0]) : tocIcon(L.icon)) + "<span>" + esc(L.title || g.name) + "</span>" + (TI ? iconGroup(TI[1]) : "") + "</div>" +
				"<div class='tocx-items' style='grid-template-columns:" + (L.colw || "repeat(" + cols + ",1fr)") + ";grid-template-rows:repeat(" + rows + ",1fr)'>" +
				g.cats.map(function (c, k) {
					var span = cols > 1 && lastCount < rows && k === rows * (cols - 1) ? " style='grid-row:span " + (rows - lastCount + 1) + "'" : "";
					return "<a href='#' class='tocx-item" + (k % 2 ? " tocx-alt" : "") + "' data-cat='" + esc(c) + "'" + span + "><span class='tocx-arr'>→</span><span class='tocx-lbl'>" + esc(c) + "</span></a>";
				}).join("") + "</div></div>";
		};
		for (var k = 0; k < rest.length; k += 2) {
			var a = rest[k], b = rest[k + 1];
			var wa = (TOC_LOOK[a.name] || {}).w || 1, wb = b ? (TOC_LOOK[b.name] || {}).w || 1 : 0;
			h += "<div class='tocx-pair' style='grid-template-columns:" + (b ? wa + "fr " + wb + "fr" : "1fr") + "'>" + win(a) + (b ? win(b) : "") + "</div>";
		}
		return h + "</div>";
	}
	// ---- one-time data updates (run on load so they reach an unsaved draft too) ----
	function migrate() {
		var th = data.theme = data.theme || {}, changed = false;
		// a header that also holds its blurb: the header keeps just its name, the blurb (exactly as written) moves to a new row under it
		if (!th.blurbRows) {
			for (var i = data.rows.length - 1; i >= 0; i--) {
				var r = data.rows[i];
				if (!(r.k === "h1" || r.k === "h2") || zone(r) !== "body" || r.c.length !== 1) continue;
				var parts = splitAtFirstBreak(r.c[0][3]);
				if (!parts) continue;
				r.c[0][3] = parts[0];
				var blurb = {k: "row", h: 30, c: [[r.c[0][0], r.c[0][1], 1, parts[1]]]};
				if (r.zone) blurb.zone = r.zone;
				r.h = Math.min(r.h, 70);
				data.rows.splice(i + 1, 0, blurb);
			}
			th.blurbRows = 1; changed = true;
		}
		// "Ability Changing" -> "Ability Changing Moves" (contents + the category it points at)
		if (!th.renameAbility) {
			(data.toc || []).forEach(function (g) { g.cats = g.cats.map(function (c) { return c === "Ability Changing" ? "Ability Changing Moves" : c; }); });
			data.rows.forEach(function (r) { if (r.cat === "Ability Changing") r.cat = "Ability Changing Moves"; r.c.forEach(function (c) { if (c[4] && c[4].go === "Ability Changing") c[4].go = "Ability Changing Moves"; }); });
			th.renameAbility = 1; changed = true;
		}
		// "Inaccurate Damaging Moves" -> "Inaccurate Moves"
		if (!th.renameInaccurate) {
			data.rows.forEach(function (r) { if (r.cat === "Inaccurate Moves" && (r.k === "h1")) r.c[0][3] = r.c[0][3].replace("Inaccurate Damaging Moves", "Inaccurate Moves"); });
			th.renameInaccurate = 1; changed = true;
		}
		// Weather & Terrain Setting moves up to sit in the same box as Weather & Terrain Interactions
		if (!th.weatherJoin) {
			var blockOf = function (cat) {
				var a = -1; for (var x = 0; x < data.rows.length; x++) if (data.rows[x].k === "h1" && data.rows[x].cat === cat) { a = x; break; }
				if (a < 0) return null;
				var b = a + 1; while (b < data.rows.length && !(data.rows[b].k === "h1" || data.rows[b].k === "h0")) b++;
				return [a, b];
			};
			var setB = blockOf("Weather & Terrain Setting"), intB = blockOf("Weather & Terrain Interactions");
			if (setB && intB) {
				var moved = data.rows.splice(setB[0], setB[1] - setB[0]);
				moved[0].joinPrev = true;
				intB = blockOf("Weather & Terrain Interactions");
				Array.prototype.splice.apply(data.rows, [intB[1], 0].concat(moved));
			}
			th.weatherJoin = 1; changed = true;
		}
		if (changed) setTimeout(markDirty, 0);
	}
	// split a cell's html at its first line break: [title html, rest html] (null when there's nothing after it)
	function splitAtFirstBreak(html) {
		var box = document.createElement("div"); box.innerHTML = html;
		var br = box.querySelector("br");
		if (!br) return null;
		var after = document.createRange(); after.setStartAfter(br); after.setEnd(box, box.childNodes.length);
		var restFrag = after.cloneContents(), rest = document.createElement("div"); rest.appendChild(restFrag);
		if (!rest.textContent.trim()) return null;
		var before = document.createRange(); before.setStart(box, 0); before.setEndBefore(br);
		var head = document.createElement("div"); head.appendChild(before.cloneContents());
		if (!head.textContent.trim()) return null;
		// drop leading line breaks / empty pieces at the start of the blurb
		var restHtml = rest.innerHTML.replace(/^(\s|<span[^>]*>\s*<\/span>|<br\s*\/?>)+/, "");
		return [head.innerHTML, restHtml];
	}
	function goToCat(name) {
		for (var i = 0; i < data.rows.length; i++) if (data.rows[i].k === "h1" && data.rows[i].cat === name) return goTo(i);
	}
	function goToType(t) {
		for (var i = 0; i < data.rows.length; i++) if (data.rows[i].k === "h1" && typeOf(data.rows[i]) === t) { openAll(i); return goTo(i); }
	}

	// Move rows: one fixed height, at most two lines. A cell with two written lines never wraps further; a one-line
	// cell may wrap to two. Anything that still doesn't fit shrinks (the whole cell, evenly) until it does.
	var FIT = {};
	function fitMoves(only) {
		// batched: write all, then read all, then write all (measuring cell by cell made the page crawl)
		var todo = [], colsKey = data.cols.join(",");
		(only ? only.filter(function (tr) { return tr.classList.contains("mg-mv"); }) : $$("#mg-guide tr.mg-mv")).forEach(function (tr) {
			if (tr.style.display === "none") return;
			var r = data.rows[+tr.getAttribute("data-i")];
			Array.prototype.forEach.call(tr.children, function (td) {
				var inn = td.firstElementChild;
				if (!inn || !inn.classList.contains("mg-in") || inn.getAttribute("data-fit") === "1") return;
				var lines = (inn.innerHTML.match(/<br/g) || []).length + 1, j = +td.getAttribute("data-j"), c = r && r.c[j];
				var key = c ? tr.getAttribute("data-h") + "|" + colsKey + "|" + r.c.map(function (q) { return q[1]; }).join(",") + "|" + j + "|" + JSON.stringify(c[4] || "") + "|" + c[3] : null;
				inn.style.whiteSpace = lines >= 2 ? "nowrap" : "";
				// a size you set yourself (the cell's size, or a size on part of its text) is kept: no auto-shrink
				if (c && ((c[4] && c[4].st && c[4].st.fs) || /font-size/.test(c[3]))) { inn.style.zoom = 1; inn.setAttribute("data-fit", "1"); return; }
				if (key && FIT[key] != null) { inn.style.zoom = FIT[key]; inn.setAttribute("data-fit", "1"); return; }
				inn.style.zoom = 1;
				todo.push({inn: inn, td: td, h: +tr.getAttribute("data-h") - 4, wrap: lines < 2, key: key});
			});
		});
		for (var round = 0; round < 4 && todo.length; round++) {
			todo.forEach(function (t) { t.sh = t.inn.scrollHeight; t.sw = t.inn.scrollWidth; t.w = t.td.clientWidth - 6; t.z = +t.inn.style.zoom || 1; });
			todo = todo.filter(function (t) {
				var need = Math.min(t.h / (t.sh * t.z), t.w / (t.sw * t.z));
				t.inn.setAttribute("data-fit", "1");
				if (need >= 0.995) { if (t.key) FIT[t.key] = +t.inn.style.zoom || 1; return false; }
				// a wrapping cell re-wraps when it shrinks, so it gets another look next round
				var z = Math.max(0.45, Math.floor(t.z * need * (t.wrap ? Math.sqrt(need) : 1) * 100) / 100);
				t.inn.style.zoom = z;
				if (t.key) FIT[t.key] = z;
				return t.wrap && z > 0.45;
			});
		}
	}

	// ---- colors ----
	function typeText(t) { return typeof remixTypeText === "function" ? remixTypeText(TYPE_COLORS[t], t) : "#000"; }
	function hsl(hex) {
		var n = parseInt(hex.slice(1), 16), r = (n >> 16 & 255) / 255, g = (n >> 8 & 255) / 255, b = (n & 255) / 255;
		var mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn, h = 0, s = 0;
		if (d) { s = d / (1 - Math.abs(2 * l - 1)); h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h = (h * 60 + 360) % 360; }
		return [h, s, l];
	}
	function hex(h, s, l) {
		var c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2;
		var rgb = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
		return "#" + rgb.map(function (v) { return ("0" + Math.round(Math.max(0, Math.min(1, v + m)) * 255).toString(16)).slice(-2); }).join("");
	}
	var clsColor = {};
	var blackBorders = {};
	function readClassColors() {
		data.css.replace(/\.mg \.(s\d+)\{([^}]*)\}/g, function (a, k, body) {
			var sides = [];
			body.replace(/border-(top|right|bottom|left):[^;]*#000000/gi, function (m, side) { sides.push(side.toLowerCase()); });
			if (sides.length) blackBorders[k] = sides;
		});
		data.css.replace(/\.mg \.([a-z]\d+)\{([^}]*)\}/g, function (a, k, body) {
			var c = /(?:^|;)color:(#[0-9a-f]{6})/i.exec(body), b = /background-color:(#[0-9a-f]{6})/i.exec(body);
			clsColor[k] = {color: c && c[1].toLowerCase(), bg: b && b[1].toLowerCase()};
		});
	}
	function spanClasses(h) { return (h.match(/class="(r\d+)"/g) || []).map(function (x) { return x.slice(7, -1); }); }
	// Type sections in the website's type colors. A type's sheet color is its header's text (the bars are black):
	// that color becomes the website color, and each lighter fill becomes the website color lightened by the SAME
	// formula the sheet used (the same share of the way to white, the same saturation ratio), so every type's
	// light rows are as much lighter than its base as in the sheet. Greys, white and black stay.
	// Every type has two fills: its base (the website type color) and a lighter secondary. The secondary is the website
	// color lightened by the same formula the sheet used for that type (same share of the way to white, same saturation
	// ratio), unless one is set by hand in data.theme.secondary (Fire: #ff9554).
	// Which type a cell belongs to: in a type section, that type; in ANY move row (the categories too), the move's own
	// Type cell. A move whose Type isn't a real type ("User Type") keeps the sheet's colors.
	var SECONDARY = {Fire: "#ff9554"};
	var sheetMain = {}, sheetSecond = {};
	function learnSheetColors() {
		var type = null, counts = {};
		data.rows.forEach(function (r) {
			if (r.k === "h1") {
				type = typeOf(r);
				if (type && !sheetMain[type]) {
					var c0 = r.c[0], cc = clsColor[c0[0]] || {}, main = cc.color && hsl(cc.color)[1] > 0.15 ? cc.color : null;
					spanClasses(c0[3]).forEach(function (k) { var sc = clsColor[k]; if (!main && sc && sc.color && hsl(sc.color)[1] > 0.15) main = sc.color; });
					if (main) sheetMain[type] = main;
				}
			} else if (r.k === "h0" || r.cat) type = null;
			if (!type || !isMoveRow(r) || !sheetMain[type]) return;
			r.c.forEach(function (c) {
				var bg = (clsColor[c[0]] || {}).bg;
				if (!bg || bg === sheetMain[type] || !colorful(bg)) return;
				counts[type] = counts[type] || {}; counts[type][bg] = (counts[type][bg] || 0) + 1;
			});
		});
		Object.keys(counts).forEach(function (t) { sheetSecond[t] = Object.keys(counts[t]).sort(function (x, y) { return counts[t][y] - counts[t][x]; })[0]; });
	}
	function colorful(c) { var o = hsl(c); return o[1] >= 0.12 && o[2] <= 0.985 && o[2] >= 0.04; }
	function secondary(t) {
		var own = (data.theme && data.theme.secondary || {})[t] || SECONDARY[t];
		if (own) return own;
		var m = sheetMain[t], s2 = sheetSecond[t], w = hsl(TYPE_COLORS[t]);
		if (!m || !s2) return hex(w[0], w[1] * 0.6, w[2] + 0.6 * (1 - w[2]));
		var M = hsl(m), S = hsl(s2), toWhite = M[2] < 1 ? (S[2] - M[2]) / (1 - M[2]) : 0;
		return hex(w[0], Math.min(1, w[1] * (M[1] ? S[1] / M[1] : 1)), toWhite >= 0 ? w[2] + toWhite * (1 - w[2]) : w[2] * (S[2] / (M[2] || 1)));
	}
	function fillFor(t, bg) {
		if (!bg || !colorful(bg)) return null;
		return bg === sheetMain[t] ? TYPE_COLORS[t] : secondary(t);
	}
	function rowType(r) {
		for (var j = 0; j < r.c.length; j++) { var t = plain(r.c[j][3]); if (TYPE_COLORS[t]) return t; }
		return null;
	}
	function typeColorCss() {
		if (!Object.keys(sheetMain).length) learnSheetColors();
		var css = "", section = null;
		data.rows.forEach(function (r, i) {
			if (r.k === "h1") section = typeOf(r);
			else if (r.k === "h0" || r.cat) section = null;
			var t = isMoveRow(r) ? rowType(r) : section;
			if (!t || !sheetMain[t]) return;
			var main = sheetMain[t], sel = "tr[data-i='" + i + "'] > td[data-j='";
			r.c.forEach(function (c, j) {
				var cc = clsColor[c[0]] || {}, cell = sel + j + "']";
				var nb = fillFor(t, cc.bg);
				if (nb) css += cell + "{background-color:" + nb + " !important}";
				if (cc.color === main) css += cell + "{color:" + TYPE_COLORS[t] + " !important}";
				spanClasses(c[3]).forEach(function (k) { var sc = clsColor[k]; if (sc && sc.color === main) css += cell + " ." + k + "{color:" + TYPE_COLORS[t] + " !important}"; });
			});
		});
		return css;
	}

	// Colors you pick for the intro and the table of contents (Colors panel), saved in data.theme
	var LOGO_SWATCHES = ["#7d1bc0", "#7f72c8", "#c9a6ef", "#7bc0dc", "#16698b", "#3769a8", "#0f4469", "#facc17", "#e3e0ac", "#dab578", "#ef1c7b", "#ffffff"];
	function areaColors(kind) {
		var seen = {};
		data.rows.forEach(function (r) {
			if (r.k !== kind) return;
			r.c.forEach(function (c) {
				[c[0]].concat(spanClasses(c[3])).forEach(function (k) {
					var cc = clsColor[k];
					if (cc && cc.color) seen["t" + cc.color] = 1;
					if (cc && cc.bg && k[0] === "s") seen["f" + cc.bg] = 1;
				});
			});
		});
		return Object.keys(seen).sort();
	}
	function themeCss() {
		var th = data.theme || {}, css = "";
		// test view (toggle "◐ Site background"): every pure-black fill becomes the site's dark color
		var INNER = "#0c0a0e"; // halfway between the sheet's black and the site's #17141c
		Object.keys(clsColor).forEach(function (k) { if (k[0] === "s" && clsColor[k].bg === "#000000") css += "body.mg-sitebg .mg-page td." + k + "{background-color:" + INNER + "}"; });
		Object.keys(blackBorders).forEach(function (k) { css += "body.mg-sitebg .mg-page td." + k + "{" + blackBorders[k].map(function (side) { return "border-" + side + "-color:" + INNER; }).join(";") + "}"; });
		[["intro", "#mg-info"], ["toc", "#mg-toc"]].forEach(function (a) {
			var map = th[a[0]] || {};
			Object.keys(clsColor).forEach(function (k) {
				var c = clsColor[k];
				if (c.color && map["t" + c.color]) css += a[1] + " ." + k + "{color:" + map["t" + c.color] + "}";
				if (c.bg && map["f" + c.bg] && k[0] === "s") css += a[1] + " td." + k + "{background-color:" + map["f" + c.bg] + "}";
			});
		});
		return css;
	}
	function applyColors() {
		var st = document.getElementById("mg-colors") || document.head.appendChild(Object.assign(document.createElement("style"), {id: "mg-colors"}));
		var css = themeCss(); /* the guide keeps the sheet's own type colors (user 2026-11-22); cell formatting is on the cells */
		if (st.textContent !== css) st.textContent = css;
	}
	// the editor's cell formatting, for viewers (the editor itself isn't loaded for them)
	function cellCss() { return typeof RemixSheetEditor !== "undefined" ? RemixSheetEditor.css(data) : ""; }
	function colorPanel() {
		var p = document.getElementById("mg-colorpanel");
		if (p) { p.remove(); return; }
		var th = data.theme = data.theme || {}, row = function (key, kind) {
			var val = (th[kind] || {})[key] || key.slice(1), what = key[0] === "t" ? "Text" : "Fill";
			return "<div class='mg-cp-row'><input type='color' value='" + val + "' data-cp='" + kind + "' data-key='" + key + "'><span>" + what +
				" <code>" + key.slice(1) + "</code></span></div>" + RemixSheetEditor.swatchHtml("data-sw");
		};
		p = document.createElement("div");
		p.id = "mg-colorpanel";
		p.innerHTML = "<div class='mg-cp-top'><b>Move Guide colors</b><button type='button' class='mg-btn' data-cp-close>✕</button></div>" +
			"<div class='mg-cp-note'>Each color the sheet uses at the top, swapped everywhere it appears there. Swatches = the new Remix logo's colors. Changes show live; 💾 Save to file keeps them.</div>" +
			"<div class='mg-cp-h'>Info blurb</div>" + areaColors("intro").map(function (k) { return row(k, "intro"); }).join("") +
			"<div class='mg-cp-h'>Table of contents</div>" + areaColors("toc").map(function (k) { return row(k, "toc"); }).join("") +
			"<button type='button' class='mg-btn' data-cp-reset>Reset to the sheet's colors</button>";
		document.body.appendChild(p);
	}
	function setColor(input, val) {
		var th = data.theme = data.theme || {}, kind = input.getAttribute("data-cp"), key = input.getAttribute("data-key");
		if (!kind || !key) return;
		th[kind] = th[kind] || {};
		th[kind][key] = val; input.value = val;
		applyColors(); markDirty();
	}

	// ---- the logo in the info blurb: drag to move, drag its corner to resize (edit mode), saved in data.theme.logo ----
	function placeLogo() {
		var img = $("#mg-info img.mg-img");
		if (!img) return;
		var L = (data.theme || {}).logo;
		img.style.position = "relative";
		img.style.maxWidth = "none"; img.style.maxHeight = "none";
		if (!L) L = {x: 12, y: 0, w: Math.max(60, data.cols[0] - 24)}; // not set yet: fit the cell, off the left edge
		img.style.width = L.w + "px"; img.style.height = "auto"; img.style.left = L.x + "px"; img.style.top = L.y + "px";
		img.parentNode.style.overflow = "visible";
		img.classList.toggle("mg-logo-edit", editing);
		img.title = editing ? "Drag to move · drag the bottom-right corner to resize" : "";
	}
	document.addEventListener("mousedown", function (e) {
		var img = e.target.closest && e.target.closest("img.mg-logo-edit");
		if (!img || !editing) return;
		e.preventDefault(); e.stopPropagation();
		var r = img.getBoundingClientRect(), zoom = parseFloat(img.closest("table").style.zoom) || 1;
		var L = (data.theme = data.theme || {}).logo = (data.theme.logo || {x: 0, y: 0, w: img.offsetWidth});
		var resize = e.clientX > r.right - 22 && e.clientY > r.bottom - 22, sx = e.clientX, sy = e.clientY, st = {x: L.x, y: L.y, w: L.w};
		function mv(ev) {
			var dx = (ev.clientX - sx) / zoom, dy = (ev.clientY - sy) / zoom;
			if (resize) L.w = Math.max(40, Math.round(st.w + dx)); else { L.x = Math.round(st.x + dx); L.y = Math.round(st.y + dy); }
			placeLogo();
		}
		function up() { document.removeEventListener("mousemove", mv); document.removeEventListener("mouseup", up); markDirty(); }
		document.addEventListener("mousemove", mv); document.addEventListener("mouseup", up);
	}, true);

	function startOpenLabel() {
		var b = $(".mg-btn[data-act=startopen]");
		if (b) { b.innerHTML = startOpen ? "▾ Dropdowns start: Expanded" : "▸ Dropdowns start: Collapsed"; b.classList.toggle("on", startOpen); }
	}
	function applyHide() {
		startOpenLabel();
		$("#mg-info").style.display = hide.info ? "none" : "";
		$("#mg-toc").style.display = hide.toc ? "none" : "";
		$(".mg-btn[data-act=info]").textContent = hide.info ? "Show info" : "Hide info";
		$(".mg-btn[data-act=toc]").textContent = hide.toc ? "Show contents" : "Hide contents";
	}

	// the sheet's own width, scaled down to fit (never up); very narrow screens scroll sideways instead
	function scale() {
		var w = data.cols.reduce(function (a, b) { return a + b; }, 0) + (editing ? 46 : 0);
		$$(".mg-page table.mg").forEach(function (t) {
			var box = t.parentNode.clientWidth;
			t.style.zoom = Math.max(0.42, Math.min(1, box / w));
		});
	}

	// ---- editing (localhost only) ----
	function editTools() {
		var el = $(".mg-edit-tools");
		if (!CAN_EDIT) { el.innerHTML = ""; return; }
		el.innerHTML = "<span class='mg-mode'><button type='button' class='mg-btn mg-mode-b" + (editing ? "" : " on") + "' data-mode='preview' title='Exactly what visitors see'>👁 Preview</button>" +
			"<button type='button' class='mg-btn mg-mode-b" + (editing ? " on" : "") + "' data-mode='edit' title='The Sheets-style editor (only you see it)'>✏️ Edit</button></span>" +
			"<button type='button' class='mg-btn mg-colors' title='Change the info blurb and table of contents colors'>🎨 Colors</button>" +

			(editing || dirty ? "<button type='button' class='mg-btn mg-save' title='Save into the website folder (src/moveguide/move_guide.json)'>💾 Save" + (dirty ? " •" : "") + "</button>" +
				"<button type='button' class='mg-btn mg-discard' title='Throw away your unsaved edits'>Discard edits</button>" : "");
	}
	var undo = [], redo = [];
	function snap() { return JSON.stringify({rows: data.rows, cols: data.cols, theme: data.theme, moveH: data.moveH}); }
	// a dated copy of the guide in "Saved from the site/auto-backups" (via tools/dev_server.py): on Save, before Discard,
	// and every 3 minutes while there are unsaved edits. Never blocks anything if the server isn't there.
	var lastBackup = "";
	function backup(why) {
		var text = JSON.stringify(data);
		if (text === lastBackup) return Promise.resolve();
		return fetch("/__backup", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({path: "moveguide/move_guide.json", content: text, why: why})})
			.then(function (r) { if (r.ok) lastBackup = text; }, function () {});
	}
	setInterval(function () { if (CAN_EDIT && data && dirty) backup("auto"); }, 180000);
	function toast(msg) {
		var t = document.getElementById("mg-toast") || document.body.appendChild(Object.assign(document.createElement("div"), {id: "mg-toast"}));
		t.textContent = msg; t.style.display = "block";
		clearTimeout(toast.t); toast.t = setTimeout(function () { t.style.display = "none"; }, 4000);
	}
	function markDirty() {
		var now = snap();
		if (undo[undo.length - 1] !== now) { undo.push(now); if (undo.length > 150) undo.shift(); redo = []; }
		dirty = true; saveDraftSoon(); editTools();
	}
	function saveDraftSoon() { clearTimeout(saveDraftSoon.t); saveDraftSoon.t = setTimeout(function () { save(K_DRAFT, data); }, 600); }
	window.addEventListener("beforeunload", function () { if (saveDraftSoon.t && dirty) save(K_DRAFT, data); });
	function restore(from, to) {
		if (from.length < 2 && from === undo) return;
		if (from === undo) { to.push(from.pop()); var st = JSON.parse(undo[undo.length - 1]); }
		else { if (!from.length) return; var x = from.pop(); undo.push(x); st = JSON.parse(x); }
		data.rows = st.rows; data.cols = st.cols; data.theme = st.theme; data.moveH = st.moveH;
		dirty = true; save(K_DRAFT, data); editTools(); render();
	}
	document.addEventListener("keydown", function (e) {
		if (!editing || !(e.ctrlKey || e.metaKey)) return;
		if (editor && editor.editing()) return; // typing in a cell: the browser undoes the typing itself
		var k = e.key.toLowerCase();
		if (k === "z" && !e.shiftKey) { e.preventDefault(); restore(undo, redo); }
		else if (k === "y" || (k === "z" && e.shiftKey)) { e.preventDefault(); restore(redo, undo); }
	});
	function startEditor() {
		if (!editor) editor = RemixSheetEditor.create({
			data: function () { return data; },
			scope: ".mg-page",
			rowH: rowH,
			rerender: render,
			changed: markDirty,
			undo: function () { restore(undo, redo); },
			redo: function () { restore(redo, undo); },
			kinds: [["row", "Normal row"], ["h0", "Big dropdown (whole group)"], ["h1", "Header (type / category)"], ["h2", "Sub-header"], ["intro", "Info blurb"], ["toc", "Table of contents"]]
		});
		editor.start();
	}
	function setMode(edit) {
		if (edit === editing) return;
		editing = edit;
		if (editing) { startEditor(); if (!undo.length) undo.push(snap()); } else if (editor) editor.stop();
		document.body.classList.toggle("mg-editing", editing);
		editTools(); render();
	}

	document.addEventListener("click", function (e) {
		if (e.target.closest(".mg-colors") || e.target.closest("[data-cp-close]")) { colorPanel(); return; }
		var sw = e.target.closest("#mg-colorpanel [data-sw]");
		if (sw) { e.preventDefault(); var row0 = sw.closest(".rse-sw").previousElementSibling; if (row0) setColor(row0.querySelector("input"), sw.getAttribute("data-sw")); return; }
		if (e.target.closest("[data-cp-reset]")) {
			var rb = e.target.closest("[data-cp-reset]");
			if (!rb.classList.contains("sure")) { rb.classList.add("sure"); rb.textContent = "Click again to reset"; return; }
			var logo = (data.theme || {}).logo; data.theme = logo ? {logo: logo} : {}; applyColors(); markDirty(); colorPanel(); colorPanel(); return;
		}
		var tx = e.target.closest(".tocx [data-cat]");
		if (tx) { e.preventDefault(); goToCat(tx.getAttribute("data-cat")); return; }
		if (editing) { var b0 = e.target.closest(".mg-btn"); if (!b0 && !e.target.classList.contains("mg-caret")) return; }
		var go = e.target.closest("td.mg-go");
		if (go) {
			e.preventDefault();
			var gc = data.rows[+go.parentNode.getAttribute("data-i")].c[+go.getAttribute("data-j")];
			goToCat(gc[4].go); return;
		}
		var top = e.target.closest("a[href='#mg-toc']");
		if (top) { e.preventDefault(); if (hide.toc) { hide.toc = 0; save(K_HIDE, hide); applyHide(); } $("#mg-toc").scrollIntoView(); return; }
		var c2 = e.target.closest(".mg-caret2");
		if (c2) {
			var hi2 = +c2.closest("tr").getAttribute("data-i"), all = inside(hi2);
			var anyShut = all.some(function (h) { return !isOpen(h); });
			if (anyShut) openAll(hi2); else closeAll(hi2);
			applyCollapse(); return;
		}
		var tg = e.target.closest(".mg-tg");
		if (tg) { e.preventDefault(); goToType(tg.getAttribute("data-type")); return; }
		var hd = e.target.closest(".mg-page td.mg-hd");
		if (hd) {
			var hi = +hd.parentNode.getAttribute("data-i"), k = headKey(data.rows[hi]);
			if (data.rows[hi].k === "h0") { if (open[k]) closeAll(hi); else open[k] = 1; }
			else if (open[k]) delete open[k]; else open[k] = 1;
			save(K_OPEN, open); applyCollapse(); return;
		}
		var b = e.target.closest(".mg-btn");
		if (!b) return;
		var act = b.getAttribute("data-act");
		if (act === "info" || act === "toc") { hide[act] = hide[act] ? 0 : 1; save(K_HIDE, hide); applyHide(); }
		else if (act === "startopen") {
			startOpen = !startOpen;
			try { localStorage.setItem("remixMoveGuideStartOpen", startOpen ? "1" : ""); } catch (e5) {}
			if (startOpen) data.rows.forEach(function (r) { if (HEADS[r.k]) open[headKey(r)] = 1; });
			else { open = {}; data.rows.forEach(function (r) { if (zone(r) === "toc" && HEADS[r.k]) open[headKey(r)] = 1; }); }
			startOpenLabel(); applyCollapse();
		}
		else if (act === "collapse") { open = {}; save(K_OPEN, open); applyCollapse(); }
		else if (act === "expand") { data.rows.forEach(function (r) { if (HEADS[r.k]) open[headKey(r)] = 1; }); save(K_OPEN, open); applyCollapse(); }
		else if (b.hasAttribute("data-mode")) setMode(b.getAttribute("data-mode") === "edit");
		else if (b.classList.contains("mg-sitebg-b")) { var on = document.body.classList.toggle("mg-sitebg"); try { localStorage.setItem("remixMoveGuideSiteBg", on ? "1" : ""); } catch (e4) {} editTools(); }
		else if (b.classList.contains("mg-save")) {
			var text = JSON.stringify(data);
			backup("save");
			b.textContent = "Saving…";
			fetch("/__save", {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({path: "moveguide/move_guide.json", content: text})})
				.then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
				.then(function () {
					// it's in the website folder now: the draft isn't needed any more
					dirty = false; clearTimeout(saveDraftSoon.t); saveDraftSoon.t = null;
					try { localStorage.removeItem(K_DRAFT); } catch (e3) {}
					editTools(); toast("Saved to the website folder (src/moveguide/move_guide.json)");
				})
				.catch(function () {
					var a = document.createElement("a");
					a.href = URL.createObjectURL(new Blob([text], {type: "application/json"}));
					a.download = "move_guide.json"; a.click();
					editTools(); toast("The save server isn't running, so it downloaded instead. Put move_guide.json in src/moveguide/.");
				});
		} else if (b.classList.contains("mg-discard")) {
			// a deliberate step (a double-click once threw away hours of work): type DISCARD; a backup is kept anyway
			var box = document.getElementById("mg-discardbox");
			if (box) { box.remove(); return; }
			box = document.createElement("div"); box.id = "mg-discardbox";
			box.innerHTML = "Throw away ALL unsaved edits? (A backup copy is kept in Saved from the site/auto-backups.) Type <b>DISCARD</b>: <input> <button type='button' class='mg-btn' data-x='go'>Discard</button> <button type='button' class='mg-btn' data-x='no'>Cancel</button>";
			document.body.appendChild(box);
			var inp = box.querySelector("input"); inp.focus();
			box.onclick = function (ev) {
				var x = ev.target.getAttribute("data-x");
				if (x === "no") box.remove();
				if (x === "go") {
					if (inp.value.trim().toUpperCase() !== "DISCARD") { inp.style.outline = "2px solid #ff6b6b"; return; }
					backup("discard").then(function () { try { localStorage.removeItem(K_DRAFT); } catch (e2) {} dirty = false; saveDraftSoon.t = null; location.reload(); });
				}
			};
		}
	});
	document.addEventListener("input", function (e) {
		if (e.target.classList && e.target.classList.contains("mg-search")) { applyCollapse(); return; }
		if (e.target.hasAttribute && e.target.hasAttribute("data-cp")) { setColor(e.target, e.target.value); return; }
		var td = e.target.closest && e.target.closest("td[contenteditable]");
		if (!td || (editor && editor.on)) return;
		var i = +td.parentNode.getAttribute("data-i"), j = +td.getAttribute("data-j");
		var clone = td.cloneNode(true);
		clone.querySelectorAll(".mg-caret").forEach(function (x) { x.remove(); });
		var inn = clone.querySelector(":scope > .mg-in");
		data.rows[i].c[j][3] = (inn || clone).innerHTML;
		clearTimeout(markDirty.t); markDirty.t = setTimeout(markDirty, 400);
	});
	window.addEventListener("resize", function () { if (data) { scale(); fitHeads(); fitToc(); } });
	if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { if (data) { fitHeads(); fitTypeGrid(); fitToc(); } });
	// opening / closing / resizing the DoozDex sidebar narrows the page: re-fit the sheet to it
	var lastW = 0; // only when the width changes (not every time a cell grows while you type)
	if (window.ResizeObserver) new ResizeObserver(function (en) { var w = Math.round(en[0].contentRect.width); if (data && w !== lastW) { lastW = w; scale(); } }).observe(document.querySelector(".mg-page"));

	document.body.classList.add("mg-sitebg"); // the windowed look (dark gray inside, site color around) is the normal look
	var draft = CAN_EDIT ? load(K_DRAFT, null) : null;
	fetch("./moveguide/move_guide.json", {cache: "no-cache"}).then(function (r) { return r.json(); }).then(function (d) {
		data = draft && draft.rows ? draft : d;
		dirty = !!(draft && draft.rows);
		var st = document.createElement("style"); st.textContent = data.css; document.head.appendChild(st);
		readClassColors();
		migrate();
		if (startOpen) data.rows.forEach(function (r) { if (HEADS[r.k]) open[headKey(r)] = 1; });
		data.rows.forEach(function (r) { if (zone(r) === "toc" && HEADS[r.k]) open[headKey(r)] = 1; }); // the type grid starts open
		// the contents list the sheet's own categories only (my 5 extra Misc. Status ones were not in it)
		(data.toc || []).forEach(function (g) {
			g.cats = g.cats.filter(function (c) { return ["Weather & Terrain Setting", "Redirection & Doubles Only Moves", "Assorted Status Moves", "AI / Trainer Only Moves", "Unused Moves/Animations"].indexOf(c) < 0; });
		});
		var th0 = data.theme = data.theme || {};
		delete th0["null"];
		if (!th0.tocPurples) {
			th0.toc = Object.assign(th0.toc || {}, {"t#f6b26b": "#b78bee", "t#ffe599": "#9f01be"});
			th0.tocPurples = 1;
			setTimeout(markDirty, 0);
		}
		var defs = document.createElement("div"); defs.innerHTML = data.defs; document.body.appendChild(defs.firstChild);
		editTools();
		render();
	}).catch(function (e) { $("#mg-guide").innerHTML = "<div class='mg-loading'>Couldn't load the move guide (" + e + ").</div>"; });
})();
