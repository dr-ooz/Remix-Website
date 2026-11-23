import { statBars, setStatBars, ROW_H_BARS } from "../components/Pokemon";
import { createVirtualizer } from "@tanstack/solid-virtual";
import clsx from "clsx";
import type { JSX } from "solid-js/jsx-runtime";

type Order = "num" | "a-z" | "hp" | "atk" | "def" | "spa" | "spd" | "spe" | "bst";

const ORDERS: Option<Order>[] = [
  { label: "#", value: "num" },
  { label: "A-Z", value: "a-z" },
  { label: "HP", value: "hp" },
  { label: "Atk", value: "atk" },
  { label: "Def", value: "def" },
  { label: "SpA", value: "spa" },
  { label: "SpD", value: "spd" },
  { label: "Spe", value: "spe" },
  { label: "BST", value: "bst" },
];

type PokemonRowItem = { type: "item"; data: PokemonData; famStart?: boolean } | { type: "header"; label: string };

export const ScreenPokedex = (props: { datasetId: string }) => {
  onMount(() => useOPT()![1](null));

  const datasetId = useDatasetId();
  const pokedex = usePokedex();
  const moves = useMoves();
  const sheetId = useSheetId();

  // the search box: what's typed filters by Pokemon name; picking a type / ability / move / item / filter from its
  // suggestions drops it into its cell below
  const [searchText, setSearchText] = createSignal("");
  const searchFilter = () => nameToId(searchText());
  const [typesFilter, setTypesFilter] = createSignal(["", ""]);

  const [order, setOrder] = createSignal<Order>("num");
  const [reversed, setReversed] = createSignal(false);

  const [abilityFilter, setAbilityFilter] = createSignal(["", "", ""]);

  // the three filters, and a picked item (shows the Pokemon that hold it)
  const [sigOnly, setSigOnly] = createSignal(false);
  const [doozianOnly, setDoozianOnly] = createSignal(false);
  const [typeChangedOnly, setTypeChangedOnly] = createSignal(false);
  const [itemPick, setItemPick] = createSignal("");
  // the filter block can fold away (remembered)
  const [filtersOpen, setFiltersOpenRaw] = createSignal((() => { try { return localStorage.getItem("dzFiltersOpen") !== "0"; } catch { return true; } })());
  const setFiltersOpen = (v: boolean) => { setFiltersOpenRaw(v); try { localStorage.setItem("dzFiltersOpen", v ? "1" : "0"); } catch { /* private mode */ } };
  const activeCount = () =>
    typesFilter().filter(Boolean).length + abilityFilter().filter(Boolean).length + movesFilter().filter((m) => m[0]).length +
    (sigOnly() ? 1 : 0) + (doozianOnly() ? 1 : 0) + (typeChangedOnly() ? 1 : 0) + (itemPick() ? 1 : 0);
  const clearFilters = () => {
    setTypesFilter(["", ""]); setAbilityFilter(["", "", ""]); setMovesFilter([["", true], ["", true], ["", true], ["", true]]);
    setSigOnly(false); setDoozianOnly(false); setTypeChangedOnly(false); setItemPick("");
  };

  const [movesFilter, setMovesFilter] = createSignal<[string, boolean][]>([
    ["", true],
    ["", true],
    ["", true],
    ["", true],
  ]);

  let parentRef: HTMLDivElement;

  const abilityOptions = createMemo(() => {
    const pd = pokedex();
    if (!pd) return [{ value: "", label: "—" }];

    const abilities = new Set<string>();

    for (const d of Object.values(pd)) {
      const list = d.abilities;
      for (let j = 0; j < list.length; j++) {
        abilities.add(list[j]!);
      }
    }

    const sorted = Array.from(abilities).sort((a, b) => a.localeCompare(b));

    const options = Array.from<Option>({ length: sorted.length + 1 });
    options[0] = { value: "", label: "(Ability)" };

    for (let i = 0; i < sorted.length; i++) {
      const value = sorted[i]!;
      options[i + 1] = { value, label: value };
    }

    return options;
  });

  const moveOptions = createMemo(() => {
    const pd = pokedex();
    const ms = moves();
    if (!pd) return [{ value: "", label: "—" }];

    const aMoves = new Set<string>();

    for (const d of Object.values(pd)) {
      const list = Object.values(d.learntMoves);
      for (let i = 0; i < list.length; i++) aMoves.add(list[i]![0]);
    }

    const sorted = Array.from(aMoves).sort((a, b) => a.localeCompare(b));

    const options = Array.from<Option>({ length: sorted.length + 1 });
    options[0] = { value: "", label: "(Move)" };

    for (let i = 0; i < sorted.length; i++) {
      const value = sorted[i]!;
      options[i + 1] = { value, label: (ms && ms[nameToId(value)]?.name) || value };
    }

    return options;
  });

  const groupedAndSorted = createMemo<PokemonRowItem[]>(() => {
    const data = pokedex();
    if (!data) return [];

    const di = datasetId();
    const datasetData = DATASET_IDS.find((i) => i.value === di);

    const sf = nameToId(searchFilter());
    const tf = typesFilter();
    const pureTyped = new Set(tf).size === 1;
    const af = abilityFilter().filter(Boolean);
    const mf = movesFilter();

    const standardMons: any[] = [];
    const signatureItemMons: any[] = [];

    const ip = itemPick();

    const or = order();

    for (const p of Object.values(data)) {
      const id = nameToId(p.name);
      // also match the game's original name (Dugtrio -> Drugtrio + Drumtrio, Audino -> Kangakid + Vitabeat)
      if (sf && !id.includes(sf) && !((p as any).oldNames ?? []).some((o: string) => nameToId(o).includes(sf))) continue;

      let typesMatch = true;
      for (let i = 0; i < tf.length; i++) {
        const t = tf[i]!;
        if (t && (!p.types.includes(t) || (pureTyped && p.types.length !== 1))) {
          typesMatch = false;
          break;
        }
      }
      if (!typesMatch) continue;

      let movesMatch = true;
      for (let i = 0; i < mf.length; i++) {
        const [moveName, shouldInclude] = mf[i]!;
        if (!moveName) continue;
        const hasMove = p.learntMoves.find((i) => i[0] === moveName);
        if (shouldInclude ? !hasMove : hasMove) {
          movesMatch = false;
          break;
        }
      }
      if (!movesMatch) continue;

      const sig = datasetData?.signatureItems[id];
      if (sigOnly() && !sig) continue;
      if (ip && !(sig ?? "").split(" / ").includes(ip)) continue;
      if (doozianOnly() && !(p as any).doozian) continue;
      if (typeChangedOnly() && !(p as any).typeChanged) continue;

      if (af.length > 0) {
        const sigItem = datasetData?.signatureItems[id];
        const sigAbilities = (sigItem && datasetData?.magicItems[sigItem]?.abilities) || [];

        let allMatch = true;
        let needsSignatureItem = false;

        for (let i = 0; i < af.length; i++) {
          const ability = af[i]!;
          if (p.abilities.includes(ability)) continue;
          if (sigAbilities.includes(ability)) {
            needsSignatureItem = true;
            continue;
          }
          allMatch = false;
          break;
        }
        if (!allMatch) continue;

        if (!needsSignatureItem || (or !== "a-z" && or !== "num")) {
          standardMons.push(p);
        } else {
          signatureItemMons.push(p);
        }
      } else {
        standardMons.push(p);
      }
    }

    const sortFn = (a: any, b: any) => {
      let i = 0;
      switch (or) {
        case "a-z":
          i = a.name.localeCompare(b.name);
          break;
        case "num":
          // Remix dex order (from the dex order board), not the game's numbers
          i = (a.dexOrder ?? 10000 + a.num) - (b.dexOrder ?? 10000 + b.num);
          break;
        case "hp":
          i = b.baseStats[0] - a.baseStats[0];
          break;
        case "atk":
          i = b.baseStats[1] - a.baseStats[1];
          break;
        case "def":
          i = b.baseStats[2] - a.baseStats[2];
          break;
        case "spa":
          i = b.baseStats[3] - a.baseStats[3];
          break;
        case "spd":
          i = b.baseStats[4] - a.baseStats[4];
          break;
        case "spe":
          i = b.baseStats[5] - a.baseStats[5];
          break;
        case "bst":
          i =
            b.baseStats.reduce((acc: number, cum: number) => acc + cum, 0) -
            a.baseStats.reduce((acc: number, cum: number) => acc + cum, 0);
          break;
      }
      return i * (reversed() ? -1 : 1);
    };

    standardMons.sort(sortFn);
    signatureItemMons.sort(sortFn);

    const result: PokemonRowItem[] = standardMons.map((p, i) => ({
      type: "item",
      data: p,
      famStart: or === "num" && i > 0 && p.family !== standardMons[i - 1].family,
    }));

    if (signatureItemMons.length > 0) {
      result.push({
        type: "header",
        label: `Gains the effects of ${af.join("/")} via a signature item`,
      });
      for (const p of signatureItemMons) {
        result.push({ type: "item", data: p });
      }
    }

    return result;
  });

  // how many Pokemon are listed, and how many separate evolution lines they come from (Megas count as their base)
  const counts = createMemo(() => {
    const pd = pokedex();
    const shown = groupedAndSorted().filter((r) => r.type === "item").map((r) => (r as any).data as PokemonData);
    if (!pd) return { mons: shown.length, lines: 0 };
    const byName: Record<string, any> = {};
    for (const p of Object.values(pd)) byName[p.name] = p;
    const roots = new Set<string>();
    for (const p of shown) {
      let n = p.name.replace(/-(Mega|Primal)(-[XY])?$/, "");
      if (!byName[n]) n = p.name;
      let guard = 0;
      while (byName[n]?.prevo && byName[byName[n].prevo] && guard++ < 6) n = byName[n].prevo;
      roots.add(n);
    }
    return { mons: shown.length, lines: roots.size };
  });

  const virtualizer = createVirtualizer({
    get count() {
      return groupedAndSorted()?.length ?? 0;
    },
    getScrollElement: () => parentRef,
    estimateSize: () => (statBars() ? ROW_H_BARS : 58),
  });

  // row height changes with the stat display: re-measure the list when it's switched
  createEffect(on(statBars, () => virtualizer.measure(), { defer: true }));

  const autoCompleteList = createMemo(() => Object.keys({ ...pokedex() }).toSorted());

  // everything the search box can suggest, Pokemon first (like the Showdown dex)
  const FILTERS = [
    { label: "Signature Item", tag: "Filter", kind: "filter", value: "sig" },
    { label: "Doozian Form", tag: "Filter", kind: "filter", value: "doozian" },
    { label: "Type Changed", tag: "Filter", kind: "filter", value: "typeChanged" },
  ];
  const suggestions = createMemo(() => {
    const pd = pokedex();
    if (!pd) return [];
    const ds = DATASET_IDS.find((i) => i.value === datasetId());
    const items = new Set<string>();
    for (const v of Object.values(ds?.signatureItems ?? {})) for (const i of v.split(" / ")) items.add(i);
    return [
      ...Object.values(pd).map((p) => ({ label: p.name, tag: "Pokémon", kind: "pokemon", value: p.name, rank: 0 })),
      ...TYPES.filter((t) => t.value).map((t) => ({ label: t.label, tag: "Type", kind: "type", value: t.value, rank: 1 })),
      ...abilityOptions().filter((o) => o.value).map((o) => ({ label: o.label, tag: "Ability", kind: "ability", value: o.value, rank: 2 })),
      ...moveOptions().filter((o) => o.value).map((o) => ({ label: o.label, tag: "Move", kind: "move", value: o.value, rank: 3 })),
      ...[...items].map((i) => ({ label: i, tag: "Item", kind: "item", value: i, rank: 4 })),
      ...FILTERS.map((f) => ({ ...f, rank: 5 })),
    ];
  });
  // a picked suggestion goes into the first free cell of its kind (a full row: the last cell is replaced)
  const put = <T,>(list: T[], v: T, empty: (x: T) => boolean, same: (x: T) => boolean) => {
    if (list.some(same)) return list;
    const next = [...list];
    const i = next.findIndex(empty);
    next[i < 0 ? next.length - 1 : i] = v;
    return next;
  };
  const pickSuggestion = (s: any) => {
    if (s.kind === "pokemon") { setSearchText(s.value); return; }
    setSearchText("");
    if (s.kind === "type") setTypesFilter((l) => put(l, s.value, (x) => !x, (x) => x === s.value));
    else if (s.kind === "ability") setAbilityFilter((l) => put(l, s.value, (x) => !x, (x) => x === s.value));
    else if (s.kind === "move") setMovesFilter((l) => put(l, [s.value, true] as [string, boolean], (x) => !x[0], (x) => x[0] === s.value));
    else if (s.kind === "item") setItemPick(s.value);
    else if (s.value === "sig") setSigOnly(true);
    else if (s.value === "doozian") setDoozianOnly(true);
    else if (s.value === "typeChanged") setTypeChangedOnly(true);
    setFiltersOpen(true);
  };
  // the cells' empty labels: (Type 1) (Type 2), (Ability 1-3), (Move 1-4)
  const named = (opts: Option[], label: string) => [{ value: "", label }, ...opts.filter((o) => o.value)];

  return (
    <>
      <div class="flex flex-col gap-1 p-1 pt-0">
        <div class="flex items-center gap-1">
          <Input
            value={searchText()}
            oninput={(e) => setSearchText(e.currentTarget.value)}
            suggest={suggestions()}
            onPick={pickSuggestion}
            max={10}
            placeholder="Search anything..."
            title="Pokémon, types, abilities, moves, items, or a filter (Signature Item, Doozian Form, Type Changed)"
          />
          <Button
            class="flex-none px-1.5 text-xs whitespace-nowrap"
            title={filtersOpen() ? "Hide the filters" : "Show the filters"}
            onclick={() => setFiltersOpen(!filtersOpen())}
          >
            Filters{activeCount() ? ` (${activeCount()})` : ""} {filtersOpen() ? "▴" : "▾"}
          </Button>
        </div>

        <Show when={filtersOpen()}>
        <div class="flex gap-1">
          <Index each={typesFilter()}>
            {(t, index) => (
              <Select
                options={named(TYPES.toSorted((a, b) => a.label.localeCompare(b.label)), `(Type ${index + 1})`)}
                value={t()}
                oninput={(e) =>
                  setTypesFilter((prev) => {
                    const next = [...prev];
                    next[index] = e.currentTarget.value;
                    return next;
                  })
                }
              />
            )}
          </Index>
        </div>

        <div class="flex gap-1">
          <Index each={abilityFilter()}>
            {(t, index) => (
              <Select
                options={named(abilityOptions(), `(Ability ${index + 1})`)}
                value={t()}
                oninput={(e) =>
                  setAbilityFilter((prev) => {
                    const next = [...prev];
                    next[index] = e.currentTarget.value;
                    return next;
                  })
                }
              />
            )}
          </Index>
        </div>

        <div class="grid grid-cols-2 gap-1">
          <Index each={movesFilter()}>
            {(t, index) => (
              <div class="flex gap-1">
                <Checkbox
                  checked={t()[1]}
                  title="Ticked: learns it. Crossed: doesn't learn it"
                  onchange={(e) =>
                    setMovesFilter((prev) => {
                      const next = [...prev];
                      next[index] = [next[index]![0], e.currentTarget.checked];
                      return next;
                    })
                  }
                />
                <Select
                  options={named(moveOptions(), `(Move ${index + 1})`)}
                  value={t()[0]}
                  oninput={(e) =>
                    setMovesFilter((prev) => {
                      const next = [...prev];
                      next[index] = [e.currentTarget.value, true];
                      return next;
                    })
                  }
                />
              </div>
            )}
          </Index>
        </div>

        <div class="flex gap-1">
          <Button class={cn("flex-1 text-xs", sigOnly() && "dz-filter-on font-bold")} onclick={() => setSigOnly(!sigOnly())}>
            Signature Item
          </Button>
          <Button class={cn("flex-1 text-xs", doozianOnly() && "dz-filter-on font-bold")} onclick={() => setDoozianOnly(!doozianOnly())}>
            Doozian Form
          </Button>
          <Button class={cn("flex-1 text-xs", typeChangedOnly() && "dz-filter-on font-bold")} onclick={() => setTypeChangedOnly(!typeChangedOnly())}>
            Type Changed
          </Button>
        </div>

        <Show when={itemPick() || activeCount()}>
          <div class="flex items-center gap-1 text-xs">
            <Show when={itemPick()}>
              <span class="flex-1 truncate">
                Holds: <b>{itemPick()}</b>{" "}
                <button type="button" class="cursor-pointer opacity-70 hover:opacity-100" title="Remove" onClick={() => setItemPick("")}>✕</button>
              </span>
            </Show>
            <button type="button" class="ml-auto cursor-pointer text-white/70 underline hover:text-white" onClick={clearFilters}>
              Clear filters
            </button>
          </div>
        </Show>
        </Show>

        <div class="flex gap-1">
          <For each={ORDERS}>
            {(o) => (
              <Button
                class={cn("flex-1 text-sm", order() === o.value && "font-bold")}
                onclick={() =>
                  order() === o.value ? setReversed((prev) => !prev) : setOrder(o.value)
                }
              >
                {o.label}
              </Button>
            )}
          </For>
        </div>

        <div class="flex items-center gap-1 text-sm font-bold">
          <div class="flex flex-1 flex-col text-center">
            <div>Click the Pokemon to see their changes on the Doozdex!</div>
            <div class="text-xs font-normal text-white/70">
              {counts().mons} Pokémon · {counts().lines} evolution line{counts().lines === 1 ? "" : "s"}
            </div>
          </div>
          <div class="flex flex-none flex-col gap-0.5">
            <Button class="text-xs" onclick={() => setStatBars(!statBars())}>
              {statBars() ? "Stat numbers" : "Stat bars"}
            </Button>
          </div>
        </div>
      </div>

      <div
        ref={(el) => (parentRef = el)}
        class={cn("flex-auto overflow-auto", groupedAndSorted().length > 0 && "border-t")}
      >
        <RowVirtualizer class="border-x" virtualizer={virtualizer} items={groupedAndSorted()}>
          {(d) =>
            d.type === "item" ? (
              <div class="relative h-full">
                <Show when={(d as any).famStart}>
                  <div class="dz-family-line pointer-events-none absolute right-0 left-0" style={{ "z-index": 50 }} />
                </Show>
                <Pokemon data={d.data} datasetId={props.datasetId} sheetId={sheetId()!} />
              </div>
            ) : (
              <div class="flex h-full flex-col items-center justify-center border-b text-center">
                <div class="text-xs font-bold">{d.label}</div>
                <div class="text-xs">
                  To see full effects of the item, click the Pokemon's icon!
                </div>
              </div>
            )
          }
        </RowVirtualizer>
      </div>
    </>
  );
};

function Checkbox(props: JSX.InputHTMLAttributes<HTMLInputElement>) {
  const [local, rest] = splitProps(props, ["class"]);

  return (
    <input
      type="checkbox"
      class={clsx(
        "h-4 w-4 flex-none cursor-pointer appearance-none self-center rounded-xs border border-white",
        "flex items-center justify-center",
        "bg-red-500 before:content-['✕']",
        "checked:bg-green-500 checked:text-black checked:before:content-['✓']",
        local.class,
      )}
      {...rest}
    />
  );
}
