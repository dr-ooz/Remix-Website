// Edits to an imported set (item, ability, nature, level, EVs, IVs, moves) save back
// to that set, so they stick when you switch Pokemon or reload the page.
// Only imported/custom sets are touched; built-in sets are never changed.
var REMIX_SAVE_STATS = ["hp", "at", "df", "sa", "sd", "sp"];

function remixSaveSetRef(pokeObj) {
	var id = pokeObj.find("input.set-selector").val() || "";
	var open = id.indexOf(" (");
	if (open < 0) return null;
	return { species: id.substring(0, open), setName: id.substring(open + 2, id.lastIndexOf(")")) };
}

function remixSaveSet(pokeObj) {
	var ref = pokeObj.data("remixSaveRef");
	var now = remixSaveSetRef(pokeObj);
	// The panel changed to another set before the save ran: drop it.
	if (!ref || !now || ref.species !== now.species || ref.setName !== now.setName) return;
	var set = typeof setdex !== "undefined" && setdex[ref.species] && setdex[ref.species][ref.setName];
	if (!set || !set.isCustomSet) return;

	var saved = $.extend(true, {}, set);
	saved.level = ~~pokeObj.find(".level").val() || saved.level;
	saved.nature = pokeObj.find(".nature").val() || saved.nature;
	var ability = pokeObj.find("select.ability").val();
	if (ability !== undefined) saved.ability = ability;
	saved.item = pokeObj.find("select.item").val() || "";
	var tera = pokeObj.find(".teraType");
	if (tera.length && tera.is(":visible") && tera.val()) saved.teraType = tera.val();
	saved.evs = {}; saved.ivs = {};
	REMIX_SAVE_STATS.forEach(function (s) {
		var row = pokeObj.find("." + s);
		if (row.find(".evs").length) saved.evs[s] = ~~row.find(".evs").val();
		if (row.find(".ivs").length) saved.ivs[s] = ~~row.find(".ivs").val();
	});
	saved.moves = [];
	for (var i = 1; i <= 4; i++) {
		var m = pokeObj.find(".move" + i + " select.move-selector").val();
		if (m && m !== "(No Move)") saved.moves.push(m);
	}

	var customsets = {};
	try { customsets = JSON.parse(localStorage.customsets || "{}"); } catch (e) {}
	if (!customsets[ref.species]) customsets[ref.species] = {};
	customsets[ref.species][ref.setName] = saved;
	if (typeof updateDex === "function") updateDex(customsets);
	else localStorage.customsets = JSON.stringify(customsets);
	if (typeof remixMarkTeamHP === "function") remixMarkTeamHP();
	if (typeof remixUpdateDoublesAI === "function") remixUpdateDoublesAI(); // saved set changed
}

function remixIdKey(pokeObj) {
	var id = remixSaveSetRef(pokeObj);
	return id ? id.species + "|" + id.setName : "";
}

// Field changes right after the shown set changed are the calc loading it, not edits.
function remixStartLoading(pokeObj) {
	clearTimeout(pokeObj.data("remixSaveTimer"));
	pokeObj.data({ remixLoading: true, remixLastSet: remixIdKey(pokeObj) });
	clearTimeout(pokeObj.data("remixLoadTimer"));
	pokeObj.data("remixLoadTimer", setTimeout(function () {
		pokeObj.data({ remixLoading: false, remixLastSet: remixIdKey(pokeObj) });
	}, 600));
}

function remixQueueSave(pokeObj) {
	if (pokeObj.data("remixLastSet") !== remixIdKey(pokeObj)) { remixStartLoading(pokeObj); return; }
	if (pokeObj.data("remixLoading")) return;
	pokeObj.data("remixSaveRef", remixSaveSetRef(pokeObj));
	clearTimeout(pokeObj.data("remixSaveTimer"));
	pokeObj.data("remixSaveTimer", setTimeout(function () { remixSaveSet(pokeObj); }, 400));
}

$(function () {
	$(".poke-info").each(function () { $(this).data("remixLastSet", remixIdKey($(this))); });
	$(".poke-info").on("change", "input.set-selector", function () {
		remixStartLoading($(this).closest(".poke-info"));
	});
	$(".poke-info").on("change keyup",
		".level, .nature, select.ability, select.item, .evs, .ivs, select.move-selector, .teraType",
		function () { remixQueueSave($(this).closest(".poke-info")); });
});

// "Save Set" button next to your Pokemon search: saves whatever is in the panel (a Blank Set too) into
// your box ("My Box", where imported sets go), so it shows with your saved sets and team.
$(function () {
	setTimeout(function () {
		var p1 = $("#p1"), sel = p1.find(".select2-container.set-selector").first();
		if (!sel.length || $("#remix-saveset").length) return;
		var btn = $("<button type='button' id='remix-saveset' class='btn remix-saveset' title='Save this Pokemon to your box'>Save Set</button>");
		sel.after(btn);
		btn.on("click", function () {
			var ref = remixSaveSetRef(p1);
			if (!ref || !ref.species || typeof addToDex !== "function") return;
			var poke = { name: ref.species, nameProp: "My Box", isCustomSet: true, evs: {}, ivs: {}, moves: [],
				level: ~~p1.find(".level").val() || 100, nature: p1.find(".nature").val() || "Hardy",
				ability: p1.find("select.ability").val(), item: p1.find("select.item").val() || "" };
			REMIX_SAVE_STATS.forEach(function (s) {
				var row = p1.find("." + s);
				if (row.find(".evs").length) poke.evs[s] = ~~row.find(".evs").val();
				if (row.find(".ivs").length) poke.ivs[s] = ~~row.find(".ivs").val();
			});
			for (var i = 1; i <= 4; i++) {
				var m = p1.find(".move" + i + " select.move-selector").val();
				if (m && m !== "(No Move)") poke.moves.push(m);
			}
			addToDex(poke);
			btn.text("Saved!");
			setTimeout(function () { btn.text("Save Set"); }, 1500);
		});
	}, 600);
});
