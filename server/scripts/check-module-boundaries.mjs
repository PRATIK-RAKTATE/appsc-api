import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

const files = execFileSync("rg", ["--files", "src", "-g", "*.js"], {
  encoding: "utf8",
}).trim().split("\n").filter(Boolean);

const moduleOf = (file) => file.match(/^src\/modules\/([^/]+)\//)?.[1] ?? null;
const violations = [];

for (const file of files) {
  const source = readFileSync(file, "utf8");
  const sourceModule = moduleOf(file);

  for (const match of source.matchAll(/["'](\.\.?\/[^"']+\.js)["']/g)) {
    const target = path.posix.normalize(path.posix.join(path.posix.dirname(file), match[1]));
    const targetModule = moduleOf(target);

    if (
      sourceModule &&
      targetModule &&
      sourceModule !== targetModule &&
      target !== `src/modules/${targetModule}/index.js`
    ) {
      violations.push(`${file} deep-imports ${target}`);
    }

    if (
      (file.startsWith("src/shared/") || file.startsWith("src/config/")) &&
      targetModule
    ) {
      violations.push(`${file} imports feature module ${targetModule}`);
    }
  }
}

if (violations.length) {
  console.error("Module boundary violations:\n" + violations.join("\n"));
  process.exit(1);
}

console.log("Module boundaries are valid.");
