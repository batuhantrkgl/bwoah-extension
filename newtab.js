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

const driverMapping = {
  1: "Max Verstappen",
  11: "Sergio Perez",
  16: "Charles Leclerc",
  55: "Carlos Sainz",
  44: "Lewis Hamilton",
  63: "George Russell",
  81: "Oscar Piastri",
  4: "Lando Norris",
  14: "Fernando Alonso",
  18: "Lance Stroll",
  77: "Valtteri Bottas",
  24: "Zhou Guanyu",
  23: "Alex Albon",
  2: "Logan Sargeant",
  3: "Daniel Ricciardo",
  22: "Yuki Tsunoda",
  27: "Nico Hulkenberg",
  20: "Kevin Magnussen"
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
  "Sauber": "Stake F1 Team Kick Sauber"
};

const REAL_TEAM_RADIO_CLIPS = {
  1: "https://livetiming.formula1.com/static/2024/2024-03-02_Pre-Season_Testing/2024-03-02_Practice/TeamRadio/TESVER01_1_20240302_112854.mp3",
  11: "https://livetiming.formula1.com/static/2024/2024-03-02_Pre-Season_Testing/2024-03-02_Practice/TeamRadio/TESPER01_11_20240302_112908.mp3",
  44: "https://livetiming.formula1.com/static/2024/2024-03-02_Pre-Season_Testing/2024-03-02_Practice/TeamRadio/TESHAM01_44_20240302_113015.mp3"
};

const IMAGE_CACHE_SIZE = 20; // Increased from 5
const IMAGE_CACHE_KEY = 'bwoahImageCache';
const SHOWN_IMAGES_KEY = 'bwoahShownImages';
const REDDIT_CACHE_KEY = 'bwoahRedditCache';
const REDDIT_CACHE_DURATION = 60 * 60 * 1000; // 1 hour
const GITHUB_CACHE_KEY = 'bwoahGitHubCache';
const GITHUB_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours (long cache due to rate limits)

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const RACE_SCHEDULE_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const TRACK_DETAILS_CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days
const DEBOUNCE_DELAY = 250; // 250ms
const API_TIMEOUT = 5000; // 5 seconds

function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

class APICache {
  constructor() {
    this.cache = new Map();
  }

  async fetch(url, options = {}) {
    const cacheKey = url + JSON.stringify(options);
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log(`Cache hit for ${url}`);
      return cached.data;
    }

    console.log(`Cache miss for ${url}`);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      const data = await response.json();

      this.cache.set(cacheKey, {
        timestamp: Date.now(),
        data
      });

      return data;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  clear() {
    this.cache.clear();
  }
}

