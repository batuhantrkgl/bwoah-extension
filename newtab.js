const imageContainer = document.getElementById('image-container');
const driversList = document.getElementById('drivers-list');
const teamsList = document.getElementById('teams-list');
const nextRaceTitle = document.getElementById('next-race-title');
const countdownTimer = document.getElementById('countdown-timer');
const raceScheduleContainer = document.getElementById('race-schedule');
const trackButton = document.getElementById('track-button');
const scheduleButton = document.getElementById('schedule-button');
const repoOwner = 'batuhantrkgl';
const repoName = 'bwoah-extension';
const path = 'images';
const apiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${path}`;
let showTrackDetails = false;
let showSchedule = false;
let closestRace;
let motorsport = 'f1';
let year = new Date().getFullYear();
let url = `https://raw.githubusercontent.com/sportstimes/f1/main/_db/${motorsport}/${year}.json`;
let isDevMode = false;
const devModeKey = 'bwoahDevMode';
const _LOG_LEVEL = localStorage.getItem('bwoahLogLevel') || 'warn';
const _LOG_LEVELS = { debug: 0, warn: 1, error: 2 };
const log = {
  debug: (...args) => _LOG_LEVELS[_LOG_LEVEL] <= 0 && console.log('[bwoah]', ...args),
  warn: (...args) => _LOG_LEVELS[_LOG_LEVEL] <= 1 && console.warn('[bwoah]', ...args),
  error: (...args) => console.error('[bwoah]', ...args),
  time: (label) => _LOG_LEVELS[_LOG_LEVEL] <= 0 && console.time(label),
  timeEnd: (label) => _LOG_LEVELS[_LOG_LEVEL] <= 0 && console.timeEnd(label)
};
const driverMapping = {
  1: "Max Verstappen",
  4: "Lando Norris",
  16: "Charles Leclerc",
  44: "Lewis Hamilton",
  63: "George Russell",
  81: "Oscar Piastri",
  14: "Fernando Alonso",
  18: "Lance Stroll",
  22: "Yuki Tsunoda",
  23: "Alex Albon",
  55: "Carlos Sainz",
  27: "Nico Hulkenberg",
  31: "Esteban Ocon",
  10: "Pierre Gasly",
  87: "Oliver Bearman",
  38: "Gabriel Bortoleto",
  6: "Isack Hadjar",
  43: "Franco Colapinto",
  7: "Jack Doohan",
  12: "Andrea Kimi Antonelli"
};
const teamNameMapping = {
  "Ferrari": "Scuderia Ferrari HP",
  "Red Bull": "Oracle Red Bull Racing",
  "Mercedes": "Mercedes-AMG Petronas F1 Team",
  "McLaren": "McLaren Formula 1 Team",
  "Aston Martin": "Aston Martin Aramco F1 Team",
  "Alpine F1 Team": "BWT Alpine F1 Team",
  "Williams": "Williams Racing",
  "RB F1 Team": "Visa Cash App RB F1 Team",
  "Haas F1 Team": "MoneyGram Haas F1 Team",
  "Sauber": "Stake F1 Team Kick Sauber",
  "Audi": "Audi F1 Team",
  "Cadillac F1 Team": "Cadillac F1 Team"
};
const TEAM_URL_SLUGS = {
  "Ferrari": "ferrari",
  "Red Bull": "red-bull-racing",
  "Mercedes": "mercedes",
  "McLaren": "mclaren",
  "Aston Martin": "aston-martin",
  "Alpine F1 Team": "alpine",
  "Williams": "williams",
  "RB F1 Team": "rb",
  "Haas F1 Team": "haas",
  "Sauber": "kick-sauber",
  "Audi": "audi",
  "Cadillac F1 Team": "cadillac"
};
function getTeamUrlSlug(teamName) {
  return TEAM_URL_SLUGS[teamName] || teamName.toLowerCase().replace(/\s+/g, '-');
}
const CIRCUIT_IMAGE_SLUGS = {
  "Monaco": "monoco",
  "Canadian": "canada",
  "Spanish": "spain",
  "Barcelona": "spain",
  "Las-vegas": "las_vegas",
  "Las Vegas": "las_vegas",
  "Australian": "australia",
  "British": "great_britain",
  "Belgian": "belgium",
  "Hungarian": "hungary",
  "Dutch": "netherlands",
  "Italian": "italy",
  "Singapore": "singapore",
  "Japanese": "japan",
  "Mexican": "mexico",
  "Brazilian": "brazil",
  "Abu Dhabi": "abu_dhabi"
};
function getCircuitImageUrl(raceName) {
  let slug = raceName;
  for (const [key, value] of Object.entries(CIRCUIT_IMAGE_SLUGS)) {
    if (raceName.includes(key)) {
      slug = raceName.replace(key, value);
      break;
    }
  }
  return `https://media.formula1.com/image/upload/f_auto/q_auto/v1677244985/content/dam/fom-website/2018-redesign-assets/Circuit%20maps%2016x9/${slug}_Circuit.png.transform/8col/image.png`;
}
function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
const REAL_TEAM_RADIO_CLIPS = {
  1: "https://livetiming.formula1.com/static/2024/2024-03-02_Pre-Season_Testing/2024-03-02_Practice/TeamRadio/TESVER01_1_20240302_112854.mp3",
  11: "https://livetiming.formula1.com/static/2024/2024-03-02_Pre-Season_Testing/2024-03-02_Practice/TeamRadio/TESPER01_11_20240302_112908.mp3",
  44: "https://livetiming.formula1.com/static/2024/2024-03-02_Pre-Season_Testing/2024-03-02_Practice/TeamRadio/TESHAM01_44_20240302_113015.mp3"
};
const IMAGE_CACHE_SIZE = 20; 
const IMAGE_CACHE_KEY = 'bwoahImageCache';
const SHOWN_IMAGES_KEY = 'bwoahShownImages';
const FAILED_IMAGES_KEY = 'bwoahFailedImages'; 
const REDDIT_CACHE_KEY = 'bwoahRedditCache';
const REDDIT_CACHE_DURATION = 60 * 60 * 1000; 
const GITHUB_CACHE_KEY = 'bwoahGitHubCache';
const GITHUB_CACHE_DURATION = 24 * 60 * 60 * 1000; 
const CACHE_DURATION = 5 * 60 * 1000; 
const RACE_SCHEDULE_CACHE_DURATION = 24 * 60 * 60 * 1000; 
const TRACK_DETAILS_CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; 
const DEBOUNCE_DELAY = 250; 
const API_TIMEOUT = 5000; 
function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}
function simpleHash(obj) {
  const str = JSON.stringify(obj);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; 
  }
  return hash;
}
class RaceDataCache {
  constructor() {
    this.RACE_SCHEDULE_KEY = 'bwoahRaceScheduleCache';
    this.TRACK_DETAILS_KEY = 'bwoahTrackDetailsCache';
  }
  getCachedRaceSchedule(year) {
    try {
      const cached = localStorage.getItem(`${this.RACE_SCHEDULE_KEY}_${year}`);
      if (!cached) return null;
      const data = JSON.parse(cached);
      if (Date.now() - data.timestamp > RACE_SCHEDULE_CACHE_DURATION) {
        localStorage.removeItem(`${this.RACE_SCHEDULE_KEY}_${year}`);
        return null;
      }
      console.log(`Race schedule cache hit for year ${year}`);
      return data.races;
    } catch (error) {
      console.error('Error reading race schedule cache:', error);
      return null;
    }
  }
  cacheRaceSchedule(year, races) {
    try {
      const data = {
        timestamp: Date.now(),
        races: races
      };
      localStorage.setItem(`${this.RACE_SCHEDULE_KEY}_${year}`, JSON.stringify(data));
      console.log(`Race schedule cached for year ${year}`);
    } catch (error) {
      console.error('Error caching race schedule:', error);
    }
  }
  getCachedTrackDetails(raceName) {
    try {
      const cached = localStorage.getItem(`${this.TRACK_DETAILS_KEY}_${raceName}`);
      if (!cached) return null;
      const data = JSON.parse(cached);
      if (Date.now() - data.timestamp > TRACK_DETAILS_CACHE_DURATION) {
        localStorage.removeItem(`${this.TRACK_DETAILS_KEY}_${raceName}`);
        return null;
      }
      console.log(`Track details cache hit for ${raceName}`);
      return data.details;
    } catch (error) {
      console.error('Error reading track details cache:', error);
      return null;
    }
  }
  cacheTrackDetails(raceName, details) {
    try {
      const data = {
        timestamp: Date.now(),
        details: details
      };
      localStorage.setItem(`${this.TRACK_DETAILS_KEY}_${raceName}`, JSON.stringify(data));
      console.log(`Track details cached for ${raceName}`);
    } catch (error) {
      console.error('Error caching track details:', error);
    }
  }
  clearRaceScheduleCache() {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(this.RACE_SCHEDULE_KEY)) {
        localStorage.removeItem(key);
      }
    });
    console.log('Race schedule cache cleared');
  }
  clearTrackDetailsCache() {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(this.TRACK_DETAILS_KEY)) {
        localStorage.removeItem(key);
      }
    });
    console.log('Track details cache cleared');
  }
  clearAll() {
    this.clearRaceScheduleCache();
    this.clearTrackDetailsCache();
  }
}
const raceDataCache = new RaceDataCache();
class ImageCache {
  constructor() {
    this.cache = new Set();
    this.shownImages = new Set();
    this.failedImages = new Set();
    this.loading = new Map();
    this.preloadQueue = [];
    this._initPromise = null;
    this.initTimerId = null;
    try {
      const shown = localStorage.getItem(SHOWN_IMAGES_KEY);
      if (shown) this.shownImages = new Set(JSON.parse(shown));
      const failed = localStorage.getItem(FAILED_IMAGES_KEY);
      if (failed) this.failedImages = new Set(JSON.parse(failed));
    } catch (e) {
      console.warn('Error loading cache tracking:', e);
    }
  }
  initialize() {
    if (!this._initPromise) {
      this._initPromise = this._doInitialize().finally(() => {
        this._initPromise = null;
      });
    }
    return this._initPromise;
  }
  async _doInitialize() {
    const timerId = `imageCache:init:${Date.now()}`;
    console.time(timerId);
    this.initTimerId = timerId;
    try {
      const images = await fetchImages();
      if (images.length > 0) {
        const initialImage = images[Math.floor(Math.random() * images.length)];
        this.cache.add(initialImage);
        this.shownImages.add(initialImage);
        localStorage.setItem(SHOWN_IMAGES_KEY, JSON.stringify([...this.shownImages]));
      }
      setTimeout(async () => {
        const savedCache = localStorage.getItem(IMAGE_CACHE_KEY);
        if (savedCache) {
          const urls = JSON.parse(savedCache);
          await this.validateCachedUrls(urls);
        }
        if (this.cache.size < IMAGE_CACHE_SIZE) {
          await this.fillCache();
        }
      }, 100);
    } catch (error) {
      console.error('Error initializing image cache:', error);
    } finally {
      console.timeEnd(timerId); 
    }
  }
  async validateCachedUrls(urls) {
    const validUrls = urls.filter(u => !this.failedImages.has(u));
    this.cache = new Set(validUrls);
  }
  async preloadImage(url) {
    if (this.loading.has(url)) return this.loading.get(url);
    const loadPromise = new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(url);
      img.onerror = reject;
      img.src = url;
    });
    this.loading.set(url, loadPromise);
    try {
      await loadPromise;
      this.cache.add(url);
    } finally {
      this.loading.delete(url);
    }
  }
  async fillCache() {
    if (this.preloadQueue.length > 0) return;
    let images = await fetchImages();
    const availableImages = images.filter(url => !this.shownImages.has(url) && !this.failedImages.has(url));
    if (availableImages.length === 0) {
      console.log('All images have been shown, resetting tracking');
      this.shownImages.clear();
      localStorage.setItem(SHOWN_IMAGES_KEY, '[]');
      const needed = IMAGE_CACHE_SIZE - this.cache.size;
      const newImages = images
        .sort(() => Math.random() - 0.5)
        .slice(0, needed);
      this.preloadQueue.push(...newImages);
    } else {
      const needed = IMAGE_CACHE_SIZE - this.cache.size;
      const newImages = availableImages
        .sort(() => Math.random() - 0.5)
        .slice(0, needed);
      this.preloadQueue.push(...newImages);
    }
    while (this.preloadQueue.length > 0) {
      const batch = this.preloadQueue.splice(0, 3);
      await Promise.all(batch.map(url => this.preloadImage(url)));
    }
    localStorage.setItem(IMAGE_CACHE_KEY, JSON.stringify([...this.cache]));
  }
  getRandomImage() {
    const images = [...this.cache];
    if (images.length === 0) return null;
    const index = Math.floor(Math.random() * images.length);
    const image = images[index];
    this.shownImages.add(image);
    localStorage.setItem(SHOWN_IMAGES_KEY, JSON.stringify([...this.shownImages]));
    this.cache.delete(image);
    if (this.cache.size < IMAGE_CACHE_SIZE / 2) {
      this.fillCache().catch(console.error);
    }
    return image;
  }
  getShownImagesCount() {
    return this.shownImages.size;
  }
  markFailed(url) {
    console.warn(`Marking image as failed: ${url}`);
    this.failedImages.add(url);
    this.cache.delete(url);
    try {
      localStorage.setItem(FAILED_IMAGES_KEY, JSON.stringify([...this.failedImages]));
      localStorage.setItem(IMAGE_CACHE_KEY, JSON.stringify([...this.cache]));
    } catch (e) {}
  }
}
const imageCache = new ImageCache();
function ensureElement(id) {
  let el = document.getElementById(id);
  if (!el) {
    el = document.createElement('div');
    el.id = id;
    document.body.appendChild(el);
  }
  return el;
}
function toggleDevMode() {
  isDevMode = !isDevMode;
  console.log(`Dev mode ${isDevMode ? 'enabled' : 'disabled'}`);
  localStorage.setItem(devModeKey, isDevMode);
  const driversLeaderboard = document.getElementById('drivers-leaderboard');
  const teamsLeaderboard = document.getElementById('teams-leaderboard');
  const raceSchedule = document.getElementById('race-schedule');
  if (isDevMode) {
    if (driversLeaderboard) driversLeaderboard.style.display = 'none';
    if (teamsLeaderboard) teamsLeaderboard.style.display = 'none';
    if (raceSchedule) raceSchedule.style.display = 'none';
  } else {
    if (driversLeaderboard) driversLeaderboard.style.display = 'block';
    if (teamsLeaderboard) teamsLeaderboard.style.display = 'block';
    if (raceSchedule) raceSchedule.style.display = 'block';
  }
  const leftSection = ensureElement('dev-left-section');
  const rightSection = ensureElement('dev-right-section');
  const bottomSection = ensureElement('dev-bottom-section');
  leftSection.style.display = isDevMode ? 'block' : 'none';
  rightSection.style.display = isDevMode ? 'block' : 'none';
  bottomSection.style.display = isDevMode ? 'block' : 'none';
  if (!isDevMode) {
    displayRandomImage();
  }
  updateLiveSessionData();
  console.log(`Dev mode ${isDevMode ? 'enabled' : 'disabled'}`);
}
async function checkSeasonBreak(jsonContent) {
  log.debug("Running checkSeasonBreak...");
  const showLeaderboards = localStorage.getItem('showLeaderboards') !== 'false';
  const driversLeaderboard = document.getElementById('drivers-leaderboard');
  const teamsLeaderboard = document.getElementById('teams-leaderboard');
  if (driversLeaderboard) {
    driversLeaderboard.style.display = showLeaderboards ? 'block' : 'none';
  }
  if (teamsLeaderboard) {
    teamsLeaderboard.style.display = showLeaderboards ? 'block' : 'none';
  }
  log.debug("Fetching initial leaderboard data...");
  await fetchLeaderboard(new Date().getFullYear());
}
async function fetchRedditImages() {
  console.log('Fetching images from r/F1Porn');
  try {
    const cached = localStorage.getItem(REDDIT_CACHE_KEY);
    if (cached) {
      const data = JSON.parse(cached);
      if (Date.now() - data.timestamp < REDDIT_CACHE_DURATION) {
        console.log('Using cached Reddit images');
        return data.images;
      }
    }
  } catch (error) {
    console.error('Error reading Reddit cache:', error);
  }
  try {
    let response;
    let attempts = 0;
    const maxAttempts = 3;
    while (attempts < maxAttempts) {
      try {
        response = await new Promise((resolve, reject) => {
          chrome.runtime.sendMessage(
            { action: 'fetchReddit' },
            (response) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else if (response && response.success) {
                resolve(response.data);
              } else {
                reject(new Error(response ? response.error : 'No response from background'));
              }
            }
          );
        });
        break; 
      } catch (error) {
        attempts++;
        if (attempts >= maxAttempts) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, 100 * attempts));
      }
    }
    const posts = response.data.children;
    const imageUrls = posts
      .filter(post => {
        const url = post.data.url;
        return url && (
          url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ||
          url.includes('i.redd.it') ||
          url.includes('i.imgur.com')
        );
      })
      .map(post => {
        let url = post.data.url;
        if (url.includes('imgur.com') && !url.includes('i.imgur.com')) {
          url = url.replace('imgur.com', 'i.imgur.com') + '.jpg';
        }
        return url;
      })
      .filter(url => url); 
    console.log(`Found ${imageUrls.length} images from r/F1Porn`);
    try {
      localStorage.setItem(REDDIT_CACHE_KEY, JSON.stringify({
        timestamp: Date.now(),
        images: imageUrls
      }));
    } catch (error) {
      console.error('Error caching Reddit images:', error);
    }
    return imageUrls;
  } catch (error) {
    console.error('Error fetching Reddit images:', error);
    return [];
  }
}
let _fetchImagesPromise = null;
async function fetchImages() {
  if (_fetchImagesPromise) {
    return _fetchImagesPromise;
  }
  _fetchImagesPromise = _doFetchImages().finally(() => {
    _fetchImagesPromise = null;
  });
  return _fetchImagesPromise;
}
async function _doFetchImages() {
  console.log('Starting fetchImages()');
  let allImages = [];
  try {
    const cachedGitHub = localStorage.getItem(GITHUB_CACHE_KEY);
    let useCache = false;
    if (cachedGitHub) {
      try {
        const parsed = JSON.parse(cachedGitHub);
        if (Date.now() - parsed.timestamp < GITHUB_CACHE_DURATION) {
          console.log('Using cached GitHub images (cache still valid)');
          allImages = parsed.images;
          useCache = true;
        }
      } catch (parseError) {
        console.warn('Error parsing GitHub cache:', parseError);
      }
    }
    if (!useCache) {
      console.log(`Fetching images from GitHub API: ${apiUrl}`);
      let response;
      let attempts = 0;
      const maxAttempts = 3;
      while (attempts < maxAttempts) {
        try {
          response = await fetch(apiUrl);
          break;
        } catch (e) {
          attempts++;
          if (attempts >= maxAttempts) throw e;
          console.warn(`GitHub API fetch failed, retrying (${attempts}/${maxAttempts})...`);
          await new Promise(r => setTimeout(r, 1000 * attempts));
        }
      }
      if (!response.ok) {
        if (response.status === 403) {
          console.warn('GitHub API rate limit exceeded - using cached images');
          if (cachedGitHub) {
            try {
              const parsed = JSON.parse(cachedGitHub);
              allImages = parsed.images || [];
              console.log(`Loaded ${allImages.length} images from expired cache (rate limit fallback)`);
            } catch (parseError) {
              console.warn('Could not load cached images:', parseError);
            }
          }
        } else {
          console.warn(`GitHub API responded with status: ${response.status}`);
        }
      } else {
        const data = await response.json();
        console.log(`Received ${data.length} items from GitHub API`);
        for (const item of data) {
          if (item.type === 'dir') {
            console.log(`Processing directory: ${item.name}`);
            try {
              const dirResponse = await fetch(item.url);
              if (!dirResponse.ok) {
                console.warn(`Skipping directory ${item.name} due to failed response`);
                continue;
              }
              const dirContents = await dirResponse.json();
              if (!Array.isArray(dirContents)) {
                console.warn(`Skipping directory ${item.name} due to invalid response format`);
                continue;
              }
              const images = dirContents
                .filter(file => file.type === 'file' && file.name.match(/\.(jpg|jpeg|png|gif|webp)$/i));
              console.log(`Found ${images.length} images in directory ${item.name}`);
              allImages = allImages.concat(images.map(image => image.download_url));
            } catch (dirError) {
              console.error(`Error processing directory ${item.name}:`, dirError);
              continue;
            }
          }
        }
        if (allImages.length > 0) {
          try {
            localStorage.setItem(GITHUB_CACHE_KEY, JSON.stringify({
              timestamp: Date.now(),
              images: allImages
            }));
            console.log(`Cached ${allImages.length} GitHub images`);
          } catch (cacheError) {
            console.warn('Error caching GitHub images:', cacheError);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error fetching GitHub images:', error);
    try {
      const cachedGitHub = localStorage.getItem(GITHUB_CACHE_KEY);
      if (cachedGitHub) {
        const parsed = JSON.parse(cachedGitHub);
        allImages = parsed.images || [];
        console.log(`Loaded ${allImages.length} images from cache (error fallback)`);
      }
    } catch (fallbackError) {
      console.warn('Could not load cached images after error:', fallbackError);
    }
  }
  try {
    const redditImages = await fetchRedditImages();
    allImages = allImages.concat(redditImages);
  } catch (error) {
    console.error('Error fetching Reddit images:', error);
  }
  console.log(`Total images found: ${allImages.length} (GitHub + Reddit)`);
  if (allImages.length === 0) {
    console.warn('No images found from any source, using fallback background');
    return ['data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='];
  }
  return allImages;
}
const FALLBACK_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
async function displayRandomImage(retryCount = 0) {
  const MAX_RETRIES = 5;
  if (retryCount >= MAX_RETRIES) {
    console.error(`Exceeded MAX_RETRIES (${MAX_RETRIES}) for image loading. Using fallback.`);
    imageContainer.innerHTML = `<img src="${FALLBACK_IMAGE}" alt="Fallback Image">`;
    return;
  }
  const timerId = `displayRandomImage:${Date.now()}`;
  console.time(timerId);
  try {
    const cachedUrls = localStorage.getItem(IMAGE_CACHE_KEY);
    if (cachedUrls) {
      const urls = JSON.parse(cachedUrls);
      if (urls.length > 0) {
        const randomIndex = Math.floor(Math.random() * urls.length);
        const imageUrl = urls[randomIndex];
        console.log('Using image from localStorage:', imageUrl);
        const img = new Image();
        img.src = imageUrl;
        img.alt = "Random Image";
        img.onerror = () => {
          console.warn(`Cached image failed to load: ${imageUrl}, trying another... (retry ${retryCount + 1})`);
          imageCache.markFailed(imageUrl);
          setTimeout(() => displayRandomImage(retryCount + 1), 100); 
        };
        img.onload = () => {
          imageContainer.innerHTML = '';
          imageContainer.appendChild(img);
        };
        setTimeout(() => imageCache.initialize(), 100);
        return;
      }
    }
    if (imageCache.cache.size === 0) {
      await imageCache.initialize();
    }
    const randomImage = imageCache.getRandomImage();
    if (randomImage) {
      console.log('Using cached image:', randomImage);
      const img = new Image();
      img.src = randomImage;
      img.alt = "Random Image";
      img.onerror = () => {
        console.warn(`Memory cache image failed to load: ${randomImage}, trying another... (retry ${retryCount + 1})`);
        imageCache.markFailed(randomImage);
        setTimeout(() => displayRandomImage(retryCount + 1), 100);
      };
      img.onload = () => {
        imageContainer.innerHTML = '';
        imageContainer.appendChild(img);
      };
    } else {
      console.log('No cached image available, fetching new one');
      const images = await fetchImages();
      if (images.length > 0) {
        const newImage = images[Math.floor(Math.random() * images.length)];
        const img = new Image();
        img.src = newImage;
        img.alt = "Random Image";
        img.onerror = () => {
          console.warn(`New image failed to load: ${newImage}, trying another... (retry ${retryCount + 1})`);
          imageCache.markFailed(newImage);
          setTimeout(() => displayRandomImage(retryCount + 1), 100);
        };
        img.onload = () => {
          imageContainer.innerHTML = '';
          imageContainer.appendChild(img);
        };
        imageCache.cache.add(newImage);
        localStorage.setItem(IMAGE_CACHE_KEY, JSON.stringify([...imageCache.cache]));
      } else {
        console.warn('No images available to display');
        imageContainer.innerHTML = '<p>No images found.</p>';
      }
    }
  } finally {
    console.timeEnd(timerId);
  }
}
function formatDate(date) {
  const options = { day: 'numeric', month: 'long' };
  return new Date(date).toLocaleDateString('en-US', options);
}
function formatTime(date) {
  return new Date(date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}
const fetchLeaderboard = debounce(async (year = new Date().getFullYear()) => {
  console.time('leaderboard:fetch');
  console.log(`Fetching leaderboard data for year: ${year}`);
  const driversUrl = `https://api.jolpi.ca/ergast/f1/${year}/driverstandings/?format=json`;
  const teamsUrl = `https://api.jolpi.ca/ergast/f1/${year}/constructorstandings/?format=json`;
  const driversListUrl = `https://api.jolpi.ca/ergast/f1/${year}/drivers/?format=json`;
  const teamsListUrl = `https://api.jolpi.ca/ergast/f1/${year}/constructors/?format=json`;
  const driversLeaderboard = document.getElementById('drivers-leaderboard');
  const teamsLeaderboard = document.getElementById('teams-leaderboard');
  if (driversLeaderboard) driversLeaderboard.style.display = 'block';
  if (teamsLeaderboard) teamsLeaderboard.style.display = 'block';
  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear - 1, currentYear - 2];
  const yearSelectorHTML = years.map(y => `
    <span class="year-button ${parseInt(year) === y ? 'active' : ''}" data-year="${y}">${y}</span>
  `).join('').trim();
  const yearContainer = document.getElementById('year-selector-container');
  if (yearContainer) {
    yearContainer.innerHTML = yearSelectorHTML;
  }
  const driversList = document.getElementById('drivers-list');
  const teamsList = document.getElementById('teams-list');
  if (!driversList || !teamsList) {
    console.error("Could not find drivers-list or teams-list elements");
    return;
  }
  driversList.innerHTML = '<div class="leaderboard-message">Loading standings...</div>';
  teamsList.innerHTML = '<div class="leaderboard-message">Loading standings...</div>';
  setTimeout(() => {
    console.log("Adding click handlers to year buttons");
    document.querySelectorAll('.year-button').forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const btn = e.target.closest('.year-button');
        if (!btn) return;
        const selectedYear = parseInt(btn.getAttribute('data-year'));
        console.log(`Year button clicked: ${selectedYear}`);
        document.querySelectorAll('.year-button').forEach(b => {
          b.classList.remove('active');
        });
        btn.classList.add('active');
        fetchLeaderboard(selectedYear);
      });
    });
  }, 100);
  const renderFallbackData = (driversListData, teamsListData) => {
    const sortedTeams = teamsListData.MRData.ConstructorTable.Constructors.sort((a, b) => {
      return FALLBACK_DRIVERS_ORDER.indexOf(a.constructorId) - FALLBACK_DRIVERS_ORDER.indexOf(b.constructorId);
    });
    teamsList.innerHTML = sortedTeams.map((team, index) => `
      <div class="leaderboard-item" style="--index: ${index}" data-url="https://www.formula1.com/en/teams/${getTeamUrlSlug(team.name)}">
        <span class="leaderboard-position">${index + 1}</span>
        <span class="leaderboard-name">${escapeHTML(teamNameMapping[team.name] || team.name)}</span>
        <span class="leaderboard-points">0 pts</span>
      </div>
    `).join('');
      const sortedDrivers = sortDriversByTeam(
      driversListData.MRData.DriverTable.Drivers,
      teamsListData.MRData.ConstructorTable.Constructors
    );
    driversList.innerHTML = sortedDrivers.map((driver, index) => `
      <div class="leaderboard-item" style="--index: ${index}" data-url="https://www.formula1.com/en/drivers/${driver.givenName.toLowerCase()}-${driver.familyName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}">
        <span class="leaderboard-position">${index + 1}</span>
        <span class="leaderboard-name">#${escapeHTML(driver.permanentNumber)} ${escapeHTML(driver.givenName)} ${escapeHTML(driver.familyName)}</span>
        <span class="leaderboard-points">0 pts</span>
      </div>
    `).join('');
    document.querySelectorAll('.leaderboard-item').forEach(item => {
      item.addEventListener('click', () => {
        const url = item.getAttribute('data-url');
        window.open(url, '_blank');
      });
    });
    ensureLeaderboardsFit();
  };
  const renderStandingsData = (driversData, teamsData) => {
    const driversStandings = driversData.MRData.StandingsTable.StandingsLists[0].DriverStandings;
    const teamsStandings = teamsData.MRData.StandingsTable.StandingsLists[0].ConstructorStandings;
    driversList.innerHTML = driversStandings.map((driver, index) => `
      <div class="leaderboard-item" style="--index: ${index}" data-url="https://www.formula1.com/en/drivers/${driver.Driver.givenName.toLowerCase()}-${driver.Driver.familyName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}">
        <span class="leaderboard-position">${driver.position || (index + 1)}</span>
        <span class="leaderboard-name">#${escapeHTML(driver.Driver.permanentNumber || '?')} ${escapeHTML(driver.Driver.givenName)} ${escapeHTML(driver.Driver.familyName)}</span>
        <span class="leaderboard-points">${escapeHTML(driver.points)} pts</span>
      </div>
    `).join('');
    teamsList.innerHTML = teamsStandings.map((team, index) => `
      <div class="leaderboard-item" style="--index: ${index}" data-url="https://www.formula1.com/en/teams/${getTeamUrlSlug(team.Constructor.name)}">
        <span class="leaderboard-position">${team.position || (index + 1)}</span>
        <span class="leaderboard-name">${escapeHTML(teamNameMapping[team.Constructor.name] || team.Constructor.name)}</span>
        <span class="leaderboard-points">${escapeHTML(team.points)} pts</span>
      </div>
    `).join('');
    document.querySelectorAll('.leaderboard-item').forEach(item => {
      item.addEventListener('click', () => {
        const url = item.getAttribute('data-url');
        window.open(url, '_blank');
      });
    });
    ensureLeaderboardsFit();
  };
  const cacheKey = `f1_leaderboard_cache_${year}`;
  const cachedData = localStorage.getItem(cacheKey);
  let cachedType = null;
  let cachedPayload = null;
  if (cachedData) {
    try {
      const parsed = JSON.parse(cachedData);
      cachedType = parsed.type;
      cachedPayload = parsed.payload;
      console.log(`Using cached leaderboard data for year ${year}`);
      if (cachedType === 'standings') {
        renderStandingsData(cachedPayload.driversData, cachedPayload.teamsData);
      } else if (cachedType === 'fallback') {
        renderFallbackData(cachedPayload.driversListData, cachedPayload.teamsListData);
      }
    } catch (e) {
      console.error('Failed to parse cached leaderboard data:', e);
    }
  }
  try {
    console.log("Fetching API data...");
    const [driversResponse, teamsResponse] = await Promise.all([
      fetch(driversUrl).catch(e => ({ ok: false })),
      fetch(teamsUrl).catch(e => ({ ok: false }))
    ]);
    if (!driversResponse.ok || !teamsResponse.ok) {
      console.warn('Standings not available, falling back to driver/constructor lists');
      const [driversListResponse, teamsListResponse] = await Promise.all([
        fetch(driversListUrl),
        fetch(teamsListUrl)
      ]);
      if (!driversListResponse.ok || !teamsListResponse.ok) {
        if (year === new Date().getFullYear()) {
          console.warn(`Current year ${year} data unavailable, falling back to ${year - 1}`);
          return fetchLeaderboard(year - 1);
        }
        throw new Error('Both standings and lists unavailable');
      }
      const driversListData = await driversListResponse.json();
      const teamsListData = await teamsListResponse.json();
      const newPayload = { driversListData, teamsListData };
      const newHash = simpleHash(newPayload);
      const cachedHash = cachedPayload ? simpleHash(cachedPayload) : null;
      if (!cachedPayload || cachedType !== 'fallback' || cachedHash !== newHash) {
        renderFallbackData(driversListData, teamsListData);
        localStorage.setItem(cacheKey, JSON.stringify({ type: 'fallback', payload: newPayload }));
        console.log(`Updated cache with new fallback data for ${year}`);
      } else {
        console.log(`Cache is up to date for ${year} fallback data`);
      }
    } else {
      const driversData = await driversResponse.json();
      const teamsData = await teamsResponse.json();
      if (driversData.MRData.StandingsTable.StandingsLists?.[0]?.DriverStandings) {
        console.log("Successfully received standings data");
        const newPayload = { driversData, teamsData };
        const newHash = simpleHash(newPayload);
        const cachedHash = cachedPayload ? simpleHash(cachedPayload) : null;
        if (!cachedPayload || cachedType !== 'standings' || cachedHash !== newHash) {
          renderStandingsData(driversData, teamsData);
          localStorage.setItem(cacheKey, JSON.stringify({ type: 'standings', payload: newPayload }));
          console.log(`Updated cache with new standings data for ${year}`);
        } else {
          console.log(`Cache is up to date for ${year} standings data`);
        }
        return;
      } else {
        if (year === new Date().getFullYear()) {
          console.warn(`Current year ${year} has empty data, falling back to ${year - 1}`);
          return fetchLeaderboard(year - 1);
        }
      }
    }
  } catch (error) {
    console.error('Error in fetchLeaderboard():', error);
    if (driversList) driversList.innerHTML = '<p>Error loading drivers leaderboard.</p>';
    if (teamsList) teamsList.innerHTML = '<p>Error loading teams leaderboard.</p>';
  } finally {
    console.timeEnd('leaderboard:fetch');
  }
}, DEBOUNCE_DELAY);
function ensureLeaderboardsFit() {
  const driversContainer = document.getElementById('drivers-leaderboard');
  const driversList = document.getElementById('drivers-list');
  removePagination(driversContainer);
  applyPagination(driversContainer, driversList, '.leaderboard-item', 10);
  const teamsContainer = document.getElementById('teams-leaderboard');
  removePagination(teamsContainer);
  if (!teamsContainer.querySelector('.spacer-controls')) {
    const spacer = document.createElement('div');
    spacer.className = 'spacer-controls';
    spacer.innerHTML = '<button class="pagination-arrow"></button>'; 
    teamsContainer.appendChild(spacer);
  }
}
function tryFit(kind) {
  const container = document.getElementById(`${kind}-leaderboard`);
  const list = document.getElementById(`${kind}-list`);
  if (!container || !list) return;
  container.classList.remove('compress', 'x-compress', 'multi-column');
  removePagination(container);
  container.style.overflowY = 'auto';
  requestAnimationFrame(() => {
    const fits = () => {
      const hasOverflow = container.scrollHeight > container.clientHeight + 2;
      console.log(`${kind} - scrollHeight: ${container.scrollHeight}, clientHeight: ${container.clientHeight}, hasOverflow: ${hasOverflow}`);
      return !hasOverflow;
    };
    if (fits()) {
      container.style.overflowY = 'hidden';
      console.log(`${kind} fits without compression`);
      return; 
    }
    container.classList.add('compress');
    container.style.overflowY = 'hidden';
    if (fits()) {
      console.log(`${kind} fits with light compression`);
      return;
    }
    container.classList.add('x-compress');
    if (fits()) {
      console.log(`${kind} fits with extra compression`);
      return;
    }
    console.log(`${kind} needs pagination`);
    container.classList.remove('compress', 'x-compress');
    container.style.overflowY = 'hidden';
    applyPagination(container, list, '.leaderboard-item', 10);
  });
}
function removePagination(container) {
  const controls = container.querySelector('.pagination-controls');
  if (controls) controls.remove();
  const items = container.querySelectorAll('.leaderboard-item');
  items.forEach(it => (it.style.display = ''));
}
function applyPagination(container, listEl, itemSelector, pageSize = 10) {
  const items = Array.from(listEl.querySelectorAll(itemSelector));
  if (items.length <= pageSize) return; 
  const totalPages = Math.ceil(items.length / pageSize);
  let current = 1;
  const controls = document.createElement('div');
  controls.className = 'pagination-controls';
  const prevBtn = document.createElement('button');
  prevBtn.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" class="arrow-icon">
      <path d="M15 19l-7-7 7-7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;
  prevBtn.className = 'pagination-arrow prev';
  const nextBtn = document.createElement('button');
  nextBtn.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" class="arrow-icon">
      <path d="M9 5l7 7-7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `;
  nextBtn.className = 'pagination-arrow next';
  const render = (page) => {
    current = Math.max(1, Math.min(totalPages, page));
    items.forEach((it, idx) => {
      const start = (current - 1) * pageSize;
      const end = start + pageSize;
      if (idx >= start && idx < end) {
        it.style.display = 'flex'; 
      } else {
        it.style.display = 'none';
      }
    });
    prevBtn.disabled = current === 1;
    nextBtn.disabled = current === totalPages;
    prevBtn.classList.toggle('disabled', current === 1);
    nextBtn.classList.toggle('disabled', current === totalPages);
  };
  prevBtn.addEventListener('click', () => render(current - 1));
  nextBtn.addEventListener('click', () => render(current + 1));
  controls.appendChild(prevBtn);
  controls.appendChild(nextBtn);
  container.appendChild(controls);
  render(1);
}
async function fetchRaceSchedule() {
  try {
    const sessions = closestRace.sessions;
    let sessionsHTML = '';
    const sessionMapping = [
      { key: 'fp1', label: 'FP1' },
      { key: 'fp2', label: 'FP2' },
      { key: 'fp3', label: 'FP3' },
      { key: 'sprintQualifying', label: 'Sprint Qualifying' },
      { key: 'sprint_qualifying', label: 'Sprint Qualifying' },
      { key: 'sprint', label: 'Sprint' },
      { key: 'qualifying', label: 'Qualifying' }
    ];
    sessionMapping.forEach(({ key, label }) => {
      if (sessions[key]) {
        sessionsHTML += `<div class="session-time" data-time="${sessions[key]}"><strong>${label}:</strong> ${formatDate(sessions[key])} ${formatTime(sessions[key])}</div>`;
      }
    });
    const raceTime = sessions.gp || sessions.feature || sessions.race2 || sessions.race;
    if (raceTime) {
      const raceLabel = sessions.feature ? 'Feature Race' : sessions.race2 ? 'Race 2' : 'Race';
      sessionsHTML += `<div class="session-time" data-time="${raceTime}"><strong>${raceLabel}:</strong> ${formatDate(raceTime)} ${formatTime(raceTime)}</div>`;
    }
    if (raceScheduleContainer) {
      raceScheduleContainer.style.display = 'block';
      raceScheduleContainer.innerHTML = `
        <h2 style="text-align: left;">Upcoming Race: ${closestRace.slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</h2>
        <div class="horizontal-schedule">
          ${sessionsHTML}
        </div>
      `;
      document.querySelectorAll('.session-time').forEach(item => {
        let originalTime = item.innerHTML;
        item.addEventListener('click', () => {
          const time = new Date(item.getAttribute('data-time'));
          if (item.style.color === 'white') {
            item.innerHTML = originalTime;
            item.style.color = '';
            item.style.cursor = 'pointer';
          } else {
            item.innerHTML = `Local Time: ${time.toLocaleString()}`;
            item.style.color = 'white';
          }
        });
      });
    }
  } catch (error) {
    console.error('Error fetching race schedule:', error);
    raceScheduleContainer.innerHTML = '<p>Error loading race schedule.</p>';
  }
}
const FALLBACK_DRIVERS_ORDER = [
  'ferrari',
  'mercedes',
  'red_bull',
  'mclaren',
  'aston_martin',
  'alpine',
  'haas',
  'rb',
  'sauber',
  'williams',
  'audi',
  'cadillac'
];
function sortDriversByTeam(drivers, constructors) {
  const driversByTeam = {};
  constructors.forEach(team => {
    driversByTeam[team.constructorId] = [];
  });
  drivers.forEach(driver => {
    const constructor = constructors.find(team => {
      return team.url === driver.Constructors?.[0]?.url;
    });
    if (constructor) {
      driversByTeam[constructor.constructorId].push(driver);
    }
  });
  return FALLBACK_DRIVERS_ORDER.flatMap(teamId =>
    driversByTeam[teamId] || []
  );
}
const pad = (n) => n < 10 ? '0' + n : n;
function updateCountdown(targetDate) {
  const now = new Date();
  const diff = targetDate - now;
  if (diff <= 0) {
    countdownTimer.innerHTML = '<div class="race-live" style="font-size: 1.5rem; font-weight: bold; color: #ff1801;">RACE IS LIVE!</div>';
    return;
  }
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  if (!document.getElementById('days-count')) {
    countdownTimer.innerHTML = `
        <div class="time-unit"><span id="days-count">${pad(days)}</span><label>DAYS</label></div>
        <div class="time-unit"><span id="hours-count">${pad(hours)}</span><label>HRS</label></div>
        <div class="time-unit"><span id="minutes-count">${pad(minutes)}</span><label>MIN</label></div>
     `;
  } else {
    document.getElementById('days-count').innerText = pad(days);
    document.getElementById('hours-count').innerText = pad(hours);
    document.getElementById('minutes-count').innerText = pad(minutes);
  }
}
function startCountdown(race) {
  if (!race) {
    if (nextRaceTitle) nextRaceTitle.innerText = "No Upcoming Races";
    return;
  }
  const raceName = race.name || "Unknown GP";
  if (nextRaceTitle) nextRaceTitle.innerText = raceName;
  const raceDate = new Date(race.sessions.gp || race.sessions.feature || race.sessions.race2 || race.sessions.race);
  updateCountdown(raceDate);
  if (window._countdownIntervalId) clearInterval(window._countdownIntervalId);
  window._countdownIntervalId = setInterval(() => updateCountdown(raceDate), 30000);
}
async function fetchTrackDetails(race) {
  const cached = raceDataCache.getCachedTrackDetails(race);
  if (cached) {
    console.log(`Using cached track details for ${race}`);
    return cached;
  }
  const apiUrl = `https://f1-circuit-api.vercel.app/api/circuits/${race}`;
  try {
    console.log(`Fetching fresh track details for ${race}`);
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error(`Network response was not ok for URL: ${apiUrl}`);
    const data = await response.json();
    const trackDetails = {
      name: data.name || 'N/A',
      firstGrandPrix: data.first_grand_prix || 'N/A',
      numberOfLaps: data.number_of_laps || 'N/A',
      circuitLength: data.circuit_length ? `${data.circuit_length} km` : 'N/A',
      raceDistance: data.race_distance ? `${data.race_distance} km` : 'N/A',
      lapRecord: data.lap_record || 'N/A'
    };
    raceDataCache.cacheTrackDetails(race, trackDetails);
    return trackDetails;
  } catch (error) {
    console.error('Error fetching track details:', error);
    return {
      name: 'Error',
      firstGrandPrix: 'N/A',
      numberOfLaps: 'N/A',
      circuitLength: 'N/A',
      raceDistance: 'N/A',
      lapRecord: 'N/A'
    };
  }
}
trackButton.addEventListener('click', async () => {
  showTrackDetails = true;
  showSchedule = false;
  const raceName = closestRace?.slug || 'bahrain';
  const trackDetails = await fetchTrackDetails(raceName);
  if (raceScheduleContainer) {
    raceScheduleContainer.style.display = 'block';
    raceScheduleContainer.innerHTML = `
    <h2>Track Details</h2>
    <div class="horizontal-schedule">
      <div><strong>Name of the Circuit:</strong> ${trackDetails.name}</div>
      <div><strong>First Grand Prix:</strong> ${trackDetails.firstGrandPrix}</div>
      <div><strong>Number of Laps:</strong> ${trackDetails.numberOfLaps}</div>
      <div><strong>Circuit Length:</strong> ${trackDetails.circuitLength}</div>
      <div><strong>Race Distance:</strong> ${trackDetails.raceDistance}</div>
      <div><strong>Lap Record:</strong> ${trackDetails.lapRecord}</div>
    </div>
  `;
  }
});
scheduleButton.addEventListener('click', () => {
  showTrackDetails = false;
  showSchedule = true;
  fetchRaceSchedule();
});
const donateButton = document.getElementById('donate-button');
const githubButton = document.getElementById('github-button');
const discordButton = document.getElementById('discord-button');
const newsButton = document.getElementById('news-button');
donateButton.addEventListener('click', () => {
  window.open('https://buymeacoffee.com/batuhantrkgl', '_blank');
});
githubButton.addEventListener('click', () => {
  window.open('https://github.com/batuhantrkgl/bwoah-extension/tree/src', '_blank');
});
discordButton.addEventListener('click', () => {
  window.open('https://github.com/batuhantrkgl/bwoah-extension/discussions', '_blank');
});
const blurButton = document.getElementById('blur-button');
const blurButtonIcon = blurButton.querySelector('img');
const overlay = document.getElementById('overlay');
function toggleBlur() {
  const isBlurred = overlay.style.backdropFilter === 'blur(2px)';
  if (isBlurred) {
    overlay.style.backdropFilter = 'none';
    blurButtonIcon.src = 'images/blur_on.png';
    localStorage.setItem('isBlurred', 'false');
  } else {
    overlay.style.backdropFilter = 'blur(2px)';
    blurButtonIcon.src = 'images/blur_off.png';
    localStorage.setItem('isBlurred', 'true');
  }
}
blurButton.addEventListener('click', toggleBlur);
const darknessButton = document.getElementById('darkness-button');
const darknessButtonIcon = darknessButton.querySelector('img');
function toggleDarkness() {
  const isDark = overlay.style.background === 'rgba(0, 0, 0, 0.6)';
  if (isDark) {
    overlay.style.background = 'none';
    darknessButtonIcon.src = 'images/darkness_off.png';
    localStorage.setItem('isDark', 'false');
  } else {
    overlay.style.background = 'rgba(0, 0, 0, 0.6)';
    darknessButtonIcon.src = 'images/darkness.png';
    localStorage.setItem('isDark', 'true');
  }
}
darknessButton.addEventListener('click', toggleDarkness);
const othersButton = document.getElementById('others-button');
const othersContainer = document.getElementById('others-container');
const controlsBar = document.getElementById('controls-bar');
const backButton = document.getElementById('back-button');
if (othersButton && othersContainer && controlsBar && backButton) {
  othersButton.addEventListener('click', () => {
    controlsBar.style.display = 'none';
    othersContainer.style.display = 'flex';
  });
  backButton.addEventListener('click', () => {
    othersContainer.style.display = 'none';
    controlsBar.style.display = 'flex';
  });
}
const searchToggleButton = document.getElementById('search-toggle-button');
const searchModeContainer = document.getElementById('search-mode-container');
const disableSearchButton = document.getElementById('disable-search-button');
const toggleButtonsContainer = document.getElementById('toggle-buttons');
const SEARCH_MODE_KEY = 'bwoahSearchMode';
function updateSearchMode(isEnabled) {
  if (isEnabled) {
    controlsBar.style.display = 'none';
    searchModeContainer.style.display = 'flex';
    setTimeout(() => {
      const searchInput = document.getElementById('main-search-input');
      if (searchInput) searchInput.focus();
    }, 100);
  } else {
    searchModeContainer.style.display = 'none';
    controlsBar.style.display = 'flex';
  }
}
const isSearchMode = localStorage.getItem(SEARCH_MODE_KEY) === 'true';
updateSearchMode(isSearchMode);
if (searchToggleButton && searchModeContainer && disableSearchButton) {
  searchToggleButton.addEventListener('click', () => {
    localStorage.setItem(SEARCH_MODE_KEY, 'true');
    othersContainer.style.display = 'none';
    updateSearchMode(true);
  });
  disableSearchButton.addEventListener('click', () => {
    localStorage.setItem(SEARCH_MODE_KEY, 'false');
    updateSearchMode(false);
  });
}
const f1Button = document.getElementById('f1-button');
if (f1Button) {
  f1Button.addEventListener('click', () => {
    window.open('https://f1.com/', '_blank');
  });
}
document.getElementById('news-button').addEventListener('click', () => {
  window.open('https://www.formula1.com/en/latest/all.html', '_blank');
});
document.querySelectorAll('.toggle-button').forEach(button => {
  button.classList.add('animated-button');
});
async function checkLiveSession() {
  console.log('Checking for live session');
  if (isDevMode) {
    console.log('Dev mode active, returning simulated session');
    return {
      isLive: true,
      sessionName: 'Development Session',
      sessionTime: new Date(),
      isDevMode: true
    };
  }
  if (!closestRace) {
    console.log('No closest race found');
    return { isLive: false };
  }
  const now = new Date();
  const sessions = closestRace.sessions;
  console.log('Checking sessions:', sessions);
  const sessionTimes = {
    'FP1': new Date(sessions.fp1),
    'FP2': new Date(sessions.fp2),
    'FP3': new Date(sessions.fp3),
    'Qualifying': new Date(sessions.qualifying),
    'Race': new Date(sessions.gp || sessions.feature || sessions.race2 || sessions.race)
  };
  for (const [sessionName, sessionTime] of Object.entries(sessionTimes)) {
    if (Math.abs(now - sessionTime) <= 3 * 60 * 60 * 1000) {
      return { isLive: true, sessionName, sessionTime };
    }
  }
  return { isLive: false };
}
async function updateLiveSessionData() {
  const liveStatus = await checkLiveSession();
  if (!liveStatus.isLive && !isDevMode) return;
  if (closestRace) {
    const trackImage = getCircuitImageUrl(closestRace.name);
    imageContainer.innerHTML = `<img src="${trackImage}" alt="Track Layout">`;
  }
  if (isDevMode) {
    const mockData = getMockData();
    const leftSection = ensureElement('dev-left-section');
    const rightSection = ensureElement('dev-right-section');
    const bottomSection = ensureElement('dev-bottom-section');
    leftSection.className = 'dev-side-section';
    rightSection.className = 'dev-side-section';
    bottomSection.className = 'dev-bottom-section';
    leftSection.style.display = 'block';
    rightSection.style.display = 'block';
    bottomSection.style.display = 'block';
    leftSection.innerHTML = `
      <div class="live-section team-radio">
      <h3>Latest Team Radio (Mock)</h3>
      ${formatTeamRadio(mockData.teamRadio)}
      </div>
      <div class="live-section positions">
      <h3>Top 3 Positions (Mock)</h3>
      ${formatPositions(mockData.positions)}
      </div>
    `;
    rightSection.innerHTML = `
      <div class="live-section race-control">
        <h3>Race Control Messages (Mock)</h3>
        ${formatRaceControl(mockData.raceControl)}
      </div>
      <div class="live-section pit-stops">
        <h3>Recent Pit Stops (Mock)</h3>
        ${formatPitStops(mockData.pitStops)}
      </div>
    `;
    bottomSection.innerHTML = `
      <div class="live-session-header">
        <h2>DEV MODE: Simulated Session</h2>
        <button id="toggle-dev-mode" class="dev-mode-button">Disable Dev Mode</button>
      </div>
    `;
    document.getElementById('toggle-dev-mode')?.addEventListener('click', toggleDevMode);
    return;
  }
  const trackImage = getCircuitImageUrl(closestRace.name);
  imageContainer.innerHTML = `
    <div style="background-color: #404040; padding: 20px; display: flex; justify-content: center; align-items: center;">
      <img class="live-mode-imageContainer" 
           src="${trackImage}" 
           alt="Track Layout"
           style="width: 50%; height: 50%; object-fit: contain;">
    </div>`;
  let liveDataContainer = document.getElementById('live-data');
  if (!liveDataContainer) {
    liveDataContainer = document.createElement('div');
    liveDataContainer.id = 'live-data';
    document.body.appendChild(liveDataContainer);
  }
  try {
    const sessionKey = await _getCurrentSessionKey();
    const [teamRadio, raceControl, positions, pitStops] = await Promise.all([
      fetch(`https://api.openf1.org/v1/team_radio?session_key=${sessionKey}`).then(r => r.json()),
      fetch(`https://api.openf1.org/v1/race_control?session_key=${sessionKey}`).then(r => r.json()),
      fetch(`https://api.openf1.org/v1/position?session_key=${sessionKey}`).then(r => r.json()),
      fetch(`https://api.openf1.org/v1/pit?session_key=${sessionKey}`).then(r => r.json())
    ]);
    liveDataContainer.innerHTML = `
      <div class="live-session-header">
        <h2>🔴 LIVE: ${liveStatus.sessionName}</h2>
      </div>
      <div class="live-data-grid">
        <div class="live-section team-radio">
          <h3>Latest Team Radio</h3>
          ${formatTeamRadio(teamRadio.slice(-3))}
        </div>
        <div class="live-section race-control">
          <h3>Race Control Messages</h3>
          ${formatRaceControl(raceControl.slice(-3))}
        </div>
        <div class="live-section positions">
          <h3>Top 3 Positions</h3>
          ${formatPositions(positions.filter(p => p.position <= 3))}
        </div>
        <div class="live-section pit-stops">
          <h3>Recent Pit Stops</h3>
          ${formatPitStops(pitStops.slice(-3))}
        </div>
      </div>
    `;
  } catch (error) {
    console.error('Error fetching live session data:', error);
  }
}
function formatTeamRadio(radios) {
  return radios.map(radio => `
    <div class="radio-message">
      <span class="driver-number">#${radio.driver_number}</span>
      <audio class="radio-audio" controls src="${radio.recording_url}"></audio>
    </div>
  `).join('');
}
function formatRaceControl(messages) {
  return messages.map(msg => `
    <div class="race-control-message">
      <span class="message-time">${new Date(msg.date).toLocaleTimeString()}</span>
      <span class="message-text">${msg.message}</span>
    </div>
  `).join('');
}
function formatPositions(positions) {
  if (!Array.isArray(positions)) return '<div>No position data available</div>';
  return positions
    .filter(pos => pos && typeof pos === 'object' && pos.position && pos.driver_number)
    .map(pos => `
      <div class="position-item">
        <span class="position-number">P${pos.position}</span>
        <span class="driver-info">
          <span class="driver-number">#${pos.driver_number}</span>
          <span class="driver-name">${driverMapping[pos.driver_number] || 'Unknown Driver'}</span>
        </span>
        ${pos.gap ? `<span class="driver-gap">${pos.gap}</span>` : ''}
      </div>
    `).join('') || '<div>No valid position data</div>';
}
function formatPitStops(stops) {
  return stops.map(stop => `
    <div class="pit-stop-item">
      <span class="driver-number">#${stop.driver_number} ${driverMapping[stop.driver_number] || ''}</span>
      <span class="pit-info">
        <span class="pit-duration">${stop.pit_duration.toFixed(1)}s</span>
        ${stop.lap_number ? `<span class="pit-lap">Lap ${stop.lap_number}</span>` : ''}
      </span>
    </div>
  `).join('');
}
let _livePollingInterval = null;
function startLivePolling() {
  if (_livePollingInterval) return; 
  _livePollingInterval = setInterval(async () => {
    const status = await checkLiveSession();
    if (!status.isLive && !isDevMode) {
      stopLivePolling();
      displayRandomImage();
      return;
    }
    updateLiveSessionData();
  }, 30000);
  console.log('Live polling started');
}
function stopLivePolling() {
  if (_livePollingInterval) {
    clearInterval(_livePollingInterval);
    _livePollingInterval = null;
    console.log('Live polling stopped');
  }
}
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    const othersContainer = document.getElementById('others-container');
    const controlsBar = document.getElementById('controls-bar');
    const raceScheduleContainer = document.getElementById('race-schedule');
    if (othersContainer && window.getComputedStyle(othersContainer).display === 'flex') {
      othersContainer.style.display = 'none';
      if (controlsBar) controlsBar.style.display = 'flex';
    }
    if (showTrackDetails || showSchedule) {
      showTrackDetails = false;
      showSchedule = false;
      if (raceScheduleContainer) {
        raceScheduleContainer.innerHTML = '';
        raceScheduleContainer.style.display = 'none';
      }
      if (controlsBar) controlsBar.style.display = 'flex';
      const toggleButtons = document.getElementById('toggle-buttons');
      if (toggleButtons) toggleButtons.style.display = 'flex';
    }
  } else if (event.ctrlKey && event.shiftKey && event.key === 'Q') {
    toggleDevMode();
  }
});
function getMockData() {
  return {
    teamRadio: [
      { driver_number: 1, recording_url: REAL_TEAM_RADIO_CLIPS[1], date: new Date().toISOString() },
      { driver_number: 11, recording_url: REAL_TEAM_RADIO_CLIPS[11], date: new Date().toISOString() },
      { driver_number: 44, recording_url: REAL_TEAM_RADIO_CLIPS[44], date: new Date().toISOString() }
    ],
    raceControl: [
      { date: new Date().toISOString(), message: 'DRS ENABLED - Track conditions suitable for DRS usage', flag: 'NONE' },
      { date: new Date().toISOString(), message: 'Track limits violation at Turn 4 - Driver #1 (VER) - Lap time deleted', flag: 'BLACK AND WHITE' },
      { date: new Date().toISOString(), message: 'Yellow flag in sector 2 - Car stopped at Turn 8', flag: 'YELLOW' }
    ],
    positions: [
      { position: 1, driver_number: 1, gap: "+0.000" },
      { position: 2, driver_number: 11, gap: "+0.432" },
      { position: 3, driver_number: 44, gap: "+0.578" }
    ],
    pitStops: [
      { driver_number: 1, pit_duration: 22.1, lap_number: 24 },
      { driver_number: 11, pit_duration: 21.8, lap_number: 25 },
      { driver_number: 44, pit_duration: 22.4, lap_number: 23 }
    ]
  };
}
const standingsButton = document.getElementById('standings-button');
standingsButton.addEventListener('click', async () => {
  const driversLeaderboard = document.getElementById('drivers-leaderboard');
  const teamsLeaderboard = document.getElementById('teams-leaderboard');
  if (!driversLeaderboard || !teamsLeaderboard) return;
  const isHidden = driversLeaderboard.style.display === 'none';
  driversLeaderboard.style.display = isHidden ? 'block' : 'none';
  teamsLeaderboard.style.display = isHidden ? 'block' : 'none';
  localStorage.setItem('showLeaderboards', isHidden ? 'true' : 'false');
  if (isHidden) {
    await fetchLeaderboard(new Date().getFullYear());
  }
});
document.addEventListener('DOMContentLoaded', async () => {
  const pageLoadTimer = 'pageLoad:' + Date.now();
  console.time(pageLoadTimer);
  try {
    console.log("DOM Content Loaded - Initializing app...");
    const driversLeaderboard = document.getElementById('drivers-leaderboard');
    const teamsLeaderboard = document.getElementById('teams-leaderboard');
    const safeInitialize = () => imageCache.initialize().catch(err => {
      console.error('Image cache init failed:', err);
      return null;
    });
    const safeLeaderboard = () => {
      try {
        return fetchLeaderboard();
      } catch (err) {
        console.error('Leaderboard fetch failed:', err);
        return null;
      }
    };
    const safeDisplayImage = () => displayRandomImage().catch(err => {
      console.error('Display image failed:', err);
      return null;
    });
    await Promise.all([
      safeInitialize(),
      safeLeaderboard(),
      safeDisplayImage()
    ]);
    const overlay = document.getElementById('overlay');
    await initRaceData();
    isDevMode = localStorage.getItem(devModeKey) === 'true';
    const showLeaderboards = localStorage.getItem('showLeaderboards') !== 'false'; 
    if (isDevMode) {
      console.log("Dev mode is active");
      ['drivers-leaderboard', 'teams-leaderboard', 'race-schedule']
        .map(id => document.getElementById(id))
        .forEach(el => el && (el.style.display = 'none'));
      updateLiveSessionData();
      startLivePolling();
    } else {
      console.log("Standard mode active, applying visibility states");
      if (driversLeaderboard) driversLeaderboard.style.display = showLeaderboards ? 'block' : 'none';
      if (teamsLeaderboard) teamsLeaderboard.style.display = showLeaderboards ? 'block' : 'none';
      const liveStatus = await checkLiveSession();
      if (liveStatus.isLive) {
        updateLiveSessionData();
        startLivePolling();
      }
    }
    setupUIElements(overlay);
  } catch (error) {
    console.error('Error during page initialization:', error);
  } finally {
    console.timeEnd(pageLoadTimer);
  }
});
async function initRaceData() {
  try {
    let jsonContent = null;
    const cachedRaces = raceDataCache.getCachedRaceSchedule(year);
    if (cachedRaces) {
      console.log('Using cached race schedule');
      jsonContent = { races: cachedRaces };
    } else {
      console.log('Fetching fresh race schedule');
      let response = await fetch(url);
      if (!response.ok) throw new Error(`Network response was not ok for URL: ${url}`);
      jsonContent = await response.json();
      raceDataCache.cacheRaceSchedule(year, jsonContent.races);
    }
    await checkSeasonBreak(jsonContent);
    let currentDate = new Date();
    let sortedRaces = jsonContent.races
      .filter(race => new Date(race.sessions.gp || race.sessions.feature || race.sessions.race2 || race.sessions.race) > currentDate)
      .sort((a, b) => new Date(a.sessions.gp || a.sessions.feature || a.sessions.race2 || a.sessions.race) - new Date(b.sessions.gp || b.sessions.feature || b.sessions.race2 || b.sessions.race));
    if (!sortedRaces.length) {
      console.log("No upcoming races for this year, checking next year's schedule...");
      year += 1;
      url = `https://raw.githubusercontent.com/sportstimes/f1/main/_db/${motorsport}/${year}.json`;
      const cachedNextYear = raceDataCache.getCachedRaceSchedule(year);
      if (cachedNextYear) {
        jsonContent = { races: cachedNextYear };
      } else {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Network response was not ok for URL: ${url}`);
        jsonContent = await response.json();
        raceDataCache.cacheRaceSchedule(year, jsonContent.races);
      }
      sortedRaces = jsonContent.races
        .filter(race => new Date(race.sessions.gp || race.sessions.feature || race.sessions.race2 || race.sessions.race) > currentDate)
        .sort((a, b) => new Date(a.sessions.gp || a.sessions.feature || a.sessions.race2 || a.sessions.race) - new Date(b.sessions.gp || b.sessions.feature || b.sessions.race2 || b.sessions.race));
      if (!sortedRaces.length) {
        raceScheduleContainer.innerHTML = '<p>No upcoming races found for the next year either.</p>';
      }
    }
    closestRace = sortedRaces[0];
    startCountdown(closestRace);
  } catch (error) {
    console.error('Error fetching race schedule:', error);
  }
}
function setupUIElements(overlay) {
  console.log("Setting up UI elements");
  setupButton('blur-button', overlay, 'isBlurred', 'blur(2px)', 'none',
    ['blur_off.png', 'blur_on.png']);
  setupButton('darkness-button', overlay, 'isDark', 'rgba(0, 0, 0, 0.6)', 'none',
    ['darkness.png', 'darkness_off.png']);
  setupButton('countdown-toggle-button', document.getElementById('next-race-countdown'), 'isCountdownVisible', 'flex', 'none',
    ['visibility.svg', 'visibility.svg']);
  const countdownToggle = document.getElementById('countdown-toggle-button');
  const countdownEl = document.getElementById('next-race-countdown');
  if (countdownToggle && countdownEl) {
    const stored = localStorage.getItem('isCountdownVisible');
    const isVisible = stored === null || stored === 'true';
    countdownEl.style.display = isVisible ? 'inline-flex' : 'none';
    countdownToggle.addEventListener('click', () => {
      const currentlyVisible = countdownEl.style.display !== 'none';
      if (currentlyVisible) {
        countdownEl.style.display = 'none';
        localStorage.setItem('isCountdownVisible', 'false');
        countdownToggle.style.opacity = '0.5'; 
      } else {
        countdownEl.style.display = 'inline-flex';
        localStorage.setItem('isCountdownVisible', 'true');
        countdownToggle.style.opacity = '1';
      }
    });
    countdownToggle.style.opacity = isVisible ? '1' : '0.5';
  }
}
function setupButton(buttonId, overlay, storageKey, activeValue, inactiveValue, [activeIcon, inactiveIcon]) {
  const button = document.getElementById(buttonId);
  const buttonIcon = button?.querySelector('img');
  if (button && buttonIcon) {
    const isActive = localStorage.getItem(storageKey) === 'true';
    const propertyName = buttonId.includes('blur') ? 'backdropFilter' : 'background';
    overlay.style[propertyName] = isActive ? activeValue : inactiveValue;
    buttonIcon.src = `images/${isActive ? activeIcon : inactiveIcon}`;
  }
}
async function _getCurrentSessionKey() {
  try {
    const response = await fetch('https://api.openf1.org/v1/sessions?session_key=latest');
    if (!response.ok) throw new Error(`OpenF1 API returned ${response.status}`);
    const data = await response.json();
    if (Array.isArray(data) && data.length > 0) {
      return data[0].session_key;
    }
    throw new Error('No session data returned');
  } catch (error) {
    console.error('Error fetching current session key:', error);
    return null;
  }
}
let scrollTimeout;
const handleScrollStart = () => {
  document.body.classList.add('is-scrolling');
  clearTimeout(scrollTimeout);
  scrollTimeout = setTimeout(() => {
    document.body.classList.remove('is-scrolling');
  }, 400);
};
document.addEventListener('wheel', handleScrollStart);
document.addEventListener('touchmove', handleScrollStart);