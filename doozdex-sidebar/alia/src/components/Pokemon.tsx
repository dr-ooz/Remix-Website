// Edited copy of Alia's Pokemon row (calc sidebar version). Same look and size
// as her original, plus:
// - the sprite sits centred in its space and slides left as the text gets
//   close, stopping SPRITE_GAP px from the types;
// - stats use fixed-width cells, so the text never runs into the abilities.

const ROW_H = 58; // matches estimateSize in ScreenPokedex (stat bars mode: ROW_H_BARS)
export const ROW_H_BARS = 64; // taller rows for the stat bars; sprites keep the ROW_H size
const ROW_LINE = 2; // px: the line under each Pokemon
const SPRITE_SCALE = (ROW_H - ROW_LINE) / 30; // minisprites are 30px tall, drawn as tall as the row
const SPRITE_GAP = 1.75; // px between the types and the sprite (half the old gap)
const SPRITE_AREA_MAX = 80; // px: about one big sprite wide; more room goes around the text

// Wide sprites drawn over the type icons (but under the name/stats), and how far (px) to nudge them left.
const SPRITE_SHIFT: Record<string, number> = { charizardmegax: 10, charizardmegay: 10 };

// Sprites drawn bigger/smaller than the rest (they grow up from the feet).
// Whatever the size, a sprite is never drawn past its row's top or bottom.
const SPRITE_SIZE: Record<string, number> = {
  stoutland: 1.125, turtonator: 1.08, drampa: 1.12, kartana: 0.75, poipole: 0.85, guzzleon: 1.1, dhelmise: 1.2, wishiwashisolo: 0.75, tyrantrum: 1.2, clefable: 1.15, grumpig: 1.2, vanillish: 1.1, vanilluxe: 1.1,
  shiinotic: 1.05, altariamega: 1.05, whiscash: 1.125, gourgeistsmall: 0.9, gourgeistsuper: 1.12,
};

// Sprites stretched to fill the row top to bottom, with this many px left at each edge.
const SPRITE_FILL: Record<string, number> = { wailord: 1 };
const CONTENT_H = ROW_H - ROW_LINE;

// Stat display: a little bar graph under the name (default) or colored numbers. Kept per browser.
const BARS_KEY = "dzStatBars";
const loadBars = () => { try { return localStorage.getItem(BARS_KEY) !== "off"; } catch { return true; } }; // bars by default
export const [statBars, setStatBarsSignal] = createSignal(loadBars());
// Bar look: "soft" (default: see-through fill with a solid top line) or "solid" (full color).
const SOFT_KEY = "dzStatBarsSoft";
const loadSoft = () => { try { return localStorage.getItem(SOFT_KEY) !== "off"; } catch { return true; } }; // soft by default
export const [barsSoft, setBarsSoftSignal] = createSignal(loadSoft());
export const setBarsSoft = (on: boolean) => {
  setBarsSoftSignal(on);
  try { localStorage.setItem(SOFT_KEY, on ? "on" : "off"); } catch {}
};
export const setStatBars = (on: boolean) => {
  setStatBarsSignal(on);
  try { localStorage.setItem(BARS_KEY, on ? "on" : "off"); } catch {}
};

export const Pokemon = (props: { data: PokemonData; datasetId: string; sheetId: string }) => {
  return (
    <div
      class={cn("relative flex h-full border-b border-transparent", props.data.range && "cursor-pointer")}
      onclick={() => props.data.range && openRange(props.data.range, props.sheetId)}
    >
      {/* the line under each Pokemon, drawn on top so it runs the full width (over the type column too) */}
      <div class="dz-row-line pointer-events-none absolute right-0 left-0" style={{ "z-index": 40 }} />
      <Types data={props.data} />

      <Sprite data={props.data} datasetId={props.datasetId} />

      {/* Spare room goes to the sprite first (up to SPRITE_AREA_MAX), then is
          split evenly around the text so it stays centred like before. */}
      <div class="min-w-0 flex-1" />

      <Show
        when={statBars()}
        fallback={
          <div class="z-30 mr-1 flex flex-none flex-col place-items-center py-1">
            <Name data={props.data} />
            <Stats data={props.data} />
          </div>
        }
      >
        <div class="z-30 mr-1 flex h-full flex-none flex-col items-center">
          {/* the bars run up under the name: their 150 line is the name's baseline */}
          <div class="relative z-10 -mb-[6px] max-w-full leading-[24px] [&>div]:bg-transparent [&>div]:[text-shadow:0_0_3px_#000,0_0_2px_#000,0_0_1px_#000]">
            <Name data={props.data} />
          </div>
          <StatBars data={props.data} />
        </div>
      </Show>

      <div class="min-w-0 flex-1" />

      <Abilities data={props.data} />
    </div>
  );
};

const Types = (props: { data: PokemonData }) => {
  const [, setOpt] = useOPT()!;

  return (
    <div
      class="z-10 flex w-6.5 shrink-0 cursor-pointer flex-col gap-px border-r"
      style={{ "background-color": "var(--dz-line)" }}
      onclick={(e) => {
        e.stopPropagation();
        setOpt(props.data.name);
      }}
    >
      <For each={props.data.types}>{(t) => <Type type={t!} />}</For>
    </div>
  );
};

