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

	function rowHtml(r, i) {
		var head = r.k === "h1" || r.k === "h2";
		return "<tr data-i='" + i + "' class='mg-" + r.k + "' style='height:" + r.h + "px'>" + r.c.map(function (c, j) {
			return "<td class='" + c[0] + (head && j === 0 ? " mg-hd" : "") + "'" + (c[1] > 1 ? " colspan='" + c[1] + "'" : "") +
				(c[2] > 1 ? " rowspan='" + c[2] + "'" : "") + " data-j='" + j + "'" + (editing ? " contenteditable='true'" : "") + ">" +
				(head && j === 0 ? "<span class='mg-caret' contenteditable='false'></span>" : "") + c[3] + "</td>";
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

	function renderToc() {
		var types = [], cats = [], cur = null;
		data.rows.forEach(function (r, i) {
			if (r.k === "h1") { cur = {i: i, t: headTitle(r), kids: []}; (/^All \w+ Type Moves/.test(cur.t) ? types : cats).push(cur); }
			else if (r.k === "h2" && cur && headTitle(r).length <= 60) cur.kids.push({i: i, t: headTitle(r)}); // long ones are notes, not names
		});
		var list = function (arr) {
			return "<ul>" + arr.map(function (h) {
				return "<li><a href='#' data-go='" + h.i + "'>" + h.t + "</a>" + (h.kids.length ? "<ul>" + h.kids.map(function (k) {
					return "<li><a href='#' data-go='" + k.i + "'>" + k.t + "</a></li>";
				}).join("") + "</ul>" : "") + "</li>";
			}).join("") + "</ul>";
		};
		$("#mg-toc").innerHTML = "<div class='mg-toc-title'>Table of Contents</div><div class='mg-toc-cols'>" +
			"<div><div class='mg-toc-h'>All Moves by Type</div>" + list(types) + "</div>" +
			"<div><div class='mg-toc-h'>Moves by Category</div>" + list(cats) + "</div></div>";
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

	var draft = CAN_EDIT ? load(K_DRAFT, null) : null;
	fetch("./moveguide/move_guide.json").then(function (r) { return r.json(); }).then(function (d) {
		data = draft && draft.rows ? draft : d;
		dirty = !!(draft && draft.rows);
		var st = document.createElement("style"); st.textContent = data.css; document.head.appendChild(st);
		var defs = document.createElement("div"); defs.innerHTML = data.defs; document.body.appendChild(defs.firstChild);
		editTools();
		render();
	}).catch(function (e) { $("#mg-guide").innerHTML = "<div class='mg-loading'>Couldn't load the move guide (" + e + ").</div>"; });
})();
