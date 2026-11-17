export const nameToId = (name: string): string => {
  const id = name.toLowerCase().replace(/[^a-z0-9]+/g, "");
  return RENAME[id] ?? id;
};

export const toName = (str: string): string => {
  return str[0]!.toUpperCase() + str.slice(1).toLowerCase();
};

export const greaterThan130BP = (value: number): number => {
  if (value < 0) {
    if (value === -71) return 1;
    return value + 256;
  }
  return value;
};
