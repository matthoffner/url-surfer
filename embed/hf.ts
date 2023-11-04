import { pipeline } from '@xenova/transformers';
import { Embeddings, EmbeddingsParams } from 'langchain/embeddings/base';

const DEFAULT_EMBEDDINGS_MODEL = 'Xenova/all-MiniLM-L6-v2';

export interface XenovaTransformersEmbeddingsParams extends EmbeddingsParams {
    model?: string;
  }
  
  export class XenovaTransformersEmbeddings extends Embeddings {
    model: string;
    client: any;
  
    constructor(fields?: XenovaTransformersEmbeddingsParams) {
      super(fields ?? {});
      this.model = fields?.model ?? DEFAULT_EMBEDDINGS_MODEL;
    }
  
    async _embed(texts: string[]): Promise<number[][]> {
      if (!this.client) {
        this.client = await pipeline("embeddings", this.model);
      }
  
      return this.caller.call(async () => {
        return await Promise.all(
          texts.map(async (text): Promise<number[]> => {
            const result = await this.client(text, { pooling: "mean", normalize: true });
            return result.data;
          })
        );
      });
    }
  
    embedQuery(document: string): Promise<number[]> {
      return this._embed([document]).then((embeddings) => embeddings[0]);
    }
  
    embedDocuments(documents: string[]): Promise<number[][]> {
      return this._embed(documents);
    }
  }