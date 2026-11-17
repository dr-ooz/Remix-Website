/* THE stat color palette for the whole DoozDex site: one color per 10 base-stat
   points. Entry 0 = 0-9, 1 = 10-19, ... 24 = 240-249, 25 = 250 and up.
   Finalized by Dooz 2026-11-16 (40-99 retouched the same day). Only change when Dooz asks;
   there is no in-page color editor any more - edit this array.

   Used by: the boss guide (remix_bossguide.js), the DoozDex sidebar
   (doozdex-sidebar/alia/src/utils/constants.ts reads this file at build time),
   and any future site page that colors stats. Keep the array as plain JSON
   (double quotes, one line) - the sidebar build parses it. */
var REMIX_STAT_COLORS = ["#4f0303","#610505","#880707","#ae0909","#d14800","#e47c00","#f4b82b","#f4e42f","#f9ff00","#d0f300","#95e40c","#5cc70a","#227406","#11a608","#0bd97c","#00ffbe","#0acfb2","#00c7c9","#00b8ff","#00a7ff","#0082ff","#9500f3","#b400f3","#d700f3","#f300ce","#ff00e9"];

/* Color for a base stat value. */
function remixStatColor(v) {
	return REMIX_STAT_COLORS[Math.max(0, Math.min(REMIX_STAT_COLORS.length - 1, Math.floor((v || 0) / 10)))];
}
