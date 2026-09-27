import { describe, expect, test } from "bun:test";
import { fetchRedditImages, ImageCache } from "../js/images.js";

describe("r/F1Porn Image Fetching & Caching", () => {
  test("fetchRedditImages retrieves high-resolution r/F1Porn images", async () => {
    const images = await fetchRedditImages();

    expect(Array.isArray(images)).toBe(true);
    expect(images.length).toBeGreaterThan(0);

    // Every image URL must be from reddit or imgur and end with valid image extension or host
    for (const url of images.slice(0, 5)) {
      expect(url).toMatch(/^https:\/\/(i\.redd\.it|preview\.redd\.it|i\.imgur\.com)/);
    }
  }, 10000); // 10s timeout for live network test

  test("fetchRedditImages excludes removed and deleted posts", async () => {
    const images = await fetchRedditImages();
    // Known removed 404 URL should never be present in fetched images
    expect(images).not.toContain("https://i.redd.it/di2y193mevfh1.jpeg");
  }, 10000);

  test("ImageCache initializes and serves r/F1Porn images without crashing", async () => {
    const cache = new ImageCache();
    await cache.initialize();
    const image = await cache.getRandomImage();

    expect(image).toBeString();
    expect(image).toMatch(/^https:\/\/(i\.redd\.it|preview\.redd\.it|i\.imgur\.com)/);
  }, 10000);
});
