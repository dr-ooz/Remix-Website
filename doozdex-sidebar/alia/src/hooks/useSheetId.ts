import { SheetIdContext } from "@/context/DataContext";

export const useSheetId = () => {
  const ctx = useContext(SheetIdContext);
  if (ctx === undefined) throw new Error("useSheetId must be used within a DataProvider");
  return ctx;
};
