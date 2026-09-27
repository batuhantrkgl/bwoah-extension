/**
 * Image Management - Exclusively using r/F1Porn
 */

import {
  IMAGE_CACHE_SIZE,
  IMAGE_CACHE_KEY,
  SHOWN_IMAGES_KEY,
  FAILED_IMAGES_KEY,
  REDDIT_CACHE_KEY,
  WALLPAPER_META_KEY,
  REDDIT_CACHE_DURATION
} from "./constants.js";
import { storage } from "./storage.js";
import { shuffleArray, parseResolutionFromTitle, isHighResolution } from "./utils.js";

export class ImageCache {
  constructor() {
    this.cache = new Set();
    this.shownImages = new Set();
    this.failedImages = new Set();
    this.loading = new Map();
    this._initialized = false;
  }

  async initialize() {
    if (this._initialized) return;
    this._initialized = true;

    try {
      const [shown, failed, savedCache] = await Promise.all([
        storage.get(SHOWN_IMAGES_KEY, []),
        storage.get(FAILED_IMAGES_KEY, []),
        storage.get(IMAGE_CACHE_KEY, [])
      ]);

      this.shownImages = new Set(Array.isArray(shown) ? shown : []);
      this.failedImages = new Set(Array.isArray(failed) ? failed : []);

      if (Array.isArray(savedCache) && savedCache.length > 0) {
        const valid = savedCache.filter(u => !this.failedImages.has(u));
        this.cache = new Set(valid);
      }

      if (this.cache.size < 5) {
        this.fillCache().catch(() => {});
      }
    } catch (e) {
      console.warn('[Bwoah] ImageCache init error:', e);
    }
  }

  async preloadImage(url) {
    if (!url || this.failedImages.has(url)) return null;
    if (typeof Image === 'undefined') {
      this.cache.add(url);
      return url;
    }
    if (this.loading.has(url)) return this.loading.get(url);

    const promise = new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        if (img.naturalWidth && img.naturalHeight) {
          if (!isHighResolution(img.naturalWidth, img.naturalHeight)) {
            this.markFailed(url);
            resolve(null);
            return;
          }
        }
        resolve(url);
      };
      img.onerror = () => {
        this.markFailed(url);
        resolve(null);
      };
      img.src = url;
    });

    this.loading.set(url, promise);
    try {
      const res = await promise;
      if (res) {
        this.cache.add(res);
      }
      return res;
    } finally {
      this.loading.delete(url);
    }
  }

  async fillCache() {
    try {
      const allImages = await fetchRedditImages();
      if (!Array.isArray(allImages) || allImages.length === 0) return;

      const candidates = allImages.filter(u => !this.shownImages.has(u) && !this.failedImages.has(u));

      if (candidates.length === 0) {
        this.shownImages.clear();
        await storage.set(SHOWN_IMAGES_KEY, []);
      }

      const available = candidates.length > 0 ? candidates : allImages;
      const needed = Math.max(0, IMAGE_CACHE_SIZE - this.cache.size);
      const shuffled = shuffleArray(available).slice(0, needed);

      for (let i = 0; i < shuffled.length; i += 3) {
        const batch = shuffled.slice(i, i + 3);
        await Promise.all(batch.map(url => this.preloadImage(url)));
      }

      await storage.set(IMAGE_CACHE_KEY, [...this.cache]);
    } catch (e) {
      console.warn('[Bwoah] Failed to fill r/F1Porn cache:', e);
    }
  }

  async getRandomImage() {
    await this.initialize();
    let validImages = [...this.cache].filter(u => !this.failedImages.has(u));

    if (validImages.length === 0) {
      await this.fillCache();
      validImages = [...this.cache].filter(u => !this.failedImages.has(u));
    }

    if (validImages.length === 0) {
      const fresh = await fetchRedditImages();
      const candidates = fresh.filter(u => !this.failedImages.has(u) && !this.shownImages.has(u));
      const pool = candidates.length > 0 ? candidates : fresh.filter(u => !this.failedImages.has(u));
      const shuffled = shuffleArray(pool);

      for (const candidate of shuffled) {
        const preloaded = await this.preloadImage(candidate);
        if (preloaded) {
          this.shownImages.add(preloaded);
          this.cache.delete(preloaded);
          await Promise.all([
            storage.set(SHOWN_IMAGES_KEY, [...this.shownImages]),
            storage.set(IMAGE_CACHE_KEY, [...this.cache])
          ]);
          return preloaded;
        }
      }
      return null;
    }

    const index = Math.floor(Math.random() * validImages.length);
    const chosen = validImages[index];

    this.shownImages.add(chosen);
    this.cache.delete(chosen);

    await Promise.all([
      storage.set(SHOWN_IMAGES_KEY, [...this.shownImages]),
      storage.set(IMAGE_CACHE_KEY, [...this.cache])
    ]);

    if (this.cache.size < 5) {
      this.fillCache().catch(() => {});
    }

    return chosen;
  }

  markFailed(url) {
    if (!url) return;
    this.failedImages.add(url);
    this.cache.delete(url);
    storage.set(FAILED_IMAGES_KEY, [...this.failedImages]);
    storage.set(IMAGE_CACHE_KEY, [...this.cache]);
  }
}

