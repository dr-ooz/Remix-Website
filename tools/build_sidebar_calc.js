// The DoozDex sidebar's calc-backed data, worked out by the calc's own engine (calc/dist) so the sidebar always
// matches the calc:
//  - type charts: for every Pokemon, each of its abilities x each of its matchup items (and none), the same way the
//    calc page's type chart does it (src/js/remix_typechart.js): damage to the Pokemon / damage to a typeless copy
//    with no ability or item, with across-the-board factors (Fur Coat, Multiscale...) divided out
//  - moves: effective power the way the AI sees it (fixed multi-hits x their hits, 2-5 hits x3, always-crit x1.5)
//
//   node tools/build_sidebar_calc.js     (run by doozdex-sidebar/build_data.py after it writes data.json)
//
// In:  src/doozdex-sidebar/data.json (the sidebar's Pokemon / moves)   Out: src/doozdex-sidebar/calc_data.json
const fs = require("fs");
const path = require("path");
const calc = require("../calc/dist/index.js");

const ROOT = path.join(__dirname, "..");
const DATA = path.join(ROOT, "src", "doozdex-sidebar", "data.json");
const OUT = path.join(ROOT, "src", "doozdex-sidebar", "calc_data.json");
const gen = calc.Generations.get(7);
const TYPES = ["Normal", "Fire", "Water", "Electric", "Grass", "Ice", "Fighting", "Poison", "Ground", "Flying",
  "Psychic", "Bug", "Rock", "Ghost", "Dragon", "Dark", "Steel", "Fairy"];

const data = JSON.parse(fs.readFileSync(DATA, "utf8"));
const field = new calc.Field();
const attacker = new calc.Pokemon(gen, "Mew", {level: 100, nature: "Serious", evs: {atk: 252}, overrides: {types: ["???"]}});

function damage(defender, type) {
  const move = new calc.Move(gen, "Rock Tomb", {overrides: {type, basePower: 200}});
  try { return calc.calculate(gen, attacker, defender, move, field).range()[1]; } catch (e) { return NaN; }
}
function variant(base, {ability, item, typeless}) {
  const d = base.clone();
  d.ability = ability || "(No Ability)"; // not undefined: the engine refills a blank ability with the species default
  d.item = item || undefined;
  if (typeless) {
    d.species = Object.assign({}, d.species, {types: ["???", "???"]});
    d.types = ["???", "???"];
    d.teraType = undefined;
  }
  d.originalCurHP = d.maxHP(); // full HP (Multiscale etc. count as at full)
  return d;
}
function snap(x) { // 2, 0.5, 0.25 ... snapped; odd values (Filter's 1.5) kept
  if (!(x > 0)) return x === 0 ? 0 : NaN;
  const l = Math.log2(x), r = Math.round(l);
  return Math.abs(l - r) < 0.06 ? Math.pow(2, r) : Math.round(x * 100) / 100;
}
function makeMon(p) {
  const ALIAS = {"Minior": "Minior-Meteor", "Minior-Red": "Minior-Twinkle"}; // sidebar name -> calc name
  for (const n of [ALIAS[p.name], p.name, p.name + "-Shield", p.baseSpecies]) {
    if (!n) continue;
    try {
      const m = new calc.Pokemon(gen, n, {level: 100});
      if (m.species && m.species.baseStats) return m;
    } catch (e) { /* next name */ }
  }
  return null;
}

const out = {charts: {}, movePower: {}, grants: {}};
let done = 0, missing = [];
for (const [id, p] of Object.entries(data.pokedex)) {
  const mon = makeMon(p);
  if (!mon) { missing.push(p.name); continue; }
  const ref = variant(mon, {typeless: true});
  const bases = TYPES.map((t) => damage(ref, t));
  const items = [...new Set((p.typeItems || []).map((i) => i.name))];
  const abilities = [...new Set(p.abilities.filter(Boolean))];
  const generic = (ab, it) => { // the factor most types share on a typeless copy with this ability / item
    if (!ab && !it) return 1;
    const tl = variant(mon, {ability: ab, item: it, typeless: true});
    const count = {};
    let best = "1", n = 0;
    TYPES.forEach((t, i) => {
      if (!(bases[i] > 0)) return;
      const k = (damage(tl, t) / bases[i]).toFixed(3);
      count[k] = (count[k] || 0) + 1;
      if (count[k] > n) { n = count[k]; best = k; }
    });
    const g = parseFloat(best);
    return g > 0 ? g : 1;
  };
  const chart = (ab, it) => {
    const d = variant(mon, {ability: ab, item: it});
    const g = generic(ab, it);
    return TYPES.map((t, i) => (bases[i] > 0 ? snap(damage(d, t) / bases[i] / g) : 1));
  };
  const base = chart("", "");
  const entry = {"|": base};
  for (const ab of ["", ...abilities]) {
    for (const it of ["", ...items]) {
      if (!ab && !it) continue;
      const c = chart(ab, it);
      if (c.some((v, i) => v !== base[i])) entry[ab + "|" + it] = c;
    }
  }
  out.charts[id] = entry;
  // abilities that include other abilities' effects for this Pokemon (Star Power -> Levitate, Stance Change ->
  // Sharpness / Battle Armor + Levitate, Power Construct per form...), straight from the calc
  for (const ab of abilities) {
    try {
      const g = new calc.Pokemon(gen, mon.name, {level: 100, ability: ab}).remixGrantedAbilities();
      if (g && g.length) (out.grants[id] = out.grants[id] || {})[ab] = g;
    } catch (e) { /* no grants */ }
  }
  if (++done % 100 === 0) process.stdout.write(done + " ");
}

// effective power, the way the AI counts it
for (const [id, m] of Object.entries(data.moves)) {
  const gm = gen.moves.get(calc.toID(m.name));
  const bp = m.power || 0;
  if (!bp) continue;
  const mh = gm && gm.multihit;
  const hits = Array.isArray(mh) ? (mh[1] >= 5 ? 3 : mh[1]) : mh || 1;
  const crit = gm && gm.willCrit ? 1.5 : 1;
  const eff = Math.round(bp * hits * crit);
  if (eff !== bp) out.movePower[id] = eff;
}

fs.writeFileSync(OUT, JSON.stringify(out));
console.log("\nsidebar calc data:", done, "Pokemon charts,", Object.keys(out.movePower).length, "moves with a different effective power ->", OUT);
if (missing.length) console.log("not in the calc:", missing.join(", "));
