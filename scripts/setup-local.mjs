import { spawnSync } from "node:child_process";
import { copyFileSync, constants, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseEnv } from "node:util";

const root = fileURLToPath(new URL("../", import.meta.url));
if (process.argv.length !== 2 && (process.argv.length !== 4 || process.argv[2] !== "--state-dir")) {
  throw new Error("Usage: npm run setup:local [-- --state-dir <path>]");
}
const stateDir = process.argv[3] ? path.resolve(process.argv[3]) : path.join(root, ".wrangler/state");

try {
  copyFileSync(path.join(root, ".env.example"), path.join(root, ".env.local"), constants.COPYFILE_EXCL);
  console.log("Created .env.local; add your own OpenAI API key to enable the support agent.");
} catch (error) {
  if (error.code !== "EEXIST") throw error;
  console.log("Keeping existing .env.local unchanged.");
}

function run(args, options = {}) {
  const result = spawnSync(process.execPath, args, { cwd: root, encoding: "utf8", ...options });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${args.at(-1)} failed:\n${result.stderr || result.stdout}`);
  }
  return result.stdout;
}

console.log("Building the local Worker...");
run(["scripts/run-framework.mjs", "build"], { stdio: "inherit" });

const wrangler = [
  "--import", "./scripts/sites-env.mjs", "./node_modules/wrangler/bin/wrangler.js",
  "d1", "execute", "DB", "--local", "--yes", "--json",
  "--config", "dist/server/wrangler.json", "--persist-to", stateDir,
];
function query(sql) {
  const output = JSON.parse(run([...wrangler, "--command", sql]));
  if (!output[0]?.success) throw new Error(`Local D1 query failed: ${sql}`);
  return output[0].results;
}

query("CREATE TABLE IF NOT EXISTS traceguard_local_migrations (name TEXT PRIMARY KEY)");
const migrations = [
  ["0000_black_crystal.sql", ["agents", "incident_actions"]],
  ["0001_parched_omega_flight.sql", ["agent_keys", "runs"]],
  ["0002_mighty_warpath.sql", ["support_daily_usage", "support_reviews"]],
];
for (const [file, tables] of migrations) {
  const existing = query(`SELECT name FROM sqlite_master WHERE type = 'table' AND name IN (${tables.map((table) => `'${table}'`).join(", ")})`);
  const applied = query(`SELECT name FROM traceguard_local_migrations WHERE name = '${file}'`).length > 0;
  if (applied && existing.length !== tables.length) {
    throw new Error(`${file} is recorded as applied, but its tables are missing. Inspect the local database before retrying.`);
  }
  if (!applied && existing.length === 0) {
    const output = JSON.parse(run([...wrangler, "--file", `drizzle/${file}`]));
    if (!output.every((item) => item.success)) throw new Error(`Migration ${file} failed.`);
    const created = query(`SELECT name FROM sqlite_master WHERE type = 'table' AND name IN (${tables.map((table) => `'${table}'`).join(", ")})`);
    if (created.length !== tables.length) throw new Error(`Migration ${file} did not create its expected tables.`);
  } else if (!applied && existing.length !== tables.length) {
    throw new Error(`${file} has only some expected tables. Inspect the local database before retrying.`);
  }
  if (!applied) query(`INSERT INTO traceguard_local_migrations (name) VALUES ('${file}')`);
  console.log(`${file}: ${applied ? "already applied" : "ready"}`);
}

const env = parseEnv(readFileSync(path.join(root, ".env.local"), "utf8"));
console.log(`Local database ready. Support model: ${env.OPENAI_API_KEY ? "key present" : "add OPENAI_API_KEY to .env.local"}. Run npm run dev.`);