export const imageCache = new ImageCache();

export async function fetchRedditImages() {
  try {
    const cached = await storage.get(REDDIT_CACHE_KEY);
    if (cached && (Date.now() - cached.timestamp < REDDIT_CACHE_DURATION) && Array.isArray(cached.images) && cached.images.length > 0) {
      return cached.images;
    }
  } catch (e) {}

  try {
    let posts = [];
    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      const response = await new Promise((resolve) => {
        chrome.runtime.sendMessage({ action: 'fetchReddit' }, res => {
          if (chrome.runtime.lastError || !res || !res.success) {
            resolve(null);
          } else {
            resolve(res.data);
          }
        });
      });
      posts = response?.data?.children || [];
    }

    // Direct fallback if service worker was unavailable
    if (posts.length === 0) {
      const res = await fetch('https://api.pullpush.io/reddit/search/submission/?subreddit=F1Porn&size=100');
      if (res.ok) {
        const json = await res.json();
        posts = (json?.data || [])
          .filter(p => p && !p.removed_by_category && p.author !== '[deleted]' && p.selftext !== '[removed]' && p.selftext !== '[deleted]' && p.is_robot_indexable !== false && p.url)
          .map(p => ({
            data: {
              url: p.url,
              title: p.title,
              removed_by_category: p.removed_by_category,
              author: p.author,
              selftext: p.selftext,
              is_robot_indexable: p.is_robot_indexable
            }
          }));
      }
    }

    const imageUrls = [];
    const metaMap = {};

    for (const post of posts) {
      const data = post.data;
      if (!data) continue;

      // 0. Filter out deleted or removed posts immediately
      if (data.removed_by_category || data.author === '[deleted]' || data.selftext === '[removed]' || data.selftext === '[deleted]' || data.is_robot_indexable === false) {
        continue;
      }

      // 1. Filter out low resolution or vertical images via post title
      const titleRes = parseResolutionFromTitle(data.title);
      if (titleRes && !isHighResolution(titleRes.width, titleRes.height)) {
        continue;
      }

      // 2. Filter out via preview source dimensions if available
      const previewSource = data.preview?.images?.[0]?.source;
      if (previewSource?.width && previewSource?.height) {
        if (!isHighResolution(previewSource.width, previewSource.height)) {
          continue;
        }
      }

      const permalink = data.permalink ? ('https://www.reddit.com' + data.permalink) : 'https://www.reddit.com/r/F1Porn';
      const postTitle = data.title || '';

      if (data.url && (data.url.match(/\.(jpg|jpeg|png|webp)$/i) || data.url.includes('i.redd.it'))) {
        imageUrls.push(data.url);
        metaMap[data.url] = { title: postTitle, permalink };
      } else if (data.is_gallery && data.media_metadata) {
        for (const meta of Object.values(data.media_metadata)) {
          const w = meta?.s?.x || meta?.s?.width;
          const h = meta?.s?.y || meta?.s?.height;
          if (w && h && !isHighResolution(w, h)) {
            continue;
          }
          if (meta?.s?.u) {
            const cleanUrl = meta.s.u.replace(/&amp;/g, '&');
            imageUrls.push(cleanUrl);
            metaMap[cleanUrl] = { title: postTitle, permalink };
          }
        }
      } else if (data.preview?.images?.[0]?.source?.url) {
        const cleanUrl = data.preview.images[0].source.url.replace(/&amp;/g, '&');
        imageUrls.push(cleanUrl);
        metaMap[cleanUrl] = { title: postTitle, permalink };
      } else if (data.url && data.url.includes('imgur.com') && !data.url.includes('i.imgur.com') && !data.url.includes('/a/')) {
        const cleanUrl = data.url + '.jpg';
        imageUrls.push(cleanUrl);
        metaMap[cleanUrl] = { title: postTitle, permalink };
      }
    }

    const validImageUrls = imageUrls.filter(url => {
      try {
        const u = new URL(url);
        return (u.hostname.includes('redd.it') || u.hostname.includes('imgur.com')) &&
               !url.endsWith('.gif') && !url.includes('/v.redd.it/');
      } catch (e) {
        return false;
      }
    });

    if (validImageUrls.length > 0) {
      await Promise.all([
        storage.set(REDDIT_CACHE_KEY, {
          timestamp: Date.now(),
          images: validImageUrls
        }),
        storage.set(WALLPAPER_META_KEY, metaMap)
      ]);
      return validImageUrls;
    }
  } catch (error) {
    console.warn('[Bwoah] r/F1Porn fetch warning:', error.message);
  }

  return [];
}

