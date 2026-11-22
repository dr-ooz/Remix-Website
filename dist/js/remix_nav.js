// Top bar shared by every page: DoozDex logo (far left), the site's sections, Ultra Remix logo (far right).
// Live sections are links; the rest are greyed out until they're built (flip "live" when one is done).
// blurb: a short line under the tab (empty for now; fill them in later).
var REMIX_NAV = [
	{label: "Art Gallery", tip: "Coming soon: showcase art and videos for every Doozian form", blurb: ""},
	{label: "PokéDex", tip: "Coming soon: every Pokémon change", blurb: ""},
	{label: "MoveDex", href: "./moveguide.html", live: true, tip: "Every move change, by type and by category", blurb: ""},
	{label: "AbilityDex", tip: "Coming soon", blurb: ""},
	{label: "ItemDex", tip: "Coming soon", blurb: ""},
	{label: "Battle HQ", href: "./", live: true, tip: "Damage calc, Trainer Rosters (boss guide), Trainer AI guides and player team layouts", blurb: ""},
	{label: "Adventure HQ", tip: "Coming soon: walkthrough, progression, level caps, TM and item locations", blurb: ""},
	{label: "Features & QoL", tip: "Coming soon", blurb: ""},
	{label: "Discord", href: "https://discord.com/invite/Wz9UYFFZhn", live: true, ext: true, tip: "Discord server", blurb: ""}
];
(function () {
	var nav = document.getElementById("rx-nav");
	if (!nav) return;
	var here = location.pathname.split("/").pop() || "index.html";
	var cur = function (h) { var f = h.replace("./", "") || "index.html"; return f === here || (f === "index.html" && here === ""); };
	var esc = function (s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/'/g, "&#39;"); };
	nav.innerHTML = "<div class='rx-nav'><a class='rx-nav-logo rx-nav-left' href='./' title='Remix DoozDex'><img src='./img/DoozDexLogo.png' alt='DoozDex'></a>" +
		"<div class='rx-nav-tabs'>" + REMIX_NAV.map(function (t) {
			var tab = !t.live ? "<span class='rx-tab rx-tab-soon' title='" + esc(t.tip) + "'>" + esc(t.label) + "<small>soon</small></span>" :
				"<a class='rx-tab" + (!t.ext && cur(t.href) ? " rx-tab-cur" : "") + "' href='" + esc(t.href) + "' title='" + esc(t.tip) + "'" +
				(t.ext ? " target='_blank' rel='noopener'" : "") + ">" + esc(t.label) + "</a>";
			return "<div class='rx-tabcol'>" + tab + "<div class='rx-tab-blurb'>" + esc(t.blurb || "") + "</div></div>";
		}).join("") + "</div>" +
		"<a class='rx-nav-logo rx-nav-right' href='./' title='Pokémon Ultra Remix'><img src='./img/UltraRemixLogo.png' alt='Pokémon Ultra Remix'></a></div>";
})();

// The bar stays reachable: it slides away while you scroll down (reading) and comes back, slimmer, as soon as you scroll up.
(function () {
	var nav = document.getElementById("rx-nav");
	if (!nav) return;
	var lastY = window.scrollY, ticking = false;
	function update() {
		ticking = false;
		var y = window.scrollY, past = y > nav.offsetHeight + 40;
		document.body.classList.toggle("rx-nav-pinned", past);
		if (!past) nav.classList.remove("rx-nav-away");
		else if (y > lastY + 4) nav.classList.add("rx-nav-away");     // scrolling down: out of the way
		else if (y < lastY - 4) nav.classList.remove("rx-nav-away");  // scrolling up: back
		lastY = y;
	}
	window.addEventListener("scroll", update, {passive: true}); // cheap: a couple of class toggles
})();
