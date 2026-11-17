export interface Option<T extends string = string> {
  value: T;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends Solid.JSX.SelectHTMLAttributes<HTMLSelectElement> {
  options: Option[];
}

export const Select = (props: SelectProps) => {
  const [local, rest] = splitProps(props, ["class", "options"]);

  return (
    <select
      class={cn(
        "w-full min-w-0 cursor-pointer rounded border px-1 text-center disabled:opacity-50",
        local.class,
      )}
      {...rest}
    >
      <For each={local.options}>
        {(option) => <option value={option.value}>{option.label}</option>}
      </For>
    </select>
  );
};
