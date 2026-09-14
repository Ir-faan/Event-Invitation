import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";

// A previously installed node_modules may predate the HEIC dependency.
// Repair it before Vite scans the designer (which is also imported by the home page).
function missingPackages() {
  return ["vite", "heic-to"].filter((name) => {
    try { import.meta.resolve(name); return false; } catch { return true; }
  });
}

const missing = missingPackages();
if (missing.length) {
  console.log("Missing development dependencies: " + missing.join(", ") + ". Running npm ci before Vite starts…");
  const npm = process.platform === "win32" ? "npm.cmd" : "npm";
  const install = spawnSync(npm, ["ci"], { stdio: "inherit", timeout: 8 * 60_000, shell: false });
  if (install.error || install.status !== 0) {
    console.error("Could not install dependencies. Run npm ci in the repository, then npm run dev.");
    process.exit(install.status || 1);
  }
  if (!existsSync(new URL("../node_modules/heic-to/package.json", import.meta.url))
    || !existsSync(new URL("../node_modules/vite/package.json", import.meta.url))) {
    console.error("The dependencies are still missing. Check the npm install output above.");
    process.exit(1);
  }
}