const apiCache = new APICache();

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
      // Removed extensive validation that might fail
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
    this.loading = new Map();
    this.preloadQueue = [];
    this.initTimerId = null;
    this.shownImages = new Set(JSON.parse(localStorage.getItem(SHOWN_IMAGES_KEY) || '[]'));
  }

  async initialize() {
    const timerId = `imageCache:init:${Date.now()}`;
    console.time(timerId);
    this.initTimerId = timerId;

    try {
      // First, get one image immediately
      const images = await fetchImages();
      if (images.length > 0) {
        const initialImage = images[Math.floor(Math.random() * images.length)];
        this.cache.add(initialImage);
        this.shownImages.add(initialImage);
        localStorage.setItem(SHOWN_IMAGES_KEY, JSON.stringify([...this.shownImages]));
      }

      // Then load the rest in the background
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
      console.timeEnd(this.initTimerId);
    }
  }

  async validateCachedUrls(urls) {
    // Skip HEAD check because it causes CORS errors for many image hosts (Reddit, Imgur)
    // We'll trust the cache expiration instead, or let the image fail to load naturally
    this.cache = new Set(urls);
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

    const images = await fetchImages();
    const availableImages = images.filter(url => !this.shownImages.has(url));

    // Reset shown images if we've seen all images
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

    // Track shown image
    this.shownImages.add(image);
    localStorage.setItem(SHOWN_IMAGES_KEY, JSON.stringify([...this.shownImages]));

    this.cache.delete(image);

    if (this.cache.size < IMAGE_CACHE_SIZE / 2) {
      this.fillCache().catch(console.error);
    }

    return image;
  }

  // Add method to check how many unique images have been shown
  getShownImagesCount() {
    return this.shownImages.size;
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
    // In dev mode, hide normal UI
    if (driversLeaderboard) driversLeaderboard.style.display = 'none';
    if (teamsLeaderboard) teamsLeaderboard.style.display = 'none';
    if (raceSchedule) raceSchedule.style.display = 'none';
  } else {
    // When exiting dev mode, restore normal UI
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
  console.log("Running checkSeasonBreak...");

  // Show leaderboards by default during seasons
  const driversLeaderboard = document.getElementById('drivers-leaderboard');
  const teamsLeaderboard = document.getElementById('teams-leaderboard');

  console.log("Setting initial visibility of leaderboards");

  // Always make them visible by default
  if (driversLeaderboard) {
    driversLeaderboard.style.display = 'block';
    console.log("Drivers leaderboard display set to block");
  }

  if (teamsLeaderboard) {
    teamsLeaderboard.style.display = 'block';
    console.log("Teams leaderboard display set to block");
  }

  // Preload leaderboard data with current year
  console.log("Fetching initial leaderboard data...");
  await fetchLeaderboard(new Date().getFullYear());
}

// IIFE Removed - logic moved to initApp to avoid hoisting issues
/*
(async () => {
  ...
})();
*/

async function fetchRedditImages() {
  console.log('Fetching images from r/F1Porn');

  // Check cache first
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
    // Use background script to fetch Reddit data (bypasses CORS)
    // Retry mechanism for service worker connection
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
        break; // Success, exit loop
      } catch (error) {
        attempts++;
        if (attempts >= maxAttempts) {
          throw error;
        }
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 100 * attempts));
      }
    }

    const posts = response.data.children;

    const imageUrls = posts
      .filter(post => {
        const url = post.data.url;
        // Check if it's a direct image link
        return url && (
          url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ||
          url.includes('i.redd.it') ||
          url.includes('i.imgur.com')
        );
      })
      .map(post => {
        let url = post.data.url;
        // Convert imgur gallery links to direct image links
        if (url.includes('imgur.com') && !url.includes('i.imgur.com')) {
          url = url.replace('imgur.com', 'i.imgur.com') + '.jpg';
        }
        return url;
      })
      .filter(url => url); // Remove any null/undefined

    console.log(`Found ${imageUrls.length} images from r/F1Porn`);

    // Cache the results
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

