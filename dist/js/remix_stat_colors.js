/* THE stat color palette for the whole DoozDex site: one color per 10 base-stat
   points. Entry 0 = 0-9, 1 = 10-19, ... 24 = 240-249, 25 = 250 and up.
   Finalized by Dooz 2026-11-16 (40-99 retouched the same day); 110-209 re-paced 2026-11-17,
   and everything from 200 up is one color. Only change when Dooz asks;
   on localhost the Colors button (js/remix_color_editor.js) previews changes; saving them edits this array.

   Used by: the boss guide (remix_bossguide.js), the DoozDex sidebar
   (doozdex-sidebar/alia/src/utils/constants.ts reads this file at build time),
   and any future site page that colors stats. Keep the array as plain JSON
   (double quotes, one line) - the sidebar build parses it. */
var REMIX_STAT_COLORS = ["#4f0303","#610505","#880707","#ae0909","#d14800","#e47c00","#f4b82b","#f4e42f","#f9ff00","#d0f300","#95e40c","#5cc70a","#3eb609","#11a608","#00bf70","#009c68","#1fddb8","#00c2ae","#4afffb","#00e4e8","#59ffff","#59ffff","#59ffff","#59ffff","#59ffff","#59ffff"];

/* Local color editor preview (only on localhost): stat colors not saved yet, in this browser only. */
var REMIX_STAT_COLORS_SAVED = REMIX_STAT_COLORS.slice();
(function () {
	if (!/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)) return;
	var p = null;
	try { p = JSON.parse(localStorage.getItem("remixColorPreview") || "null"); } catch (e) {}
	if (p && Array.isArray(p.stats) && p.stats.length === REMIX_STAT_COLORS.length) REMIX_STAT_COLORS.splice(0, p.stats.length, ...p.stats);
})();

/* Color for a base stat value. */
function remixStatColor(v) {
	return REMIX_STAT_COLORS[Math.max(0, Math.min(REMIX_STAT_COLORS.length - 1, Math.floor((v || 0) / 10)))];
}
