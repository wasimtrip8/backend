import { createApi } from 'unsplash-js';
import dotenv from 'dotenv';

dotenv.config(); // Load .env variables

export class UnsplashClient {
  private unsplash;

  constructor() {
    const accessKey = process.env.UNSPLASH_ACCESS_KEY;
    if (!accessKey) {
      throw new Error('Missing UNSPLASH_ACCESS_KEY in environment variables');
    }

    this.unsplash = createApi({
      accessKey,
      fetch // TS workaround for node-fetch types
    });
  }

  /**
   * Search Unsplash for a photo matching the given query.
   * @param query The search term, e.g., "Elephant Falls"
   * @returns URL of the image or null if not found.
   */
  public async searchImage(query: string): Promise<string | null> {
    try {
      const result = await this.unsplash.search.getPhotos({
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
}
