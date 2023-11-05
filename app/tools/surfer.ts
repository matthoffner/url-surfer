import { Tool } from './tool';
import { z } from 'zod';

function createUrlSurfer() {
  const paramsSchema = z.object({
    input: z.string(),
  });
  const name = 'surfer';
  const description = 'A custom URL navigator. Useful when a URL is provided with a question. Input should be a prompt with a URL. Outputs a JSON array of relevant results.';

  const execute = async ({ input }: z.infer<typeof paramsSchema>) => {
    try {
      const res = await fetch('/api/surfer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: input }), // Include the prompt in the request body
      });

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      return data;
    } catch (error) {
      // @ts-ignore
      throw new Error(`Error in UrlSurfer: ${error.message}`);
    }
  };

  return new Tool(paramsSchema, name, description, execute).tool;
}

export { createUrlSurfer };
