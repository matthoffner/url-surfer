import { NextApiRequest, NextApiResponse } from 'next';
import fetch from 'node-fetch';
import { JSDOM } from 'jsdom';
// @ts-ignore
import pdfParse from 'pdf-parse';
import puppeteer from 'puppeteer';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { MemoryVectorStore } from 'langchain/vectorstores/memory';
import { XenovaTransformersEmbeddings } from '../../embed/hf';

const DEFAULT_CHUNK_SIZE = 1000;

async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  const data = await pdfParse(buffer);
  return data.text;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const targetUrl = req.query.url as string;
  const prompt = req.query.prompt as string;

  if (!targetUrl) {
    return res.status(400).json({ error: 'No URL provided' });
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
    const documents = await textSplitter.createDocuments([content]);

    // Using the provided MemoryVectorStore initialization
    const vectorStore = await MemoryVectorStore.fromTexts(
      // @ts-ignore
      documents.map((doc: { text }) => doc.text),
      documents.map((_: any, index: { toString: () => any; }) => index.toString()),
      new XenovaTransformersEmbeddings()
    );

    if (prompt) {
      // Perform similarity search based on user input
      const queryResult = await vectorStore.similaritySearch(prompt, 2);

  // @ts-ignore
      const results = queryResult.map(({ id, score }): string => {
        // @ts-ignore
        return `Result ${id} with score ${score}: ${documents[parseInt(id)].text}`;
      }).join('\n\n');

      return res.status(200).send(results);
    } else {
      // @ts-ignore
      return res.status(200).send(`Summary: ${documents[0].text}`);
    }
  } catch (error) {
    console.error(error);
    // @ts-ignore
    return res.status(500).json({ error: error.message });
  }
}
