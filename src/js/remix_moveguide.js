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
	var open = load(K_OPEN, {}), hide = load(K_HIDE, {});
	var HEADS = {h0: 1, h1: 1, h2: 1};

	function headKey(r) { return plain(r.c[0][3].split(/<br>|\n/)[0]).slice(0, 80); }
	function headTitle(r) {
		var d = document.createElement("div"); d.innerHTML = r.c[0][3].replace(/<br\s*\/?>/g, "\n");
		return (d.textContent || "").split("\n")[0].replace(/[-–—]{4,}.*/, "").replace(/\s+/g, " ").trim();
	}
	function isColumnHead(r) { return /^Move Name$/i.test(plain(r.c[0][3])); }
	function isMoveRow(r) { return r.k === "row" && r.c.length >= 8 && !isColumnHead(r); }
	var TYPE_COLORS = typeof REMIX_TYPE_COLORS !== "undefined" ? REMIX_TYPE_COLORS : {};
	function typeOf(r) { var m = /^All (\w+) Type Moves/.exec(headTitle(r)); return m && TYPE_COLORS[m[1]] ? m[1] : null; }

	// one height for every move row (the most common one in the sheet) until you set a row's own height
	function moveH() {
		if (data.moveH) return data.moveH;
		var n = {};
		data.rows.forEach(function (r) { if (isMoveRow(r)) n[r.h] = (n[r.h] || 0) + 1; });
		return (data.moveH = +Object.keys(n).sort(function (a, b) { return n[b] - n[a]; })[0] || 46);
	}
	function rowH(r) { return isMoveRow(r) && !r.hSet ? moveH() : r.h; }

	// A cell that is only rich-text spans: the cell's own font size would add a tall empty strut to every line
	// (the sheet sizes each line by its own text), so the cell gets size 0 and each span keeps its own size.
	var noSizeSpan = null;
	function richOnly(h) {
		if (!noSizeSpan) {
			noSizeSpan = {};
			data.css.replace(/\.mg \.(r\d+)\{([^}]*)\}/g, function (a, k, b) { if (b.indexOf("font-size") < 0) noSizeSpan[k] = 1; });
		}
		if (h.indexOf("<span") !== 0) return false;
		var spans = h.match(/<span class="(r\d+)">/g) || [];
		if (spans.some(function (s) { return noSizeSpan[s.slice(13, -2)]; })) return false;
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
			// category icons: one size in every move row
			h = h.replace(/<img class="mg-cat"( style="[^"]*")?/g, "<img class=\"mg-cat\" style=\"height:" + Math.max(18, rowH(r) - 12) + "px\"");
			return "<div class='mg-in'>" + h + "</div>";
		}
		return h;
	}

	function rowHtml(r, i) {
		var head = HEADS[r.k];
		return "<tr data-i='" + i + "' class='mg-" + r.k + (isMoveRow(r) ? " mg-mv" : "") + "' data-h='" + rowH(r) + "' style='height:" + rowH(r) + "px'>" + r.c.map(function (c, j) {
			return "<td class='" + c[0] + cellExtra(c, r) + (head && j === 0 ? " mg-hd" : "") + "'" + (c[1] > 1 ? " colspan='" + c[1] + "'" : "") +
				(c[2] > 1 ? " rowspan='" + c[2] + "'" : "") + " data-j='" + j + "'" + (editing ? " contenteditable='true'" : "") + ">" +
				(head && j === 0 ? "<span class='mg-caret' contenteditable='false'></span>" : "") + cellHtml(c, r) + "</td>";
		}).join("") + "</tr>";
	}
	function tableHtml(rows) {
		return "<table class='mg waffle'><colgroup>" + data.cols.map(function (w) { return "<col style='width:" + w + "px'>"; }).join("") +
			"</colgroup><tbody>" + rows.join("") + "</tbody></table>";
	}

	function render() {
		var intro = [], toc = [], body = [];
		data.rows.forEach(function (r, i) { (r.k === "intro" ? intro : r.k === "toc" ? toc : body).push(rowHtml(r, i)); });
		$("#mg-info").innerHTML = "<div class='mg-scroll'>" + tableHtml(intro) + "</div>";
		$("#mg-toc").innerHTML = "<div class='mg-scroll'>" + tableHtml(toc) + "</div>";
		$("#mg-guide").innerHTML = tableHtml(body);
		if (!editing) linkTypeNames();
		placeLogo();
		applyColors();
		applyCollapse();
		applyHide();
		scale();
		fitMoves();
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
		var h0 = -1, h1 = -1, h2 = -1, out = [];
		data.rows.forEach(function (r, i) {
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
		$$("#mg-guide tr[data-i]").forEach(function (tr) {
			var i = +tr.getAttribute("data-i"), r = data.rows[i], s = sec[i], show;
			if (q) show = match[i] || (isColumnHead(r) && match[s.h2 >= 0 ? s.h2 : s.h1]);
			else show = ["h0", "h1", "h2"].every(function (k) {
				var h = s[k];
				if (h < 0 || h === i) return true;
				if (k === "h2" && HEADS[r.k] && r.k !== "row") return true; // a header isn't inside the h2 before it
				if (k === "h1" && r.k === "h0") return true;
				return isOpen(h);
			});
			tr.style.display = show ? "" : "none";
			if (HEADS[r.k]) tr.classList.toggle("mg-shut", !q && !isOpen(i));
		});
		fitMoves();
	}
	function goTo(i) {
		var sec = sections()[i];
		[sec.h0, sec.h1, sec.h2, i].forEach(function (h) { if (h >= 0) open[headKey(data.rows[h])] = 1; });
		save(K_OPEN, open);
		applyCollapse();
		var tr = $("#mg-guide tr[data-i='" + i + "']");
		if (tr) tr.scrollIntoView({block: "start"});
	}
	function goToCat(name) {
		for (var i = 0; i < data.rows.length; i++) if (data.rows[i].k === "h1" && data.rows[i].cat === name) return goTo(i);
	}
	function goToType(t) {
		for (var i = 0; i < data.rows.length; i++) if (data.rows[i].k === "h1" && typeOf(data.rows[i]) === t) return goTo(i);
	}

	// Move rows: one fixed height, at most two lines. A cell with two written lines never wraps further; a one-line
	// cell may wrap to two. Anything that still doesn't fit shrinks (the whole cell, evenly) until it does.
	function fitMoves() {
		// batched: write all, then read all, then write all (measuring cell by cell made the page crawl)
		var todo = [];
		$$("#mg-guide tr.mg-mv").forEach(function (tr) {
			if (tr.style.display === "none") return;
			Array.prototype.forEach.call(tr.children, function (td) {
				var inn = td.firstElementChild;
				if (!inn || !inn.classList.contains("mg-in") || (inn.getAttribute("data-fit") === "1" && !editing)) return;
				var lines = (inn.innerHTML.match(/<br/g) || []).length + 1;
				inn.style.zoom = 1;
				inn.style.whiteSpace = lines >= 2 ? "nowrap" : "";
				todo.push({inn: inn, td: td, h: +tr.getAttribute("data-h") - 4, wrap: lines < 2});
			});
		});
		for (var round = 0; round < 4 && todo.length; round++) {
			todo.forEach(function (t) { t.sh = t.inn.scrollHeight; t.sw = t.inn.scrollWidth; t.w = t.td.clientWidth - 6; t.z = +t.inn.style.zoom || 1; });
			todo = todo.filter(function (t) {
				var need = Math.min(t.h / (t.sh * t.z), t.w / (t.sw * t.z));
				t.inn.setAttribute("data-fit", "1");
				if (need >= 0.995) return false;
				// a wrapping cell re-wraps when it shrinks, so it gets another look next round
				var z = Math.max(0.45, Math.floor(t.z * need * (t.wrap ? Math.sqrt(need) : 1) * 100) / 100);
				t.inn.style.zoom = z;
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
	function readClassColors() {
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
	function typeColorCss() {
		var css = "", type = null, main = null;
		data.rows.forEach(function (r, i) {
			if (r.k === "h1") {
				type = typeOf(r); main = null;
				if (type) {
					var c0 = r.c[0], cc = clsColor[c0[0]] || {};
					main = cc.color && hsl(cc.color)[1] > 0.15 ? cc.color : null;
					spanClasses(c0[3]).forEach(function (k) { var sc = clsColor[k]; if (!main && sc && sc.color && hsl(sc.color)[1] > 0.15) main = sc.color; });
				}
			} else if (r.k === "h0" || r.cat) type = null;
			if (!type || !main) return;
			var t = hsl(TYPE_COLORS[type]), m = hsl(main), sel = "#mg-guide tr[data-i='" + i + "'] ";
			var recolor = function (col) {
				if (col === main) return TYPE_COLORS[type];
				var o = hsl(col);
				if (o[1] < 0.12 || o[2] > 0.985 || o[2] < 0.04) return null;
				var toWhite = m[2] < 1 ? (o[2] - m[2]) / (1 - m[2]) : 0;
				var l = toWhite >= 0 ? t[2] + toWhite * (1 - t[2]) : t[2] * (o[2] / (m[2] || 1));
				return hex(t[0], Math.min(1, t[1] * (m[1] ? o[1] / m[1] : 1)), l);
			};
			r.c.forEach(function (c, j) {
				var cc = clsColor[c[0]] || {}, cell = sel + "> td[data-j='" + j + "']";
				if (cc.bg) { var nb = recolor(cc.bg); if (nb) css += cell + "{background-color:" + nb + " !important}"; }
				if (cc.color === main) css += cell + "{color:" + TYPE_COLORS[type] + " !important}";
				spanClasses(c[3]).forEach(function (k) { var sc = clsColor[k]; if (sc && sc.color === main) css += cell + " ." + k + "{color:" + TYPE_COLORS[type] + " !important}"; });
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
		[["intro", "#mg-info"], ["toc", "#mg-toc"]].forEach(function (a) {
			var map = th[a[0]] || {};
			Object.keys(clsColor).forEach(function (k) {
				var c = clsColor[k];
				if (c.color && map["t" + c.color]) css += a[1] + " ." + k + "{color:" + map["t" + c.color] + " !important}";
				if (c.bg && map["f" + c.bg] && k[0] === "s") css += a[1] + " td." + k + "{background-color:" + map["f" + c.bg] + " !important}";
			});
		});
		return css;
	}
	function applyColors() {
		var st = document.getElementById("mg-colors") || document.head.appendChild(Object.assign(document.createElement("style"), {id: "mg-colors"}));
		st.textContent = typeColorCss() + themeCss() + (editor ? editor.css() : cellCss());
	}
	// the editor's cell formatting, for viewers (the editor itself isn't loaded for them)
	function cellCss() { return typeof RemixSheetEditor !== "undefined" ? RemixSheetEditor.create({data: function () { return data; }}).css() : ""; }
	function colorPanel() {
		var p = document.getElementById("mg-colorpanel");
		if (p) { p.remove(); return; }
		var th = data.theme = data.theme || {}, row = function (key, kind) {
			var val = (th[kind] || {})[key] || key.slice(1), what = key[0] === "t" ? "Text" : "Fill";
			return "<label class='mg-cp-row'><input type='color' value='" + val + "' data-cp='" + kind + "' data-key='" + key + "'><span>" + what +
				" <code>" + key.slice(1) + "</code></span><span class='mg-cp-sw'>" + LOGO_SWATCHES.map(function (s) {
					return "<i style='background:" + s + "' data-sw='" + s + "'></i>"; }).join("") + "</span></label>";
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

	function applyHide() {
		$("#mg-info").style.display = hide.info ? "none" : "";
		$("#mg-toc").style.display = hide.toc ? "none" : "";
		$(".mg-btn[data-act=info]").textContent = hide.info ? "Show info" : "Hide info";
		$(".mg-btn[data-act=toc]").textContent = hide.toc ? "Show contents" : "Hide contents";
	}

	// the sheet's own width, scaled down to fit (never up); very narrow screens scroll sideways instead
	function scale() {
		var w = data.cols.reduce(function (a, b) { return a + b; }, 0);
		$$(".mg-page table.mg").forEach(function (t) {
			var box = t.parentNode.clientWidth;
			t.style.zoom = Math.max(0.42, Math.min(1, box / w));
		});
	}

	// ---- editing (localhost only) ----
	function editTools() {
		var el = $(".mg-edit-tools");
		if (!CAN_EDIT) { el.innerHTML = ""; return; }
		el.innerHTML = "<button type='button' class='mg-btn mg-edit'>" + (editing ? "✓ Done editing" : "✏️ Edit guide") + "</button>" +
			"<button type='button' class='mg-btn mg-colors' title='Change the info blurb and table of contents colors'>🎨 Colors</button>" +
			(editing || dirty ? "<button type='button' class='mg-btn mg-save' title='Download move_guide.json: put it in src/moveguide/ and rebuild'>💾 Save to file</button>" +
				"<button type='button' class='mg-btn mg-discard' title='Throw away your unsaved edits'>Discard edits</button>" : "");
	}
	function markDirty() { dirty = true; save(K_DRAFT, data); editTools(); }
	function startEditor() {
		if (!editor) editor = RemixSheetEditor.create({
			data: function () { return data; },
			scope: ".mg-page",
			rerender: render,
			changed: markDirty,
			kinds: [["row", "Normal row"], ["h0", "Big dropdown (whole group)"], ["h1", "Header (type / category)"], ["h2", "Sub-header"], ["intro", "Info blurb"], ["toc", "Table of contents"]],
			extraSize: function () { return "<div class='rse-row'>Every move row <input type='number' data-rse-in='moveH' min='20' step='1' value='" + moveH() + "'>px</div>"; },
			onInput: function (k, v) { if (k === "moveH") { data.moveH = Math.max(20, +v || 46); markDirty(); render(); } }
		});
		editor.start();
	}

	document.addEventListener("click", function (e) {
		if (e.target.closest(".mg-colors") || e.target.closest("[data-cp-close]")) { colorPanel(); return; }
		var sw = e.target.closest("[data-sw]");
		if (sw) { e.preventDefault(); setColor(sw.closest(".mg-cp-row").querySelector("input"), sw.getAttribute("data-sw")); return; }
		if (e.target.closest("[data-cp-reset]")) {
			if (!confirm("Put the info blurb and contents back to the sheet's colors?")) return;
			var logo = (data.theme || {}).logo; data.theme = logo ? {logo: logo} : {}; applyColors(); markDirty(); colorPanel(); colorPanel(); return;
		}
		if (editing) { var b0 = e.target.closest(".mg-btn"); if (!b0 && !e.target.classList.contains("mg-caret")) return; }
		var tl = e.target.closest(".mg-typelink");
		if (tl) { e.preventDefault(); goToType(tl.getAttribute("data-type")); return; }
		var go = e.target.closest("td.mg-go");
		if (go) {
			e.preventDefault();
			var gc = data.rows[+go.parentNode.getAttribute("data-i")].c[+go.getAttribute("data-j")];
			goToCat(gc[4].go); return;
		}
		var top = e.target.closest("a[href='#mg-toc']");
		if (top) { e.preventDefault(); if (hide.toc) { hide.toc = 0; save(K_HIDE, hide); applyHide(); } $("#mg-toc").scrollIntoView(); return; }
		var hd = e.target.closest("#mg-guide td.mg-hd");
		if (hd) {
			var k = headKey(data.rows[+hd.parentNode.getAttribute("data-i")]);
			if (open[k]) delete open[k]; else open[k] = 1;
			save(K_OPEN, open); applyCollapse(); return;
		}
		var b = e.target.closest(".mg-btn");
		if (!b) return;
		var act = b.getAttribute("data-act");
		if (act === "info" || act === "toc") { hide[act] = hide[act] ? 0 : 1; save(K_HIDE, hide); applyHide(); }
		else if (act === "collapse") { open = {}; save(K_OPEN, open); applyCollapse(); }
		else if (act === "expand") { data.rows.forEach(function (r) { if (HEADS[r.k]) open[headKey(r)] = 1; }); save(K_OPEN, open); applyCollapse(); }
		else if (b.classList.contains("mg-edit")) {
			editing = !editing;
			if (editing) startEditor(); else if (editor) editor.stop();
			editTools(); render();
		} else if (b.classList.contains("mg-save")) {
			var a = document.createElement("a");
			a.href = URL.createObjectURL(new Blob([JSON.stringify(data)], {type: "application/json"}));
			a.download = "move_guide.json"; a.click();
		} else if (b.classList.contains("mg-discard")) {
			if (!confirm("Throw away all your unsaved Move Guide edits?")) return;
			try { localStorage.removeItem(K_DRAFT); } catch (e2) {}
			location.reload();
		}
	});
	document.addEventListener("input", function (e) {
		if (e.target.classList && e.target.classList.contains("mg-search")) { applyCollapse(); return; }
		if (e.target.hasAttribute && e.target.hasAttribute("data-cp")) { setColor(e.target, e.target.value); return; }
		var td = e.target.closest && e.target.closest("td[contenteditable]");
		if (!td) return;
		var i = +td.parentNode.getAttribute("data-i"), j = +td.getAttribute("data-j");
		var clone = td.cloneNode(true);
		clone.querySelectorAll(".mg-caret").forEach(function (x) { x.remove(); });
		var inn = clone.querySelector(":scope > .mg-in");
		data.rows[i].c[j][3] = (inn || clone).innerHTML;
		clearTimeout(markDirty.t); markDirty.t = setTimeout(markDirty, 400);
	});
	window.addEventListener("resize", function () { if (data) scale(); });
	// opening / closing / resizing the DoozDex sidebar narrows the page: re-fit the sheet to it
	if (window.ResizeObserver) new ResizeObserver(function () { if (data) scale(); }).observe(document.querySelector(".mg-page"));

	var draft = CAN_EDIT ? load(K_DRAFT, null) : null;
	fetch("./moveguide/move_guide.json", {cache: "no-cache"}).then(function (r) { return r.json(); }).then(function (d) {
		data = draft && draft.rows ? draft : d;
		dirty = !!(draft && draft.rows);
		var st = document.createElement("style"); st.textContent = data.css; document.head.appendChild(st);
		readClassColors();
		var defs = document.createElement("div"); defs.innerHTML = data.defs; document.body.appendChild(defs.firstChild);
		editTools();
		render();
	}).catch(function (e) { $("#mg-guide").innerHTML = "<div class='mg-loading'>Couldn't load the move guide (" + e + ").</div>"; });
})();
