// window.RemixFortune.open({sheets, title, onApply(sheets), onClose()}): a full-screen FortuneSheet (Google-Sheets-like)
// over the page. "Apply to page" hands the edited sheets back; the page turns them into its own data.
import React, { useRef } from "react";
import { createRoot } from "react-dom/client";
import { Workbook } from "@fortune-sheet/react";
import "@fortune-sheet/react/dist/index.css";

function Editor({ opts, close }) {
	const ref = useRef(null);
	const apply = (andClose) => {
		const sheets = ref.current.getAllSheets();
		opts.onApply(sheets);
		if (andClose) close();
	};
	return (
		<div className="rf-wrap">
			<div className="rf-bar">
				<b>{opts.title || "Edit in Sheets"}</b>
				<span className="rf-hint">Only you see this. The last column (⚙) is each row's type. Apply puts your changes on the page; 💾 Save to file keeps them.</span>
				<button className="rf-go" onClick={() => apply(true)}>Apply to page</button>
				<button onClick={close}>Close without applying</button>
			</div>
			<div className="rf-sheet">
				<Workbook ref={ref} data={opts.sheets} lang="en" showFormulaBar={true} />
			</div>
		</div>
	);
}

window.RemixFortune = {
	open(opts) {
		const host = document.createElement("div");
		host.id = "rf-host";
		document.body.appendChild(host);
		document.body.style.overflow = "hidden";
		const root = createRoot(host);
		const close = () => { root.unmount(); host.remove(); document.body.style.overflow = ""; if (opts.onClose) opts.onClose(); };
		root.render(<Editor opts={opts} close={close} />);
		return { close };
	}
};
