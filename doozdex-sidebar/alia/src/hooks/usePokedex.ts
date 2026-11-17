export const usePokedex = () => {
  const ctx = useContext(PokedexContext);
  if (ctx === undefined) throw new Error("usePokedex must be used within a DataProvider");
  return ctx;
};
