import { MongoClient, type Db } from "mongodb";
import { setServers } from "node:dns";

const databaseName = process.env.TOP_GAMES_MONGODB_DATABASE || "test";

declare global {
  var topGamesMongoClientPromise: Promise<MongoClient> | undefined;
}

export async function getTopGamesDatabase(): Promise<Db> {
  const uri = process.env.TOP_GAMES_MONGODB_URI?.trim();
  if (!uri) throw new Error("TOP_GAMES_MONGODB_URI is not configured.");

  global.topGamesMongoClientPromise ||= connect(uri).catch((error) => {
    global.topGamesMongoClientPromise = undefined;
    throw error;
  });
  return (await global.topGamesMongoClientPromise).db(databaseName);
}

async function connect(uri: string) {
  const options = { serverSelectionTimeoutMS: 5000 };
  if (uri.startsWith("mongodb+srv://")) {
    setServers(["8.8.8.8", "1.1.1.1"]);
  }
  try {
    return await new MongoClient(uri, options).connect();
  } catch (error) {
    if (uri.startsWith("mongodb+srv://") && /querySrv ECONNREFUSED/.test((error as Error).message)) {
      setServers(["8.8.8.8", "1.1.1.1"]);
      return new MongoClient(uri, options).connect();
    }
    throw error;
  }
}
