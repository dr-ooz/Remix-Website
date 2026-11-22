// Sheets-style editor that works ON the real page (so what you edit is exactly what visitors see).
// Localhost only, and only in Edit mode; Preview mode is the plain public page.
// Laid out like Google Sheets / FortuneSheet (sheet-editor/ in the repo is FortuneSheet, kept as a reference):
//   toolbar: undo, redo, paint format, clear format | font | size | B I S U | text color, fill, borders, merge |
//            horizontal align, vertical align, wrap
//   column letters + row numbers around each table (drag their edges to resize), click / drag / Shift+click to
//   select, double-click or just type to edit a cell, Enter / Tab / arrows to move, Delete to clear,
//   Ctrl+C / X / V, Ctrl+B / I / U, right-click for rows (insert, delete, duplicate, row type) and merging.
// The page passes hooks: RemixSheetEditor.create({data, scope, rerender, changed, undo, redo, kinds, rowH})
// Cell formatting lives in each cell's extra object: c[4].st = {bg, color, ff, fs, b, i, u, s, al, va, wrap, bd}.
var RemixSheetEditor = (function () {
	var FONTS = ["Comfortaa", "Arial", "Verdana", "Trebuchet MS", "Tahoma", "Georgia", "Times New Roman", "Courier New", "Impact"];
	var SIZES = [6, 7, 8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 30, 36, 48, 60, 72];
	var LOGO = ["#3163ad", "#2d6fa0", "#448fb3", "#6eb3da", "#7bd8e9", "#c3dff6", "#096f84", "#05586f", "#063e58", "#082949",
		"#361b70", "#8c72c8", "#a096f9", "#981ee6", "#9f01be", "#7d1bc0", "#ef1c7b", "#c9a6ef"];
	var K_SAVED = "remixSheetSwatches";
	var LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

	// ---- saved colors (shared by every sheet page in this browser) ----
	function savedColors() { try { return JSON.parse(localStorage.getItem(K_SAVED)) || []; } catch (e) { return []; } }
	function setSaved(list) { try { localStorage.setItem(K_SAVED, JSON.stringify(list)); } catch (e) {} refreshSwatches(); }
	function baseColors() {
		var types = typeof REMIX_TYPE_COLORS !== "undefined" ? Object.keys(REMIX_TYPE_COLORS).map(function (t) { return [REMIX_TYPE_COLORS[t], t]; }) : [];
		return [["#ffffff", "White"], ["#000000", "Black"]].concat(types, LOGO.map(function (c) { return [c, "Remix logo"]; }));
	}
	function swatchInner(attr) {
		var dot = function (c, tip, saved) { return "<i style='background:" + c + "' " + attr + "='" + c + "' title='" + tip + " " + c + "'" + (saved ? " data-saved='1'" : "") + "></i>"; };
		return baseColors().map(function (b) { return dot(b[0], b[1]); }).join("") +
			savedColors().map(function (c) { return dot(c, "Saved (right-click to remove)", 1); }).join("") +
			"<button type='button' class='rse-sw-add' title='Save the color in the picker to this list'>＋</button>";
	}
	function swatchHtml(attr, act) { return "<span class='rse-sw' data-attr='" + attr + "'" + (act ? " data-act='" + act + "'" : "") + ">" + swatchInner(attr) + "</span>"; }
	function refreshSwatches() { document.querySelectorAll(".rse-sw").forEach(function (s) { s.innerHTML = swatchInner(s.getAttribute("data-attr")); }); }
	document.addEventListener("click", function (e) {
		var add = e.target.closest && e.target.closest(".rse-sw-add");
		if (!add) return;
		e.preventDefault(); e.stopPropagation();
		var box = add.closest(".rse-sw"), scope = box.parentNode, inp = scope && scope.querySelector("input[type=color]");
		if (!inp) return;
		var list = savedColors();
		if (list.indexOf(inp.value) < 0) { list.push(inp.value); setSaved(list); }
	}, true);
	document.addEventListener("contextmenu", function (e) {
		var i = e.target.closest && e.target.closest(".rse-sw i[data-saved]");
		if (!i) return;
		e.preventDefault(); e.stopPropagation();
		var c = i.getAttribute(i.closest(".rse-sw").getAttribute("data-attr"));
		setSaved(savedColors().filter(function (x) { return x !== c; }));
	}, true);

	// cell formatting -> css (wins over the sheet's own classes and the page's colors)
	function cellCss(data) {
		var css = "";
		data.rows.forEach(function (r, i) {
			r.c.forEach(function (c, j) {
				var st = c[4] && c[4].st;
				if (!st) return;
				var td = "tr[data-i='" + i + "'] > td[data-j='" + j + "']", all = td + "," + td + " *", a = "", t = "";
				if (st.bg) a += "background-color:" + st.bg + " !important;";
				if (st.al) a += "text-align:" + st.al + " !important;";
				if (st.va) a += "vertical-align:" + st.va + " !important;";
				if (st.wrap === "wrap") a += "white-space:normal !important;";
				if (st.wrap === "clip") a += "white-space:nowrap !important;overflow:hidden !important;text-overflow:clip;";
				if (st.wrap === "overflow") a += "white-space:nowrap !important;overflow:visible !important;";
				if (st.bd) ["top", "right", "bottom", "left"].forEach(function (s) { if (st.bd[s[0]]) a += "border-" + s + ":" + st.bd[s[0]] + " !important;"; });
				if (st.color) t += "color:" + st.color + " !important;";
				if (st.ff) t += "font-family:'" + st.ff + "',Arial,sans-serif !important;";
				if (st.fs) t += "font-size:" + st.fs + "pt !important;";
				if (st.b != null) t += "font-weight:" + (st.b ? "bold" : "normal") + " !important;";
				if (st.i != null) t += "font-style:" + (st.i ? "italic" : "normal") + " !important;";
				if (st.u != null || st.s != null) t += "text-decoration:" + ((st.u ? "underline " : "") + (st.s ? "line-through" : "") || "none") + " !important;";
				if (a) css += td + "{" + a + "}";
				if (t) css += all + "{" + t + "}";
			});
		});
		return css;
	}

	function create(o) {
		var api = {on: false}, sel = null, active = null, dragging = false, editTd = null, editOrig = null, bar = null, menu = null, clip = null, painter = null;
		var data = function () { return o.data(); };
		var cellAt = function (i, j) { var r = data().rows[i]; return r && r.c[j]; };
		var ext = function (c) { if (!c[4] || typeof c[4] !== "object") c[4] = {}; return c[4]; };

		// ---- grid positions of a table (merged cells cover several columns / rows) ----
		var grids = null;
		function grid(tb) {
			grids = grids || new Map();
			if (grids.has(tb)) return grids.get(tb);
			var rows = Array.prototype.slice.call(tb.children).filter(function (tr) { return tr.hasAttribute("data-i"); });
			var taken = {}, cells = [], byTd = new Map();
			rows.forEach(function (tr, y) {
				var x = 0, i = +tr.getAttribute("data-i");
				Array.prototype.forEach.call(tr.children, function (td) {
					if (td.tagName !== "TD") return;
					while (taken[y + ":" + x]) x++;
					var cs = td.colSpan || 1, rs = td.rowSpan || 1;
					for (var a = 0; a < rs; a++) for (var b = 0; b < cs; b++) taken[(y + a) + ":" + (x + b)] = 1;
					var cell = {i: i, j: +td.getAttribute("data-j"), y: y, x: x, cs: cs, rs: rs, td: td, tr: tr};
					cells.push(cell); byTd.set(td, cell);
					x += cs;
				});
			});
			var g = {tb: tb, rows: rows, cells: cells, byTd: byTd};
			grids.set(tb, g);
			return g;
		}
		function tableId(tb) { var h = tb.closest("[id]"); return h ? h.id : ""; }
		function tbodyById(id) { return document.querySelector("#" + id + " table.mg > tbody"); }
		function cellAtXY(g, y, x) { return g.cells.filter(function (c) { return y >= c.y && y < c.y + c.rs && x >= c.x && x < c.x + c.cs; })[0]; }

		// ---- selection: a rectangle in one table (grows to include whole merged cells, like Sheets) ----
		function setSel(tb, y0, x0, y1, x1) {
			var g = grid(tb), r = {y0: Math.min(y0, y1), y1: Math.max(y0, y1), x0: Math.min(x0, x1), x1: Math.max(x0, x1)};
			for (var k = 0; k < 6; k++) {
				var grew = false;
				g.cells.forEach(function (c) {
					if (c.y > r.y1 || c.y + c.rs - 1 < r.y0 || c.x > r.x1 || c.x + c.cs - 1 < r.x0) return;
					if (c.y < r.y0) { r.y0 = c.y; grew = true; } if (c.x < r.x0) { r.x0 = c.x; grew = true; }
					if (c.y + c.rs - 1 > r.y1) { r.y1 = c.y + c.rs - 1; grew = true; } if (c.x + c.cs - 1 > r.x1) { r.x1 = c.x + c.cs - 1; grew = true; }
				});
				if (!grew) break;
			}
			sel = {id: tableId(tb), y0: r.y0, y1: r.y1, x0: r.x0, x1: r.x1};
			draw();
		}
		function selCells() {
			if (!sel) return [];
			var tb = tbodyById(sel.id); if (!tb) return [];
			return grid(tb).cells.filter(function (c) { return c.y >= sel.y0 && c.y + c.rs - 1 <= sel.y1 && c.x >= sel.x0 && c.x + c.cs - 1 <= sel.x1; });
		}
		function selRows() { var s = {}; selCells().forEach(function (c) { s[c.i] = 1; }); return Object.keys(s).map(Number).sort(function (a, b) { return a - b; }); }
		function draw() {
			var box = document.getElementById("rse-selbox"), act = document.getElementById("rse-active");
			if (!box) {
				box = document.createElement("div"); box.id = "rse-selbox"; document.body.appendChild(box);
				act = document.createElement("div"); act.id = "rse-active"; document.body.appendChild(act);
			}
			var cells = selCells();
			if (!api.on || !cells.length) { box.style.display = act.style.display = "none"; updateBar(); return; }
			var L = 1e9, T = 1e9, R = -1e9, B = -1e9;
			cells.forEach(function (c) { var b = c.td.getBoundingClientRect(); if (!b.width && !b.height) return; L = Math.min(L, b.left); T = Math.min(T, b.top); R = Math.max(R, b.right); B = Math.max(B, b.bottom); });
			if (L > R) { box.style.display = act.style.display = "none"; return; }
			place(box, L, T, R, B);
			var a = active && document.body.contains(active.td) ? active.td.getBoundingClientRect() : null;
			if (a) place(act, a.left, a.top, a.right, a.bottom); else act.style.display = "none";
			updateBar();
		}
		function place(el, L, T, R, B) { el.style.display = "block"; el.style.left = (L + scrollX) + "px"; el.style.top = (T + scrollY) + "px"; el.style.width = (R - L) + "px"; el.style.height = (B - T) + "px"; }

		// ---- editing a cell's text ----
		function inner(td) { var m = td.querySelector(":scope > .mg-in"); return m || td; }
		function cleanHtml(td) {
			var clone = td.cloneNode(true);
			clone.querySelectorAll(".mg-caret").forEach(function (x) { x.remove(); });
			var m = clone.querySelector(":scope > .mg-in");
			return (m || clone).innerHTML;
		}
		function beginEdit(cell, replace) {
			if (!cell) return;
			endEdit(true);
			var td = cell.td;
			editTd = {cell: cell, td: td};
			editOrig = cellAt(cell.i, cell.j)[3];
			td.contentEditable = "true";
			td.classList.add("rse-editing");
			var target = inner(td);
			target.style.zoom = 1; target.style.whiteSpace = "normal";
			if (replace != null) target.innerHTML = replace.replace(/&/g, "&amp;").replace(/</g, "&lt;");
			td.focus();
			var r = document.createRange(); r.selectNodeContents(target); r.collapse(false);
			var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
		}
		function endEdit(commit) {
			if (!editTd) return;
			var td = editTd.td, c = cellAt(editTd.cell.i, editTd.cell.j), html = cleanHtml(td);
			td.contentEditable = "false"; td.classList.remove("rse-editing");
			editTd = null;
			if (c && commit && html !== c[3]) { c[3] = html; o.changed(); }
			else if (c && !commit) c[3] = editOrig;
			o.rerender();
		}

		// ---- formatting ----
		var savedRange = null;
		document.addEventListener("selectionchange", function () {
			if (!editTd) return;
			var s = window.getSelection();
			if (s.rangeCount && !s.isCollapsed && editTd.td.contains(s.anchorNode)) savedRange = s.getRangeAt(0).cloneRange();
		});
		function looks(cell) {
			var td = cell.td, probe = td.querySelector(".mg-in span, :scope > span:not(.mg-caret)") || td, cs = getComputedStyle(probe);
			return {b: parseInt(cs.fontWeight, 10) >= 600, i: cs.fontStyle === "italic", u: /underline/.test(cs.textDecorationLine), s: /line-through/.test(cs.textDecorationLine)};
		}
		// a text format: the highlighted text while typing in a cell, else every selected cell
		function fmt(prop, val) {
			if (editTd && savedRange && editTd.td.contains(savedRange.startContainer) && !savedRange.collapsed) {
				var s = window.getSelection(); s.removeAllRanges(); s.addRange(savedRange);
				document.execCommand("styleWithCSS", false, true);
				if (prop === "b") document.execCommand("bold");
				else if (prop === "i") document.execCommand("italic");
				else if (prop === "u") document.execCommand("underline");
				else if (prop === "s") document.execCommand("strikeThrough");
				else if (prop === "color") document.execCommand("foreColor", false, val);
				else if (prop === "ff") document.execCommand("fontName", false, val);
				else if (prop === "fs") {
					document.execCommand("fontSize", false, 7);
					editTd.td.querySelectorAll("font[size='7']").forEach(function (f) { var sp = document.createElement("span"); sp.style.fontSize = val + "pt"; sp.innerHTML = f.innerHTML; f.parentNode.replaceChild(sp, f); });
					editTd.td.querySelectorAll("span[style*='xxx-large']").forEach(function (sp) { sp.style.fontSize = val + "pt"; });
				}
				return;
			}
			if (editTd) endEdit(true);
			var cells = selCells();
			if (!cells.length) return;
			var now = looks(active && cells.indexOf(active) >= 0 ? active : cells[0]);
			var v = /^[bius]$/.test(prop) ? !now[prop] : val;
			cells.forEach(function (c) { var e = ext(cellAt(c.i, c.j)); e.st = e.st || {}; if (v === "" || v == null) delete e.st[prop]; else e.st[prop] = v; });
			o.changed(); o.rerender();
		}
		function setCells(fn) { if (editTd) endEdit(true); selCells().forEach(function (c) { var e = ext(cellAt(c.i, c.j)); e.st = e.st || {}; fn(e.st, c); }); o.changed(); o.rerender(); }
		function borders(kind, color, width) {
			var line = width + "px solid " + color;
			setCells(function (st, c) {
				var top = c.y === sel.y0, bot = c.y + c.rs - 1 === sel.y1, left = c.x === sel.x0, right = c.x + c.cs - 1 === sel.x1;
				st.bd = st.bd || {};
				var set = function (s, on) { if (on) st.bd[s] = line; };
				if (kind === "all") st.bd = {t: line, r: line, b: line, l: line};
				else if (kind === "outer") { set("t", top); set("b", bot); set("l", left); set("r", right); }
				else if (kind === "inner") { set("t", !top); set("l", !left); }
				else if (kind === "none") st.bd = {t: "0 none", r: "0 none", b: "0 none", l: "0 none"};
				else set(kind, kind === "t" ? top : kind === "b" ? bot : kind === "l" ? left : right);
			});
		}

		// ---- merge / unmerge ----
		function merge() {
			if (editTd) endEdit(true);
			var cells = selCells(); if (cells.length < 2) return;
			var top = cells.filter(function (c) { return c.y === sel.y0 && c.x === sel.x0; })[0];
			if (!top) return;
			var keep = cellAt(top.i, top.j);
			keep[1] = sel.x1 - sel.x0 + 1; keep[2] = sel.y1 - sel.y0 + 1;
			cells.filter(function (c) { return c !== top; }).sort(function (a, b) { return b.i - a.i || b.j - a.j; })
				.forEach(function (c) { data().rows[c.i].c.splice(c.j, 1); });
			active = null; o.changed(); o.rerender();
		}
		function unmerge() {
			if (editTd) endEdit(true);
			var tb = tbodyById(sel.id), g = grid(tb);
			selCells().filter(function (c) { return c.cs > 1 || c.rs > 1; }).sort(function (a, b) { return b.i - a.i || b.j - a.j; }).forEach(function (c) {
				var cell = cellAt(c.i, c.j), cls = cell[0];
				cell[1] = 1; cell[2] = 1;
				for (var b = 1; b < c.cs; b++) data().rows[c.i].c.splice(c.j + b, 0, [cls, 1, 1, ""]);
				for (var a = 1; a < c.rs; a++) {
					var tr = g.rows[c.y + a]; if (!tr) break;
					var ri = +tr.getAttribute("data-i"), at = g.cells.filter(function (q) { return q.i === ri && q.x < c.x; }).length;
					for (b = 0; b < c.cs; b++) data().rows[ri].c.splice(at + b, 0, [cls, 1, 1, ""]);
				}
			});
			active = null; o.changed(); o.rerender();
		}

		// ---- rows ----
		function rowOp(op, kind) {
			if (editTd) endEdit(true);
			var rows = selRows(); if (!rows.length) return;
			var R = data().rows;
			if (op === "del") rows.slice().reverse().forEach(function (i) { R.splice(i, 1); });
			else if (op === "dup") R.splice(rows[rows.length - 1] + 1, 0, JSON.parse(JSON.stringify(R[rows[rows.length - 1]])));
			else if (op === "above" || op === "below") {
				var i = op === "above" ? rows[0] : rows[rows.length - 1], src = R[i];
				var blank = {k: src.k === "intro" || src.k === "toc" ? src.k : "row", h: src.h, c: src.c.map(function (c) { return [c[0], c[1], 1, ""]; })};
				if (src.zone) blank.zone = src.zone;
				R.splice(op === "above" ? i : i + 1, 0, blank);
			} else if (op === "kind") rows.forEach(function (i) {
				var r = R[i];
				if (!r.zone && (r.k === "intro" || r.k === "toc")) r.zone = r.k;
				r.k = kind;
				if (kind === "intro" || kind === "toc") delete r.zone;
			});
			sel = null; active = null; o.changed(); o.rerender();
		}

		// ---- clipboard ----
		function copy(cut) {
			var cells = selCells(); if (!cells.length) return;
			clip = cells.map(function (c) { return {dy: c.y - sel.y0, dx: c.x - sel.x0, cell: JSON.parse(JSON.stringify(cellAt(c.i, c.j)))}; });
			var text = [];
			cells.forEach(function (c) { (text[c.y - sel.y0] = text[c.y - sel.y0] || [])[c.x - sel.x0] = c.td.innerText.replace(/\s+/g, " ").trim(); });
			clip.text = text.map(function (r) { return (r || []).join("\t"); }).join("\n");
			try { navigator.clipboard.writeText(clip.text); } catch (e) {}
			if (cut) { cells.forEach(function (c) { cellAt(c.i, c.j)[3] = ""; }); o.changed(); o.rerender(); }
		}
		function paste(text) {
			if (!sel) return;
			var tb = tbodyById(sel.id), g = grid(tb);
			if (clip && (text == null || text === clip.text)) {
				clip.forEach(function (p) {
					var t = cellAtXY(g, sel.y0 + p.dy, sel.x0 + p.dx); if (!t) return;
					var c = cellAt(t.i, t.j); c[0] = p.cell[0]; c[3] = p.cell[3];
					if (p.cell[4]) c[4] = JSON.parse(JSON.stringify(p.cell[4])); else c.length = Math.min(c.length, 4);
				});
			} else if (text != null) {
				text.replace(/\r/g, "").split("\n").forEach(function (line, dy) {
					line.split("\t").forEach(function (v, dx) {
						var t = cellAtXY(g, sel.y0 + dy, sel.x0 + dx); if (t) cellAt(t.i, t.j)[3] = v.replace(/&/g, "&amp;").replace(/</g, "&lt;");
					});
				});
			}
			o.changed(); o.rerender();
		}

		// ---- the toolbar (like Google Sheets) ----
		function btn(act, label, tip, v) { return "<button type='button' class='rse-b' data-a='" + act + "'" + (v != null ? " data-v='" + v + "'" : "") + " title='" + tip + "'>" + label + "</button>"; }
		function colorBtn(act, label, tip) {
			return "<span class='rse-pop'><button type='button' class='rse-b rse-color' data-pop='" + act + "' title='" + tip + "'>" + label + "<i class='rse-cbar' data-bar='" + act + "'></i></button>" +
				"<div class='rse-popbox' data-box='" + act + "'><div class='rse-poprow'><input type='color' data-pick='" + act + "'> <span>Custom</span>" +
				"<button type='button' class='rse-b' data-a='" + act + "-reset' title='Back to the sheet&#39;s own color'>Reset</button></div>" + swatchHtml("data-sw", act) + "</div></span>";
		}
		function buildBar() {
			bar = document.createElement("div");
			bar.id = "rse-bar";
			bar.innerHTML =
				btn("undo", "↶", "Undo (Ctrl+Z)") + btn("redo", "↷", "Redo (Ctrl+Y)") + btn("paint", "🖌", "Paint format: copy this cell's format, then click where it goes") + btn("clear", "⌫", "Clear formatting") + "<i class='rse-sep'></i>" +
				"<select data-in='ff' title='Font'>" + FONTS.map(function (f) { return "<option style='font-family:" + f + "'>" + f + "</option>"; }).join("") + "</select>" +
				"<input data-in='fs' list='rse-sizes' title='Font size (pt)' placeholder='pt'><datalist id='rse-sizes'>" + SIZES.map(function (s) { return "<option value='" + s + "'>"; }).join("") + "</datalist><i class='rse-sep'></i>" +
				btn("b", "<b>B</b>", "Bold (Ctrl+B)") + btn("i", "<i>I</i>", "Italic (Ctrl+I)") + btn("s", "<s>S</s>", "Strikethrough") + btn("u", "<u>U</u>", "Underline (Ctrl+U)") +
				colorBtn("color", "A", "Text color") + colorBtn("bg", "🪣", "Fill color") +
				"<span class='rse-pop'><button type='button' class='rse-b' data-pop='bd' title='Borders'>▦</button><div class='rse-popbox rse-bdbox' data-box='bd'>" +
				btn("bd", "All", "All borders", "all") + btn("bd", "Outer", "Outer borders", "outer") + btn("bd", "Inner", "Inner borders", "inner") +
				btn("bd", "Top", "Top", "t") + btn("bd", "Bottom", "Bottom", "b") + btn("bd", "Left", "Left", "l") + btn("bd", "Right", "Right", "r") + btn("bd", "None", "No borders", "none") +
				"<div class='rse-poprow'>Color <input type='color' data-bdcolor value='#000000'> Width <select data-bdw><option>1</option><option>2</option><option selected>3</option></select>px</div></div></span>" +
				btn("merge", "⊞ Merge", "Merge the selected cells") + btn("unmerge", "⊟", "Unmerge") + "<i class='rse-sep'></i>" +
				btn("al", "⇤", "Align left", "left") + btn("al", "↔", "Align center", "center") + btn("al", "⇥", "Align right", "right") +
				btn("va", "⤒", "Top", "top") + btn("va", "↕", "Middle", "middle") + btn("va", "⤓", "Bottom", "bottom") +
				"<select data-in='wrap' title='Text wrapping'><option value=''>Wrap: sheet's</option><option value='wrap'>Wrap</option><option value='overflow'>Overflow</option><option value='clip'>Clip</option></select>" +
				"<span class='rse-info'></span>";
			document.body.appendChild(bar);
			bar.addEventListener("mousedown", function (e) { if (e.target.closest("button, i[data-sw]")) e.preventDefault(); });
			bar.addEventListener("click", function (e) {
				var sw = e.target.closest("i[data-sw]");
				if (sw) { var act0 = sw.closest(".rse-sw").getAttribute("data-act"), c0 = sw.getAttribute("data-sw"); bar.querySelector("[data-pick='" + act0 + "']").value = c0; applyColor(act0, c0); closePops(); return; }
				var pop = e.target.closest("[data-pop]");
				if (pop) { var box = bar.querySelector("[data-box='" + pop.getAttribute("data-pop") + "']"), was = box.classList.contains("on"); closePops(); if (!was) box.classList.add("on"); return; }
				var b = e.target.closest("[data-a]"); if (!b) return;
				var a = b.getAttribute("data-a"), v = b.getAttribute("data-v");
				if (a === "undo") { if (editTd) endEdit(true); o.undo(); } else if (a === "redo") { if (editTd) endEdit(true); o.redo(); }
				else if (/^[bius]$/.test(a)) fmt(a);
				else if (a === "al" || a === "va") setCells(function (st) { st[a] = v; });
				else if (a === "clear") setCells(function (st, c) { delete ext(cellAt(c.i, c.j)).st; });
				else if (a === "merge") merge(); else if (a === "unmerge") unmerge();
				else if (a === "paint") { var cs = selCells(); if (cs.length) { var src = cellAt(cs[0].i, cs[0].j); painter = {cls: src[0], st: JSON.parse(JSON.stringify((src[4] || {}).st || {}))}; document.body.classList.add("rse-painting"); } }
				else if (a === "bd") { borders(v, bar.querySelector("[data-bdcolor]").value, bar.querySelector("[data-bdw]").value); closePops(); }
				else if (a === "color-reset") { setCells(function (st) { delete st.color; }); closePops(); }
				else if (a === "bg-reset") { setCells(function (st) { delete st.bg; }); closePops(); }
			});
			bar.addEventListener("change", function (e) {
				var k = e.target.getAttribute("data-in"), pick = e.target.getAttribute("data-pick");
				if (pick) { applyColor(pick, e.target.value); return; }
				if (k === "ff") fmt("ff", e.target.value);
				else if (k === "fs") { var n = parseFloat(e.target.value); if (n) fmt("fs", n); }
				else if (k === "wrap") setCells(function (st) { if (e.target.value) st.wrap = e.target.value; else delete st.wrap; });
			});
		}
		function applyColor(act, c) { if (act === "color") fmt("color", c); else setCells(function (st) { st.bg = c; }); }
		function closePops() { if (bar) bar.querySelectorAll(".rse-popbox.on").forEach(function (b) { b.classList.remove("on"); }); }
		function updateBar() {
			if (!bar) return;
			var cells = selCells(), info = bar.querySelector(".rse-info");
			if (!cells.length) { info.textContent = "Click a cell to start"; return; }
			var c = active && cells.indexOf(active) >= 0 ? active : cells[0], r = data().rows[c.i], st = (cellAt(c.i, c.j)[4] || {}).st || {};
			var cs = getComputedStyle(c.td.querySelector(".mg-in span, :scope > span:not(.mg-caret)") || c.td);
			var rows = selRows(); // the same row numbers as the numbers down the left
			info.textContent = LETTERS[sel.x0] + (rows[0] + 1) + (cells.length > 1 ? ":" + LETTERS[sel.x1] + (rows[rows.length - 1] + 1) : "") + " · " + (KIND_NAMES[r.k] || r.k);
			bar.querySelector("[data-in=ff]").value = st.ff || cs.fontFamily.split(",")[0].replace(/['"]/g, "").trim() || "Comfortaa";
			bar.querySelector("[data-in=fs]").value = st.fs || Math.round(parseFloat(cs.fontSize) * 0.75);
			bar.querySelector("[data-in=wrap]").value = st.wrap || "";
			var lk = looks(c);
			["b", "i", "u", "s"].forEach(function (k) { bar.querySelector("[data-a=" + k + "]").classList.toggle("on", lk[k]); });
			bar.querySelector("[data-bar=color]").style.background = st.color || cs.color;
			bar.querySelector("[data-bar=bg]").style.background = st.bg || getComputedStyle(c.td).backgroundColor;
		}
		var KIND_NAMES = {};
		(o.kinds || []).forEach(function (k) { KIND_NAMES[k[0]] = k[1]; });

		// ---- right-click menu ----
		function openMenu(x, y) {
			closeMenu();
			menu = document.createElement("div");
			menu.id = "rse-menu";
			var item = function (a, label, v) { return "<div class='rse-mi' data-m='" + a + "'" + (v ? " data-v='" + v + "'" : "") + ">" + label + "</div>"; };
			menu.innerHTML = item("copy", "Copy <small>Ctrl+C</small>") + item("cut", "Cut <small>Ctrl+X</small>") + item("paste", "Paste <small>Ctrl+V</small>") + "<hr>" +
				item("above", "Insert row above") + item("below", "Insert row below") + item("dup", "Duplicate row") + item("del", "Delete row(s)") + "<hr>" +
				item("merge", "Merge cells") + item("unmerge", "Unmerge cells") + item("clear", "Clear formatting") + item("empty", "Clear contents <small>Del</small>") + "<hr>" +
				"<div class='rse-mh'>Row type</div>" + (o.kinds || []).map(function (k) { return item("kind", k[1], k[0]); }).join("") +
				"<hr>" + item("height", "Set row height…") + item("width", "Set column width…");
			document.body.appendChild(menu);
			menu.style.left = (Math.min(x, innerWidth - 240) + scrollX) + "px";
			menu.style.top = (Math.max(4, Math.min(y, innerHeight - menu.offsetHeight - 8)) + scrollY) + "px";
			menu.addEventListener("mousedown", function (e) { e.preventDefault(); e.stopPropagation(); });
			menu.addEventListener("click", function (e) {
				var m = e.target.closest("[data-m]"); if (!m) return;
				var a = m.getAttribute("data-m"), v = m.getAttribute("data-v");
				closeMenu();
				if (a === "copy") copy(false); else if (a === "cut") copy(true);
				else if (a === "paste") { if (navigator.clipboard && navigator.clipboard.readText) navigator.clipboard.readText().then(paste, function () { paste(null); }); else paste(null); }
				else if (a === "merge") merge(); else if (a === "unmerge") unmerge();
				else if (a === "clear") setCells(function (st, c) { delete ext(cellAt(c.i, c.j)).st; });
				else if (a === "empty") { selCells().forEach(function (c) { cellAt(c.i, c.j)[3] = ""; }); o.changed(); o.rerender(); }
				else if (a === "kind") rowOp("kind", v);
				else if (a === "height") sizePrompt("h");
				else if (a === "width") sizePrompt("w");
				else rowOp(a);
			});
		}
		function closeMenu() { if (menu) { menu.remove(); menu = null; } }
		// row height / column width: a small box under the toolbar (the in-app browser blocks prompt())
		function sizePrompt(kind) {
			var rows = selRows(), cur = kind === "h" ? (o.rowH ? o.rowH(data().rows[rows[0]]) : data().rows[rows[0]].h) : data().cols[sel.x0];
			var box = document.createElement("div");
			box.id = "rse-size";
			box.innerHTML = (kind === "h" ? "Row height" : "Column width") + " <input type='number' min='8' value='" + Math.round(cur) + "'> px <button type='button' class='rse-b' data-ok>OK</button><button type='button' class='rse-b' data-no>Cancel</button>";
			document.body.appendChild(box);
			var inp = box.querySelector("input"); inp.focus(); inp.select();
			var done = function (ok) {
				var v = Math.max(8, Math.round(+inp.value || cur)); box.remove();
				if (!ok) return;
				if (kind === "h") rows.forEach(function (i) { data().rows[i].h = v; data().rows[i].hSet = 1; });
				else for (var x = sel.x0; x <= sel.x1; x++) data().cols[x] = v;
				o.changed(); o.rerender();
			};
			box.querySelector("[data-ok]").onclick = function () { done(true); };
			box.querySelector("[data-no]").onclick = function () { done(false); };
			inp.onkeydown = function (e) { if (e.key === "Enter") done(true); if (e.key === "Escape") done(false); e.stopPropagation(); };
		}

		// ---- mouse ----
		function cellFromEvent(e) {
			var td = e.target.closest && e.target.closest(o.scope + " td[data-j]");
			if (!td) return null;
			return grid(td.closest("tbody")).byTd.get(td) || null;
		}
		document.addEventListener("mousedown", function (e) {
			if (!api.on) return;
			if (bar && bar.contains(e.target)) return;
			if (e.target.closest && e.target.closest("#rse-size, #mg-colorpanel, .mg-bar")) return;
			if (menu && !menu.contains(e.target)) closeMenu();
			closePops();
			var cg = e.target.closest(".rse-colgrip"), rg = e.target.closest(".rse-rowgrip");
			if (cg || rg) { e.preventDefault(); startResize(e, cg, rg); return; }
			var ch = e.target.closest(o.scope + " th[data-col]"), rh = e.target.closest(o.scope + " th.rse-rn");
			if (ch || rh) {
				if (e.button === 2 && sel) return;
				e.preventDefault(); if (editTd) endEdit(true);
				var tb = (ch || rh).closest("table").querySelector("tbody"), g = grid(tb);
				if (ch) { var x = +ch.getAttribute("data-col"); active = cellAtXY(g, 0, x); setSel(tb, 0, e.shiftKey && sel ? sel.x0 : x, g.rows.length - 1, x); }
				else { var y = g.rows.indexOf(rh.parentNode); active = cellAtXY(g, y, 0); setSel(tb, e.shiftKey && sel ? sel.y0 : y, 0, y, data().cols.length - 1); }
				return;
			}
			if (e.target.closest(".mg-caret")) return; // the dropdown arrow still opens / closes
			var c = cellFromEvent(e);
			if (!c) { if (editTd) endEdit(true); return; }
			if (editTd && editTd.td === c.td) return; // clicking inside the cell you're typing in
			if (e.button === 2 && sel && selCells().indexOf(c) >= 0) return; // right-click inside the selection keeps it
			if (editTd) { var ci = c.i, cj = c.j; endEdit(true); var td2 = document.querySelector(o.scope + " tr[data-i='" + ci + "'] > td[data-j='" + cj + "']"); c = td2 && grid(td2.closest("tbody")).byTd.get(td2); if (!c) return; }
			e.preventDefault();
			var tb2 = c.td.closest("tbody");
			if (painter) {
				setSel(tb2, c.y, c.x, c.y + c.rs - 1, c.x + c.cs - 1);
				selCells().forEach(function (q) { var cc = cellAt(q.i, q.j); cc[0] = painter.cls; ext(cc).st = JSON.parse(JSON.stringify(painter.st)); });
				painter = null; document.body.classList.remove("rse-painting"); o.changed(); o.rerender(); return;
			}
			if (e.shiftKey && sel && sel.id === tableId(tb2) && active) setSel(tb2, active.y, active.x, c.y + c.rs - 1, c.x + c.cs - 1);
			else { active = c; setSel(tb2, c.y, c.x, c.y + c.rs - 1, c.x + c.cs - 1); dragging = true; }
		});
		document.addEventListener("mousemove", function (e) {
			if (!api.on || !dragging || !active) return;
			var el = document.elementFromPoint(e.clientX, e.clientY), td = el && el.closest && el.closest(o.scope + " td[data-j]");
			if (!td || td.closest("tbody") !== active.td.closest("tbody")) return;
			var c = grid(td.closest("tbody")).byTd.get(td);
			if (c) setSel(td.closest("tbody"), active.y, active.x, c.y + c.rs - 1, c.x + c.cs - 1);
		});
		document.addEventListener("mouseup", function () { dragging = false; });
		document.addEventListener("dblclick", function (e) {
			if (!api.on) return;
			var c = cellFromEvent(e); if (!c || (editTd && editTd.td === c.td)) return;
			active = c; setSel(c.td.closest("tbody"), c.y, c.x, c.y + c.rs - 1, c.x + c.cs - 1);
			beginEdit(c);
		});
		document.addEventListener("contextmenu", function (e) {
			if (!api.on) return;
			var c = cellFromEvent(e) || (e.target.closest && e.target.closest(o.scope + " th.rse-rn, " + o.scope + " th[data-col]"));
			if (!c) return;
			e.preventDefault();
			openMenu(e.clientX, e.clientY);
		});

		function startResize(e, cg, rg) {
			var start = cg ? e.clientX : e.clientY, zoom = parseFloat((cg || rg).closest("table").style.zoom) || 1, mv, up;
			if (cg) {
				var x = +cg.getAttribute("data-col"), w0 = data().cols[x];
				var cols = document.querySelectorAll(o.scope + " table.mg colgroup col[data-x='" + x + "']");
				mv = function (ev) { var w = Math.max(8, Math.round(w0 + (ev.clientX - start) / zoom)); cols.forEach(function (col) { col.style.width = w + "px"; }); cg.setAttribute("data-w", w); draw(); };
				up = function () { document.removeEventListener("mousemove", mv); document.removeEventListener("mouseup", up); var w = +cg.getAttribute("data-w"); if (w && w !== w0) { data().cols[x] = w; o.changed(); o.rerender(); } };
			} else {
				var tr = rg.closest("tr"), i = +tr.getAttribute("data-i"), r = data().rows[i], h0 = o.rowH ? o.rowH(r) : r.h;
				mv = function (ev) { var h = Math.max(8, Math.round(h0 + (ev.clientY - start) / zoom)); tr.style.height = h + "px"; rg.setAttribute("data-h", h); draw(); };
				up = function () { document.removeEventListener("mousemove", mv); document.removeEventListener("mouseup", up); var h = +rg.getAttribute("data-h"); if (h && h !== h0) { r.h = h; r.hSet = 1; o.changed(); o.rerender(); } };
			}
			document.addEventListener("mousemove", mv); document.addEventListener("mouseup", up);
		}

		// ---- keyboard ----
		function move(dy, dx, extend) {
			if (!sel) return;
			var tb = tbodyById(sel.id), g = grid(tb), from = (active && g.cells.indexOf(active) >= 0 && active) || cellAtXY(g, sel.y0, sel.x0);
			if (!from) return;
			var y = Math.max(0, Math.min(g.rows.length - 1, (dy > 0 ? from.y + from.rs - 1 : from.y) + dy));
			var x = Math.max(0, Math.min(data().cols.length - 1, (dx > 0 ? from.x + from.cs - 1 : from.x) + dx));
			var t = cellAtXY(g, y, x);
			while (t && t.tr.style.display === "none" && y > 0 && y < g.rows.length - 1) { y += dy || 1; t = cellAtXY(g, y, x); } // skip closed sections
			if (!t) return;
			if (extend) setSel(tb, from.y, from.x, t.y, t.x);
			else { active = t; setSel(tb, t.y, t.x, t.y + t.rs - 1, t.x + t.cs - 1); }
			var b = t.td.getBoundingClientRect(); if (b.top < 90 || b.bottom > innerHeight) t.td.scrollIntoView({block: "nearest"});
		}
		document.addEventListener("keydown", function (e) {
			if (!api.on) return;
			var k = e.key, mod = e.ctrlKey || e.metaKey;
			if (e.target.closest && e.target.closest("#rse-bar input, #rse-bar select, #rse-size, .mg-search, #mg-colorpanel")) return;
			if (mod && (k.toLowerCase() === "z" || k.toLowerCase() === "y")) return; // undo / redo: the page handles it
			if (editTd) {
				if (k === "Escape") { e.preventDefault(); endEdit(false); }
				else if (k === "Enter" && !e.shiftKey && !e.altKey) { e.preventDefault(); endEdit(true); move(1, 0); }
				else if (k === "Enter") { e.preventDefault(); document.execCommand("insertLineBreak"); }
				else if (k === "Tab") { e.preventDefault(); endEdit(true); move(0, e.shiftKey ? -1 : 1); }
				else if (mod && /^[biu]$/i.test(k)) { e.preventDefault(); fmt(k.toLowerCase()); }
				return;
			}
			if (!sel) return;
			if (mod && k.toLowerCase() === "c") { e.preventDefault(); copy(false); }
			else if (mod && k.toLowerCase() === "x") { e.preventDefault(); copy(true); }
			else if (mod && /^[biu]$/i.test(k)) { e.preventDefault(); fmt(k.toLowerCase()); }
			else if (/^Arrow/.test(k)) { e.preventDefault(); move(k === "ArrowDown" ? 1 : k === "ArrowUp" ? -1 : 0, k === "ArrowRight" ? 1 : k === "ArrowLeft" ? -1 : 0, e.shiftKey); }
			else if (k === "Tab") { e.preventDefault(); move(0, e.shiftKey ? -1 : 1); }
			else if (k === "Enter" || k === "F2") { e.preventDefault(); beginEdit(active || selCells()[0]); }
			else if (k === "Delete" || k === "Backspace") { e.preventDefault(); selCells().forEach(function (c) { cellAt(c.i, c.j)[3] = ""; }); o.changed(); o.rerender(); }
			else if (k === "Escape") { sel = null; painter = null; document.body.classList.remove("rse-painting"); draw(); }
			else if (k.length === 1 && !mod && !e.altKey) { e.preventDefault(); beginEdit(active || selCells()[0], k); }
		});
		document.addEventListener("paste", function (e) {
			if (!api.on || editTd || !sel) return;
			if (e.target.closest && e.target.closest("input, textarea, select")) return;
			e.preventDefault();
			paste((e.clipboardData || window.clipboardData).getData("text"));
		});
		window.addEventListener("resize", function () { if (api.on) draw(); });
		window.addEventListener("scroll", function () { if (menu) closeMenu(); }, {passive: true});

		// the page sits below the toolbar, however many lines the toolbar wraps to
		function fitBar() { if (bar && api.on) document.body.style.setProperty("--rse-h", bar.offsetHeight + "px"); }
		window.addEventListener("resize", fitBar);
		api.start = function () { api.on = true; if (!bar) buildBar(); bar.style.display = "flex"; document.body.classList.add("rse-on"); fitBar(); draw(); };
		api.stop = function () { if (editTd) endEdit(true); api.on = false; sel = null; active = null; closeMenu(); if (bar) bar.style.display = "none"; document.body.classList.remove("rse-on"); draw(); };
		// after the page re-draws: forget the old table layout, keep the selection, re-place the boxes
		api.mark = function () {
			grids = null;
			if (sel && active) { var tb = tbodyById(sel.id); var g = tb && grid(tb); active = (g && cellAtXY(g, active.y, active.x)) || null; }
			draw();
		};
		api.css = function () { return cellCss(data()); };
		api.editing = function () { return !!editTd; };
		return api;
	}
	return {create: create, swatchHtml: swatchHtml, css: cellCss, LETTERS: LETTERS};
})();
