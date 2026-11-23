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
  // signature items with a type matchup effect (an immunity / resistance, an added type, or a granted ability that has one)
  const monItems = createMemo(() => {
    const d = dataset();
    const list = (((mon() as any)?.typeItems ?? []) as { name: string; chart: Record<string, number>; abilities: string[]; addType?: string }[]);
    return list.filter((i) => Object.keys(i.chart).length || i.addType || i.abilities.some((a) => d?.typeChart[a]));
  });
  // abilities: the ones that change the chart, then the ones that only stop certain moves (marked *)
  const monAbilities = createMemo(() => {
    const d = dataset(), p = mon();
    if (!d || !p) return [] as string[];
    const chart = p.abilities.filter((a) => a && d.typeChart[a] && !(TYPES as Option[]).some((t) => t.value === a));
    const notes = p.abilities.filter((a) => a && ABILITY_NOTES[a] && !chart.includes(a));
    return [...chart, ...notes];
  });

  const [abilityFilter, setAbilityFilter] = createSignal("");
  const [itemFilter, setItemFilter] = createSignal("");
  // a new Pokemon: its first chart-changing ability (else its first starred one), and its item
  createEffect(on(mon, (p) => {
    const d = dataset();
    const ab = monAbilities();
    setAbilityFilter(ab.find((a) => d?.typeChart[a]) ?? ab[0] ?? "");
    setItemFilter(monItems()[0]?.name ?? "");
  }));

  const abilityOptions = createMemo<Option[]>(() => [
    { label: "(Ability)", value: "" },
    ...monAbilities().map((a) => ({ label: ABILITY_NOTES[a] && !dataset()?.typeChart[a] ? a + "*" : a, value: a })),
  ]);
  const itemOptions = createMemo<Option[]>(() => [
    { label: "(Item)", value: "" },
    ...monItems().map((i) => ({ label: i.name, value: i.name })),
  ]);
  const note = () => ABILITY_NOTES[abilityFilter()] ?? "";

  const matchUps = createMemo(() => {
    const d = dataset();
    if (!d) return {};

    const [t1, t2] = typesFilter();

    const o: Record<string, [number, boolean]> = {};
    let superEffective = 1;
    let superEffectiveFromStuff = false;

    const x = (t: string, fromStuff = false) => {
      const c = d.typeChart[t];
      for (const a in c) {
        const v = c[a as keyof typeof c];
        if (v === undefined || v === 1) continue;

        if (a === "Super Effective") {
          superEffective *= v;
          if (fromStuff) superEffectiveFromStuff = true;
          continue;
        }

        o[a] ??= [1, false];
        o[a][0] *= v;
        if (fromStuff) o[a][1] = true;
      }
    };

    for (const t of [t1, t2]) if (t) x(t);
    if (abilityFilter() && d.typeChart[abilityFilter()]) x(abilityFilter(), true);
    const it = monItems().find((i) => i.name === itemFilter());
    if (it) {
      if (it.addType && it.addType !== t1 && it.addType !== t2) x(it.addType, true);
      for (const a of it.abilities) if (d.typeChart[a] && a !== abilityFilter()) x(a, true);
      for (const [t, v] of Object.entries(it.chart)) {
        o[t] ??= [1, false];
        o[t][0] *= v;
        o[t][1] = true;
      }
    }

    if (superEffective !== 1) {
      for (const a in o) {
        if (o[a]![0] > 1) {
          o[a]![0] *= superEffective;
          if (superEffectiveFromStuff) o[a]![1] = true;
        }
      }
    }

    return o;
  });

  // Same order as the calc's type chart: biggest weakness first, then neutral, then resists
  // (mild to strong), immunities last. Ties keep the normal type order.
  const sortedTypes = createMemo(() => {
    const m = matchUps();
    return TYPES.slice(1)
      .map((t, i) => ({ t, i, x: m[t.value]?.[0] ?? 1 }))
      .sort((a, b) => b.x - a.x || a.i - b.i)
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
                <div class="flex aspect-2/3 flex-col overflow-hidden rounded-xs border">
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
                    {f() && "*"}
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
