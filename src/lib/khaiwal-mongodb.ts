import { MongoClient } from "mongodb";
import { setServers } from "node:dns";

export type KhaiwalSettings = {
  name: string;
  whatsapp: string;
};

const databaseName = process.env.KHAIWAL_MONGODB_DATABASE || "khaiwal_management";
const collectionName = "site_settings";
export const DEFAULT_SITE_ID = "www.sattaonlineresult.com";

declare global {
  var khaiwalMongoClientPromise: Promise<MongoClient> | undefined;
}

export async function getKhaiwalDatabase() {
  const uri = process.env.KHAIWAL_MONGODB_URI?.trim();
  if (!uri) throw new Error("KHAIWAL_MONGODB_URI is not configured.");
  if (uri.startsWith("mongodb+srv://")) setServers(["8.8.8.8", "1.1.1.1"]);
  const connect = () => new MongoClient(uri, { serverSelectionTimeoutMS: 5000 }).connect();
  global.khaiwalMongoClientPromise ||= connect();
  try {
    return (await global.khaiwalMongoClientPromise).db(databaseName);
  } catch {
    // Hot reload can preserve an older rejected global promise. Replace it and
    // retry immediately now that the working DNS resolvers are configured.
    global.khaiwalMongoClientPromise = connect();
    return (await global.khaiwalMongoClientPromise).db(databaseName);
  }
}

export async function getKhaiwalSettings(siteId = DEFAULT_SITE_ID): Promise<KhaiwalSettings | null> {
  const document = await (await getKhaiwalDatabase())
    .collection<Partial<KhaiwalSettings> & { siteId: string }>(collectionName)
    .findOne({ siteId });
  if (!document) return null;
  return {
    name: String(document.name || ""),
    whatsapp: String(document.whatsapp || ""),
  };
}

export async function saveKhaiwalSettings(settings: KhaiwalSettings, siteId = DEFAULT_SITE_ID) {
  const cleaned = {
    name: String(settings.name || "").trim(),
    whatsapp: String(settings.whatsapp || "").trim(),
  };
  await (await getKhaiwalDatabase()).collection(collectionName).updateOne(
    { siteId },
    { $set: { ...cleaned, siteId, updatedAt: new Date() } },
    { upsert: true },
  );
  return cleaned;
}
