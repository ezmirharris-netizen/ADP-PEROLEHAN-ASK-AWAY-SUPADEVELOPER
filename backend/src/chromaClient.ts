import { CloudClient } from "chromadb";
import { OpenAIEmbeddingFunction } from "@chroma-core/openai";

let clientInstance: CloudClient | null = null;
let collectionInstance: Awaited<ReturnType<CloudClient["getCollection"]>> | null = null;
let embedFnInstance: OpenAIEmbeddingFunction | null = null;

function getEmbedFn(): OpenAIEmbeddingFunction {
  if (!embedFnInstance) {
    embedFnInstance = new OpenAIEmbeddingFunction({
      apiKey: process.env["OPENAI_API_KEY"]!,
      modelName: process.env["EMBEDDING_MODEL"] ?? "text-embedding-3-small",
    });
  }
  return embedFnInstance;
}

function getClient(): CloudClient {
  if (!clientInstance) {
    clientInstance = new CloudClient({
      apiKey: process.env["CHROMA_API_KEY"]!,
      tenant: process.env["CHROMA_TENANT"]!,
      database: process.env["CHROMA_DATABASE"]!,
    });
  }
  return clientInstance;
}

async function getCollection() {
  if (collectionInstance) return collectionInstance;
  const client = getClient();
  const collectionName = process.env["CHROMA_COLLECTION"] ?? "pekeliling";
  collectionInstance = await client.getCollection({
    name: collectionName,
    embeddingFunction: getEmbedFn(),
  });
  return collectionInstance;
}

export interface ChunkResult {
  document: string;
  metadata: Record<string, unknown>;
  distance: number;
}

export async function queryPekeliling(
  queryText: string,
  nResults = 6
): Promise<ChunkResult[]> {
  const collection = await getCollection();

  const results = await collection.query({
    queryTexts: [queryText],
    nResults,
  });

  const docs = results.documents?.[0] ?? [];
  const metas = results.metadatas?.[0] ?? [];
  const dists = results.distances?.[0] ?? [];

  return docs
    .map((doc, i) => ({
      document: doc ?? "",
      metadata: (metas[i] as Record<string, unknown>) ?? {},
      distance: dists[i] ?? 1,
    }))
    .filter((r) => r.document.trim().length > 0);
}

let cachedAllChunks: ChunkResult[] | null = null;

export async function getAllPekelilingChunks(forceRefresh = false): Promise<ChunkResult[]> {
  if (cachedAllChunks && !forceRefresh) return cachedAllChunks;
  if (forceRefresh) collectionInstance = null;

  const collection = await getCollection();

  const BATCH_SIZE = 250;
  const all: ChunkResult[] = [];
  let offset = 0;

  for (;;) {
    const results = await collection.get({ limit: BATCH_SIZE, offset });
    const docs = results.documents ?? [];
    const metas = results.metadatas ?? [];

    for (let i = 0; i < docs.length; i++) {
      const doc = docs[i];
      if (doc && doc.trim().length > 0) {
        all.push({
          document: doc,
          metadata: (metas[i] as Record<string, unknown>) ?? {},
          distance: 0,
        });
      }
    }

    if (docs.length < BATCH_SIZE) break;
    offset += BATCH_SIZE;
  }

  all.sort((a, b) => {
    const aIdx = Number(a.metadata?.chunkIndex ?? 0);
    const bIdx = Number(b.metadata?.chunkIndex ?? 0);
    return aIdx - bIdx;
  });

  cachedAllChunks = all;
  console.log(`[chroma] Loaded and cached ${all.length} total chunks (full coverage mode)`);
  return all;
}
