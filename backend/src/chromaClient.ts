import { CloudClient } from "chromadb";
import { OpenAIEmbeddingFunction } from "@chroma-core/openai";

let clientInstance: CloudClient | null = null;
const embedFn = new OpenAIEmbeddingFunction({
  apiKey: process.env["OPENAI_API_KEY"]!,
  modelName: process.env["EMBEDDING_MODEL"] ?? "text-embedding-3-small",
});


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

export interface ChunkResult {
  document: string;
  metadata: Record<string, unknown>;
  distance: number;
}

export async function queryPekeliling(
  queryText: string,
  nResults = 6
): Promise<ChunkResult[]> {
  const client = getClient();
  const collectionName = process.env["CHROMA_COLLECTION"] ?? "pekeliling";

  const collection = await client.getCollection({
    name: collectionName,
    embeddingFunction: embedFn,
  });

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

/**
 * Fetches EVERY chunk in the collection (not similarity search) and returns
 * them sorted by chunkIndex so they reassemble in original document order.
 * Used by /analyze for full, deterministic document coverage — same input
 * always sees the same complete context, instead of a similarity-matched
 * subset that can vary chunk-to-chunk between runs.
 *
 * Paginated in batches of 250 to stay under the Chroma Cloud quota limit
 * (observed cap: 300 items per get/query call).
 */
let cachedAllChunks: ChunkResult[] | null = null;

export async function getAllPekelilingChunks(forceRefresh = false): Promise<ChunkResult[]> {
  if (cachedAllChunks && !forceRefresh) return cachedAllChunks;

  const client = getClient();
  const collectionName = process.env["CHROMA_COLLECTION"] ?? "pekeliling";

  const collection = await client.getCollection({
    name: collectionName,
    embeddingFunction: embedFn,
  });

  const BATCH_SIZE = 250;
  const all: ChunkResult[] = [];
  let offset = 0;

  // Keep paginating until a batch returns fewer than BATCH_SIZE results.
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

  // Sort by chunkIndex (falls back to 0 if missing) so chunks reassemble
  // in the same order they appeared in the original document.
  all.sort((a, b) => {
    const aIdx = Number(a.metadata?.chunkIndex ?? 0);
    const bIdx = Number(b.metadata?.chunkIndex ?? 0);
    return aIdx - bIdx;
  });

  cachedAllChunks = all;
  console.log(`[chroma] Loaded and cached ${all.length} total chunks (full coverage mode)`);
  return all;
}