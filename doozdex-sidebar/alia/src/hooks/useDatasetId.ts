import { DatasetIdContext } from "@/context/DataContext";

export const useDatasetId = () => {
  const ctx = useContext(DatasetIdContext);
  if (ctx === undefined) throw new Error("useDatasetId must be used within a DataProvider");
  return ctx;
};
