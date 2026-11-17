interface ButtonProps extends Solid.JSX.ButtonHTMLAttributes<HTMLButtonElement> {}

export const Button = (props: ButtonProps) => {
  const [local, rest] = splitProps(props, ["class"]);

  return (
    <button
      class={cn(
        "flex min-w-0 cursor-pointer items-center justify-center rounded border text-center disabled:cursor-default disabled:opacity-50",
        local.class,
      )}
      {...rest}
    />
  );
};
