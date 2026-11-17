import { render } from "solid-js/web";
import { App } from "@/entrypoints/sidepanel/App";
import "@/assets/tailwind.css";
import "./theme.css";

// Follow the calc's light/dark mode (body.dark on the page around this iframe).
// Opened on its own, it defaults to dark.
const syncTheme = () => {
  let dark = true;
  try {
    if (window.parent !== window) dark = window.parent.document.body.classList.contains("dark");
  } catch {}
  document.documentElement.dataset.theme = dark ? "dark" : "light";
};
syncTheme();
try {
  if (window.parent !== window)
    new MutationObserver(syncTheme).observe(window.parent.document.body, {
      attributes: true,
      attributeFilter: ["class"],
    });
} catch {}

render(() => <App />, document.getElementById("root")!);
