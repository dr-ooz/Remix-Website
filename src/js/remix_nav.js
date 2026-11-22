// Top bar shared by every page: DoozDex logo (left), the site's sections, Ultra Remix logo (right).
// Live sections are links; the rest are greyed out until they're built (flip "live" when one is done).
var REMIX_NAV = [
	{label: "Battle HQ", href: "./", live: true, tip: "Damage calc, Trainer Rosters (boss guide), Trainer AI guides and player team layouts"},
	{label: "Move Guide", href: "./moveguide.html", live: true, tip: "Every move change, by type and by category"},
	{label: "PokéDex", tip: "Coming soon: every Pokémon change"},
	{label: "AbilityDex", tip: "Coming soon"},
	{label: "ItemDex", tip: "Coming soon"},
	{label: "Adventure HQ", tip: "Coming soon: walkthrough, progression, level caps, TM and item locations"},
	{label: "Features & QoL", tip: "Coming soon"},
	{label: "Art Gallery", tip: "Coming soon: showcase art and videos for every Doozian form"},
	{label: "Discord", href: "https://discord.com/invite/Wz9UYFFZhn", live: true, ext: true, tip: "Discord server"}
];
(function () {
	var nav = document.getElementById("rx-nav");
	if (!nav) return;
	var here = location.pathname.split("/").pop() || "index.html";
	var cur = function (h) { var f = h.replace("./", "") || "index.html"; return f === here || (f === "index.html" && here === ""); };
	var esc = function (s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/'/g, "&#39;"); };
	nav.innerHTML = "<div class='rx-nav'><a class='rx-nav-logo rx-nav-left' href='./' title='Remix DoozDex'><img src='./img/DoozDexLogo.png' alt='DoozDex'></a>" +
		"<div class='rx-nav-tabs'>" + REMIX_NAV.map(function (t) {
			if (!t.live) return "<span class='rx-tab rx-tab-soon' title='" + esc(t.tip) + "'>" + esc(t.label) + "<small>soon</small></span>";
			return "<a class='rx-tab" + (!t.ext && cur(t.href) ? " rx-tab-cur" : "") + "' href='" + esc(t.href) + "' title='" + esc(t.tip) + "'" +
				(t.ext ? " target='_blank' rel='noopener'" : "") + ">" + esc(t.label) + "</a>";
		}).join("") + "</div>" +
		"<a class='rx-nav-logo rx-nav-right' href='./' title='Pokémon Ultra Remix'><img src='./img/UltraRemixLogo.png' alt='Pokémon Ultra Remix'></a></div>";
})();
