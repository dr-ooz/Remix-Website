/* THE type color palette for the whole DoozDex site: one color per type. Picked by Dooz with the
   type color picker (2026-11-16/17). Everything that colors a type reads this file:
   - the calc: type pills + their dropdown lists, colored move buttons, type chart tiles, boss guide
     (all from the stylesheet remixApplyTypeCss() writes below);
   - the DoozDex sidebar (doozdex-sidebar/alia/src/utils/constants.ts reads this file at build time).
   Keep REMIX_TYPE_COLORS one line of plain JSON (double quotes): the sidebar build parses it.
   Gradients (pills, buttons) run from 30% toward white at the top down to the color itself. */
var REMIX_TYPE_COLORS = {"Normal": "#c7c9be", "Fire": "#f56d00", "Water": "#6dbdf2", "Electric": "#ffcc16", "Grass": "#7dc45d", "Ice": "#b1f7ff", "Fighting": "#d64e2e", "Poison": "#c25290", "Ground": "#c78c11", "Flying": "#96b5ff", "Psychic": "#f07cd6", "Bug": "#b7c955", "Rock": "#d9c077", "Ghost": "#b78bee", "Dragon": "#6062ff", "Dark": "#8c5b5b", "Steel": "#798b94", "Fairy": "#fbbeec"};

/* Local color editor preview (only on localhost): picks not saved yet override the colors above,
   in this browser only. The live site never reads them. */
var REMIX_COLOR_PREVIEW = null;
var REMIX_TYPE_COLORS_SAVED = JSON.parse(JSON.stringify(REMIX_TYPE_COLORS));
(function () {
	if (!/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)) return;
	try { REMIX_COLOR_PREVIEW = JSON.parse(localStorage.getItem("remixColorPreview") || "null"); } catch (e) {}
	var p = REMIX_COLOR_PREVIEW && REMIX_COLOR_PREVIEW.types;
	if (p) for (var t in p) if (t in REMIX_TYPE_COLORS && /^#[0-9a-f]{6}$/i.test(p[t])) REMIX_TYPE_COLORS[t] = p[t];
})();

function remixMixHex(hex, to, f) {
	var a = parseInt(hex.slice(1), 16), b = parseInt(to.slice(1), 16);
	return "#" + [16, 8, 0].map(function (s) {
		var x = a >> s & 255, y = b >> s & 255;
		return ("0" + Math.round(x + (y - x) * f).toString(16)).slice(-2);
	}).join("");
}
function remixTypeTop(hex) { return remixMixHex(hex, "#ffffff", 0.3); }

/* Text on a type-colored box (boss guide moves and types): the same hue, much darker and a bit
   more saturated, so it reads on its own color. HSL: lightness x0.36, saturation x1.25 + 10 points. */
// Types whose dark text needs to be lighter to read well on their own color (lightness factor)
var REMIX_TYPE_TEXT_LIGHT = { Flying: 0.5, Dragon: 0.56 };
function remixTypeText(hex, type) {
	var n = parseInt(hex.slice(1), 16), r = (n >> 16 & 255) / 255, g = (n >> 8 & 255) / 255, b = (n & 255) / 255;
	var mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn, h = 0, s = 0;
	if (d) {
		s = d / (1 - Math.abs(2 * l - 1));
		h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
		h = (h * 60 + 360) % 360;
	}
	l *= REMIX_TYPE_TEXT_LIGHT[type] || 0.36; s = Math.min(1, s * 1.25 + 0.1);
	var c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2;
	var rgb = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
	return "#" + rgb.map(function (v) { return ("0" + Math.round((v + m) * 255).toString(16)).slice(-2); }).join("");
}

/* Boss guide only: types whose move/type boxes get extra saturation there (HSL points). */
var REMIX_BOSSGUIDE_SAT = { Fighting: 0.15 };
function remixSaturate(hex, add) {
	var n = parseInt(hex.slice(1), 16), r = (n >> 16 & 255) / 255, g = (n >> 8 & 255) / 255, b = (n & 255) / 255;
	var mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn, h = 0, s = 0;
	if (d) { s = d / (1 - Math.abs(2 * l - 1)); h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h = (h * 60 + 360) % 360; }
	s = Math.min(1, s + add);
	var c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2;
	var rgb = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
	return "#" + rgb.map(function (v) { return ("0" + Math.round((v + m) * 255).toString(16)).slice(-2); }).join("");
}

/* One stylesheet for every type-colored thing in the calc; rerun it after a color changes. */
function remixApplyTypeCss() {
	var css = "";
	function bgGrad(c, sat) {
		if (sat) c = remixSaturate(c, sat);
		return "linear-gradient(to bottom, " + (sat ? remixSaturate(remixTypeTop(c), sat) : remixTypeTop(c)) + ", " + c + ")";
	}
	for (var t in REMIX_TYPE_COLORS) {
		var c = REMIX_TYPE_COLORS[t], g = "linear-gradient(to bottom, " + remixTypeTop(c) + ", " + c + ")";
		css += "select.type-pill.type-" + t + "{background:" + g + "}" +
			"select.type-pill option[value=\"" + t + "\"]{background:" + c + ";color:#fff}" +
			".btn.result-typed.type-" + t + ",body.dark .btn.result-typed.type-" + t + "{background:" + g + "}" +
			".tc-cell[data-type=\"" + t + "\"] .tc-tile{background:" + c + "}" +
			".bg-t-" + t + "{background:" + bgGrad(c, REMIX_BOSSGUIDE_SAT[t]) + ";color:" + remixTypeText(c, t) + "}\n";
	}
	var el = document.getElementById("remix-type-css");
	if (!el) { el = document.createElement("style"); el.id = "remix-type-css"; document.head.appendChild(el); }
	el.textContent = css;
}
remixApplyTypeCss();
