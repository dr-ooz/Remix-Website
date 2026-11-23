import { CHART_TYPES, useCalcData } from "@/utils/calcData";
const COLOURS = {
  8: "#4adaff",
  4: "#73D216",
  3: "#4E9A06", // bad
  2: "#4E9A06",
  1.5: "#4E9A06", // bad
  // neutral: the sidebar background, nudged slightly lighter (dark mode) / darker (light mode)
  1: "color-mix(in srgb, var(--color-white) 13%, var(--color-black))", // Remix: lighter so 0x (solid black) stands out
  0.5: "#A40000",
  0.25: "#7C0000",
  0.125: "#3d0a00",
  0: "#000",
};

export const ScreenTypeChart = () => {
  const datasetId = useDatasetId();
  const dataset = createMemo(() => {
    const id = datasetId();
    return DATASET_IDS.find((d) => d.value === id);
  });
  const pokedex = usePokedex();

  const [opt] = useOPT()!;

  const pokemonNames = createMemo(() => {
    const px = pokedex();
    if (!px) return [];
    return Object.values(px)
      .map((p) => p.name)
      .toSorted();
  });
  const [pokemon, setPokemon] = createSignal("");

  onMount(() => {
    const o = opt();
    if (o) setPokemon(o);
  });

  // the Pokemon's own types (fixed), its signature items that change matchups, and its abilities that do
  const mon = createMemo(() => {
    const px = pokedex();
    return (px && pokemon() && px[nameToId(pokemon())]) || null;
  });
  const typesFilter = () => {
    const p = mon();
    return p ? [p.types[0] ?? "", p.types[1] ?? ""] : ["", ""];
  };
  // the calc's own charts for this Pokemon (tools/build_sidebar_calc.js): "ability|item" -> multipliers
  const calcData = useCalcData();
  const charts = createMemo(() => (mon() && calcData()?.charts[nameToId(mon()!.name)]) || null);
  // its signature items / abilities that change a matchup (per the calc), then the abilities that only stop certain
  // moves (marked *)
  const monItems = createMemo(() => {
    const c = charts();
    const names = [...new Set((((mon() as any)?.typeItems ?? []) as { name: string }[]).map((i) => i.name))];
    return c ? names.filter((n) => Object.keys(c).some((k) => k.split("|")[1] === n)).map((name) => ({ name })) : [];
  });
  // an ability changes the chart when it differs from the same item without it (not just because of the item)
  const changesChart = (a: string) => {
    const c = charts();
    if (!c) return false;
    const same = (x?: number[], y?: number[]) => (x ?? c["|"]!).every((v, i) => v === (y ?? c["|"]!)[i]);
    return ["", ...monItems().map((i) => i.name)].some((it) => !same(c[a + "|" + it], c["|" + it]));
  };
  const monAbilities = createMemo(() => {
    const c = charts(), p = mon();
    if (!p) return [] as string[];
    const chart = p.abilities.filter((a) => a && changesChart(a));
    const notes = p.abilities.filter((a) => a && ABILITY_NOTES[a] && !chart.includes(a));
    return [...chart, ...notes];
  });
  const [abilityFilter, setAbilityFilter] = createSignal("");
  const [itemFilter, setItemFilter] = createSignal("");
  // a new Pokemon: its first chart-changing ability (else its first starred one), and its item
  createEffect(on([mon, charts], () => {
    const d = dataset();
    const ab = monAbilities();
    setAbilityFilter(ab.find((a) => charts()?.[a + "|"]) ?? ab.find(changesChart) ?? ab[0] ?? "");
    setItemFilter(monItems()[0]?.name ?? "");
  }));

  const abilityOptions = createMemo<Option[]>(() => [
    { label: "(Ability)", value: "" },
    ...monAbilities().map((a) => ({ label: ABILITY_NOTES[a] && !changesChart(a) ? a + "*" : a, value: a })),
  ]);
  const itemOptions = createMemo<Option[]>(() => [
    { label: "(Item)", value: "" },
    ...monItems().map((i) => ({ label: i.name, value: i.name })),
  ]);
  const note = () => ABILITY_NOTES[abilityFilter()] ?? "";

  // the chart: the calc's value for the chosen ability + item; [value, changed by the ability / item]
  const matchUps = createMemo(() => {
    const c = charts();
    const o: Record<string, [number, boolean]> = {};
    if (!c) return o;
    const base = c["|"]!;
    const cur = c[abilityFilter() + "|" + itemFilter()] ?? base;
    CHART_TYPES.forEach((t, i) => { o[t] = [cur[i]!, cur[i] !== base[i]]; });
    return o;
  });

  // Same order as the calc's type chart: biggest weakness first, then neutral, then resists (mild to strong),
  // immunities last; inside a group the ones the ability / item changed come first, then the normal type order.
  const sortedTypes = createMemo(() => {
    const m = matchUps();
    return TYPES.slice(1)
      .map((t, i) => ({ t, i, x: m[t.value]?.[0] ?? 1, f: m[t.value]?.[1] ? 1 : 0 }))
      .sort((a, b) => b.x - a.x || b.f - a.f || a.i - b.i)
      .map((o) => o.t);
  });

  return (
    <>
      <div class="flex flex-col gap-1 p-1">
        <Select
          options={[
            { label: "(Pokemon)", value: "" },
            ...(pokemonNames().map((a) => ({ label: a, value: a })) ?? []),
          ]}
          value={pokemon()}
          oninput={(e) => setPokemon(e.currentTarget.value)}
        />

        <Show when={mon()}>
          <div class="flex h-6 gap-1">
            <For each={mon()!.types}>
              {(t) => (
                <div
                  class="flex flex-1 items-center justify-center overflow-hidden rounded-xs border text-sm font-bold"
                  style={{ background: `color-mix(in srgb, ${TYPE_COLOURS[t] ?? "#999"} var(--dz-info-mix), var(--dz-mix-base))` }}
                >
                  {t}
                </div>
              )}
            </For>
          </div>
        </Show>

        <div class="flex gap-1">
          <Select
            options={abilityOptions()}
            value={abilityFilter()}
            oninput={(e) => setAbilityFilter(e.currentTarget.value)}
          />

          <Select
            options={itemOptions()}
            value={itemFilter()}
            oninput={(e) => setItemFilter(e.currentTarget.value)}
          />
        </div>
        <Show when={note()}>
          <div class="text-center text-xs text-white/70 italic">* {abilityFilter()}: {note()} (not shown in the chart)</div>
        </Show>

        <div class="grid grid-cols-9 gap-1">
          <For each={sortedTypes()}>
            {(t) => {
              const v = () => matchUps()[t.value]?.[0] ?? 1;
              const f = () => matchUps()[t.value]?.[1] ?? false;
              return (
                <div
                  class={cn("flex aspect-2/3 flex-col overflow-hidden rounded-xs border", f() && "dz-tc-from")}
                  title={f() ? `${t.value}: changed by ${[abilityFilter(), itemFilter()].filter(Boolean).join(" / ")}` : undefined}
                >
                  <div class="flex-1 border-b">
                    <Type type={t.value} />
                  </div>
                  <div
                    class="flex flex-1 items-center justify-center text-xs font-bold"
                    style={{
                      background: COLOURS[v() as keyof typeof COLOURS],
                      color: { 0: "#f44", 1: "color-mix(in srgb, var(--color-white) 70%, var(--color-black))" }[v()],
                    }}
                  >
                    {v()}
                    {f() && <span class="dz-tc-star">*</span>}
                  </div>
                </div>
              );
            }}
          </For>
        </div>
      </div>
    </>
  );
};
