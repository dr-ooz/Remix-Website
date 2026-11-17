# DoozDex sidebar

The DoozDex sidebar in the calc is built from **Alia's DoozDex browser extension**
(https://github.com/alicedcodes/web-ext), all credit for the original goes to Alia.
`alia/` is a local copy of her source (commit in `alia/SOURCE_COMMIT.txt`) with Remix
changes: the calc's stat colors and theme, learnset search, name suggestions, sprite sizes.
Her repository itself is never modified from here.

Build: `npm install`, then `npm run build` (Vite, then `build_data.py` writes the data
into `../src/doozdex-sidebar`), then `node build view` in the calc root.
