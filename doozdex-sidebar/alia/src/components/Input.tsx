import { splitProps } from "solid-js";

// Edited copy (calc sidebar): no browser suggestion dropdown (it can't follow the theme).
// Screens can opt in to a themed suggestion list with `suggest` (names to offer) and
// `onPick` (called with the chosen name). `autocompleteList` is still accepted and ignored.
// a suggestion: a plain name, or {label, tag} (tag = a small grey word on the right: "Type", "Move"...)
export type Suggestion = string | { label: string; tag?: string; rank?: number; [k: string]: unknown };
interface InputProps extends Solid.JSX.InputHTMLAttributes<HTMLInputElement> {
  autocompleteList?: string[];
  suggest?: Suggestion[];
  onPick?: (item: any) => void;
  max?: number;
}
const labelOf = (s: Suggestion) => (typeof s === "string" ? s : s.label);

const key = (s: string) => s.normalize("NFD").toLowerCase().replace(/[^a-z0-9]/g, "");

export const Input = (props: InputProps) => {
  const [local, rest] = splitProps(props, ["class", "autocompleteList", "suggest", "onPick", "oninput", "onInput", "max"]);
  const [text, setText] = createSignal("");
  const [open, setOpen] = createSignal(false);
  const [active, setActive] = createSignal(0);

  // names starting with what's typed first, then names containing it; 8 at most
  const matches = createMemo(() => {
    const q = key(text());
    if (!local.suggest || q.length < 2) return [];
    // exact names first, then names starting with it, then names containing it; within each, by rank (kind)
    const exact: Suggestion[] = [], starts: Suggestion[] = [], has: Suggestion[] = [];
    for (const n of local.suggest) {
      const k = key(labelOf(n));
      if (k === q) { if (typeof n !== "string") exact.push(n); continue; }
      if (k.startsWith(q)) starts.push(n);
      else if (k.includes(q)) has.push(n);
    }
    const r = (x: Suggestion) => (typeof x === "string" ? 0 : x.rank ?? 0);
    const by = (a: Suggestion, b: Suggestion) => r(a) - r(b);
    return [...exact.sort(by), ...starts.sort(by), ...has.sort(by)].slice(0, local.max ?? 8);
  });

  const pick = (n: Suggestion) => {
    setOpen(false);
    if (typeof n !== "string") setText("");
    local.onPick?.(n);
  };

  return (
    <div class={cn("relative w-full min-w-0", local.class)}>
      <input
        class="w-full min-w-0 border-b p-1"
        autocomplete="off"
        {...rest}
        onInput={(e) => {
          setText(e.currentTarget.value);
          setOpen(true);
          setActive(0);
          const h = local.oninput ?? local.onInput;
          if (typeof h === "function") (h as (e: InputEvent & { currentTarget: HTMLInputElement }) => void)(e as any);
        }}
        onKeyDown={(e) => {
          const m = matches();
          if (!open() || !m.length) return;
          if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => (a + 1) % m.length); }
          else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => (a - 1 + m.length) % m.length); }
          else if (e.key === "Enter" || e.key === "Tab") { if (e.key === "Enter") e.preventDefault(); pick(m[active()]!); }
          else if (e.key === "Escape") setOpen(false);
        }}
        onBlur={() => setOpen(false)}
      />
      <Show when={open() && matches().length > 0}>
        <ul class="dz-suggest absolute top-full right-0 left-0 z-50 border" role="listbox">
          <For each={matches()}>
            {(n, i) => (
              <li
                role="option"
                aria-selected={i() === active()}
                class={cn("cursor-pointer px-1 py-0.5", i() === active() && "dz-suggest-on")}
                onMouseDown={(e) => { e.preventDefault(); pick(n); }}
                onMouseEnter={() => setActive(i())}
              >
                <span class="flex items-center justify-between gap-2">
                  <span>{labelOf(n)}</span>
                  {typeof n !== "string" && n.tag && <span class="text-[10px] italic opacity-60">{n.tag}</span>}
                </span>
              </li>
            )}
          </For>
        </ul>
      </Show>
    </div>
  );
};
