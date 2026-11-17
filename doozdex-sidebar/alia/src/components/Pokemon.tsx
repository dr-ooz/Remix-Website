// Edited copy of Alia's Pokemon row (calc sidebar version). Same look and size
// as her original, plus:
// - the sprite sits centred in its space and slides left as the text gets
//   close, stopping SPRITE_GAP px from the types;
// - stats use fixed-width cells, so the text never runs into the abilities.

const ROW_H = 52; // matches estimateSize in ScreenPokedex
const ROW_LINE = 2; // px: the white line under each Pokemon
const SPRITE_SCALE = (ROW_H - ROW_LINE) / 30; // minisprites are 30px tall, drawn as tall as the row
const SPRITE_GAP = 1.75; // px between the types and the sprite (half the old gap)
const SPRITE_AREA_MAX = 80; // px: about one big sprite wide; more room goes around the text

// Wide sprites drawn over the type icons (but under the name/stats), and how far (px) to nudge them left.
const SPRITE_SHIFT: Record<string, number> = { charizardmegax: 10, charizardmegay: 10 };

// Sprites drawn bigger/smaller than the rest (they grow up from the feet).
// Whatever the size, a sprite is never drawn past its row's top or bottom.
const SPRITE_SIZE: Record<string, number> = {
  stoutland: 1.125, tyrantrum: 1.2, clefable: 1.15, grumpig: 1.2, vanillish: 1.1, vanilluxe: 1.1,
  shiinotic: 1.05, altariamega: 1.05, whiscash: 1.125, gourgeistsmall: 0.9, gourgeistsuper: 1.12,
};

// Sprites stretched to fill the row top to bottom, with this many px left at each edge.
const SPRITE_FILL: Record<string, number> = { wailord: 1 };
const CONTENT_H = ROW_H - ROW_LINE;

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

      <div class="z-30 mr-1 flex flex-none flex-col place-items-center py-1">
        <Name data={props.data} />
        <Stats data={props.data} />
      </div>

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
        class={cn("dz-sprite absolute -scale-x-100", shift() ? "z-20" : "z-0")}
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

// The HP..Speed range is a fixed width (same for every Pokemon). Inside it,
// leftover room is shared equally around each number, so 3-digit and 2-digit
// numbers get the same breathing room instead of identical slots. Each number
// has its own small rounded shade instead of one rectangle behind the line.
const Stats = (props: { data: PokemonData }) => (
  <div class="flex flex-2 items-center text-[11px] [text-shadow:0_0_2px_var(--color-black)]">
    <div class="flex w-[15.9em] items-center">
      <For each={props.data.baseStats}>
        {(v, i) => (
          <>
            <Show when={i() > 0}>
              <div class="w-[0.42em] flex-none text-center opacity-80">|</div>
            </Show>
            <div class="flex-[1_1_auto] text-center">
              <span
                class="dz-stat rounded-[3px] bg-black/50 px-px font-bold"
                style={{ color: statColour(v) }}
              >
                {v}
              </span>
            </div>
          </>
        )}
      </For>
    </div>
    <span class="ml-[3px] rounded-[3px] bg-black/50 px-[2px] text-xs font-bold italic">
      {props.data.baseStats.reduce((a, c) => a + c, 0)}
    </span>
  </div>
);

const Abilities = (props: { data: PokemonData }) => (
  <div class="flex w-24 shrink-0 flex-col justify-center gap-0.5 text-[10px] font-bold">
    <For each={props.data.abilities}>{(v) => <div class="bg-ability/25 text-center">{v}</div>}</For>
  </div>
);