const Sprite = (props: { data: PokemonData; datasetId: string }) => {
  const pokemonId = () => nameToId(props.data.name);
  // visible rows of the 30px-tall sprite
  const rows = (): [number, number] => (props.data as any).spriteY ?? [0, 30];
  const fill = () => SPRITE_FILL[pokemonId()];
  const scale = () => {
    const [top, bottom] = rows();
    if (fill() !== undefined) return (CONTENT_H - 2 * fill()) / (bottom - top);
    const wanted = SPRITE_SCALE * (SPRITE_SIZE[pokemonId()] ?? 1);
    return Math.min(wanted, CONTENT_H / (30 - top)); // keep the top inside the row
  };
  // fill: lift the sprite so its lowest pixel sits `fill` px above the line
  const lift = () => (fill() !== undefined ? fill() - (30 - rows()[1]) * scale() : 0);
  const width = () => ((props.data as any).spriteW ?? 40) * scale();
  const shift = () => SPRITE_SHIFT[pokemonId()] ?? 0;

  return (
    <div class="relative h-full min-w-0 flex-[1000_1_0%]" style={{ "max-width": `${SPRITE_AREA_MAX}px` }}>
      <div
        class={cn("dz-sprite absolute -scale-x-100", statBars() ? "z-[35]" : shift() ? "z-20" : "z-0")}
        style={{
          bottom: `${lift()}px`,
          width: `${width()}px`,
          height: `${30 * scale()}px`,
          // centred in its space, but never closer than SPRITE_GAP to the types
          left: `calc(max(${SPRITE_GAP}px, 50% - ${width() / 2}px) - ${shift()}px)`,
          "background-image": `url(/calcsprites/${pokemonId()}.png)`,
          "background-size": "100% 100%",
          "background-repeat": "no-repeat",
          "image-rendering": "pixelated",
        }}
      />
    </div>
  );
};

const Name = (props: { data: PokemonData }) => (
  <div class="max-w-full flex-3 overflow-hidden bg-black/50 px-0.5 whitespace-nowrap">
    <div class={cn("inline text-xl font-bold", props.data.unusable && "text-red-400")}>
      {props.data.baseSpecies ?? props.data.name}
    </div>
    <Show when={props.data.form}>
      &nbsp;<div class="inline text-sm italic">({props.data.form})</div>
    </Show>
  </div>
);

// The HP..Speed range is a fixed width (same for every Pokemon), just wide enough for six
// 3-digit stats (Mew). Leftover room goes between the numbers (half a share before HP),
// none after Speed, so the BST always sits the same small gap after Speed.
// Each number has its own small rounded shade.
const Stats = (props: { data: PokemonData }) => (
  <div class="flex flex-2 items-center text-[11px] [text-shadow:0_0_2px_var(--color-black)]">
    <div class="flex w-[15.3em] items-center">
      <div class="flex-[0.5_1_0]" />
      <For each={props.data.baseStats}>
        {(v, i) => (
          <>
            <Show when={i() > 0}>
              <div class="min-w-[0.42em] flex-[1_1_0] text-center opacity-80">|</div>
            </Show>
            <span
              class="dz-stat flex-none rounded-[3px] bg-black/50 px-px font-bold tracking-[-0.04em]"
              style={{ color: statColour(v) }}
            >
              {v}
            </span>
          </>
        )}
      </For>
    </div>
    <span class="ml-[2px] rounded-[3px] bg-black/50 px-[2px] text-xs font-bold italic">
      {props.data.baseStats.reduce((a, c) => a + c, 0)}
    </span>
  </div>
);

// Bar graph version: one bar per stat, growing up from the bottom of the row. 150 reaches the
// bottom of the name's letters; higher stats (rare, up to 250) carry on up behind the name.
// The number sits on its bar.
const StatBars = (props: { data: PokemonData }) => (
  <div class="flex min-h-0 w-full flex-1 items-end">
    <div class="flex h-full w-[15.3em] items-end gap-[2px] text-[10px]">
      <For each={props.data.baseStats}>
        {(v) => (
          <div class="relative h-full flex-1">
            <div
              class="absolute right-0 bottom-0 left-0 rounded-t-[2px]"
              style={
                barsSoft()
                  ? {
                      height: `${(Math.min(v, 250) / 150) * 100}%`,
                      background: `color-mix(in srgb, ${statColour(v)} 40%, transparent)`,
                      "box-shadow": `inset 0 2px 0 ${statColour(v)}`,
                    }
                  : { height: `${(Math.min(v, 250) / 150) * 100}%`, background: statColour(v) }
              }
            />
            <div class="absolute right-0 bottom-0 left-0 text-center text-[12px] leading-[14px] font-bold tracking-[-0.04em] text-white [text-shadow:0_0_2px_#000,0_0_2px_#000,0_0_1px_#000]">
              {v}
            </div>
          </div>
        )}
      </For>
    </div>
    <span class="mb-px ml-[2px] rounded-[3px] bg-black/50 px-[2px] text-xs font-bold">
      {props.data.baseStats.reduce((a, c) => a + c, 0)}
    </span>
  </div>
);

// Ability names too wide for the column, shortened for the sidebar only (full name on hover).
const ABILITY_SHORT: Record<string, string> = { "Paralyzing Venom": "Paralyz. Venom" };

const Abilities = (props: { data: PokemonData }) => (
  <div class="flex w-24 shrink-0 flex-col justify-center gap-[3px] py-1 text-[10px] leading-[12px] font-bold">
    <For each={props.data.abilities}>
      {(v) => (
        <div class="bg-ability/25 py-px text-center" title={ABILITY_SHORT[v] ? v : undefined}>
          {ABILITY_SHORT[v] ?? v}
        </div>
      )}
    </For>
  </div>
);