async function fetchImages() {
  console.log('Starting fetchImages()');
  let allImages = [];

  // Fetch GitHub images (with caching for rate limit protection)
  try {
    // Check cache first
    const cachedGitHub = localStorage.getItem(GITHUB_CACHE_KEY);
    let useCache = false;

    if (cachedGitHub) {
      try {
        const parsed = JSON.parse(cachedGitHub);
        // If cache is still valid, use it
        if (Date.now() - parsed.timestamp < GITHUB_CACHE_DURATION) {
          console.log('Using cached GitHub images (cache still valid)');
          allImages = parsed.images;
          useCache = true;
        }
      } catch (parseError) {
        console.warn('Error parsing GitHub cache:', parseError);
      }
    }

    // Only fetch if not using cache
    if (!useCache) {
      console.log(`Fetching images from GitHub API: ${apiUrl}`);
      const response = await fetch(apiUrl);

      if (!response.ok) {
        if (response.status === 403) {
          console.warn('GitHub API rate limit exceeded - using cached images');
          // Use cached images even if expired when rate limited
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

        // Cache the successfully fetched images
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
    // Try to use cached images as last resort
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

  // Fetch Reddit images
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

function getRandomImage(images) {
  console.log('Getting random image from', images.length, 'images');
  const lastImage = localStorage.getItem('lastImage');
  console.log('Last displayed image:', lastImage);
  let randomImage;
  do {
    randomImage = images[Math.floor(Math.random() * images.length)];
    console.log('Selected random image:', randomImage);
  } while (randomImage === lastImage && images.length > 1);
  localStorage.setItem('lastImage', randomImage);
  return randomImage;
}

async function displayRandomImage() {
  console.time('displayRandomImage');
  try {
    const cachedUrls = localStorage.getItem(IMAGE_CACHE_KEY);

    if (cachedUrls) {
      const urls = JSON.parse(cachedUrls);
      if (urls.length > 0) {
        // Use a cached image immediately
        const randomIndex = Math.floor(Math.random() * urls.length);
        const imageUrl = urls[randomIndex];
        console.log('Using image from localStorage:', imageUrl);
        imageContainer.innerHTML = `<img src="${imageUrl}" alt="Random Image">`;

        // Initialize cache in background
        setTimeout(() => imageCache.initialize(), 100);
        return;
      }
    }

    // If no cached images in localStorage, proceed with normal flow
    if (imageCache.cache.size === 0) {
      await imageCache.initialize();
    }

    const randomImage = imageCache.getRandomImage();
    if (randomImage) {
      console.log('Using cached image:', randomImage);
      imageContainer.innerHTML = `<img src="${randomImage}" alt="Random Image">`;
    } else {
      console.log('No cached image available, fetching new one');
      const images = await fetchImages();
      if (images.length > 0) {
        const newImage = images[Math.floor(Math.random() * images.length)];
        imageContainer.innerHTML = `<img src="${newImage}" alt="Random Image">`;
        // Save to cache for future use
        imageCache.cache.add(newImage);
        localStorage.setItem(IMAGE_CACHE_KEY, JSON.stringify([...imageCache.cache]));
      } else {
        console.warn('No images available to display');
        imageContainer.innerHTML = '<p>No images found.</p>';
      }
    }
  } finally {
    console.timeEnd('displayRandomImage');
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

  // Make sure leaderboards are visible
  const driversLeaderboard = document.getElementById('drivers-leaderboard');
  const teamsLeaderboard = document.getElementById('teams-leaderboard');
  if (driversLeaderboard) driversLeaderboard.style.display = 'block';
  if (teamsLeaderboard) teamsLeaderboard.style.display = 'block';

  // Add year selector to the UI - only in drivers list
  const currentYear = new Date().getFullYear();
  ;

  // Get list containers
  const driversList = document.getElementById('drivers-list');
  const teamsList = document.getElementById('teams-list');

  if (!driversList || !teamsList) {
    console.error("Could not find drivers-list or teams-list elements");
    return;
  }

  // Only add year selector to drivers list, just loading message to teams list
  driversList.innerHTML = '<div class="leaderboard-message">Loading standings...</div>';
  teamsList.innerHTML = '<div class="leaderboard-message">Loading standings...</div>';

  // Add event listeners with a delay to ensure DOM is ready
  setTimeout(() => {
    console.log("Adding click handlers to year buttons");
    document.querySelectorAll('.year-button').forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const selectedYear = parseInt(e.target.getAttribute('data-year'));
        console.log(`Year button clicked: ${selectedYear}`);

        // Update active state visually
        document.querySelectorAll('.year-button').forEach(btn => {
          btn.classList.remove('active');
        });
        e.target.classList.add('active');

        fetchLeaderboard(selectedYear);
      });
    });
  }, 100);

  // Continue with existing fetch logic
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
        // Fallback to previous year if current year fails (e.g. season hasn't started)
        if (year === new Date().getFullYear()) {
          console.warn(`Current year ${year} data unavailable, falling back to ${year - 1}`);
          return fetchLeaderboard(year - 1);
        }
        throw new Error('Both standings and lists unavailable');
      }

      const driversListData = await driversListResponse.json();
      const teamsListData = await teamsListResponse.json();

      const sortedTeams = teamsListData.MRData.ConstructorTable.Constructors.sort((a, b) => {
        return FALLBACK_DRIVERS_ORDER.indexOf(a.constructorId) - FALLBACK_DRIVERS_ORDER.indexOf(b.constructorId);
      });

      teamsList.innerHTML = sortedTeams.map((team, index) => `
        <div class="leaderboard-item" data-url="https://www.formula1.com/en/teams/${team.name.toLowerCase().replace(/\s+/g, '-').replace("red-bull-racing", "red-bull").replace("alpine-f1-team", "alpine").replace("sauber", "kick-sauber").replace("rb-f1-team", "rb").replace("haas-f1-team", "haas").replace("red-bull", "red-bull-racing")}">
          <span class="leaderboard-position">${index + 1}</span>
          <span class="leaderboard-name">${teamNameMapping[team.name] || team.name}</span>
          <span class="leaderboard-points">0 pts</span>
        </div>
      `).join('');

      const sortedDrivers = sortDriversByTeam(
        driversListData.MRData.DriverTable.Drivers,
        teamsListData.MRData.ConstructorTable.Constructors
      );

      driversList.innerHTML = sortedDrivers.map((driver, index) => `
        <div class="leaderboard-item" data-url="https://www.formula1.com/en/drivers/${driver.givenName.toLowerCase()}-${driver.familyName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}">
          <span class="leaderboard-position">${index + 1}</span>
          <span class="leaderboard-name">#${driver.permanentNumber} ${driver.givenName} ${driver.familyName}</span>
          <span class="leaderboard-points">0 pts</span>
        </div>
      `).join('');

      document.querySelectorAll('.leaderboard-item').forEach(item => {
        item.addEventListener('click', () => {
          const url = item.getAttribute('data-url');
          window.open(url, '_blank');
        });
      });

      // Ensure lists fit without internal scrollbars
      ensureLeaderboardsFit();

    } else {
      const driversData = await driversResponse.json();
      const teamsData = await teamsResponse.json();

      if (driversData.MRData.StandingsTable.StandingsLists?.[0]?.DriverStandings) {
        console.log("Successfully received standings data");
        const driversStandings = driversData.MRData.StandingsTable.StandingsLists[0].DriverStandings;
        const teamsStandings = teamsData.MRData.StandingsTable.StandingsLists[0].ConstructorStandings;

        driversList.innerHTML = driversStandings.map(driver => `
          <div class="leaderboard-item" data-url="https://www.formula1.com/en/drivers/${driver.Driver.givenName.toLowerCase()}-${driver.Driver.familyName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')}">
            <span class="leaderboard-position">${driver.position}</span>
            <span class="leaderboard-name">#${driver.Driver.permanentNumber} ${driver.Driver.givenName} ${driver.Driver.familyName}</span>
            <span class="leaderboard-points">${driver.points} pts</span>
          </div>
        `).join('');

        teamsList.innerHTML = teamsStandings.map(team => `
          <div class="leaderboard-item" data-url="https://www.formula1.com/en/teams/${team.Constructor.name.toLowerCase().replace(/\s+/g, '-').replace("red-bull-racing", "red-bull").replace("alpine-f1-team", "alpine").replace("sauber", "kick-sauber").replace("rb-f1-team", "rb").replace("haas-f1-team", "haas").replace("red-bull", "red-bull-racing")}">
            <span class="leaderboard-position">${team.position}</span>
            <span class="leaderboard-name">${teamNameMapping[team.Constructor.name] || team.Constructor.name}</span>
            <span class="leaderboard-points">${team.points} pts</span>
          </div>
        `).join('');

        document.querySelectorAll('.leaderboard-item').forEach(item => {
          item.addEventListener('click', () => {
            const url = item.getAttribute('data-url');
            window.open(url, '_blank');
          });
        });

        // Ensure lists fit without internal scrollbars
        ensureLeaderboardsFit();
        return;
      } else {
        // Fallback for valid 200 response but empty data (typical for new season)
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

// ---- Responsive fitting helpers for leaderboards ----
function ensureLeaderboardsFit() {
  const driversContainer = document.getElementById('drivers-leaderboard');
  const driversList = document.getElementById('drivers-list');
  // Clean previous pagination if any
  removePagination(driversContainer);
  // Apply pagination only to drivers (10 items per page)
  applyPagination(driversContainer, driversList, '.leaderboard-item', 10);

  // Remove pagination from teams if any (shouldn't be needed as it has 10 items)
  const teamsContainer = document.getElementById('teams-leaderboard');
  removePagination(teamsContainer);

  // Add spacer to teams leaderboard to match drivers height (pagination buttons)
  // Check if spacer already acts
  if (!teamsContainer.querySelector('.spacer-controls')) {
    const spacer = document.createElement('div');
    spacer.className = 'spacer-controls';
    spacer.innerHTML = '<button class="pagination-arrow"></button>'; // dummy content for height
    teamsContainer.appendChild(spacer);
  }
}

/**
 * Tries to fit the leaderboard content within its container without scrollbars.
 * Applies strategies progressively: compression -> multi-column -> pagination.
 * @param {string} kind - 'drivers' or 'teams'
 */
function tryFit(kind) {
  const container = document.getElementById(`${kind}-leaderboard`);
  const list = document.getElementById(`${kind}-list`);
  if (!container || !list) return;

  // Clean previous state
  container.classList.remove('compress', 'x-compress', 'multi-column');
  removePagination(container);
  container.style.overflowY = 'auto';

  // Use requestAnimationFrame to ensure DOM has updated
  requestAnimationFrame(() => {
    const fits = () => {
      const hasOverflow = container.scrollHeight > container.clientHeight + 2;
      console.log(`${kind} - scrollHeight: ${container.scrollHeight}, clientHeight: ${container.clientHeight}, hasOverflow: ${hasOverflow}`);
      return !hasOverflow;
    };

    if (fits()) {
      container.style.overflowY = 'hidden';
      console.log(`${kind} fits without compression`);
      return; // Already fits, no action needed
    }

    // Step 1: light compression - reduce item padding
    container.classList.add('compress');
    container.style.overflowY = 'hidden';
    if (fits()) {
      console.log(`${kind} fits with light compression`);
      return;
    }

    // Step 2: extra compression - smaller font and tighter spacing
    container.classList.add('x-compress');
    if (fits()) {
      console.log(`${kind} fits with extra compression`);
      return;
    }

    // Step 3: pagination - show 10 items per page with numbered navigation
    console.log(`${kind} needs pagination`);
    container.classList.remove('compress', 'x-compress');
    container.style.overflowY = 'hidden';
    applyPagination(container, list, '.leaderboard-item', 10);
  });
}

/**
 * Removes pagination controls and shows all items
 */
function removePagination(container) {
  const controls = container.querySelector('.pagination-controls');
  if (controls) controls.remove();
  const items = container.querySelectorAll('.leaderboard-item');
  items.forEach(it => (it.style.display = ''));
}

/**
 * Applies pagination to a list.
 * Shows pageSize items at a time with "Prev" and "Next" arrow buttons.
 * @param {HTMLElement} container - The leaderboard container
 * @param {HTMLElement} listEl - The list element containing items
 * @param {string} itemSelector - CSS selector for list items
 * @param {number} pageSize - Number of items to show per page
 */
function applyPagination(container, listEl, itemSelector, pageSize = 10) {
  const items = Array.from(listEl.querySelectorAll(itemSelector));
  if (items.length <= pageSize) return; // not needed

  // Calculate total pages
  const totalPages = Math.ceil(items.length / pageSize);
  let current = 1;

  const controls = document.createElement('div');
  controls.className = 'pagination-controls';

  // Create Arrow Buttons
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

    // Show/Hide Items
    items.forEach((it, idx) => {
      const start = (current - 1) * pageSize;
      const end = start + pageSize;
      if (idx >= start && idx < end) {
        it.style.display = 'flex'; // Ensure flex layout is kept
        // Add animation class re-trigger if desired, but simple display toggle is smoother for pagination
      } else {
        it.style.display = 'none';
      }
    });

    // Update Button States
    prevBtn.disabled = current === 1;
    nextBtn.disabled = current === totalPages;

    prevBtn.classList.toggle('disabled', current === 1);
    nextBtn.classList.toggle('disabled', current === totalPages);
  };

  prevBtn.addEventListener('click', () => render(current - 1));
  nextBtn.addEventListener('click', () => render(current + 1));

  controls.appendChild(prevBtn);
  controls.appendChild(nextBtn);

  // Attach and render
  container.appendChild(controls);
  render(1);
}

async function fetchRaceSchedule() {
  try {
    const sessions = closestRace.sessions;

    // Build session HTML only for sessions that exist
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

    // Add regular sessions
    sessionMapping.forEach(({ key, label }) => {
      if (sessions[key]) {
        sessionsHTML += `<div class="session-time" data-time="${sessions[key]}"><strong>${label}:</strong> ${formatDate(sessions[key])} ${formatTime(sessions[key])}</div>`;
      }
    });

    // Add race (check multiple possible keys)
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
  'williams'
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

  // If structure exists, update text, else create structure
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

  // Proper race name formatting
  const raceName = race.name || "Unknown GP";
  if (nextRaceTitle) nextRaceTitle.innerText = raceName;

  const raceDate = new Date(race.sessions.gp || race.sessions.feature || race.sessions.race2 || race.sessions.race);

  updateCountdown(raceDate);
  // Update every minute (60000ms) to update minutes. 
  // For seconds we'd need 1000ms. Code above only shows minutes, so 1s is overkill but smooths transition.
  // Let's stick to 1 minute as the UI shows MIN as smallest unit.
  setInterval(() => updateCountdown(raceDate), 30000);
}

async function fetchTrackDetails(race) {
  // Check cache first
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

    // Cache the result
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
displayRandomImage();
// fetchRandomWord(); // Removed
fetchLeaderboard();

trackButton.addEventListener('click', async () => {
  showTrackDetails = true;
  showSchedule = false;
  const raceName = 'bahrain';
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
  window.open('https://discord.com/invite/your-invite-code', '_blank');
});


// Removed auto-refresh on tab visibility change
// Users reported background changing unexpectedly when alt-tabbing
// document.addEventListener('visibilitychange', async () => {
//   console.log('Visibility changed:', document.visibilityState);
//   if (document.visibilityState === 'visible') {
//     console.log('Tab became visible, refreshing content');
//     displayRandomImage();
//     fetchRandomWord();
//   }
// });

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





// --- Simplified Controls Toggle ---

// "Other" button opens the secondary menu
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

// Link Listeners
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
    return false;
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
    const trackImage = `https://media.formula1.com/image/upload/f_auto/q_auto/v1677244985/content/dam/fom-website/2018-redesign-assets/Circuit%20maps%2016x9/${closestRace.name
      .replace("Monaco", "monoco")
      .replace("Canadian", "canada")
      .replace("Spanish", "spain")
      .replace("Barcelona", "spain")
      .replace("Las-vegas", "las_vegas")
      .replace("Australian", "australia")}_Circuit.png.transform/8col/image.png`;

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

  const trackImage = `https://media.formula1.com/image/upload/f_auto/q_auto/v1677244985/content/dam/fom-website/2018-redesign-assets/Circuit%20maps%2016x9/${closestRace.name
    .replace("monaco", "monoco")
    .replace("canadian", "canada")
    .replace("spanish", "spain")
    .replace("barcelona", "spain")
    .replace("las-vegas", "las_vegas")
    .replace("australian", "australia")}_Circuit.png.transform/8col/image.png`;

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
    const sessionKey = await getCurrentSessionKey();
    const [teamRadio, raceControl, positions, pitStops, laps] = await Promise.all([
      fetch(`https://api.openf1.org/v1/team_radio?session_key=${sessionKey}`).then(r => r.json()),
      fetch(`https://api.openf1.org/v1/race_control?session_key=${sessionKey}`).then(r => r.json()),
      fetch(`https://api.openf1.org/v1/position?session_key=${sessionKey}`).then(r => r.json()),
      fetch(`https://api.openf1.org/v1/pit?session_key=${sessionKey}`).then(r => r.json()),
      fetch(`https://api.openf1.org/v1/laps?session_key=${sessionKey}`).then(r => r.json())
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

setInterval(updateLiveSessionData, 30000);

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    const othersContainer = document.getElementById('others-container');
    const controlsBar = document.getElementById('controls-bar');
    const raceScheduleContainer = document.getElementById('race-schedule');

    // Close "Others" menu if open
    if (othersContainer && window.getComputedStyle(othersContainer).display === 'flex') {
      othersContainer.style.display = 'none';
      if (controlsBar) controlsBar.style.display = 'flex';
    }

    // Reset Race Schedule / Track Details if open
    if (showTrackDetails || showSchedule) {
      showTrackDetails = false;
      showSchedule = false;
      // Just hide/reset schedule here if needed, or rely on other logic
      // For now, let's just ensure we don't break
      if (raceScheduleContainer) raceScheduleContainer.innerHTML = '';
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

document.getElementById('drivers-leaderboard').style.display = 'none';
document.getElementById('teams-leaderboard').style.display = 'none';

standingsButton.addEventListener('click', async () => {
  const driversLeaderboard = document.getElementById('drivers-leaderboard');
  const teamsLeaderboard = document.getElementById('teams-leaderboard');

  if (!driversLeaderboard || !teamsLeaderboard) return;

  const isHidden = driversLeaderboard.style.display === 'none';

  driversLeaderboard.style.display = isHidden ? 'block' : 'none';
  teamsLeaderboard.style.display = isHidden ? 'block' : 'none';

  if (isHidden) {
    await fetchLeaderboard(new Date().getFullYear());
  }
});

document.addEventListener('DOMContentLoaded', async () => {
  const pageLoadTimer = 'pageLoad:' + Date.now();
  console.time(pageLoadTimer);

  try {
    console.log("DOM Content Loaded - Initializing app...");

    // Initialize leaderboards before anything else
    const driversLeaderboard = document.getElementById('drivers-leaderboard');
    const teamsLeaderboard = document.getElementById('teams-leaderboard');

    if (driversLeaderboard) driversLeaderboard.style.display = 'block';
    if (teamsLeaderboard) teamsLeaderboard.style.display = 'block';

    // Wrap each async operation in a promise that won't reject
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

    /*
    const safeRandomWord = () => fetchRandomWord().catch(err => {
      console.error('Random word fetch failed:', err);
      return null;
    });
    */

    // Execute all initialization tasks in parallel
    await Promise.all([
      safeInitialize(),
      safeLeaderboard()
      // safeRandomWord() // Removed
    ]);

    // Initialize UI elements after core functionality is loaded

    const overlay = document.getElementById('overlay');

    // Initialize schedule and countdown
    await initRaceData();

    // Initialize dev mode
    isDevMode = localStorage.getItem(devModeKey) === 'true';
    if (isDevMode) {
      console.log("Dev mode is active");
      const elements = ['drivers-leaderboard', 'teams-leaderboard', 'race-schedule']
        .map(id => document.getElementById(id))
        .forEach(el => el && (el.style.display = 'none'));

      updateLiveSessionData();
    } else {
      console.log("Standard mode active, ensuring leaderboards are visible");
      if (driversLeaderboard) driversLeaderboard.style.display = 'block';
      if (teamsLeaderboard) teamsLeaderboard.style.display = 'block';
    }

    // Initialize buttons and event listeners
    setupUIElements(overlay);


  } catch (error) {
    console.error('Error during page initialization:', error);
  } finally {
    console.timeEnd(pageLoadTimer);
  }
});

async function initRaceData() {
  try {
    // Try to get from cache first
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
      .sort((a, b) => new Date(a.sessions.gp || a.sessions.feature || a.sessions.race2 || a.sessions.race) - new Date(b.sessions.gp || a.sessions.feature || b.sessions.race2 || b.sessions.race));

    if (!sortedRaces.length) {
      console.log("No upcoming races for this year, checking next year's schedule...");
      year += 1;
      url = `https://raw.githubusercontent.com/sportstimes/f1/main/_db/${motorsport}/${year}.json`;

      // Check cache for next year
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
        .sort((a, b) => new Date(a.sessions.gp || a.sessions.feature || a.sessions.race2 || a.sessions.race) - new Date(b.sessions.gp || a.sessions.feature || b.sessions.race2 || b.sessions.race));

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

// Add new helper function to organize UI initialization
function setupUIElements(overlay) {
  console.log("Setting up UI elements");
  // Initialize buttons without affecting leaderboard visibility

  // Initialize buttons
  setupButton('blur-button', overlay, 'isBlurred', 'blur(2px)', 'none',
    ['blur_off.png', 'blur_on.png']);

  setupButton('darkness-button', overlay, 'isDark', 'rgba(0, 0, 0, 0.6)', 'none',
    ['darkness.png', 'darkness_off.png']);

  // Initialize back button
  const backButton = document.getElementById('back-button');
  if (backButton) {
    backButton.style.display = 'none';
    backButton.addEventListener('click', () => {
      const othersContainer = document.getElementById('others-container');
      const controlsBar = document.getElementById('controls-bar');
      if (othersContainer) othersContainer.style.display = 'none';
      if (controlsBar) controlsBar.style.display = 'flex';
    });
  }

  // Initialize countdown toggle
  setupButton('countdown-toggle-button', document.getElementById('next-race-countdown'), 'isCountdownVisible', 'flex', 'none',
    ['visibility.svg', 'visibility.svg']);

  // Custom logic for countdown because setupButton assumes 'backdropFilter' or 'background' property for overlay, but here we toggle display
  // We need to override or handle this specific button separately if setupButton is too specific.
  // setupButton implementation uses overlay.style[propertyName] based on buttonId.includes('blur')
  // Let's implement it manually to be safe.

  const countdownToggle = document.getElementById('countdown-toggle-button');
  const countdownEl = document.getElementById('next-race-countdown');

  if (countdownToggle && countdownEl) {
    // Default to visible if not set
    const stored = localStorage.getItem('isCountdownVisible');
    const isVisible = stored === null || stored === 'true';

    // Apply initial state
    countdownEl.style.display = isVisible ? 'inline-flex' : 'none';
    // Inline-flex matches the css .featured-card { display: inline-flex }

    // Update icon opacity or style if needed to show state?
    // For now just toggle

    countdownToggle.addEventListener('click', () => {
      const currentlyVisible = countdownEl.style.display !== 'none';
      if (currentlyVisible) {
        countdownEl.style.display = 'none';
        localStorage.setItem('isCountdownVisible', 'false');
        countdownToggle.style.opacity = '0.5'; // Visual feedback for "off"
      } else {
        countdownEl.style.display = 'inline-flex';
        localStorage.setItem('isCountdownVisible', 'true');
        countdownToggle.style.opacity = '1';
      }
    });

    // Set initial opacity
    countdownToggle.style.opacity = isVisible ? '1' : '0.5';
  }
}

// Add new helper function for button setup
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

function handleBackButtonClick() {
  const containers = initializeContainers();
  otherButtonsContainer = containers.otherButtonsContainer;
  toggleButtonsContainer = containers.toggleButtonsContainer;

  if (otherButtonsContainer && toggleButtonsContainer) {
    otherButtonsContainer.style.display = 'none';
    toggleButtonsContainer.style.display = 'flex';
    toggleButtonsContainer.innerHTML = raceScheduleContainerinnerHTML;
    attachEventListeners();
  }
}

