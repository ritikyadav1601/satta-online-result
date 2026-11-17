// Seeds 1 year of random 2-digit results for Shivpuri & Janakpuri.
// Only fills days that have no value yet, so it is safe to run again.
// Usage: node scripts/seed-extra-games.mjs
import { readFileSync } from "node:fs";
import { setServers } from "node:dns";
import { MongoClient } from "mongodb";

const env = Object.fromEntries(
  readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split("\n")
    .filter((line) => line.includes("=") && !line.trim().startsWith("#"))
    .map((line) => [line.slice(0, line.indexOf("=")).trim(), line.slice(line.indexOf("=") + 1).trim().replace(/^["']|["']$/g, "")]),
);
const uri = process.env.EXTERNAL_GAME_MONGODB_URI || env.EXTERNAL_GAME_MONGODB_URI;
const dbName = process.env.EXTERNAL_GAME_MONGODB_DATABASE || env.EXTERNAL_GAME_MONGODB_DATABASE || "test";
if (!uri) throw new Error("EXTERNAL_GAME_MONGODB_URI missing");
if (uri.startsWith("mongodb+srv://")) setServers(["8.8.8.8", "1.1.1.1"]);

const KEYS = ["shivpuri", "janakpuri"];
const DAYS = 365;
const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
const shift = (date, days) => { const d = new Date(`${date}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + days); return d.toISOString().slice(0, 10); };

const client = await new MongoClient(uri, { serverSelectionTimeoutMS: 10000 }).connect();
try {
  const col = client.db(dbName).collection("sattaonline_extra_games");
  const start = shift(today, -DAYS), end = shift(today, -1);
  const existing = new Map((await col.find({ _id: { $gte: start, $lte: end } }).toArray()).map((d) => [d._id, d]));
  const ops = [];
  for (let i = DAYS; i >= 1; i--) {
    const date = shift(today, -i);
    const doc = existing.get(date);
    const set = {};
    for (const key of KEYS) if (!doc?.[key]) set[key] = String(Math.floor(Math.random() * 100)).padStart(2, "0");
    if (Object.keys(set).length) ops.push({ updateOne: { filter: { _id: date }, update: { $set: set }, upsert: true } });
  }
  if (ops.length) await col.bulkWrite(ops, { ordered: false });
  console.log(`Seeded ${ops.length} days (${start} -> ${end}) in ${dbName}.sattaonline_extra_games`);
} finally {
  await client.close();
}
