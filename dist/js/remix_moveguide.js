// Move Guide page: the Remix Move Guide sheet drawn 1:1 (cells, merges, colors, rich text, Comfortaa) from
// moveguide/move_guide.json (imported by tools/build_move_guide.py). Every big header collapses its section;
// the info blurb and the table of contents can be hidden. On localhost, "Edit guide" makes every cell
// editable, adds / removes rows and headers, and "Save to file" downloads the new move_guide.json
// (put it in src/moveguide/ and rebuild).
(function () {
	var CAN_EDIT = /^(localhost|127\.0\.0\.1)$/.test(location.hostname);
	var K_COLLAPSED = "remixMoveGuideCollapsed", K_HIDE = "remixMoveGuideHide", K_DRAFT = "remixMoveGuideDraft";
	var data = null, editing = false, dirty = false;
	var $ = function (s, r) { return (r || document).querySelector(s); };
	var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
	var load = function (k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } };
	var save = function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
	var plain = function (h) { var d = document.createElement("div"); d.innerHTML = h; return (d.textContent || "").replace(/\s+/g, " ").trim(); };
	var collapsed = load(K_COLLAPSED, {}), hide = load(K_HIDE, {});

	// the header's key for remembering collapsed state: its first line of text
	function headKey(r) { return plain(r.c[0][3].split(/<br>|\n/)[0]).slice(0, 80); }
	function headTitle(r) {
		var d = document.createElement("div"); d.innerHTML = r.c[0][3].replace(/<br\s*\/?>/g, "\n");
		return (d.textContent || "").split("\n")[0].replace(/[-–—]{4,}.*/, "").replace(/\s+/g, " ").trim();
	}

	// A cell that is only rich-text spans (like "Acid > Caustic Acid" + a small second line): the cell's own
	// font size would add a tall empty strut to every line (the sheet sizes each line by its own text), so
	// the cell itself gets size 0 and each span keeps its own size.
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
		return cls;
	}
	function cellHtml(c, r) {
		// category icons fill the cell's height like the sheet's =image() does
		return c[3].replace(/<img class="mg-cat"/g, "<img class=\"mg-cat\" style=\"height:" + Math.max(18, Math.min(r.h - 8, 46)) + "px\"");
	}

	function rowHtml(r, i) {
		var head = r.k === "h1" || r.k === "h2";
		return "<tr data-i='" + i + "' class='mg-" + r.k + "' style='height:" + r.h + "px'>" + r.c.map(function (c, j) {
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
		var intro = [], body = [];
		data.rows.forEach(function (r, i) { (r.k === "intro" ? intro : body).push(rowHtml(r, i)); });
		$("#mg-info").innerHTML = "<div class='mg-scroll'>" + tableHtml(intro) + "</div>";
		$("#mg-guide").innerHTML = tableHtml(body);
		renderToc();
		applyColors();
		applyCollapse();
		applyHide();
		scale();
	}

	// sections: every row belongs to the h1 above it and the h2 above it (inside that h1)
	function sections() {
		var h1 = -1, h2 = -1, out = [];
		data.rows.forEach(function (r, i) {
			if (r.k === "h1") { h1 = i; h2 = -1; } else if (r.k === "h2") h2 = i;
			out.push({h1: h1, h2: h2});
		});
		return out;
	}
	function applyCollapse() {
		var sec = sections(), q = ($(".mg-search").value || "").trim().toLowerCase();
		var match = {};
		if (q) data.rows.forEach(function (r, i) {
			if (r.k === "row" && r.c.length > 2 && plain(r.c[0][3]).toLowerCase().indexOf(q) !== -1) {
				match[i] = 1; if (sec[i].h1 >= 0) match[sec[i].h1] = 1; if (sec[i].h2 >= 0) match[sec[i].h2] = 1;
			}
		});
		$$("#mg-guide tr[data-i]").forEach(function (tr) {
			var i = +tr.getAttribute("data-i"), r = data.rows[i], s = sec[i], show;
			if (q) show = match[i] || (r.k === "row" && isColumnHead(r) && match[s.h2 >= 0 ? s.h2 : s.h1] && !editing);
			else {
				var c1 = s.h1 >= 0 && s.h1 !== i && collapsed[headKey(data.rows[s.h1])];
				var c2 = s.h2 >= 0 && s.h2 !== i && r.k !== "h2" && collapsed[headKey(data.rows[s.h2])];
				show = !(c1 || c2);
			}
			tr.style.display = show ? "" : "none";
			if (r.k === "h1" || r.k === "h2") tr.classList.toggle("mg-shut", !q && !!collapsed[headKey(r)]);
		});
	}
	function isColumnHead(r) { return /^Move Name$/i.test(plain(r.c[0][3])); }

	// "All Fire Type Moves" -> "Fire"
	function typeOf(r) { var m = /^All (\w+) Type Moves/.exec(headTitle(r)); return m && TYPE_COLORS[m[1]] ? m[1] : null; }

	// Table of contents: the 18 types link straight to their header; the categories are grouped like the
	// sheet's contents (data.toc), each with its sub-categories. Big headers not in any group go under "Other".
	function renderToc() {
		var types = [], byCat = {}, extra = [], cur = null;
		data.rows.forEach(function (r, i) {
			if (r.k === "h1") {
				cur = {i: i, t: r.cat || headTitle(r), kids: [], type: typeOf(r)};
				if (cur.type) { types.push(cur); cur = null; }
				else if (r.cat && !byCat[r.cat]) byCat[r.cat] = cur; else extra.push(cur);
			} else if (r.k === "h2" && cur) cur.kids.push({i: i, t: headTitle(r)});
		});
		var item = function (h) {
			return "<li><a href='#' data-go='" + h.i + "'>" + h.t + "</a>" + (h.kids.length ? "<ul>" + h.kids.map(function (k) {
				return "<li><a href='#' data-go='" + k.i + "'>" + k.t + "</a></li>";
			}).join("") + "</ul>" : "") + "</li>";
		};
		var groups = (data.toc || []).map(function (g) {
			var items = g.cats.map(function (c) { return byCat[c]; }).filter(Boolean);
			return items.length ? "<div class='mg-toc-group'><div class='mg-toc-g'>" + g.name + "</div><ul>" + items.map(item).join("") + "</ul></div>" : "";
		}).join("") + (extra.length ? "<div class='mg-toc-group'><div class='mg-toc-g'>Other</div><ul>" + extra.map(item).join("") + "</ul></div>" : "");
		$("#mg-toc").innerHTML = "<div class='mg-toc-title'>Table of Contents</div><div class='mg-toc-cols'>" +
			"<div><div class='mg-toc-h'>All Moves by Type</div><ul class='mg-toc-types'>" + types.map(function (h) {
				return "<li><a href='#' data-go='" + h.i + "' class='mg-toc-type' style='background:" + TYPE_COLORS[h.type] + ";color:" + typeText(h.type) + "'>" + h.type + "</a></li>";
			}).join("") + "</ul></div>" +
			"<div><div class='mg-toc-h'>Moves by Category</div><div class='mg-toc-groups'>" + groups + "</div></div></div>";
	}

	// ---- colors ----
	var TYPE_COLORS = typeof REMIX_TYPE_COLORS !== "undefined" ? REMIX_TYPE_COLORS : {};
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
	// each class's own text / fill color, from the sheet's css
	var clsColor = {};
	function readClassColors() {
		data.css.replace(/\.mg \.([a-z]\d+)\{([^}]*)\}/g, function (a, k, body) {
			var c = /(?:^|;)color:(#[0-9a-f]{6})/i.exec(body), b = /background-color:(#[0-9a-f]{6})/i.exec(body);
			clsColor[k] = {color: c && c[1].toLowerCase(), bg: b && b[1].toLowerCase()};
		});
	}
	// Type sections take the website's type color. In the sheet a type's color is its header's TEXT (the bars are
	// black): that text becomes the website color, and every fill in the section keeps the sheet's own lightness
	// with the website type's hue (light rows stay light). Greys, white and black stay as they are.
	function spanClasses(h) { return (h.match(/class="(r\d+)"/g) || []).map(function (x) { return x.slice(7, -1); }); }
	function typeColorCss() {
		var css = "", type = null, main = null;
		data.rows.forEach(function (r, i) {
			if (r.k === "h1") {
				type = typeOf(r); main = null;
				if (type) {
					var c0 = r.c[0], cc = clsColor[c0[0]] || {};
					main = cc.color;
					spanClasses(c0[3]).forEach(function (k) { var sc = clsColor[k]; if (sc && sc.color && hsl(sc.color)[1] > 0.15) main = main && hsl(main)[1] > 0.15 ? main : sc.color; });
				}
			}
			if (!type || !main) return;
			var t = hsl(TYPE_COLORS[type]), m = hsl(main), sel = "#mg-guide tr[data-i='" + i + "'] ";
			var recolor = function (col) {
				var o = hsl(col);
				if (col === main) return TYPE_COLORS[type];
				if (o[1] < 0.12 || o[2] > 0.97 || o[2] < 0.04) return null;
				return hex(t[0], Math.min(1, t[1] * (m[1] ? o[1] / m[1] : 1)), o[2]);
			};
			r.c.forEach(function (c, j) {
				var cc = clsColor[c[0]] || {}, cell = sel + "td[data-j='" + j + "']";
				if (cc.bg) { var nb = recolor(cc.bg); if (nb) css += cell + "{background-color:" + nb + " !important}"; }
				if (cc.color === main) css += cell + "{color:" + TYPE_COLORS[type] + " !important}";
				spanClasses(c[3]).forEach(function (k) { var sc = clsColor[k]; if (sc && sc.color === main) css += cell + " ." + k + "{color:" + TYPE_COLORS[type] + " !important}"; });
			});
		});
		return css;
	}

	// Colors you pick for the intro and the table of contents (localhost Colors panel), saved in data.theme
	var TOC_PARTS = [["tocBg", "Contents background", "#120f16"], ["tocBorder", "Contents border", "#3a3246"], ["tocTitle", "Contents title", "#ffffff"],
		["tocHead", "Column headings", "#ffe599"], ["tocGroup", "Group names", "#c9a6ef"], ["tocLink", "Category links", "#f6b26b"], ["tocSub", "Sub-category links", "#ffe599"]];
	var LOGO_SWATCHES = ["#7d1bc0", "#7f72c8", "#c9a6ef", "#7bc0dc", "#16698b", "#3769a8", "#0f4469", "#facc17", "#e3e0ac", "#dab578", "#ef1c7b", "#ffffff"];
	function introColors() {
		var seen = {};
		data.rows.forEach(function (r) {
			if (r.k !== "intro") return;
			r.c.forEach(function (c) {
				[c[0]].concat((c[3].match(/class="(r\d+)"/g) || []).map(function (x) { return x.slice(7, -1); })).forEach(function (k) {
					var cc = clsColor[k]; if (cc && cc.color) seen[cc.color] = 1;
				});
			});
		});
		return Object.keys(seen);
	}
	function themeCss() {
		var th = data.theme || {}, map = th.intro || {}, css = "#mg-toc{";
		TOC_PARTS.forEach(function (p) { css += "--" + p[0] + ":" + ((th.toc || {})[p[0]] || p[2]) + ";"; });
		css += "}";
		Object.keys(clsColor).forEach(function (k) {
			var c = clsColor[k].color;
			if (c && map[c]) css += "#mg-info ." + k + "{color:" + map[c] + " !important}";
		});
		return css;
	}
	function applyColors() {
		var st = document.getElementById("mg-colors") || document.head.appendChild(Object.assign(document.createElement("style"), {id: "mg-colors"}));
		st.textContent = typeColorCss() + themeCss();
	}
	function colorPanel() {
		var p = document.getElementById("mg-colorpanel");
		if (p) { p.remove(); return; }
		var th = data.theme = data.theme || {}, row = function (key, label, val, kind) {
			return "<label class='mg-cp-row'><input type='color' value='" + val + "' data-cp='" + kind + "' data-key='" + key + "'><span>" + label + "</span>" +
				"<span class='mg-cp-sw'>" + LOGO_SWATCHES.map(function (s) { return "<i style='background:" + s + "' data-sw='" + s + "'></i>"; }).join("") + "</span></label>";
		};
		p = document.createElement("div");
		p.id = "mg-colorpanel";
		p.innerHTML = "<div class='mg-cp-top'><b>Move Guide colors</b><button type='button' class='mg-btn' data-cp-close>✕</button></div>" +
			"<div class='mg-cp-note'>Swatches are the new Remix logo's colors. Changes show live; 💾 Save to file keeps them.</div>" +
			"<div class='mg-cp-h'>Info blurb text (each sheet color)</div>" +
			introColors().map(function (c) { return row(c, "<code>" + c + "</code>", (th.intro || {})[c] || c, "intro"); }).join("") +
			"<div class='mg-cp-h'>Table of contents</div>" +
			TOC_PARTS.map(function (q) { return row(q[0], q[1], (th.toc || {})[q[0]] || q[2], "toc"); }).join("") +
			"<button type='button' class='mg-btn' data-cp-reset>Reset to the sheet's colors</button>";
		document.body.appendChild(p);
	}
	function setColor(input, val) {
		var th = data.theme = data.theme || {}, kind = input.getAttribute("data-cp"), key = input.getAttribute("data-key");
		th[kind] = th[kind] || {};
		th[kind][key] = val; input.value = val;
		applyColors(); markDirty();
	}
	function goTo(i) {
		var sec = sections()[i];
		[sec.h1, sec.h2, i].forEach(function (h) { if (h >= 0) delete collapsed[headKey(data.rows[h])]; });
		save(K_COLLAPSED, collapsed);
		applyCollapse();
		var tr = $("#mg-guide tr[data-i='" + i + "']");
		if (tr) tr.scrollIntoView({block: "start"});
	}

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
				"<button type='button' class='mg-btn mg-discard' title='Throw away your unsaved edits'>Discard edits</button>" : "") +
			(editing ? "<span class='mg-hint'>Click any cell to type. Hover a row for ＋ Header / ＋ Row / Level / ✕. Edits are kept in this browser until you save.</span>" : "");
	}
	function markDirty() { dirty = true; save(K_DRAFT, data); editTools(); }
	var rowTools = null, toolRow = -1;
	function showRowTools(tr) {
		if (!editing || !tr) return;
		if (!rowTools) {
			rowTools = document.createElement("div");
			rowTools.className = "mg-rowtools";
			rowTools.innerHTML = "<button data-rt='head' title='Add a new header (category) below this row'>＋ Header</button>" +
				"<button data-rt='row' title='Copy this row below it'>＋ Row</button>" +
				"<button data-rt='level' title='Header: switch between big (collapses its whole section) and sub-header'>Level</button>" +
				"<button data-rt='del' title='Delete this row'>✕</button>";
			document.body.appendChild(rowTools);
			rowTools.addEventListener("click", function (e) {
				var b = e.target.closest("button"); if (!b || toolRow < 0) return;
				var act = b.getAttribute("data-rt"), r = data.rows[toolRow];
				if (act === "del") { if (!confirm("Delete this row?")) return; data.rows.splice(toolRow, 1); }
				else if (act === "row") data.rows.splice(toolRow + 1, 0, JSON.parse(JSON.stringify(r)));
				else if (act === "level") { if (r.k === "h1") r.k = "h2"; else if (r.k === "h2") r.k = "h1"; else return; }
				else if (act === "head") {
					var tpl = null;
					for (var i = toolRow; i >= 0 && !tpl; i--) if (data.rows[i].k === "h2") tpl = data.rows[i];
					tpl = tpl || {k: "h2", h: 56, c: [[data.rows.filter(function (x) { return x.k === "h2"; })[0].c[0][0], data.cols.length, 1, ""]]};
					data.rows.splice(toolRow + 1, 0, {k: "h2", h: tpl.h, c: [[tpl.c[0][0], tpl.c[0][1], 1, "New category"]]});
				}
				rowTools.style.display = "none";
				markDirty(); render();
			});
		}
		toolRow = +tr.getAttribute("data-i");
		var r = tr.getBoundingClientRect();
		rowTools.style.display = "flex";
		rowTools.style.top = (r.top + scrollY + 2) + "px";
		rowTools.style.left = Math.max(2, r.left + scrollX - rowTools.offsetWidth - 4) + "px";
		rowTools.querySelector("[data-rt=level]").style.display = /^h[12]$/.test(data.rows[toolRow].k) ? "" : "none";
	}

	document.addEventListener("click", function (e) {
		if (e.target.closest(".mg-colors") || e.target.closest("[data-cp-close]")) { colorPanel(); return; }
		var sw = e.target.closest("[data-sw]");
		if (sw) { e.preventDefault(); setColor(sw.closest(".mg-cp-row").querySelector("input"), sw.getAttribute("data-sw")); return; }
		if (e.target.closest("[data-cp-reset]")) {
			if (!confirm("Put the info blurb and contents back to the sheet's colors?")) return;
			data.theme = {}; applyColors(); markDirty(); colorPanel(); colorPanel(); return;
		}
		var go = e.target.closest("[data-go]");
		if (go) { e.preventDefault(); goTo(+go.getAttribute("data-go")); return; }
		var top = e.target.closest("a[href='#mg-toc']");
		if (top) { e.preventDefault(); if (hide.toc) { hide.toc = 0; save(K_HIDE, hide); applyHide(); } $("#mg-toc").scrollIntoView(); return; }
		var hd = e.target.closest("#mg-guide td.mg-hd");
		if (hd && (!editing || e.target.classList.contains("mg-caret"))) {
			var k = headKey(data.rows[+hd.parentNode.getAttribute("data-i")]);
			if (collapsed[k]) delete collapsed[k]; else collapsed[k] = 1;
			save(K_COLLAPSED, collapsed); applyCollapse(); return;
		}
		var b = e.target.closest(".mg-btn");
		if (!b) return;
		var act = b.getAttribute("data-act");
		if (act === "info" || act === "toc") { hide[act] = hide[act] ? 0 : 1; save(K_HIDE, hide); applyHide(); }
		else if (act === "collapse") { data.rows.forEach(function (r) { if (r.k === "h1") collapsed[headKey(r)] = 1; }); save(K_COLLAPSED, collapsed); applyCollapse(); }
		else if (act === "expand") { collapsed = {}; save(K_COLLAPSED, collapsed); applyCollapse(); }
		else if (b.classList.contains("mg-edit")) { editing = !editing; if (rowTools) rowTools.style.display = "none"; editTools(); render(); }
		else if (b.classList.contains("mg-save")) {
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
		var clone = td.cloneNode(true), caret = clone.querySelector(".mg-caret");
		if (caret) caret.remove();
		data.rows[i].c[j][3] = clone.innerHTML;
		clearTimeout(markDirty.t); markDirty.t = setTimeout(markDirty, 400);
	});
	document.addEventListener("mouseover", function (e) {
		if (!editing) return;
		var tr = e.target.closest && e.target.closest(".mg-page tr[data-i]");
		if (tr) showRowTools(tr);
	});
	window.addEventListener("resize", function () { if (data) scale(); });
	// opening / closing / resizing the DoozDex sidebar narrows the page: re-fit the sheet to it
	if (window.ResizeObserver) new ResizeObserver(function () { if (data) scale(); }).observe(document.querySelector(".mg-page"));

	var draft = CAN_EDIT ? load(K_DRAFT, null) : null;
	fetch("./moveguide/move_guide.json").then(function (r) { return r.json(); }).then(function (d) {
		data = draft && draft.rows ? draft : d;
		dirty = !!(draft && draft.rows);
		var st = document.createElement("style"); st.textContent = data.css; document.head.appendChild(st);
		readClassColors();
		var defs = document.createElement("div"); defs.innerHTML = data.defs; document.body.appendChild(defs.firstChild);
		editTools();
		render();
	}).catch(function (e) { $("#mg-guide").innerHTML = "<div class='mg-loading'>Couldn't load the move guide (" + e + ").</div>"; });
})();
