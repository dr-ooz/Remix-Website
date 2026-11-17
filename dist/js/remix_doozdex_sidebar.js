/* DoozDex sidebar: Alia's extension (built from doozdex-sidebar/ into
   ./doozdex-sidebar/) shown in a toggleable panel on the left. It runs in an
   iframe so its styles and the calc's styles never touch each other.
   Open/closed state and width are remembered in localStorage. */
(function () {
	var KEY_OPEN = "remixDoozdexOpen";
	var KEY_WIDTH = "remixDoozdexWidth";
	var MIN_W = 360, MAX_W = 900, DEFAULT_W = 390;

	function load(key) { try { return localStorage.getItem(key); } catch (e) { return null; } }
	function save(key, v) { try { localStorage.setItem(key, v); } catch (e) {} }

	var css = "" +
		"#dz-panel{position:fixed;top:0;left:0;height:100vh;width:var(--dz-w," + DEFAULT_W + "px);z-index:2000;" +
		"background:#fff;border-right:2px solid #cfc8d8;box-shadow:4px 0 12px rgba(0,0,0,.2);display:none}" +
		"body.dark #dz-panel{background:#17141c;border-right-color:#3a3344;box-shadow:4px 0 12px rgba(0,0,0,.45)}" +
		"body.dz-open #dz-panel{display:block}" +
		"body.dz-open{margin-left:var(--dz-w," + DEFAULT_W + "px)}" +
		"#dz-panel iframe{width:100%;height:100%;border:0;display:block}" +
		"#dz-grip{position:absolute;right:-5px;top:0;width:9px;height:100%;cursor:ew-resize;z-index:1}" +
		"#dz-close{position:absolute;top:2px;right:-30px;width:26px;height:26px;border:1px solid #cfc8d8;border-left:0;" +
		"border-radius:0 4px 4px 0;background:#fff;color:#17141c;font:bold 14px/24px sans-serif;cursor:pointer;padding:0}" +
		"body.dark #dz-close{background:#221d2a;color:#fff;border-color:#3a3344}" +
		"body.dz-resizing iframe{pointer-events:none}body.dz-resizing{cursor:ew-resize;user-select:none}";

	var panel, frame;

	function setWidth(w) {
		w = Math.max(MIN_W, Math.min(MAX_W, Math.round(w)));
		document.documentElement.style.setProperty("--dz-w", w + "px");
		return w;
	}

	function build() {
		var style = document.createElement("style");
		style.textContent = css;
		document.head.appendChild(style);

		panel = document.createElement("div");
		panel.id = "dz-panel";
		panel.innerHTML = '<div id="dz-grip" title="Drag to resize"></div>' +
			'<button type="button" id="dz-close" title="Close the DoozDex sidebar">&times;</button>';
		document.body.appendChild(panel);
		panel.querySelector("#dz-close").onclick = function () { window.remixToggleDoozdex(false); };

		// Drag the right edge to resize.
		panel.querySelector("#dz-grip").addEventListener("mousedown", function (e) {
			e.preventDefault();
			document.body.classList.add("dz-resizing");
			var last = DEFAULT_W;
			function move(ev) { last = setWidth(ev.clientX); }
			function up() {
				document.body.classList.remove("dz-resizing");
				document.removeEventListener("mousemove", move);
				document.removeEventListener("mouseup", up);
				save(KEY_WIDTH, last);
			}
			document.addEventListener("mousemove", move);
			document.addEventListener("mouseup", up);
		});
	}

	function updateButton(open) {
		var btn = document.getElementById("doozdex-toggle");
		if (btn) btn.innerHTML = "&#128214; DoozDex: " + (open ? "Shown" : "Hidden");
	}

	window.remixToggleDoozdex = function (force) {
		var open = typeof force === "boolean" ? force : !document.body.classList.contains("dz-open");
		if (open && !frame) {
			// Load the sidebar only the first time it is opened.
			frame = document.createElement("iframe");
			// ?v= stops the browser reusing a stale page after a rebuild
			// (its script/css files have hashed names, so they never go stale).
			frame.src = "./doozdex-sidebar/index.html?v=" + Date.now();
			frame.title = "DoozDex";
			panel.appendChild(frame);
		}
		document.body.classList.toggle("dz-open", open);
		save(KEY_OPEN, open ? "1" : "0");
		updateButton(open);
	};

	function init() {
		build();
		setWidth(Number(load(KEY_WIDTH)) || DEFAULT_W);
		window.remixToggleDoozdex(load(KEY_OPEN) !== "0"); // open by default; closing it is remembered
	}

	if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
	else init();
})();
