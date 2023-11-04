import { NextResponse } from 'next/server';
import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';
import pdfParse from 'pdf-parse';
import puppeteer from 'puppeteer';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { pipeline } from '@xenova/transformers;;
import { Embeddings, EmbeddingsParams } from 'langchain/embeddings/base';

const DEFAULT_EMBEDDINGS_MODEL = 'Xenova/all-MiniLM-L6-v2';
const DEFAULT_CHUNK_SIZE = 1000;
const DEFAULT_VECTOR_SIZE = 5;

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

const embeddings = new XenovaTransformersEmbeddings();
const vectorStore = new MemoryVectorStore<number[]>();

async function extractTextFromPDF(buffer: ArrayBuffer): Promise<string> {
  const data = await pdfParse(buffer);
  return data.text;
}

export async function middleware(request: Request) {
  const targetUrl = new URL(request.url).searchParams.get('url');
  const prompt = new URL(request.url).searchParams.get('prompt');

  if (!targetUrl) {
    return new Response('No URL provided', { status: 400 });
  }

  const response = await fetch(targetUrl);
  const contentType = response.headers.get('content-type') || '';
  let content: string;

  if (contentType.includes('application/pdf')) {
    const buffer = await response.arrayBuffer();
    content = await extractTextFromPDF(buffer);
  } else if (contentType.includes('text/html')) {
    const html = await response.text();
    const dom = new JSDOM(html);
    content = dom.window.document.body.textContent || '';

    if (!content.trim()) {
      const browser = await puppeteer.launch();
      const page = await browser.newPage();
      await page.goto(targetUrl);
      content = await page.evaluate(() => document.body.innerText);
      await browser.close();
    }
  } else {
    content = await response.text();
  }

  const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: DEFAULT_CHUNK_SIZE });
  const documents = textSplitter.splitText(content);
  const documentContents = documents.map(doc => doc.text);

  for (const [index, text] of documentContents.entries()) {
    const embedding = await embeddings.embedQuery(text);
    vectorStore.add(index.toString(), embedding);
  }

  let promptResponse = '';

  if (prompt) {
    const queryEmbedding = await embeddings.embedQuery(prompt);
    const searchResults = await vectorStore.search(queryEmbedding, { size: DEFAULT_VECTOR_SIZE });

    promptResponse = searchResults.map(result => `Result ${result.id}: ${documentContents[parseInt(result.id)]}`).join('\n\n');
  } else {
    promptResponse = `Summary: ${documentContents[0]}`;
  }

  return new Response(promptResponse, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain;charset=UTF-8',
    },
  });
}

export const config = {
  matcher: '/api/extract',
};
