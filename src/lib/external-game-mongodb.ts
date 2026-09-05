import { MongoClient, type Db } from "mongodb";
import { setServers } from "node:dns";

const databaseName = process.env.EXTERNAL_GAME_MONGODB_DATABASE || "test";

declare global {
  var externalGameMongoClientPromise: Promise<MongoClient> | undefined;
}

export async function getExternalGameDatabase(): Promise<Db> {
  const uri = process.env.EXTERNAL_GAME_MONGODB_URI?.trim();
  if (!uri) {
    throw new Error("EXTERNAL_GAME_MONGODB_URI is not configured.");
  }

  global.externalGameMongoClientPromise ||= connect(uri).catch((error) => {
    // Do not permanently cache a rejected connection. A later poll can retry
    // after a temporary DNS or network failure.
    global.externalGameMongoClientPromise = undefined;
    throw error;
  });
  return (await global.externalGameMongoClientPromise).db(databaseName);
}

async function connect(uri: string) {
  const options = { serverSelectionTimeoutMS: 5000 };
  if (uri.startsWith("mongodb+srv://")) {
    setServers(["8.8.8.8", "1.1.1.1"]);
  }
  try {
    return await new MongoClient(uri, options).connect();
  } catch (error) {
    // Some Windows/router DNS combinations reject Node's SRV lookup even
    // though the Atlas record exists. Retry once through public resolvers.
    if (uri.startsWith("mongodb+srv://") && /querySrv ECONNREFUSED/.test((error as Error).message)) {
      setServers(["8.8.8.8", "1.1.1.1"]);
      return new MongoClient(uri, options).connect();
    }
    throw error;
  }
}
