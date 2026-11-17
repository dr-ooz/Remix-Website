// Calc layout tweaks:
// - "+1 All Stats" / "+2 All Stats" field rows hidden (CSS); a "+1 All" toggle sits on each Pokemon's HP row.
// - "Team Previews" note at the bottom of the Field column; the 3 calc columns are kept the same height.
// - Import / Export: only the 3 buttons stay; the text box opens in a small window.
// - Doubles AI calc opens as a closable window over the page (remix_doubles_panel.js).
(function () {
	// "+1 all" toggle on each Pokemon's HP row (where there's no stage box): on = +1 to every stat stage, off = takes it back
	function addBoostButtons() {
		["#p1", "#p2"].forEach(function (p) {
			var cell = $(p + " tr.hp > td").last();
			if (!cell.length || cell.find(".rf-allbtn").length) return;
			cell.append("<button type='button' class='rf-allbtn' title='Toggle +1 to every stat stage'>+1 All</button>");
		});
	}
	$(document).on("click", ".rf-allbtn", function () {
		var on = !$(this).hasClass("on"), info = $(this).closest(".poke-info");
		$(this).toggleClass("on", on);
		info.find("tr select.boost").each(function () {
			$(this).val(String(Math.max(-6, Math.min(6, (+$(this).val() || 0) + (on ? 1 : -1)))));
		});
		info.find("tr select.boost").last().change();
	});
	// a new Pokemon loaded on that side starts with the toggle off
	$(document).on("change", "input.set-selector", function () { $(this).closest(".poke-info").find(".rf-allbtn").removeClass("on"); });

	// ---- small windows ----
	function modal(id, title) {
		var m = $("#" + id);
		if (m.length) return m;
		m = $("<div class='remix-modal' id='" + id + "'><div class='remix-modal-box'><div class='remix-modal-head'><span class='remix-modal-title'>" +
			title + "</span><button type='button' class='remix-modal-x' title='Close'>&times;</button></div><div class='remix-modal-body'></div></div></div>");
		$("body").append(m);
		return m;
	}
	$(document).on("click", ".remix-modal-x", function () { $(this).closest(".remix-modal").hide(); });
	$(document).on("mousedown", ".remix-modal", function (e) { if (e.target === this) $(this).hide(); });
	$(document).on("keydown", function (e) { if (e.key === "Escape") $(".remix-modal:visible").hide(); });

	var importing = false;
	function setupImportWindow() {
		var form = $("form.import-team"), row = $(".import-export-row");
		if (!form.length || !row.length || $("#remix-io").length) return false;
		var m = modal("remix-io", "Import / Export");
		m.find(".remix-modal-body").append(form,
			"<div class='remix-io-actions'><button type='button' class='remix-io-go'>Import these sets</button>" +
			"<span class='remix-io-hint'>Paste a PKHeX / Showdown export, or copy the export above.</span></div>");
		row.addClass("rf-io-row").appendTo($(".field-info"));
		$(".poke-import").hide();
		// The original Import button reads the text box: open the window first, import from inside it.
		document.getElementById("import").addEventListener("click", function (e) {
			if (importing) return;
			e.stopImmediatePropagation(); e.preventDefault();
			m.find(".remix-modal-title").text("Import sets");
			m.find(".remix-io-go, .remix-io-hint").show();
			form.find("textarea").val("");
			m.show(); form.find("textarea").focus();
		}, true);
		m.on("click", ".remix-io-go", function () {
			importing = true;
			try { $("#import").trigger("click"); } finally { importing = false; }
			m.hide();
		});
		$("#exportL, #exportAll").on("click", function () {
			setTimeout(function () {
				m.find(".remix-modal-title").text("Export (copy this)");
				m.find(".remix-io-go").hide();
				m.show(); form.find("textarea").select();
			}, 0);
		});
		return true;
	}

	$(function () {
		setTimeout(function () {
			$("#StatBoostL, #StatBoostR, #StatBoost2L, #StatBoost2R").prop("checked", false);
			addBoostButtons();
			var tries = 0, t = setInterval(function () { if (setupImportWindow() || ++tries > 40) clearInterval(t); }, 50);
		}, 60);
	});
})();

$(function () {
	// "Remaining" -> "Remaining EVs"
	$(".poke-info th label").filter(function () { return $(this).text().trim() === "Remaining"; }).text("Remaining EVs");
});

// select2 dropdowns live outside the zoomed calc: give them the same zoom and keep them under their box.
(function () {
	var raf = 0;
	function place() {
		raf = 0;
		var drop = document.querySelector(".select2-drop-active"), w = document.querySelector(".wrapper");
		if (!drop || !w) return;
		var z = parseFloat(w.style.zoom) || 1, box = document.querySelector(".select2-container-active, .select2-dropdown-open");
		if (z === 1 || !box) { drop.style.zoom = ""; return; }
		var r = box.getBoundingClientRect(), above = drop.classList.contains("select2-drop-above");
		drop.style.zoom = z;
		drop.style.width = (r.width / z) + "px";
		drop.style.left = ((r.left + window.scrollX) / z) + "px";
		drop.style.top = (above ? (r.top + window.scrollY) / z - drop.offsetHeight : (r.bottom + window.scrollY) / z) + "px";
		raf = requestAnimationFrame(place);
	}
	$(document).on("select2-open", function () { if (!raf) raf = requestAnimationFrame(place); });
})();

// "Team Previews" note in the empty space at the bottom of the Field column
$(function () {
	setTimeout(function () {
		if ($(".rf-tp").length) return;
		$(".field-info").append("<div class='rf-tp'><div class='rf-tp-head'>Team Previews</div>" +
			"<div class='rf-tp-text'>Placeholder: how the boss guide works will be explained here. Turn on " +
			"<b>Detailed Team Layout</b> (top bar) to see the boss's full team and yours below the calc.</div></div>");
	}, 120);
});

// Keep the 3 calc columns the same height (the Field column stretches to match the Pokemon panels)
(function () {
	var busy = false;
	function equalize() {
		if (busy) return;
		busy = true;
		var sets = $(".wrapper > .panel > fieldset, .wrapper > .panel > div > fieldset").filter(":visible");
		sets.css("min-height", "");
		var panels = $(".wrapper > .panel:visible"), maxH = 0;
		panels.each(function () { maxH = Math.max(maxH, this.offsetHeight); });
		panels.each(function () {
			var fs = $(this).find("fieldset:visible").first()[0];
			if (fs && this.offsetHeight < maxH) {
				fs.style.minHeight = (fs.offsetHeight + maxH - this.offsetHeight) + "px";
				var over = this.offsetHeight - maxH; // padding / box-sizing difference
				if (over) fs.style.minHeight = (parseFloat(fs.style.minHeight) - over) + "px";
			}
		});
		setTimeout(function () { busy = false; }, 0);
	}
	window.remixEqualizeColumns = equalize;
	$(function () {
		var t = null, run = function () { clearTimeout(t); t = setTimeout(equalize, 60); };
		setTimeout(equalize, 400);
		if (window.ResizeObserver) $("#p1, #p2").each(function () { new ResizeObserver(run).observe(this); });
		$(window).on("resize", run);
	});
})();
