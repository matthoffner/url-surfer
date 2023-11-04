"use client";

import { useState } from 'react';
import styles from './page.module.css'

export default function Home() {
  const [url, setUrl] = useState('');
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setLoading] = useState(false);

  const handleSubmit = async (event: { preventDefault: () => void; }) => {
    event.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`/api/extract?url=${encodeURIComponent(url)}&prompt=${encodeURIComponent(prompt)}`);
      if (!res.ok) throw new Error(`Error: ${res.status}`);
      const text = await res.text();
      setResponse(text);
    } catch (error) {
      console.error("Error fetching data: ", error);
      setResponse('Failed to fetch data.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className={styles.main}>
      <h1 className={styles.title}>
        🔗 URL Surfer 🏄‍♂️
      </h1>

      <form onSubmit={handleSubmit} className={styles.form}>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Enter URL"
          className={styles.input}
        />
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Enter your prompt"
          className={styles.input}
        />
        <button type="submit" className={styles.button} disabled={isLoading}>
          {isLoading ? 'Loading...' : 'Submit'}
        </button>
      </form>

      {response && (
        <div className={styles.response}>
          <h3>Response:</h3>
          <pre>{response}</pre>
        </div>
      )}
    </main>
  )
}
