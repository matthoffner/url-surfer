# url-surfer

This project provides an API for extracting text from PDF or HTML content, splitting the content into manageable chunks, and performing similarity searches within the text based on a given prompt.

## Features

- **PDF and HTML Text Extraction**: Extracts text from given URLs pointing to PDF files or web pages.
- **Text Splitting**: Splits the text into chunks using a character-based splitting strategy, customizable via `DEFAULT_CHUNK_SIZE`.
- **Similarity Search**: Performs a similarity search within the extracted text chunks based on a user-provided prompt.

## Usage

The main functionality is exposed via the `/api/extract` endpoint.

### Endpoint: `/api/extract`

#### Parameters:

- `url` (required): The URL of the PDF file or web page from which to extract text.
- `prompt` (optional): A string prompt used for performing a similarity search within the text.

#### Responses:

- **200 OK**: The endpoint will return the similarity search results if a prompt is provided, or a summary of the extracted text if no prompt is given.
- **400 Bad Request**: Returned if the `url` parameter is not provided.
- **500 Internal Server Error**: Returned if there's an error during processing.

## Setup

To set up and run the API locally, follow these steps:

1. Clone the repository.
2. Install dependencies with `npm install` or `yarn install`.
3. Start the development server with `npm run dev` or `yarn dev`.

## Example Request

```bash
curl -X GET 'http://localhost:3000/api/extract?url=http://example.com/document.pdf&prompt=search%20term'
