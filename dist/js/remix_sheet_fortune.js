// Sheet data <-> FortuneSheet (the dev-only Google-Sheets-style editor in src/sheet-editor/).
// Any page drawn from sheet data ({cols, css, rows: [{k, h, c: [[cls, colspan, rowspan, html, extra]], ...}]}) can use it:
//   var fs = RemixSheetFortune.toFortune(data, {rowH, name})  -> [sheet] for RemixFortune.open
//   RemixSheetFortune.fromFortune(sheets[0], data, fs.memo)    -> writes the edits back into data (rows + cols)
// The last column (⚙) holds each row's type and settings ("k=h1 | cat=Pivot Moves | rid=12"), so headers,
// dropdowns and contents links survive edits. Cells you didn't change keep their exact original HTML.
var RemixSheetFortune = (function () {
	var parser = new DOMParser();

	function parseDecl(txt) {
		var o = {};
		String(txt || "").split(";").forEach(function (d) {
			var i = d.indexOf(":"); if (i < 0) return;
			o[d.slice(0, i).trim().toLowerCase()] = d.slice(i + 1).trim();
		});
		return o;
	}
	function classMap(css) {
		var m = {};
		String(css).replace(/\.mg \.([a-z]\d+)\{([^}]*)\}/g, function (a, k, b) { m[k] = parseDecl(b); });
		return m;
	}
	function toHex(c) {
		if (!c) return null;
		c = c.trim().toLowerCase();
		if (/^#[0-9a-f]{6}$/.test(c)) return c;
		if (/^#[0-9a-f]{3}$/.test(c)) return "#" + c[1] + c[1] + c[2] + c[2] + c[3] + c[3];
		var m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(c);
		return m ? "#" + [m[1], m[2], m[3]].map(function (v) { return ("0" + (+v).toString(16)).slice(-2); }).join("") : null;
	}
	// css declarations -> FortuneSheet style keys
	function fStyle(d, into) {
		var o = into || {};
		if (d["background-color"]) { var bg = toHex(d["background-color"]); if (bg) o.bg = bg; }
		if (d.color) { var fc = toHex(d.color); if (fc) o.fc = fc; }
		if (d["font-family"]) o.ff = d["font-family"].split(",")[0].replace(/['"]/g, "").trim();
		if (d["font-size"]) { var n = parseFloat(d["font-size"]); if (n) o.fs = /px/.test(d["font-size"]) ? Math.round(n * 0.75 * 10) / 10 : n; }
		if (d["font-weight"]) o.bl = /bold|[6-9]00/.test(d["font-weight"]) ? 1 : 0;
		if (d["font-style"]) o.it = /italic/.test(d["font-style"]) ? 1 : 0;
		var td = d["text-decoration"] || d["text-decoration-line"];
		if (td) { o.cl = /line-through/.test(td) ? 1 : 0; o.un = /underline/.test(td) ? 1 : 0; }
		if (d["text-align"]) o.ht = {center: 0, left: 1, right: 2}[d["text-align"]];
		if (d["vertical-align"]) o.vt = {middle: 0, top: 1, bottom: 2}[d["vertical-align"]];
		if (d["white-space"]) o.tb = /normal|pre-wrap/.test(d["white-space"]) ? "2" : "1";
		return o;
	}
	var ST2CSS = function (st) {
		var d = {};
		if (!st) return d;
		if (st.bg) d["background-color"] = st.bg;
		if (st.color) d.color = st.color;
		if (st.ff) d["font-family"] = st.ff;
		if (st.fs) d["font-size"] = st.fs + "pt";
		if (st.b != null) d["font-weight"] = st.b ? "bold" : "normal";
		if (st.i != null) d["font-style"] = st.i ? "italic" : "normal";
		if (st.u || st.s) d["text-decoration"] = (st.u ? "underline " : "") + (st.s ? "line-through" : "");
		if (st.al) d["text-align"] = st.al;
		if (st.va) d["vertical-align"] = st.va;
		return d;
	};
	var RUN_KEYS = ["ff", "fc", "fs", "bl", "it", "cl", "un"];

	// a cell's html -> text runs with their own styles (br -> new line, images -> a placeholder)
	function runs(html, base, cls) {
		var out = [], doc = parser.parseFromString("<div>" + html + "</div>", "text/html"), img = null;
		(function walk(node, st) {
			Array.prototype.forEach.call(node.childNodes, function (n) {
				if (n.nodeType === 3) { if (n.nodeValue) out.push({v: n.nodeValue, st: st}); return; }
				if (n.nodeType !== 1) return;
				var t = n.tagName, s2 = Object.assign({}, st);
				if (t === "BR") { out.push({v: "\n", st: st}); return; }
				if (t === "IMG") { img = img || n.getAttribute("alt") || "image"; out.push({v: "🖼 " + (n.getAttribute("alt") || "image"), st: st}); return; }
				if (n.classList) n.classList.forEach(function (k) { if (cls[k]) fStyle(cls[k], s2); });
				if (n.getAttribute("style")) fStyle(parseDecl(n.getAttribute("style")), s2);
				if (t === "B" || t === "STRONG") s2.bl = 1;
				if (t === "I" || t === "EM") s2.it = 1;
				if (t === "U") s2.un = 1;
				if (t === "S" || t === "STRIKE") s2.cl = 1;
				if (t === "FONT") { if (n.getAttribute("color")) s2.fc = toHex(n.getAttribute("color")) || s2.fc; if (n.getAttribute("face")) s2.ff = n.getAttribute("face"); }
				walk(n, s2);
			});
		})(doc.body.firstChild, base);
		return {runs: out, img: img};
	}
	function sameRunStyle(a, b) { return RUN_KEYS.every(function (k) { return (a[k] || 0) === (b[k] || 0); }); }

	function toFortune(data, o) {
		o = o || {};
		var cls = classMap(data.css), ncol = data.cols.length, celldata = [], merge = {}, rowlen = {}, columnlen = {};
		var memo = {rows: {}, ncol: ncol, cls: cls};
		data.cols.forEach(function (w, x) { columnlen[x] = w; });
		columnlen[ncol] = 260;
		var taken = {};
		data.rows.forEach(function (r, y) {
			rowlen[y] = o.rowH ? o.rowH(r) : r.h;
			var x = 0, mrow = memo.rows[y] = {cells: {}, h: rowlen[y]};
			r.c.forEach(function (c, j) {
				while (taken[y + ":" + x]) x++;
				var cs = c[1] || 1, rs = c[2] || 1;
				for (var a = 0; a < rs; a++) for (var b = 0; b < cs; b++) taken[(y + a) + ":" + (x + b)] = 1;
				var base = fStyle(cls[c[0]] || {});
				fStyle(ST2CSS(c[4] && c[4].st), base);
				var rr = runs(c[3], base, cls), v = {};
				["bg", "ht", "vt", "tb"].forEach(function (k) { if (base[k] != null) v[k] = base[k]; });
				RUN_KEYS.forEach(function (k) { if (base[k] != null) v[k] = base[k]; });
				var text = rr.runs.map(function (q) { return q.v; }).join("");
				if (rr.runs.length > 1 && !rr.runs.every(function (q) { return sameRunStyle(q.st, base); })) {
					v.ct = {fa: "General", t: "inlineStr", s: rr.runs.map(function (q) {
						var s = {v: q.v}; RUN_KEYS.forEach(function (k) { if (q.st[k] != null) s[k] = q.st[k]; }); return s;
					})};
				} else { v.v = text; v.m = text; v.ct = {fa: "General", t: "g"}; }
				if (rr.img && rr.runs.length === 1) { v.fs = 10; v.ff = "Arial"; v.fc = "#888888"; } // an image (logo / category icon): small placeholder, kept as is
				if (cs > 1 || rs > 1) { v.mc = {r: y, c: x, rs: rs, cs: cs}; merge[y + "_" + x] = {r: y, c: x, rs: rs, cs: cs}; }
				celldata.push({r: y, c: x, v: v});
				mrow.cells[x] = {j: j, sig: sig(v), cs: cs, rs: rs};
				x += cs;
			});
			celldata.push({r: y, c: ncol, v: {v: metaText(r, y, memo), m: metaText(r, y, memo), fs: 9, fc: "#555555", bg: "#f3f0f7", ct: {fa: "General", t: "g"}}});
		});
		// covered cells of merges
		Object.keys(merge).forEach(function (k) {
			var m = merge[k];
			for (var a = 0; a < m.rs; a++) for (var b = 0; b < m.cs; b++) if (a || b) celldata.push({r: m.r + a, c: m.c + b, v: {mc: {r: m.r, c: m.c}}});
		});
		return {sheets: [{name: o.name || "Sheet", id: "s1", status: 1, order: 0, row: data.rows.length + 40, column: ncol + 2,
			celldata: celldata, config: {merge: merge, rowlen: rowlen, columnlen: columnlen}}], memo: memo};
	}
	function sig(v) {
		if (!v) return "";
		var t = v.ct && v.ct.t === "inlineStr" ? JSON.stringify(v.ct.s) : String(v.v == null ? "" : v.v);
		return t + "|" + ["bg", "ht", "vt", "tb"].concat(RUN_KEYS).map(function (k) { return v[k] == null ? "" : v[k]; }).join(",");
	}
	function metaText(r, y, memo) {
		var p = ["rid=" + y, "k=" + r.k];
		if (r.zone) p.push("zone=" + r.zone);
		if (r.cat) p.push("cat=" + r.cat);
		if (r.special) p.push("special=" + r.special);
		if (r.endSection) p.push("end=1");
		if (r.hSet) p.push("hset=1");
		return p.join(" | ");
	}
	function parseMeta(t) {
		var o = {};
		String(t || "").split("|").forEach(function (p) { var i = p.indexOf("="); if (i > 0) o[p.slice(0, i).trim()] = p.slice(i + 1).trim(); });
		return o;
	}
	function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
	function runHtml(s) {
		var d = [];
		if (s.fc) d.push("color:" + s.fc);
		if (s.fs) d.push("font-size:" + s.fs + "pt");
		if (s.ff) d.push("font-family:" + s.ff);
		d.push("font-weight:" + (s.bl ? "bold" : "normal"));
		d.push("font-style:" + (s.it ? "italic" : "normal"));
		d.push("text-decoration:" + ((s.un ? "underline " : "") + (s.cl ? "line-through" : "") || "none"));
		return esc(s.v || "").split("\n").map(function (part) { return part ? "<span style=\"" + d.join(";") + "\">" + part + "</span>" : ""; }).join("<br>");
	}

	function fromFortune(sheet, data, memo) {
		var ncol = memo.ncol, cfg = sheet.config || {}, merge = cfg.merge || {}, grid = sheet.data;
		if (!grid) { // fall back to celldata
			grid = [];
			(sheet.celldata || []).forEach(function (q) { (grid[q.r] = grid[q.r] || [])[q.c] = q.v; });
		}
		var old = data.rows, rows = [], lastZone = null;
		for (var y = 0; y < grid.length; y++) {
			var line = grid[y] || [], metaCell = line[ncol], meta = parseMeta(metaCell && (metaCell.v != null ? metaCell.v : metaCell.m));
			var hasContent = line.slice(0, ncol).some(function (v) { return v && (v.v != null && v.v !== "" || v.ct && v.ct.s || v.mc); });
			if (meta.rid == null && !hasContent) continue; // the empty rows FortuneSheet adds at the bottom
			var rid = meta.rid != null ? +meta.rid : -1, orow = old[rid], mrow = memo.rows[rid];
			var row = {k: meta.k || "row", h: (cfg.rowlen && cfg.rowlen[y]) || (orow ? orow.h : 21), c: []};
			if (meta.zone) row.zone = meta.zone; else if (!meta.k && lastZone && lastZone !== "body") row.zone = lastZone;
			if (meta.cat) row.cat = meta.cat;
			if (meta.special) row.special = meta.special;
			if (meta.end) row.endSection = true;
			if (meta.hset || (mrow && cfg.rowlen && cfg.rowlen[y] != null && Math.round(cfg.rowlen[y]) !== Math.round(mrow.h))) { row.hSet = 1; row.h = Math.round(cfg.rowlen[y]); }
			else if (orow) row.h = orow.h;
			lastZone = row.zone || (row.k === "intro" || row.k === "toc" ? row.k : "body");
			for (var x = 0; x < ncol; x++) {
				var v = line[x];
				if (v && v.mc && !(v.mc.r === y && v.mc.c === x)) continue; // covered by a merge
				var m = merge[y + "_" + x], cs = m ? m.cs : 1, rs = m ? m.rs : 1;
				var om = mrow && mrow.cells[x], oc = om && orow ? orow.c[om.j] : null;
				// unchanged: keep the original cell exactly
				if (oc && om.cs === cs && om.rs === rs && om.sig === sig(stripMc(v))) { row.c.push(oc); continue; }
				if (!v && !oc) { row.c.push([nearCls(orow, x, memo), cs, rs, ""]); continue; }
				row.c.push(newCell(v || {}, oc, cs, rs, orow, x, memo));
			}
			rows.push(row);
		}
		data.rows = rows;
		data.cols = data.cols.map(function (w, x) { return Math.round((cfg.columnlen && cfg.columnlen[x]) || w); });
	}
	function stripMc(v) { if (!v) return v; var o = Object.assign({}, v); if (o.mc) { o = Object.assign({}, o); delete o.mc; } return o; }
	function nearCls(orow, x, memo) { return orow && orow.c.length ? orow.c[Math.min(orow.c.length - 1, 0)][0] : ""; }
	function newCell(v, oc, cs, rs, orow, x, memo) {
		var cls = oc ? oc[0] : nearCls(orow, x, memo), st = {}, html;
		if (v.bg) st.bg = v.bg;
		if (v.ht != null) st.al = ["center", "left", "right"][v.ht];
		if (v.vt != null) st.va = ["middle", "top", "bottom"][v.vt];
		var rich = v.ct && v.ct.t === "inlineStr" && v.ct.s;
		if (rich) html = v.ct.s.map(runHtml).join("");
		else {
			var t = String(v.v == null ? (v.m == null ? "" : v.m) : v.v);
			var img = oc && /<img/.test(oc[3]) && /^🖼/.test(t);
			if (img) html = oc[3];
			else {
				html = esc(t).replace(/\n/g, "<br>");
				if (v.fc) st.color = v.fc;
				if (v.ff) st.ff = v.ff;
				if (v.fs) st.fs = v.fs;
				if (v.bl != null) st.b = !!v.bl;
				if (v.it != null) st.i = !!v.it;
				if (v.un) st.u = true;
				if (v.cl) st.s = true;
			}
		}
		var extra = Object.assign({}, oc && oc[4] || {});
		extra.st = st;
		return [cls, cs, rs, html, extra];
	}
	return {toFortune: toFortune, fromFortune: fromFortune};
})();
