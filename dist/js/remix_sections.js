// Page sections: "Damage Calc + AI Guides" and "Boss Guide" each have a header with a Hide button
// (remembered in this browser). "Player Team Layout" uses the boss guide's own show/hide (bgShowMine).
var RX_SEC_HIDDEN = {};
try { RX_SEC_HIDDEN = JSON.parse(localStorage.getItem("remixHiddenSections") || "{}") || {}; } catch (e) {}

// what each header hides
function rxSecParts(sec) {
	if (sec === "calc") {
		var head = $(".wrapper > .rx-sec[data-sec='calc']");
		return head.nextAll().not("#bg-row, script, style").add(".credits"); // the credits are the calc's
	}
	if (sec === "boss") return $("#bg-row > .bg-toolbar-slot, #boss-guide");
	return $();
}
function rxSecApply() {
	["calc", "boss"].forEach(function (sec) {
		var off = !!RX_SEC_HIDDEN[sec];
		rxSecParts(sec).toggleClass("rx-sec-off", off);
		$(".rx-sec[data-sec='" + sec + "'] .rx-sec-hide").text(off ? "Show" : "Hide");
		$(".rx-sec[data-sec='" + sec + "']").toggleClass("rx-sec-closed", off);
	});
	$(".bg-mine-bar").toggleClass("rx-sec-closed", typeof bgShowMine !== "undefined" && !bgShowMine);
}
$(document).on("click", ".rx-sec[data-sec] .rx-sec-hide", function () {
	var sec = $(this).closest(".rx-sec").attr("data-sec");
	RX_SEC_HIDDEN[sec] = !RX_SEC_HIDDEN[sec];
	try { localStorage.setItem("remixHiddenSections", JSON.stringify(RX_SEC_HIDDEN)); } catch (e) {}
	rxSecApply();
	$(window).trigger("resize"); // the calc columns / boss guide re-fit when they come back
});
// the boss guide row is (re)built by remixRenderBossGuide: re-apply after it runs
if (typeof remixRenderBossGuide === "function") {
	var rxRenderBossGuide0 = remixRenderBossGuide;
	remixRenderBossGuide = function () { rxRenderBossGuide0.apply(this, arguments); rxSecApply(); };
}
$(function () { rxSecApply(); setTimeout(rxSecApply, 500); });
