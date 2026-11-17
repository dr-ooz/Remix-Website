import { MovesContext } from "@/context/DataContext";

export const useMoves = () => {
  const ctx = useContext(MovesContext);
  if (ctx === undefined) throw new Error("useMoves must be used within a DataProvider");
  return ctx;
};
