import { NextApiRequest, NextApiResponse } from 'next';
import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';
// @ts-ignore
import pdfParse from 'pdf-parse';
import puppeteer from 'puppeteer';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { HuggingFaceTransformersEmbeddings } from "langchain/embeddings/hf_transformers";

const DEFAULT_CHUNK_SIZE = 1000;
const VECTOR_STORE_SIZE = 10;
const textSplitter = new RecursiveCharacterTextSplitter({ chunkSize: DEFAULT_CHUNK_SIZE });

async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  const data = await pdfParse(buffer);
  return data.text;
}

const model = new HuggingFaceTransformersEmbeddings({
    modelName: "Xenova/all-MiniLM-L6-v2",
});

const urlRegex = /(https?:\/\/[^\s]+)/g;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const prompt = req.query.prompt as string;
  const urls = prompt.match(urlRegex);
  const targetUrl = urls ? urls[0] : null;
  const promptWithoutUrl = urls ? prompt.replace(urlRegex, '').trim() : prompt;

  if (!targetUrl) {
    return `Couldn't find url, here is the ${prompt}`;
  }

  try {
    const response = await fetch(targetUrl);
    const contentType = response.headers.get('content-type') || '';
    let content: string;

    if (contentType.includes('application/pdf')) {
      const buffer = await response.arrayBuffer();
      content = await extractTextFromPDF(buffer as any);
    } else if (contentType.includes('text/html')) {
      const html = await response.text();
      const dom = new JSDOM(html);
      const scripts = dom.window.document.querySelectorAll('script, style');
      scripts.forEach(element => element.remove());
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

    if (!content) {
      return `Couldn't find ${targetUrl}, here is the prompt: ${promptWithoutUrl}`;
    }
    
    const documents = await textSplitter.createDocuments([content]);

    const vectorStore = await MemoryVectorStore.fromTexts(
      // @ts-ignore
      [...documents.map(doc => doc.pageContent)],
      // @ts-ignore
      [...documents.map((v, k) => k)],
      model
    )
    const queryResult = await vectorStore.similaritySearch(promptWithoutUrl, VECTOR_STORE_SIZE);
    return res.status(200).send(
      `Here is the context: ${JSON.stringify(queryResult.map(result => result.pageContent))} from using the prompt to lookup relevant information. Here is the prompt: ${promptWithoutUrl}`);
  } catch (error) {
    console.error(error);
    // @ts-ignore
    return res.status(500).json({ error: error.message });
  }
}
