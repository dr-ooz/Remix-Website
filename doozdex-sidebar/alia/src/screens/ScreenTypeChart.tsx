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

  createEffect(() => {
    const px = pokedex();
    const n = pokemon();
    const p = px && px[nameToId(n)];
    const d = dataset();
    if (!n || !p || !d) return;

    setTypesFilter([p.types[0], p.types[1] ?? ""]);

    const l = new Set<string>();

    for (const a of p.abilities) if (a) l.add(a);

    const si = d.signatureItems[nameToId(p.name)];
    const smokingZone =
      si && d.tcItems.includes(si) && (!d.tciOnlyIf[si] || d.tciOnlyIf[si].includes(p.name));
    if (smokingZone) l.add(si);

    setAllowedStuff(l);

    if (smokingZone) setItemFilter(si);

    for (const a of p.abilities) {
      if (a && d.tcAbilities.includes(a)) {
        setAbilityFilter(a);
        break;
      }
    }
  });

  const [typesFilter, setTypesFilter] = createSignal(["", ""]);
  const [abilityFilter, setAbilityFilter] = createSignal("");
  const [itemFilter, setItemFilter] = createSignal("");
  const [allowedStuff, setAllowedStuff] = createSignal(new Set<string>());

  const sameOptions = (a: Option[], b: Option[]) =>
    a.length === b.length && a.every((o, i) => o.value === b[i]!.value);

  const abilityOptions = createMemo<Option[]>(
    () => [
      { label: "(Ability)", value: "" },
      ...(dataset()
        ?.tcAbilities.filter((a) => !pokemon() || allowedStuff().has(a))
        .toSorted()
        .map((a) => ({ label: a, value: a })) ?? []),
    ],
    [{ label: "(Ability)", value: "" }],
    { equals: sameOptions },
  );

  const itemOptions = createMemo<Option[]>(
    () => [
      { label: "(Item)", value: "" },
      ...(dataset()
        ?.tcItems.filter((a) => !pokemon() || allowedStuff().has(a))
        .toSorted()
        .map((a) => ({ label: a, value: a })) ?? []),
    ],
    [{ label: "(Ability)", value: "" }],
    { equals: sameOptions },
  );

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
    for (const t of [abilityFilter(), itemFilter()]) if (t) x(t, true);

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

        <div class="flex gap-1">
          <Index each={typesFilter()}>
            {(t, index) => (
              <Select
                options={TYPES.toSorted((a, b) => a.label.localeCompare(b.label))}
                value={t()}
                oninput={(e) => {
                  setTypesFilter((prev) => {
                    const next = [...prev];
                    next[index] = e.currentTarget.value;
                    return next;
                  });
                  setPokemon("");
                }}
              />
            )}
          </Index>
        </div>

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
