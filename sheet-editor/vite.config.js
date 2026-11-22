// Builds the dev-only Sheets editor to ../src/sheet-editor/ (sheet-editor.js + sheet-editor.css).
// The site loads it only on localhost when you click "Edit in Sheets"; viewers never download it.
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
	plugins: [react()],
	define: { "process.env.NODE_ENV": '"production"' },
	build: {
		outDir: "../src/sheet-editor",
		emptyOutDir: true,
		cssCodeSplit: false,
		lib: { entry: "src/main.jsx", formats: ["iife"], name: "RemixFortuneLib", fileName: () => "sheet-editor.js" },
		rollupOptions: { output: { assetFileNames: "sheet-editor.[ext]" } }
	}
});
