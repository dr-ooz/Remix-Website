// calc_data.json, built by tools/build_sidebar_calc.js with the calc's own engine (so the sidebar matches the calc):
//  charts[pokemon id]["ability|item"] = 18 multipliers in CHART_TYPES order ("|" = types alone; a combo is only
//  listed when it changes something), movePower[move id] = effective power the way the AI counts it.
export const CHART_TYPES = ["Normal", "Fire", "Water", "Electric", "Grass", "Ice", "Fighting", "Poison", "Ground",
  "Flying", "Psychic", "Bug", "Rock", "Ghost", "Dragon", "Dark", "Steel", "Fairy"];

type CalcData = { charts: Record<string, Record<string, number[]>>; movePower: Record<string, number> };
const [calcData, setCalcData] = createSignal<CalcData | null>(null);
let started = false;
export const useCalcData = () => {
  if (!started) {
    started = true;
    fetch(((globalThis as any).__DZ_BASE ?? "") + "calc_data.json", { cache: "no-cache" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setCalcData(d))
      .catch(() => { /* the sidebar still works without it */ });
  }
  return calcData;
};

// items.json (build_data.py): signature item -> {icon (img/items/bitem_<id>.png), in-game description, semi rank}
export type ItemInfo = { icon?: number; desc: string; order?: number; group?: number };
const [itemInfo, setItemInfo] = createSignal<Record<string, ItemInfo> | null>(null);
let itemsStarted = false;
export const useItemInfo = () => {
  if (!itemsStarted) {
    itemsStarted = true;
    fetch(((globalThis as any).__DZ_BASE ?? "") + "items.json", { cache: "no-cache" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setItemInfo(d))
      .catch(() => { /* no item rows then */ });
  }
  return itemInfo;
};
// the site's item icon (the sidebar lives in doozdex-sidebar/, the icons in img/items/)
export const itemIconUrl = (id?: number) => (id ? ((globalThis as any).__DZ_BASE ?? "") + "../img/items/bitem_" + id + ".png" : "");

// effect_cats.json (build_data.py): the Move Guide's categories in order, each with its moves in guide order
export type EffectCat = { name: string; moves: string[] };
const [effectCats, setEffectCats] = createSignal<EffectCat[] | null>(null);
let catsStarted = false;
export const useEffectCats = () => {
  if (!catsStarted) {
    catsStarted = true;
    fetch(((globalThis as any).__DZ_BASE ?? "") + "effect_cats.json", { cache: "no-cache" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setEffectCats(d))
      .catch(() => { /* Effect falls back to the plain guide order */ });
  }
  return effectCats;
};
