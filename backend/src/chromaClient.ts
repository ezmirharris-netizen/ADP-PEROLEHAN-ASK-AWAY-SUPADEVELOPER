import { CloudClient } from "chromadb";
import { DefaultEmbeddingFunction } from "@chroma-core/default-embed";

let clientInstance: CloudClient | null = null;
const embedFn = new DefaultEmbeddingFunction();

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
