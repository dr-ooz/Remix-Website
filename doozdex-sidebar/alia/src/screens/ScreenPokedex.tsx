import { statBars, setStatBars, ROW_H_BARS } from "../components/Pokemon";
import { createVirtualizer } from "@tanstack/solid-virtual";
import clsx from "clsx";
import type { JSX } from "solid-js/jsx-runtime";
import { useItemInfo, itemIconUrl } from "@/utils/calcData";

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

type PokemonRowItem =
  | { type: "item"; data: PokemonData; famStart?: boolean }
  | { type: "header"; label: string }
  | { type: "itemhead"; name: string; icon: string; desc: string }
  | { type: "forms"; key: string; species: string; n: number; open: boolean };
const ITEM_HEAD_H = 80; // an item's row: its icon (72px) + its name and up to 4 lines of its in-game description
const FORMS_H = 26; // the "show / hide forms" row under Furfrou / Minior
// species with many look-alike forms: folded under the first one (folded by default in the item groups)
const FOLD_SPECIES = ["Furfrou", "Minior"];
const cycle = (v: number) => (v === 0 ? 1 : v === 1 ? -1 : 0); // a main filter: off -> on -> reversed -> off

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

  // the three main filters: 0 off, 1 only those, -1 only those without (click: on -> reversed -> off),
  // and a picked item (shows the Pokemon that hold it)
  const [sigState, setSigState] = createSignal(0);
  const [doozState, setDoozState] = createSignal(0);
  const [tcState, setTcState] = createSignal(0);
  const itemView = () => sigState() === 1 || !!itemPick(); // the item groups
  // the item groups' order: featured (semi-signature first, then dex order), most / fewest holders, A-Z
  const [itemSort, setItemSort] = createSignal<"featured" | "most" | "fewest" | "az">("featured");
  // Furfrou / Minior forms: folded in the item groups, open elsewhere, unless the viewer flips one
  const [formsFlip, setFormsFlip] = createSignal<Record<string, boolean>>({});
  const [itemPick, setItemPick] = createSignal("");
  // Mega: only Mega Evolutions, each under its base form (the base forms can be hidden)
  const [megaOnly, setMegaOnly] = createSignal(false);
  const [hideBase, setHideBase] = createSignal(false);
  const itemInfo = useItemInfo();
  // the filter block can fold away (remembered)
  const [filtersOpen, setFiltersOpenRaw] = createSignal((() => { try { return localStorage.getItem("dzFiltersOpen") !== "0"; } catch { return true; } })());
  const setFiltersOpen = (v: boolean) => { setFiltersOpenRaw(v); try { localStorage.setItem("dzFiltersOpen", v ? "1" : "0"); } catch { /* private mode */ } };
  const activeCount = () =>
    typesFilter().filter(Boolean).length + abilityFilter().filter(Boolean).length + movesFilter().filter((m) => m[0]).length +
    (sigState() ? 1 : 0) + (doozState() ? 1 : 0) + (tcState() ? 1 : 0) + (itemPick() ? 1 : 0) + (megaOnly() ? 1 : 0);
  const clearFilters = () => {
    setTypesFilter(["", ""]); setAbilityFilter(["", "", ""]); setMovesFilter([["", true], ["", true], ["", true], ["", true]]);
    setSigState(0); setDoozState(0); setTcState(0); setItemPick(""); setMegaOnly(false);
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
      if (sigState() === 1 && !sig) continue;
      if (sigState() === -1 && sig) continue;
      if (ip && !(sig ?? "").split(" / ").includes(ip)) continue;
      if (doozState() !== 0 && !!(p as any).doozian !== (doozState() === 1)) continue;
      if (tcState() !== 0 && !!(p as any).typeChanged !== (tcState() === 1)) continue;
      // a Mega has to hold its Mega Stone, so it never shows with a signature item
      if ((sigState() === 1 || ip) && /-Mega(-[XY])?$/.test(p.name)) continue;
      if (megaOnly() && !/-Mega(-[XY])?$/.test(p.name)) continue;

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

    let rows = result;

    // Mega: each Mega under its base form (once per base: Charizard over both Megas), unless base forms are hidden
    if (megaOnly() && !hideBase()) {
      const seen = new Set<string>(), out: PokemonRowItem[] = [];
      for (const r of rows) {
        if (r.type === "item") {
          const base = data[nameToId((r.data as any).baseSpecies || r.data.name.replace(/-Mega(-[XY])?$/, ""))];
          if (base && !seen.has(base.name)) {
            seen.add(base.name);
            out.push({ type: "item", data: base, famStart: out.length > 0 });
          }
          out.push({ ...r, famStart: false });
        } else out.push(r);
      }
      rows = out;
    }

    // Signature Item / a picked item: the Pokemon grouped by item, each group under a row with the item's icon and
    // in-game description. Semi-signature items (type boosters, weather rocks, seeds...) first, the rest by dex order.
    if (sigState() === 1 || ip) {
      const info = itemInfo() ?? {};
      const mons = [...rows.filter((r) => r.type === "item").map((r) => (r as any).data as PokemonData), ...signatureItemMons];
      const groups = new Map<string, PokemonData[]>();
      mons.forEach((p) => {
        for (const it of (datasetData?.signatureItems[nameToId(p.name)] ?? "").split(" / ")) {
          if (!it || (ip && it !== ip)) continue;
          if (!groups.has(it)) groups.set(it, []);
          if (!groups.get(it)!.includes(p)) groups.get(it)!.push(p);
        }
      });
      const firstAt = (it: string) => mons.indexOf(groups.get(it)![0]!);
      // how many separate evolution lines hold it (Megas count as their base)
      const lineOf = (n: string) => {
        let x = n.replace(/-(Mega|Primal)(-[XY])?$/, "");
        if (!data[nameToId(x)]) x = n;
        let g = 0;
        while ((data[nameToId(x)] as any)?.prevo && data[nameToId((data[nameToId(x)] as any).prevo)] && g++ < 6) x = (data[nameToId(x)] as any).prevo;
        return x;
      };
      const lines = (it: string) => new Set(groups.get(it)!.map((p) => lineOf(p.name))).size;
      const featured = (a: string, b: string) => (info[a]?.semi ?? 1e3) - (info[b]?.semi ?? 1e3) || firstAt(a) - firstAt(b);
      const isort = itemSort();
      const items = [...groups.keys()].sort((a, b) =>
        isort === "az" ? a.localeCompare(b)
        : isort === "most" ? lines(b) - lines(a) || groups.get(b)!.length - groups.get(a)!.length || featured(a, b)
        : isort === "fewest" ? lines(a) - lines(b) || groups.get(a)!.length - groups.get(b)!.length || featured(a, b)
        : featured(a, b));
      rows = [];
      for (const it of items) {
        rows.push({ type: "itemhead", name: it, icon: itemIconUrl(info[it]?.icon), desc: info[it]?.desc ?? "" });
        groups.get(it)!.forEach((p, i, l) =>
          rows.push({ type: "item", data: p, famStart: i > 0 && (p as any).family !== (l[i - 1] as any).family }));
      }
    }

    // Furfrou / Minior: the first form, a "show / hide forms" row, then the rest only while open
    const speciesOf = (p: PokemonData) => FOLD_SPECIES.find((f) => p.name === f || p.name.startsWith(f + "-"));
    if (rows.some((r) => r.type === "item" && speciesOf((r as any).data))) {
      const blockKey: string[] = [], counts: Record<string, number> = {};
      let block = 0;
      rows.forEach((r, i) => {
        if (r.type === "itemhead") block++;
        const sp = r.type === "item" ? speciesOf((r as any).data) : undefined;
        blockKey[i] = sp ? block + ":" + sp : "";
        if (sp) counts[blockKey[i]!] = (counts[blockKey[i]!] ?? 0) + 1;
      });
      const out: PokemonRowItem[] = [], seen = new Set<string>();
      const defOpen = !(sigState() === 1 || ip);
      rows.forEach((r, i) => {
        const k = blockKey[i]!;
        if (!k || counts[k]! < 2) { out.push(r); return; }
        const open = formsFlip()[k.split(":")[1]!] ?? defOpen;
        if (!seen.has(k)) {
          seen.add(k);
          out.push(r);
          out.push({ type: "forms", key: k, species: k.split(":")[1]!, n: counts[k]! - 1, open });
          return;
        }
        if (open) out.push({ ...(r as any), famStart: false });
      });
      rows = out;
    }

    return rows;
  });

  // how many Pokemon are listed, and how many separate evolution lines they come from (Megas count as their base)
  const counts = createMemo(() => {
    const pd = pokedex();
    const shown = [...new Set(groupedAndSorted().filter((r) => r.type === "item").map((r) => (r as any).data as PokemonData))];
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
    estimateSize: (i) => {
      const t = groupedAndSorted()[i]?.type;
      return t === "itemhead" ? ITEM_HEAD_H : t === "forms" ? FORMS_H : statBars() ? ROW_H_BARS : 58;
    },
  });

  // row height changes with the stat display: re-measure the list when it's switched
  createEffect(on([statBars, groupedAndSorted], () => virtualizer.measure(), { defer: true }));

  const autoCompleteList = createMemo(() => Object.keys({ ...pokedex() }).toSorted());

  // everything the search box can suggest, Pokemon first (like the Showdown dex)
  const FILTERS = [
    { label: "Signature Item", tag: "Filter", kind: "filter", value: "sig" },
    { label: "Doozian Form", tag: "Filter", kind: "filter", value: "doozian" },
    { label: "Type Changed", tag: "Filter", kind: "filter", value: "typeChanged" },
    { label: "Mega", tag: "Filter", kind: "filter", value: "mega" },
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
    else if (s.value === "sig") setSigState(1);
    else if (s.value === "doozian") setDoozState(1);
    else if (s.value === "typeChanged") setTcState(1);
    else if (s.value === "mega") setMegaOnly(true);
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
          <Show when={activeCount()}>
            <Button class="flex-none px-1.5 py-0 text-[10px] leading-[1.05] whitespace-nowrap" title="Clear every filter" onclick={clearFilters}>
              <span class="flex flex-col"><span>Clear</span><span>Filters</span></span>
            </Button>
          </Show>
          <Button
            class={cn("flex-none px-1.5 py-0 whitespace-nowrap", activeCount() && "dz-filter-on")}
            title={filtersOpen() ? "Hide the filters" : "Show the filters"}
            onclick={() => setFiltersOpen(!filtersOpen())}
          >
            <span class="flex flex-col text-[10px] leading-[1.05]">
              <span>{filtersOpen() ? "Hide" : "Show"}</span>
              <span>Filters{activeCount() ? ` (${activeCount()})` : ""}</span>
            </span>
          </Button>
        </div>

        <Show when={filtersOpen()}>
        <div class="flex gap-1">
          <Index each={typesFilter()}>
            {(t, index) => (
              <div class="flex min-w-0 flex-1 items-center gap-0.5">
                <Show when={t()}>
                  <button type="button" class="dz-x" title="Remove" onClick={() => setTypesFilter((prev) => prev.map((x, i) => (i === index ? "" : x)))}>✕</button>
                </Show>
                <Select
                  class={cn(t() && "dz-set")}
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
              </div>
            )}
          </Index>
        </div>

        <div class="flex gap-1">
          <Index each={abilityFilter()}>
            {(t, index) => (
              <div class="flex min-w-0 flex-1 items-center gap-0.5">
                <Show when={t()}>
                  <button type="button" class="dz-x" title="Remove" onClick={() => setAbilityFilter((prev) => prev.map((x, i) => (i === index ? "" : x)))}>✕</button>
                </Show>
                <Select
                  class={cn(t() && "dz-set")}
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
              </div>
            )}
          </Index>
        </div>

        <div class="grid grid-cols-2 gap-1">
          <Index each={movesFilter()}>
            {(t, index) => (
              <div class="flex min-w-0 items-center gap-0.5">
                <Show when={t()[0]}>
                  <button type="button" class="dz-x" title="Remove" onClick={() => setMovesFilter((prev) => prev.map((x, i) => (i === index ? ["", true] as [string, boolean] : x)))}>✕</button>
                </Show>
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
                  class={cn(t()[0] && (t()[1] ? "dz-set" : "dz-set-not"))}
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
          <For each={[
            { on: "Signature Item", off: "No Signature Item", v: sigState, set: setSigState },
            { on: "Doozian Form", off: "Not Doozian", v: doozState, set: setDoozState },
            { on: "Type Changed", off: "Type Unchanged", v: tcState, set: setTcState },
          ]}>
            {(f) => (
              <Button
                class={cn("flex-1 text-xs", f.v() === 1 && "dz-filter-on font-bold", f.v() === -1 && "dz-filter-not font-bold")}
                title="Click: only these · again: only the ones without · again: off"
                onclick={() => f.set(cycle(f.v()))}
              >
                {f.v() === -1 ? f.off : f.on}
              </Button>
            )}
          </For>
          <Show when={megaOnly()}>
            <Button class="dz-filter-on flex-none px-2 text-xs font-bold" title="Remove the Mega filter" onclick={() => setMegaOnly(false)}>
              Mega ✕
            </Button>
          </Show>
        </div>

        <Show when={itemPick()}>
          <div class="flex items-center gap-1 text-xs">
            <button type="button" class="dz-x" title="Remove" onClick={() => setItemPick("")}>✕</button>
            <span class="flex-1 truncate">Holds: <b>{itemPick()}</b></span>
          </div>
        </Show>
        </Show>

        <div class="flex gap-1">
          <For each={ORDERS}>
            {(o) => (
              <Button
                class={cn("flex-1 text-sm", order() === o.value && "dz-filter-on font-bold")}
                onclick={() =>
                  order() === o.value ? setReversed((prev) => !prev) : setOrder(o.value)
                }
              >
                {o.label}
                {order() === o.value && <span class="text-[9px]">{reversed() ? "▼" : "▲"}</span>}
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
            <Show when={megaOnly()}>
              <button type="button" class="mx-auto cursor-pointer text-xs font-normal text-white/80 underline hover:text-white" onClick={() => setHideBase(!hideBase())}>
                {hideBase() ? "Base forms hidden (click to show)" : "Base forms shown (click to hide)"}
              </button>
            </Show>
            <Show when={itemView()}>
              <div class="mt-0.5 flex items-center justify-center gap-1 text-[11px] font-normal">
                <span class="text-white/60">Items:</span>
                <For each={[["featured", "Featured"], ["most", "Most holders"], ["fewest", "Fewest holders"], ["az", "A-Z"]] as const}>
                  {([v, l]) => (
                    <button
                      type="button"
                      class={cn("cursor-pointer rounded border px-1", itemSort() === v && "dz-filter-on font-bold")}
                      title={v === "featured" ? "Type boosters, weather rocks, seeds... first, then dex order" : v === "az" ? "By item name" : "By how many evolution lines hold it"}
                      onClick={() => setItemSort(v)}
                    >
                      {l}
                    </button>
                  )}
                </For>
              </div>
            </Show>
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
            ) : d.type === "forms" ? (
              <button
                type="button"
                class="flex h-full w-full cursor-pointer items-center justify-center border-b text-[11px] text-white/75 hover:bg-white/5 hover:text-white"
                onClick={() => setFormsFlip((m) => ({ ...m, [d.species]: !d.open }))}
              >
                {d.open ? `▴ Hide the other ${d.species} forms` : `▾ Show ${d.n} more ${d.species} form${d.n === 1 ? "" : "s"}`}
              </button>
            ) : d.type === "itemhead" ? (
              <div class="dz-itemhead flex h-full items-center gap-2 border-b px-2">
                <div
                  class="h-[72px] w-[72px] flex-none bg-contain bg-center bg-no-repeat"
                  style={{ "background-image": d.icon ? `url(${d.icon})` : undefined, "image-rendering": "pixelated" }}
                  title={d.name}
                />
                <div class="min-w-0 flex-auto">
                  <div class="text-[13px] leading-tight font-bold">{d.name}</div>
                  <div class="line-clamp-4 text-[11px] leading-[1.2] text-white/80">{d.desc}</div>
                </div>
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
