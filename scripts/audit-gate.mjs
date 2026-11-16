// Fails the build on high or critical npm advisories in production dependencies, except advisories listed below.
// Each exception needs a reason and a review date: an accepted risk is a decision, not a way to turn the check off.
//   node scripts/audit-gate.mjs                 runs `npm audit --omit=dev --json`
//   node scripts/audit-gate.mjs --file x.json   reads saved `npm audit --json` output (used by the self-test)
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const ACCEPTED = {
  "GHSA-mrhx-c7xc-m3w5": {
    package: "zod",
    reason:
      "Memory exhaustion when validating very large arrays/records. Our three schemas (admission, invoice, payment forms) " +
      "contain no arrays or records, and the fix needs zod 4 plus a matching @hookform/resolvers upgrade.",
    reviewBy: "2027-02-01",
  },
};
const BLOCKING = new Set(["high", "critical"]);

function loadAudit() {
  const fileFlag = process.argv.indexOf("--file");
  if (fileFlag !== -1) return JSON.parse(readFileSync(process.argv[fileFlag + 1], "utf8"));
  try {
    return JSON.parse(execFileSync("npm", ["audit", "--omit=dev", "--json"], { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }));
  } catch (error) {
    // npm audit exits non-zero when it finds anything; the JSON is still on stdout.
    if (error.stdout) return JSON.parse(error.stdout);
    throw error;
  }
}

const advisoryId = (url = "") => (url.match(/GHSA-[a-z0-9-]+/i) || [""])[0];

export function evaluate(audit, today = new Date()) {
  const blocking = new Map();
  const accepted = new Map();
  const expired = [];
  for (const [name, vuln] of Object.entries(audit.vulnerabilities || {})) {
    for (const via of vuln.via || []) {
      if (typeof via === "string" || !BLOCKING.has(via.severity)) continue; // transitive pointer or low severity
      const id = advisoryId(via.url);
      const exception = ACCEPTED[id];
      if (exception) {
        accepted.set(id, { name, title: via.title, ...exception });
        if (new Date(exception.reviewBy) < today) expired.push(id);
      } else {
        blocking.set(id || `${name}:${via.title}`, { name, severity: via.severity, title: via.title, url: via.url });
      }
    }
  }
  return { blocking: [...blocking.values()], accepted: [...accepted.entries()], expired };
}

if (process.argv[1] && process.argv[1].endsWith("audit-gate.mjs")) {
  const { blocking, accepted, expired } = evaluate(loadAudit());
  for (const [id, info] of accepted) console.log(`accepted  ${id}  ${info.package}: ${info.reason} (review by ${info.reviewBy})`);
  for (const id of expired) console.log(`EXPIRED   ${id}: the review date has passed, decide again`);
  for (const b of blocking) console.log(`BLOCKING  ${b.severity.padEnd(8)} ${b.name}: ${b.title} ${b.url || ""}`);
  if (blocking.length || expired.length) {
    console.log(`\n${blocking.length} blocking advisory(ies), ${expired.length} expired exception(s).`);
    process.exit(1);
  }
  console.log("\nNo blocking advisories in production dependencies.");
}
