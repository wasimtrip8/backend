import { createApi } from 'unsplash-js';
import dotenv from 'dotenv';

dotenv.config(); // Load .env variables

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

if (!UNSPLASH_ACCESS_KEY) {
  throw new Error('Missing UNSPLASH_ACCESS_KEY in environment variables');
}

const unsplash = createApi({
  accessKey: UNSPLASH_ACCESS_KEY,
  fetch // TS workaround for node-fetch types
});

/**
 * Search Unsplash for a photo matching the given query.
 * @param query The search term, e.g., "Elephant Falls"
 * @returns URL of the image or null if not found.
 */
async function searchUnsplashImage(query: string): Promise<string | null> {
  try {
    const result = await unsplash.search.getPhotos({
      query,
      perPage: 1,
      orientation: 'landscape'
    });

    if (result.errors) {
      console.error('Unsplash API Error:', result.errors);
      return null;
    }

    const { response } = result;
    if (response && response.results && response.results.length > 0) {
      return response.results[0].urls.regular;
    }

    console.warn(`No Unsplash results found for "${query}"`);
    return null;
  } catch (err) {
    console.error('Error calling Unsplash API:', err);
    return null;
  }
}

export default {
  searchUnsplashImage
};
