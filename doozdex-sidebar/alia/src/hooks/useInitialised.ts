export const useInitialised = () => {
  const ctx = useContext(InitialisedContext);
  if (ctx === undefined) throw new Error("useInitialised must be used within a DataProvider");
  return ctx;
};
