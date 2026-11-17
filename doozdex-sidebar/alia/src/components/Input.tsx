import { splitProps } from "solid-js";

// Edited copy (calc sidebar): no browser suggestion dropdown (it can't follow the theme).
// Screens can opt in to a themed suggestion list with `suggest` (names to offer) and
// `onPick` (called with the chosen name). `autocompleteList` is still accepted and ignored.
interface InputProps extends Solid.JSX.InputHTMLAttributes<HTMLInputElement> {
  autocompleteList?: string[];
  suggest?: string[];
  onPick?: (name: string) => void;
}

const key = (s: string) => s.normalize("NFD").toLowerCase().replace(/[^a-z0-9]/g, "");

export const Input = (props: InputProps) => {
  const [local, rest] = splitProps(props, ["class", "autocompleteList", "suggest", "onPick", "oninput", "onInput"]);
  const [text, setText] = createSignal("");
  const [open, setOpen] = createSignal(false);
  const [active, setActive] = createSignal(0);

  // names starting with what's typed first, then names containing it; 8 at most
  const matches = createMemo(() => {
    const q = key(text());
    if (!local.suggest || q.length < 2) return [];
    const starts: string[] = [], has: string[] = [];
    for (const n of local.suggest) {
      const k = key(n);
      if (k === q) continue;
      if (k.startsWith(q)) starts.push(n);
      else if (k.includes(q)) has.push(n);
    }
    return [...starts, ...has].slice(0, 8);
  });

  const pick = (n: string) => {
    setOpen(false);
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
                {n}
              </li>
            )}
          </For>
        </ul>
      </Show>
    </div>
  );
};
