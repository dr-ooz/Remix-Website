/* Local color editor (localhost only; the live site never shows it).
   A "Colors" button opens a panel for the 18 type colors and the 26 stat color bands. Every pick
   previews live on this page and in the DoozDex sidebar, in this browser only (localStorage
   "remixColorPreview"; js/remix_type_colors.js, js/remix_stat_colors.js and the sidebar read it).
   Nothing is saved to the site files until Dooz tells Claude to save the colors. */
(function () {
	if (!/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)) return;
	if (typeof REMIX_TYPE_COLORS === "undefined" || typeof REMIX_STAT_COLORS === "undefined") return;

	var KEY = "remixColorPreview";
	var TYPES = ["Normal", "Fire", "Water", "Electric", "Grass", "Ice", "Fighting", "Poison", "Ground",
		"Flying", "Psychic", "Bug", "Rock", "Ghost", "Dragon", "Dark", "Steel", "Fairy"];
	var tab = "types", sel = "Normal", selStat = 25, hsv = [0, 0, 1];

	// ---- color math ----
	function hexToRgb(h) { var n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
	function rgbToHex(c) { return "#" + c.map(function (v) { return ("0" + Math.max(0, Math.min(255, Math.round(v))).toString(16)).slice(-2); }).join(""); }
	function rgbToHsv(c) {
		var r = c[0] / 255, g = c[1] / 255, b = c[2] / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn, h = 0;
		if (d) h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
		return [(h * 60 + 360) % 360, mx ? d / mx : 0, mx];
	}
	function hsvToRgb(h, s, v) {
		function f(n) { var k = (n + h / 60) % 6; return (v - v * s * Math.max(0, Math.min(k, 4 - k, 1))) * 255; }
		return [f(5), f(3), f(1)];
	}

	// ---- state ----
	function cur() { return tab === "types" ? REMIX_TYPE_COLORS[sel] : REMIX_STAT_COLORS[selStat]; }
	function saved() { return tab === "types" ? REMIX_TYPE_COLORS_SAVED[sel] : REMIX_STAT_COLORS_SAVED[selStat]; }
	function changes() {
		var types = {}, nt = 0, ns = 0;
		TYPES.forEach(function (t) { if (REMIX_TYPE_COLORS[t] !== REMIX_TYPE_COLORS_SAVED[t]) { types[t] = REMIX_TYPE_COLORS[t]; nt++; } });
		REMIX_STAT_COLORS.forEach(function (c, i) { if (c !== REMIX_STAT_COLORS_SAVED[i]) ns++; });
		return { types: types, nt: nt, ns: ns };
	}
	function persist() {
		var c = changes();
		try {
			if (!c.nt && !c.ns) localStorage.removeItem(KEY);
			else localStorage.setItem(KEY, JSON.stringify({ types: c.types, stats: c.ns ? REMIX_STAT_COLORS.slice() : undefined }));
		} catch (e) {}
	}
	var sidebarTimer = null, guideTimer = null;
	function refreshPage(what) {
		if (what !== "stats") remixApplyTypeCss();
		clearTimeout(guideTimer);
		guideTimer = setTimeout(function () {
			if (typeof remixRenderBossGuide === "function" && $("#bg-row").is(":visible")) { try { remixRenderBossGuide(); } catch (e) {} }
		}, 150);
		clearTimeout(sidebarTimer);
		sidebarTimer = setTimeout(function () {
			var f = document.querySelector("#dz-panel iframe");
			if (f) { try { f.contentWindow.location.reload(); } catch (e) {} }
		}, 450);
	}
	function setColor(hex, keepWheel) {
		hex = hex.toLowerCase();
		if (tab === "types") REMIX_TYPE_COLORS[sel] = hex; else REMIX_STAT_COLORS[selStat] = hex;
		if (!keepWheel) hsv = rgbToHsv(hexToRgb(hex));
		persist(); refreshPage(tab); render(keepWheel);
	}

	// ---- UI ----
	$("head").append("<style>" +
		"#ce-btn{position:fixed;right:calc(12px + env(safe-area-inset-right,0px));bottom:calc(12px + env(safe-area-inset-bottom,0px));z-index:9000;" +
		"padding:7px 14px;border-radius:18px;border:1px solid #6a5a86;background:#2b2435;color:#fff;font-weight:bold;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.4)}" +
		"#ce-btn.has{background:#6a4fd8;border-color:#9d86ff}" +
		"#ce{position:fixed;right:calc(12px + env(safe-area-inset-right,0px));bottom:calc(56px + env(safe-area-inset-bottom,0px));z-index:9000;width:330px;max-width:calc(100vw - 24px);" +
		"max-height:calc(100vh - 80px);overflow:auto;background:#1e1a24;color:#f1edf7;border:1px solid #4a4058;border-radius:10px;padding:10px;" +
		"font:13px/1.35 Verdana,system-ui,sans-serif;box-shadow:0 6px 24px rgba(0,0,0,.5);display:none}" +
		"#ce.open{display:block}#ce *{box-sizing:border-box}" +
		"#ce .ce-tabs{display:flex;gap:4px;margin-bottom:8px}#ce button{font:inherit;cursor:pointer;color:#f1edf7;background:#2b2435;border:1px solid #4a4058;border-radius:6px;padding:4px 10px}" +
		"#ce button:hover{border-color:#9d86ff}#ce button[aria-pressed=true]{background:#3a2f55;border-color:#9d86ff;font-weight:bold}" +
		"#ce .ce-list{display:grid;grid-template-columns:repeat(3,1fr);gap:3px;margin-bottom:8px}" +
		"#ce .ce-item{display:flex;align-items:center;gap:5px;padding:3px 5px;border-radius:5px;background:#17141c;border:1px solid #3a3344;font-weight:bold;font-size:12px;cursor:pointer;min-width:0}" +
		"#ce .ce-item[aria-selected=true]{outline:2px solid #9d86ff}#ce .ce-item.ch::after{content:'\\2022';color:#f2b632;margin-left:auto}" +
		"#ce .ce-item i{width:12px;height:12px;border-radius:3px;flex:none}#ce .ce-item span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}" +
		"#ce .ce-pick{display:grid;grid-template-columns:150px 1fr;gap:10px;align-items:start}" +
		"#ce canvas{width:150px;height:150px;border-radius:50%;cursor:crosshair;touch-action:none;display:block}" +
		"#ce .ce-wheel{position:relative;width:150px;height:150px}#ce .ce-dot{position:absolute;width:12px;height:12px;margin:-6px 0 0 -6px;border-radius:50%;border:2px solid #fff;box-shadow:0 0 0 1px #000;pointer-events:none}" +
		"#ce input[type=range]{width:100%;margin:6px 0 0}#ce .ce-hex{width:100%;font:13px Consolas,monospace;padding:4px 6px;border:1px solid #4a4058;border-radius:5px;background:#17141c;color:#fff}" +
		"#ce .ce-side{display:grid;gap:6px}#ce .ce-cmp{display:flex;gap:4px}#ce .ce-cmp div{flex:1;height:30px;border-radius:5px;display:flex;align-items:center;justify-content:center;font-size:10px;color:#fff;text-shadow:0 1px 2px #000}" +
		"#ce .ce-name{font-weight:bold;font-size:15px}#ce .ce-foot{margin-top:8px;display:flex;flex-wrap:wrap;gap:6px;align-items:center;font-size:12px;color:#c9bfd8}" +
		"#ce .ce-note{width:100%;font-size:11.5px;color:#a59cb3}" +
		"</style>");
	var btn = $("<button type='button' id='ce-btn' title='Preview type and stat colors (only on your computer)'>Colors</button>").appendTo("body");
	var box = $("<div id='ce' role='dialog' aria-label='Color editor'></div>").appendTo("body");
	box.html(
		"<div class='ce-tabs'><button type='button' data-tab='types'>Types</button><button type='button' data-tab='stats'>Stat colors</button>" +
		"<button type='button' class='ce-x' style='margin-left:auto' aria-label='Close'>&times;</button></div>" +
		"<div class='ce-list'></div>" +
		"<div class='ce-pick'><div><div class='ce-wheel'><canvas width='300' height='300' aria-label='Color wheel'></canvas><div class='ce-dot'></div></div>" +
		"<input type='range' min='0' max='100' class='ce-val' aria-label='Brightness'></div>" +
		"<div class='ce-side'><div class='ce-name'></div><input class='ce-hex' maxlength='7' spellcheck='false' aria-label='Hex color'>" +
		"<div class='ce-cmp'><div class='ce-saved' title='Click to go back to the saved color'></div><div class='ce-now'></div></div>" +
		"<button type='button' class='ce-revert1'>Back to saved</button></div></div>" +
		"<div class='ce-foot'><span class='ce-count'></span><button type='button' class='ce-revert'>Undo all</button>" +
		"<div class='ce-note'>Previews show only in this browser. Tell Claude <b>save colors</b> to keep them site-wide.</div></div>");

	var cv = box.find("canvas")[0], ctx = cv.getContext("2d"), R = cv.width / 2;
	function drawWheel() {
		var img = ctx.createImageData(cv.width, cv.height), d = img.data;
		for (var y = 0; y < cv.height; y++) for (var x = 0; x < cv.width; x++) {
			var dx = x - R + 0.5, dy = y - R + 0.5, r = Math.sqrt(dx * dx + dy * dy), i = (y * cv.width + x) * 4;
			if (r > R) continue;
			var c = hsvToRgb((Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360, r / R, hsv[2]);
			d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = r > R - 1 ? 255 * (R - r) : 255;
		}
		ctx.putImageData(img, 0, 0);
	}
	function statLabel(i) { return i === 25 ? "250+" : (i * 10) + "-" + (i * 10 + 9); }
	var lastV = -1;
	function render(keepWheel) {
		box.find("[data-tab]").each(function () { this.setAttribute("aria-pressed", String(this.dataset.tab === tab)); });
		var list = box.find(".ce-list").empty();
		if (tab === "types") TYPES.forEach(function (t) {
			var c = REMIX_TYPE_COLORS[t];
			$("<div class='ce-item' role='option'></div>").attr({ "data-k": t, "aria-selected": String(t === sel) })
				.toggleClass("ch", c !== REMIX_TYPE_COLORS_SAVED[t])
				.append($("<i>").css("background", c), $("<span>").text(t).css("color", c)).appendTo(list);
		});
		else REMIX_STAT_COLORS.forEach(function (c, i) {
			$("<div class='ce-item' role='option'></div>").attr({ "data-k": i, "aria-selected": String(i === selStat) })
				.toggleClass("ch", c !== REMIX_STAT_COLORS_SAVED[i])
				.append($("<i>").css("background", c), $("<span>").text(statLabel(i)).css("color", c)).appendTo(list);
		});
		var c = cur(), s = saved();
		if (!keepWheel) hsv = rgbToHsv(hexToRgb(c));
		if (hsv[2] !== lastV) { drawWheel(); lastV = hsv[2]; }
		var a = hsv[0] * Math.PI / 180;
		box.find(".ce-dot").css({ left: (50 + Math.cos(a) * hsv[1] * 50) + "%", top: (50 + Math.sin(a) * hsv[1] * 50) + "%", background: c });
		var val = box.find(".ce-val").val(Math.round(hsv[2] * 100));
		val.css("background", "linear-gradient(to right,#000," + rgbToHex(hsvToRgb(hsv[0], hsv[1], 1)) + ")");
		box.find(".ce-name").text(tab === "types" ? sel : "Stats " + statLabel(selStat)).css("color", c);
		var hx = box.find(".ce-hex")[0]; if (document.activeElement !== hx) hx.value = c;
		box.find(".ce-saved").css("background", s).text("saved " + s);
		box.find(".ce-now").css("background", c).text(c === s ? "same" : "new " + c);
		box.find(".ce-revert1").prop("disabled", c === s);
		var ch = changes(), n = ch.nt + ch.ns;
		box.find(".ce-count").text(n ? n + " unsaved change" + (n > 1 ? "s" : "") : "No unsaved changes");
		btn.toggleClass("has", n > 0).text(n ? "Colors (" + n + ")" : "Colors");
	}

	btn.on("click", function () { box.toggleClass("open"); if (box.hasClass("open")) render(); });
	box.on("click", ".ce-x", function () { box.removeClass("open"); });
	box.on("click", "[data-tab]", function () { tab = this.dataset.tab; render(); });
	box.on("click", ".ce-item", function () { var k = this.dataset.k; if (tab === "types") sel = k; else selStat = +k; render(); });
	box.on("click", ".ce-revert1, .ce-saved", function () { setColor(saved()); });
	var undoArmed = null;
	box.on("click", ".ce-revert", function () {
		var b = $(this);
		if (!undoArmed) { b.text("Click again"); undoArmed = setTimeout(function () { undoArmed = null; b.text("Undo all"); }, 3000); return; }
		clearTimeout(undoArmed); undoArmed = null; b.text("Undo all");
		TYPES.forEach(function (t) { REMIX_TYPE_COLORS[t] = REMIX_TYPE_COLORS_SAVED[t]; });
		REMIX_STAT_COLORS_SAVED.forEach(function (c, i) { REMIX_STAT_COLORS[i] = c; });
		persist(); refreshPage(); render();
	});
	box.on("input", ".ce-hex", function () {
		var v = this.value.trim(); if (v[0] !== "#") v = "#" + v;
		if (/^#[0-9a-f]{6}$/i.test(v)) setColor(v);
	});
	box.on("blur", ".ce-hex", function () { this.value = cur(); });
	box.on("input", ".ce-val", function () { hsv = [hsv[0], hsv[1], this.value / 100]; setColor(rgbToHex(hsvToRgb(hsv[0], hsv[1], hsv[2])), true); });
	function fromPointer(e) {
		var b = cv.getBoundingClientRect(), dx = e.clientX - b.left - b.width / 2, dy = e.clientY - b.top - b.height / 2;
		hsv = [(Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360, Math.min(1, Math.sqrt(dx * dx + dy * dy) / (b.width / 2)), hsv[2]];
		setColor(rgbToHex(hsvToRgb(hsv[0], hsv[1], hsv[2])), true);
	}
	cv.addEventListener("pointerdown", function (e) { cv.setPointerCapture(e.pointerId); fromPointer(e); });
	cv.addEventListener("pointermove", function (e) { if (cv.hasPointerCapture(e.pointerId)) fromPointer(e); });
	render();
})();