export async function getWallpaperMeta(url) {
  if (!url) return null;
  try {
    const metaMap = await storage.get(WALLPAPER_META_KEY, {});
    return metaMap[url] || null;
  } catch (e) {
    return null;
  }
}

export async function updateWallpaperBadge(url) {
  const badge = document.getElementById('wallpaper-info');
  const link = document.getElementById('wallpaper-link');
  const titleEl = document.getElementById('wallpaper-title');
  if (!badge || !link || !titleEl) return;

  const meta = await getWallpaperMeta(url);
  if (meta && meta.title) {
    titleEl.textContent = meta.title;
    link.href = meta.permalink || 'https://www.reddit.com/r/F1Porn';
    badge.style.display = 'flex';
  } else {
    badge.style.display = 'none';
  }
}

export async function displayRandomImage(retryCount = 0) {
  const imageContainer = document.getElementById('image-container');
  if (!imageContainer) return;

  const refreshBtn = document.getElementById('refresh-wallpaper-button');
  if (refreshBtn) refreshBtn.classList.add('spinning');

  const url = await imageCache.getRandomImage();
  if (!url) {
    if (refreshBtn) refreshBtn.classList.remove('spinning');
    return;
  }

  const img = new Image();
  img.src = url;
  img.alt = "F1 Wallpaper from r/F1Porn";

  img.onload = () => {
    if (img.naturalWidth && img.naturalHeight && !isHighResolution(img.naturalWidth, img.naturalHeight)) {
      imageCache.markFailed(url);
      if (retryCount < 5) displayRandomImage(retryCount + 1);
      else if (refreshBtn) refreshBtn.classList.remove('spinning');
      return;
    }

    // Smooth crossfade transition
    const oldImg = imageContainer.querySelector('img');
    img.style.opacity = '0';
    img.style.transition = 'opacity 0.5s ease-in-out';
    imageContainer.appendChild(img);

    requestAnimationFrame(() => {
      img.style.opacity = '1';
      if (oldImg) {
        setTimeout(() => {
          if (oldImg.parentElement === imageContainer) {
            imageContainer.removeChild(oldImg);
          }
        }, 500);
      }
    });

    updateWallpaperBadge(url);
    if (refreshBtn) refreshBtn.classList.remove('spinning');
  };

  img.onerror = () => {
    imageCache.markFailed(url);
    if (retryCount < 5) displayRandomImage(retryCount + 1);
    else if (refreshBtn) refreshBtn.classList.remove('spinning');
  };
}

export async function refreshWallpaper() {
  const refreshBtn = document.getElementById('refresh-wallpaper-button');
  if (refreshBtn) refreshBtn.classList.add('spinning');
  try {
    await displayRandomImage();
  } finally {
    if (refreshBtn) {
      setTimeout(() => refreshBtn.classList.remove('spinning'), 500);
    }
  }
}
