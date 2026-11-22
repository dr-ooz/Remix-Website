// Sheets-style editor for any page drawn from sheet data ({cols, rows: [{k, h, c: [[cls, colspan, rowspan, html, extra]]}]}).
// Localhost only, hidden from viewers. A side panel like Google Sheets' toolbar:
//   text (font, size, bold / italic / underline / strike, color) - on the selected text, or on whole cells when
//   no text is selected; cell (fill, horizontal / vertical align); sizes (column width, row height, for every
//   selected cell); merge / unmerge; rows (insert above / below, duplicate, delete, kind).
// Click a cell to select it, Shift+click for a block. The page passes in hooks:
//   RemixSheetEditor.create({data, tables: () => [tbody elements], rerender, changed, kinds})
// Cell formatting lives in each cell's extra object: c[4].st = {bg, color, ff, fs, b, i, u, s, al, va}.
var RemixSheetEditor = (function () {
	var FONTS = ["Comfortaa", "Arial", "Verdana", "Trebuchet MS", "Georgia", "Times New Roman", "Courier New", "Impact"];
	var SWATCHES = ["#000000", "#ffffff", "#7d1bc0", "#7f72c8", "#c9a6ef", "#7bc0dc", "#16698b", "#3769a8", "#0f4469", "#facc17", "#e3e0ac", "#dab578", "#ef1c7b", "#cc0000", "#00ff00"];

	function create(o) {
		var api = {on: false}, sel = [], anchor = null, panel = null, savedRange = null;
		var data = function () { return o.data(); };

		// ---- grid positions (merged cells cover several columns / rows) ----
		function grid(tbody) {
			var rows = Array.prototype.slice.call(tbody.children), taken = {}, cells = [];
			rows.forEach(function (tr, y) {
				var x = 0, i = +tr.getAttribute("data-i");
				Array.prototype.forEach.call(tr.children, function (td) {
					while (taken[y + ":" + x]) x++;
					var j = +td.getAttribute("data-j"), cs = td.colSpan || 1, rs = td.rowSpan || 1;
					for (var a = 0; a < rs; a++) for (var b = 0; b < cs; b++) taken[(y + a) + ":" + (x + b)] = 1;
					cells.push({i: i, j: j, y: y, x: x, cs: cs, rs: rs, td: td, tr: tr});
					x += cs;
				});
			});
			return {rows: rows, cells: cells};
		}
		function gridOf(td) {
			var tb = td.closest("tbody"), g = grid(tb);
			return {g: g, me: g.cells.filter(function (c) { return c.td === td; })[0], tb: tb};
		}
		function cellAt(i, j) { var r = data().rows[i]; return r && r.c[j]; }
		function ext(c) { if (!c[4] || typeof c[4] !== "object") c[4] = c[4] || {}; return c[4]; }

		// ---- selection ----
		function mark() {
			document.querySelectorAll(".rse-sel").forEach(function (td) { td.classList.remove("rse-sel"); });
			sel.forEach(function (s) { var td = document.querySelector("tr[data-i='" + s.i + "'] > td[data-j='" + s.j + "']"); if (td) td.classList.add("rse-sel"); });
			if (panel) fillPanel();
		}
		function select(td, extend) {
			var at = gridOf(td);
			if (!at.me) return;
			if (!extend || !anchor || anchor.tb !== at.tb) { anchor = {tb: at.tb, y: at.me.y, x: at.me.x}; sel = [{i: at.me.i, j: at.me.j, x: at.me.x, y: at.me.y, cs: at.me.cs, rs: at.me.rs}]; }
			else {
				var y0 = Math.min(anchor.y, at.me.y), y1 = Math.max(anchor.y, at.me.y + at.me.rs - 1);
				var x0 = Math.min(anchor.x, at.me.x), x1 = Math.max(anchor.x, at.me.x + at.me.cs - 1);
				sel = at.g.cells.filter(function (c) { return c.y >= y0 && c.y <= y1 && c.x >= x0 && c.x <= x1; })
					.map(function (c) { return {i: c.i, j: c.j, x: c.x, y: c.y, cs: c.cs, rs: c.rs}; });
			}
			mark();
		}
		function selRows() { var s = {}; sel.forEach(function (c) { s[c.i] = 1; }); return Object.keys(s).map(Number).sort(function (a, b) { return a - b; }); }
		function selCols() { var s = {}; sel.forEach(function (c) { for (var b = 0; b < c.cs; b++) s[c.x + b] = 1; }); return Object.keys(s).map(Number); }

		// ---- text inside a cell (a real text selection) vs whole cells ----
		function textRange() {
			var s = window.getSelection();
			if (!s.rangeCount || s.isCollapsed) return null;
			var n = s.anchorNode && (s.anchorNode.nodeType === 1 ? s.anchorNode : s.anchorNode.parentNode);
			return n && n.closest && n.closest("td[contenteditable]") ? s.getRangeAt(0) : null;
		}
		document.addEventListener("selectionchange", function () { if (api.on) { var r = textRange(); if (r) savedRange = r.cloneRange(); } });
		function restoreRange() {
			if (!savedRange) return null;
			var s = window.getSelection(); s.removeAllRanges(); s.addRange(savedRange);
			return savedRange;
		}
		function saveCellFrom(node) {
			var td = node.closest && node.closest("td[contenteditable]");
			if (!td) return;
			var c = cellAt(+td.parentNode.getAttribute("data-i"), +td.getAttribute("data-j"));
			var clone = td.cloneNode(true);
			clone.querySelectorAll(".mg-caret").forEach(function (x) { x.remove(); });
			var inner = clone.querySelector(":scope > .mg-in");
			c[3] = (inner || clone).innerHTML;
			o.changed();
		}
		// apply a text format: to the selected text if there is one, else to every selected cell
		function fmt(prop, val) {
			var r = savedRange && document.contains(savedRange.startContainer) && !savedRange.collapsed ? restoreRange() : null;
			if (r) {
				document.execCommand("styleWithCSS", false, true);
				var node = r.startContainer;
				if (prop === "b") document.execCommand("bold");
				else if (prop === "i") document.execCommand("italic");
				else if (prop === "u") document.execCommand("underline");
				else if (prop === "s") document.execCommand("strikeThrough");
				else if (prop === "color") document.execCommand("foreColor", false, val);
				else if (prop === "ff") document.execCommand("fontName", false, val);
				else if (prop === "fs") {
					document.execCommand("fontSize", false, 7);
					var td = (node.nodeType === 1 ? node : node.parentNode).closest("td");
					td.querySelectorAll("font[size='7'], span[style*='xxx-large']").forEach(function (f) {
						var sp = document.createElement("span"); sp.style.fontSize = val + "pt"; sp.innerHTML = f.innerHTML;
						if (f.tagName === "SPAN") { f.style.fontSize = val + "pt"; return; }
						f.parentNode.replaceChild(sp, f);
					});
				}
				saveCellFrom(node.nodeType === 1 ? node : node.parentNode);
				return;
			}
			if (!sel.length) return;
			// B / I / U / S flip what the first selected cell LOOKS like now (the sheet's own style included)
			var td0 = document.querySelector("tr[data-i='" + sel[0].i + "'] > td[data-j='" + sel[0].j + "']");
			var probe = td0 && (td0.querySelector(".mg-in span, :scope > span:not(.mg-caret)") || td0), cs = probe ? getComputedStyle(probe) : {};
			var now = {b: parseInt(cs.fontWeight, 10) >= 600, i: cs.fontStyle === "italic",
				u: /underline/.test(cs.textDecorationLine || ""), s: /line-through/.test(cs.textDecorationLine || "")};
			var toggle = /^[bius]$/.test(prop) ? !now[prop] : val;
			sel.forEach(function (s) { var e = ext(cellAt(s.i, s.j)); e.st = e.st || {}; if (toggle === "" || toggle == null) delete e.st[prop]; else e.st[prop] = toggle; });
			o.changed(); o.rerender(); mark();
		}

		// ---- cell styles -> css (cell formatting wins over the sheet's own classes and the page's colors) ----
		api.css = function () {
			var css = "";
			data().rows.forEach(function (r, i) {
				r.c.forEach(function (c, j) {
					var st = c[4] && c[4].st;
					if (!st) return;
					var td = "tr[data-i='" + i + "'] > td[data-j='" + j + "']", all = td + "," + td + " *", a = "", t = "";
					if (st.bg) a += "background-color:" + st.bg + " !important;";
					if (st.al) a += "text-align:" + st.al + " !important;";
					if (st.va) a += "vertical-align:" + st.va + " !important;";
					if (st.color) t += "color:" + st.color + " !important;";
					if (st.ff) t += "font-family:'" + st.ff + "',Arial,sans-serif !important;";
					if (st.fs) t += "font-size:" + st.fs + "pt !important;";
					if (st.b != null) t += "font-weight:" + (st.b ? "bold" : "normal") + " !important;";
					if (st.i != null) t += "font-style:" + (st.i ? "italic" : "normal") + " !important;";
					if (st.u || st.s) t += "text-decoration:" + (st.u ? "underline " : "") + (st.s ? "line-through" : "") + " !important;";
					if (a) css += td + "{" + a + "}";
					if (t) css += all + "{" + t + "}";
				});
			});
			return css;
		};

		// ---- merge / unmerge ----
		function merge() {
			if (sel.length < 2) return;
			var y0 = Math.min.apply(null, sel.map(function (s) { return s.y; })), x0 = Math.min.apply(null, sel.map(function (s) { return s.x; }));
			var y1 = Math.max.apply(null, sel.map(function (s) { return s.y + s.rs - 1; })), x1 = Math.max.apply(null, sel.map(function (s) { return s.x + s.cs - 1; }));
			var top = sel.filter(function (s) { return s.y === y0 && s.x === x0; })[0];
			if (!top) return alert("Select a block that starts with a cell in its top-left corner.");
			var keep = cellAt(top.i, top.j);
			keep[1] = x1 - x0 + 1; keep[2] = y1 - y0 + 1;
			// drop the others (from the last cell back, so indexes stay right)
			sel.filter(function (s) { return s !== top; }).sort(function (a, b) { return b.i - a.i || b.j - a.j; })
				.forEach(function (s) { data().rows[s.i].c.splice(s.j, 1); });
			sel = []; o.changed(); o.rerender();
		}
		function unmerge() {
			sel.slice().sort(function (a, b) { return b.i - a.i || b.j - a.j; }).forEach(function (s) {
				var c = cellAt(s.i, s.j), cs = c[1], rs = c[2];
				if (cs === 1 && rs === 1) return;
				var tb = document.querySelector("tr[data-i='" + s.i + "']").closest("tbody"), g = grid(tb);
				c[1] = 1; c[2] = 1;
				var blank = function () { return [c[0], 1, 1, ""]; };
				for (var b = 1; b < cs; b++) data().rows[s.i].c.splice(s.j + b, 0, blank());
				for (var a = 1; a < rs; a++) {
					var tr = g.rows[s.y + a]; if (!tr) break;
					var ri = +tr.getAttribute("data-i"), row = data().rows[ri];
					// where column s.x falls in that row
					var at = g.cells.filter(function (q) { return q.i === ri && q.x < s.x; }).length;
					for (b = 0; b < cs; b++) row.c.splice(at + b, 0, blank());
				}
			});
			sel = []; o.changed(); o.rerender();
		}

		// ---- rows ----
		function rowOp(op, kind) {
			var rows = selRows();
			if (!rows.length) return;
			var R = data().rows;
			if (op === "del") { if (!confirm("Delete " + rows.length + " row(s)?")) return; rows.reverse().forEach(function (i) { R.splice(i, 1); }); }
			else if (op === "dup") R.splice(rows[rows.length - 1] + 1, 0, JSON.parse(JSON.stringify(R[rows[rows.length - 1]])));
			else if (op === "above" || op === "below") {
				var i = op === "above" ? rows[0] : rows[rows.length - 1], src = R[i];
				var blank = {k: src.k === "intro" || src.k === "toc" ? src.k : "row", h: src.h, c: src.c.map(function (c) { return [c[0], c[1], 1, ""]; })};
				R.splice(op === "above" ? i : i + 1, 0, blank);
			} else if (op === "kind") rows.forEach(function (i) { R[i].k = kind; });
			sel = []; o.changed(); o.rerender();
		}

		// ---- sizes ----
		function setSize(what, v) {
			v = Math.max(8, Math.round(+v || 0));
			if (what === "w") selCols().forEach(function (x) { data().cols[x] = v; });
			else selRows().forEach(function (i) { data().rows[i].h = v; data().rows[i].hSet = 1; });
			o.changed(); o.rerender(); mark();
		}

		// ---- the panel ----
		function btn(act, label, tip, val) { return "<button type='button' data-rse='" + act + "'" + (val != null ? " data-v='" + val + "'" : "") + " title='" + tip + "'>" + label + "</button>"; }
		function sw(act) { return "<span class='rse-sw'>" + SWATCHES.map(function (c) { return "<i style='background:" + c + "' data-rse='" + act + "' data-v='" + c + "'></i>"; }).join("") + "</span>"; }
		function buildPanel() {
			panel = document.createElement("div");
			panel.id = "rse-panel";
			panel.innerHTML = "<div class='rse-h'>Sheet editor <small>(only you see this)</small></div>" +
				"<div class='rse-info'></div>" +
				"<div class='rse-sec'>Text <small>selected text, or whole cells</small></div>" +
				"<div class='rse-row'><select data-rse-in='ff'>" + FONTS.map(function (f) { return "<option style='font-family:" + f + "'>" + f + "</option>"; }).join("") + "</select>" +
				"<input type='number' data-rse-in='fs' min='5' max='120' step='1' placeholder='pt' title='Font size (pt)'></div>" +
				"<div class='rse-row'>" + btn("b", "<b>B</b>", "Bold") + btn("i", "<i>I</i>", "Italic") + btn("u", "<u>U</u>", "Underline") + btn("s", "<s>S</s>", "Strikethrough") +
				"<label class='rse-color' title='Text color'>A<input type='color' data-rse-in='color'></label>" + btn("clear", "⌫ Clear", "Clear this cell's own formatting") + "</div>" + sw("color") +
				"<div class='rse-sec'>Cell</div>" +
				"<div class='rse-row'><label class='rse-color' title='Fill color'>Fill<input type='color' data-rse-in='bg'></label>" +
				btn("al", "⇤", "Align left", "left") + btn("al", "↔", "Align center", "center") + btn("al", "⇥", "Align right", "right") +
				btn("va", "⤒", "Top", "top") + btn("va", "↕", "Middle", "middle") + btn("va", "⤓", "Bottom", "bottom") + "</div>" + sw("bg") +
				"<div class='rse-sec'>Size <small>every selected column / row</small></div>" +
				"<div class='rse-row'>Column width <input type='number' data-rse-in='w' min='8' step='1'>px</div>" +
				"<div class='rse-row'>Row height <input type='number' data-rse-in='h' min='8' step='1'>px</div>" +
				(o.extraSize ? o.extraSize() : "") +
				"<div class='rse-sec'>Merge</div><div class='rse-row'>" + btn("merge", "Merge cells", "Merge the selected block") + btn("unmerge", "Unmerge", "Split merged cells back up") + "</div>" +
				"<div class='rse-sec'>Rows</div><div class='rse-row'>" + btn("above", "＋ Above", "Insert a row above") + btn("below", "＋ Below", "Insert a row below") +
				btn("dup", "Duplicate", "Copy the row below it") + btn("del", "✕ Delete", "Delete the selected rows") + "</div>" +
				"<div class='rse-row'>Row kind <select data-rse-in='kind'>" + (o.kinds || []).map(function (k) { return "<option value='" + k[0] + "'>" + k[1] + "</option>"; }).join("") + "</select></div>" +
				"<div class='rse-tip'>Click a cell to select it · Shift+click for a block · double-click to type · select text to format just that text.</div>";
			document.body.appendChild(panel);
			panel.addEventListener("mousedown", function (e) { if (e.target.tagName === "BUTTON" || e.target.tagName === "I" || e.target.closest("button")) e.preventDefault(); });
			panel.addEventListener("click", function (e) {
				var b = e.target.closest("[data-rse]"); if (!b) return;
				var a = b.getAttribute("data-rse"), v = b.getAttribute("data-v");
				if (/^[bius]$/.test(a)) fmt(a);
				else if (a === "color") fmt("color", v);
				else if (a === "bg" || a === "al" || a === "va") cellFmt(a, v);
				else if (a === "clear") { sel.forEach(function (s) { var e2 = ext(cellAt(s.i, s.j)); delete e2.st; }); o.changed(); o.rerender(); mark(); }
				else if (a === "merge") merge();
				else if (a === "unmerge") unmerge();
				else rowOp(a);
			});
			panel.addEventListener("change", function (e) {
				var k = e.target.getAttribute("data-rse-in"); if (!k) return;
				if (k === "ff" || k === "fs" || k === "color") fmt(k, e.target.value);
				else if (k === "bg") cellFmt("bg", e.target.value);
				else if (k === "w" || k === "h") setSize(k, e.target.value);
				else if (k === "kind") rowOp("kind", e.target.value);
				else if (o.onInput) o.onInput(k, e.target.value);
			});
		}
		function cellFmt(prop, v) {
			sel.forEach(function (s) { var e = ext(cellAt(s.i, s.j)); e.st = e.st || {}; e.st[prop] = v; });
			o.changed(); o.rerender(); mark();
		}
		function fillPanel() {
			var info = panel.querySelector(".rse-info");
			if (!sel.length) { info.textContent = "No cell selected."; return; }
			var s = sel[0], r = data().rows[s.i], st = (cellAt(s.i, s.j)[4] || {}).st || {};
			info.textContent = sel.length + " cell(s) · row kind: " + r.k + (sel.length === 1 ? " · column " + (s.x + 1) : "");
			panel.querySelector("[data-rse-in=w]").value = data().cols[s.x] || "";
			panel.querySelector("[data-rse-in=h]").value = r.h || "";
			panel.querySelector("[data-rse-in=kind]").value = r.k;
			panel.querySelector("[data-rse-in=fs]").value = st.fs || "";
			if (st.ff) panel.querySelector("[data-rse-in=ff]").value = st.ff;
		}

		api.start = function () {
			api.on = true;
			if (!panel) buildPanel();
			panel.style.display = "block";
			document.body.classList.add("rse-on");
			fillPanel();
		};
		api.stop = function () { api.on = false; sel = []; if (panel) panel.style.display = "none"; document.body.classList.remove("rse-on"); mark(); };
		api.mark = mark;
		document.addEventListener("mousedown", function (e) {
			if (!api.on) return;
			var td = e.target.closest && e.target.closest("td[data-j]");
			if (!td || !td.closest(o.scope || "body")) return;
			if (e.shiftKey) { e.preventDefault(); select(td, true); }
			else if (!td.classList.contains("rse-sel") || sel.length > 1) select(td, false);
		});
		return api;
	}
	return {create: create};
})();
