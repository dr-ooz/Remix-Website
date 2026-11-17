import { fileURLToPath } from "node:url";
import path from "node:path";
import { defineConfig, type Plugin } from "vite";
import solid from "vite-plugin-solid";
import tailwindcss from "@tailwindcss/vite";
import AutoImport from "unplugin-auto-import/vite";

const here = path.dirname(fileURLToPath(import.meta.url));
// Copy of Alia's extension (src + public), see alia/SOURCE_COMMIT.txt.
const ext = path.join(here, "alia");
const extSrc = path.join(ext, "src");
const shim = path.join(here, "shims/wxt.ts");

// Her code uses root paths like "/icons/x.svg". The sidebar lives in a
// subfolder, so make them relative to the sidebar page.
const relativeAssets = (): Plugin => ({
  name: "relative-assets",
  enforce: "pre",
  transform(code, id) {
    if (!id.startsWith(extSrc.replace(/\\/g, "/")) && !id.startsWith(extSrc)) return;
    if (!/\.(tsx?|jsx?)$/.test(id.split("?")[0])) return;
    // Full URLs: a relative url() inside a CSS variable resolves against the
    // stylesheet's folder, not the page, which broke the type icons.
    return code.replace(/([`(])\/(icons|sprites|calcsprites)\//g, "$1${globalThis.__DZ_BASE}$2/");
  },
});

export default defineConfig({
  base: "./",
  root: here,
  publicDir: path.join(ext, "public"),
  resolve: {
    alias: {
      "@": extSrc,
      "wxt/utils/storage": shim,
      "wxt-shim": shim,
    },
  },
  plugins: [
    relativeAssets(),
    // WXT auto-imports these in the extension; recreate that here.
    AutoImport({
      include: [/\.[tj]sx?$/],
      imports: [
        "solid-js",
        { "solid-js/web": ["render"] },
        { "wxt-shim": ["storage", "browser"] },
      ],
      dirs: ["components", "context", "hooks", "utils", "screens"].map((d) => path.join(extSrc, d)),
      dts: false,
    }),
    solid(),
    tailwindcss(),
  ],
  build: {
    // The calc's build copies src/ into dist/.
    outDir: path.resolve(here, "../src/doozdex-sidebar"),
    emptyOutDir: true,
  },
});
