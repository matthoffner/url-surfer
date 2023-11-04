# 🔗 url-surfer 🏄‍♂️

Simple API to navigate to a URL from a prompt, returning relevant context from the prompt using a vector store.

## How it works

1. Navigate (parse url/fetch/mime-type check)
2. Extract text (jsdom/puppeteer/pdf-parse)
3. Create vector store (transformers.js)
4. Return vector results in prompt (langchain)


## Ideas

* Configuration: Vector search size, token counting
* OpenAI functions integration
