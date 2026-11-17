// import "@/assets/sheet.css";
import { DATASET_IDS } from "@/utils/constants";

export default defineContentScript({
  main() {},
  matches: DATASET_IDS.map(
    ({ sheetId }) => "https://docs.google.com/spreadsheets/d/" + sheetId + "*",
  ),
  runAt: "document_start",
});
