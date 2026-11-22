// Remix: the dark shade of a type colour (same rule as the calc's remixTypeText / RemixHex outlines):
// same hue, HSL lightness x0.36, saturation x1.25 + 10 points.
const darkShade = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  let l = (mx + mn) / 2, h = 0, s = 0;
  if (d) {
    s = d / (1 - Math.abs(2 * l - 1));
    h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h = (h * 60 + 360) % 360;
  }
  l *= 0.36;
  s = Math.min(1, s * 1.25 + 0.1);
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = l - c / 2;
  const rgb = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return "#" + rgb.map((v) => ("0" + Math.round((v + m) * 255).toString(16)).slice(-2)).join("");
};

// One SVG filter per type: the symbol grown evenly by a fraction of a pixel (feMorphology), filled with the
// dark shade, under the symbol. Even all the way round (stacked drop-shadows thickened it unevenly).
const made = new Set<string>();
const outlineFilter = (type: string, colour: string) => {
  const id = `rx-type-outline-${type}`;
  if (!made.has(id) && typeof document !== "undefined") {
    made.add(id);
    const ns = "http://www.w3.org/2000/svg";
    let host = document.getElementById("rx-type-filters") as unknown as SVGSVGElement | null;
    if (!host) {
      host = document.createElementNS(ns, "svg");
      host.id = "rx-type-filters";
      host.setAttribute("width", "0");
      host.setAttribute("height", "0");
      host.style.position = "absolute";
      document.body.appendChild(host);
    }
    const f = document.createElementNS(ns, "filter");
    f.id = id;
    f.setAttribute("x", "-10%");
    f.setAttribute("y", "-10%");
    f.setAttribute("width", "120%");
    f.setAttribute("height", "120%");
    f.innerHTML =
      `<feMorphology in="SourceAlpha" operator="dilate" radius="1.1" result="grown"/>` +
      `<feFlood flood-color="${darkShade(colour)}"/><feComposite in2="grown" operator="in" result="edge"/>` +
      `<feMerge><feMergeNode in="edge"/><feMergeNode in="SourceGraphic"/></feMerge>`;
    host.appendChild(f);
  }
  return `url(#${id})`;
};

// muted: the box takes its row's blended color (the moves list), instead of the full type color (the type chart)
export const Type = (props: { type: string; muted?: boolean }) => {
  const colour = () => TYPE_COLOURS[props.type] ?? "#999";
  const fill = () =>
    props.muted ? `color-mix(in srgb, ${colour()} var(--dz-info-mix), var(--dz-mix-base))` : colour();
  return (
    <div class="relative h-full min-h-0 w-full" style={{ "background-color": fill() }}>
      <div
        class="absolute inset-[1px] bg-contain bg-center bg-no-repeat"
        style={{ "background-image": `url(/icons/${props.type}.svg?v=2)`, filter: outlineFilter(props.type, colour()) }}
      />
    </div>
  );
};
