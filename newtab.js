const imageContainer = document.getElementById('image-container');
const driversList = document.getElementById('drivers-list');
const teamsList = document.getElementById('teams-list');
const randomWordContainer = document.getElementById('random-word');
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

const REAL_TEAM_RADIO_CLIPS = {
  1: "https://livetiming.formula1.com/static/2024/2024-03-02_Pre-Season_Testing/2024-03-02_Practice/TeamRadio/TESVER01_1_20240302_112854.mp3",
  11: "https://livetiming.formula1.com/static/2024/2024-03-02_Pre-Season_Testing/2024-03-02_Practice/TeamRadio/TESPER01_11_20240302_112908.mp3",
  44: "https://livetiming.formula1.com/static/2024/2024-03-02_Pre-Season_Testing/2024-03-02_Practice/TeamRadio/TESHAM01_44_20240302_113015.mp3"
};

const IMAGE_CACHE_SIZE = 20; // Increased from 5
const IMAGE_CACHE_KEY = 'bwoahImageCache';
const SHOWN_IMAGES_KEY = 'bwoahShownImages';

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
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
    const validUrls = await Promise.all(
      urls.map(url => 
        fetch(url, { method: 'HEAD' })
          .then(res => res.ok ? url : null)
          .catch(() => null)
      )
    );
    
    this.cache = new Set(validUrls.filter(Boolean));
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
  
  console.log('Toggling visibility of UI elements for dev mode');
  if (driversLeaderboard) driversLeaderboard.style.display = isDevMode ? 'none' : 'block';
  if (teamsLeaderboard) teamsLeaderboard.style.display = isDevMode ? 'none' : 'block';
  if (raceSchedule) raceSchedule.style.display = isDevMode ? 'none' : 'block';

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
  const currentDate = new Date();
  const lastRace = jsonContent.races[jsonContent.races.length - 1];
  const lastRaceDate = new Date(lastRace.sessions.gp || lastRace.sessions.feature || lastRace.sessions.race);
  const nextSeasonStart = new Date(jsonContent.races[0].sessions.gp || jsonContent.races[0].sessions.feature || jsonContent.races[0].sessions.race);
  
  const seasonBreakStart = new Date(lastRaceDate);
  seasonBreakStart.setDate(lastRaceDate.getDate() + 1);
  
  const hideLeaderboardDate = new Date(seasonBreakStart);
  hideLeaderboardDate.setDate(seasonBreakStart.getDate() + 7);
  
  const showLeaderboardDate = new Date(nextSeasonStart);
  showLeaderboardDate.setDate(nextSeasonStart.getDate() - 7);

  const isInInitialBreakWeek = currentDate >= seasonBreakStart && currentDate <= hideLeaderboardDate;
  const isInPreSeasonWeek = currentDate >= showLeaderboardDate && currentDate <= nextSeasonStart;
  
  const driversLeaderboard = document.getElementById('drivers-leaderboard');
  const teamsLeaderboard = document.getElementById('teams-leaderboard');
  
  if (isInInitialBreakWeek || isInPreSeasonWeek) {
    driversLeaderboard.style.display = 'block';
    teamsLeaderboard.style.display = 'block';
    await fetchLeaderboard();
  } else {
    driversLeaderboard.style.display = 'none';
    teamsLeaderboard.style.display = 'none';
  }
}

(async () => {
  try {
    let response = await fetch(url);
    if (!response.ok) throw new Error(`Network response was not ok for URL: ${url}`);
    let jsonContent = await response.json();

    await checkSeasonBreak(jsonContent);

    let currentDate = new Date();
    let sortedRaces = jsonContent.races
      .filter(race => new Date(race.sessions.gp || race.sessions.feature || race.sessions.race2 || race.sessions.race) > currentDate)
      .sort((a, b) => new Date(a.sessions.gp || a.sessions.feature || a.sessions.race2 || a.sessions.race) - new Date(b.sessions.gp || a.sessions.feature || b.sessions.race2 || b.sessions.race));

    if (!sortedRaces.length) {
      console.log("No upcoming races for this year, checking next year's schedule...");
      year += 1;
      url = `https://raw.githubusercontent.com/sportstimes/f1/main/_db/${motorsport}/${year}.json`;
      response = await fetch(url);
      if (!response.ok) throw new Error(`Network response was not ok for URL: ${url}`);
      jsonContent = await response.json();

      sortedRaces = jsonContent.races
        .filter(race => new Date(race.sessions.gp || race.sessions.feature || race.sessions.race2 || race.sessions.race) > currentDate)
        .sort((a, b) => new Date(a.sessions.gp || a.sessions.feature || a.sessions.race2 || a.sessions.race) - new Date(b.sessions.gp || a.sessions.feature || b.sessions.race2 || b.sessions.race));

      if (!sortedRaces.length) {
        raceScheduleContainer.innerHTML = '<p>No upcoming races found for the next year either.</p>';
      }
    }

    closestRace = sortedRaces[0];
  } catch (error) {
    console.error('Error fetching race schedule:', error);
  }
})();

async function fetchImages() {
  console.log('Starting fetchImages()');
  try {
    console.log(`Fetching images from GitHub API: ${apiUrl}`);
    const response = await fetch(apiUrl);
    
    if (!response.ok) {
      if (response.status === 403) {
        console.warn('GitHub API rate limit exceeded, using fallback background');
        return ['data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='];
      }
      throw new Error(`GitHub API responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`Received ${data.length} items from GitHub API`);

    let allImages = [];

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

    console.log(`Total images found: ${allImages.length}`);
    if (allImages.length === 0) {
      console.warn('No images found in any directory, using fallback background');
      return ['data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='];
    }
    return allImages;

  } catch (error) {
    console.error('Error in fetchImages():', error);
    return ['data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='];
  }
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
  const driversUrl = `https://api.jolpi.ca/ergast/f1/${year}/driverstandings/?format=json`;
  const teamsUrl = `https://api.jolpi.ca/ergast/f1/${year}/constructorstandings/?format=json`;
  const driversListUrl = 'https://api.jolpi.ca/ergast/f1/2024/drivers/?format=json';
  const teamsListUrl = 'https://api.jolpi.ca/ergast/f1/2024/constructors/?format=json';

  try {
    const [driversResponse, teamsResponse] = await Promise.all([
      fetch(driversUrl),
      fetch(teamsUrl)
    ]);

    if (!driversResponse.ok || !teamsResponse.ok) {
      console.warn('Standings not available, falling back to driver/constructor lists');
      const [driversListResponse, teamsListResponse] = await Promise.all([
        fetch(driversListUrl),
        fetch(teamsListUrl)
      ]);

      if (!driversListResponse.ok || !teamsListResponse.ok) {
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
          <span class="leaderboard-name">${team.name}</span>
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

    } else {
      const driversData = await driversResponse.json();
      const teamsData = await teamsResponse.json();

      if (driversData.MRData.StandingsTable.StandingsLists?.[0]?.DriverStandings) {
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
            <span class="leaderboard-name">${team.Constructor.name}</span>
            <span class="leaderboard-points">${team.points} pts</span>
          </div>
        `).join('');

        document.querySelectorAll('.leaderboard-item').forEach(item => {
          item.addEventListener('click', () => {
            const url = item.getAttribute('data-url');
            window.open(url, '_blank');
          });
        });
        return;
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

async function fetchRaceSchedule() {
  try {
    const sessions = closestRace.sessions;
    raceScheduleContainer.innerHTML = `
      <h2 style="text-align: left;">Upcoming Race: ${closestRace.slug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}</h2>
      <div class="horizontal-schedule">
        <div class="session-time" data-time="${sessions.fp1}"><strong>FP1:</strong> ${formatDate(sessions.fp1)} ${formatTime(sessions.fp1)}</div>
        <div class="session-time" data-time="${sessions.fp2}"><strong>FP2:</strong> ${formatDate(sessions.fp2)} ${formatTime(sessions.fp2)}</div>
        <div class="session-time" data-time="${sessions.fp3}"><strong>FP3:</strong> ${formatDate(sessions.fp3)} ${formatTime(sessions.fp3)}</div>
        <div class="session-time" data-time="${sessions.qualifying}"><strong>Qualifying:</strong> ${formatDate(sessions.qualifying)} ${formatTime(sessions.qualifying)}</div>
        <div class="session-time" data-time="${sessions.gp || sessions.feature || sessions.race2 || sessions.race}"><strong>Race:</strong> ${formatDate(sessions.gp || sessions.feature || sessions.race2 || sessions.race)} ${formatTime(sessions.gp || sessions.feature || sessions.race2 || sessions.race)}</div>
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

async function fetchRandomWord() {
  const wordsUrl = `https://raw.githubusercontent.com/${repoOwner}/${repoName}/main/words.txt`;

  try {
    const response = await fetch(wordsUrl);
    if (!response.ok) throw new Error(`Network response was not ok for URL: ${wordsUrl}`);
    const text = await response.text();
    const words = text.split('\n').filter(word => word.trim().length > 0);
    const randomWord = words[Math.floor(Math.random() * words.length)];
    randomWordContainer.textContent = randomWord;
    if (randomWord.length > 100) {
      randomWordContainer.style.fontSize = '14px';
    } else if (randomWord.length > 150) {
      randomWordContainer.style.fontSize = '12px';
    } else if (randomWord.length > 200) {
      randomWordContainer.style.fontSize = '12px';
      randomWordContainer.style.wordBreak = 'break-word';
    } else {
      randomWordContainer.style.fontSize = '20px';
    }
  } catch (error) {
    console.error('Error fetching random word:', error);
    randomWordContainer.textContent = 'Error loading word.';
  }
}

async function fetchTrackDetails(race) {
  const targetUrl = `https://f1-circuit-api.batuhantrkgl.tech/api/circuits/${race}`;
  const proxyUrl = `http://f1-circuit-api.batuhantrkgl.tech/proxy?url=${encodeURIComponent(targetUrl)}`;
  try {
    const response = await fetch(proxyUrl);
    if (!response.ok) throw new Error(`Network response was not ok for URL: ${targetUrl}`);
    const data = await response.json();

    const name = data.name || 'N/A';
    const firstGrandPrix = data.first_grand_prix || 'N/A';
    const numberOfLaps = data.number_of_laps || 'N/A';
    const circuitLength = data.circuit_length ? `${data.circuit_length} km` : 'N/A';
    const raceDistance = data.race_distance ? `${data.race_distance} km` : 'N/A';
    const lapRecord = data.lap_record || 'N/A';

    return {
      name,
      firstGrandPrix,
      numberOfLaps,
      circuitLength,
      raceDistance,
      lapRecord
    };
  } catch (error) {
    console.error('Error fetching track details:', error);
    return 'Error loading track details.';
  }
}
displayRandomImage();
fetchRandomWord();
fetchLeaderboard();

trackButton.addEventListener('click', async () => {
  showTrackDetails = true;
  showSchedule = false;
  const raceName = 'pre-season-testing';
  const trackDetails = await fetchTrackDetails(raceName);
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
});

scheduleButton.addEventListener('click', () => {
  showTrackDetails = false;
  showSchedule = true;
  fetchRaceSchedule();
});

let othersButton = document.getElementById('others-button');
let otherButtonsContainer = document.getElementById('others-container');
let toggleButtonsContainer = document.getElementById('toggle-buttons');

function initializeContainers() {
  otherButtonsContainer = document.getElementById('others-container');
  toggleButtonsContainer = document.getElementById('toggle-buttons');

  if (!otherButtonsContainer) {
    otherButtonsContainer = document.createElement('div');
    otherButtonsContainer.id = 'others-container';
    otherButtonsContainer.style.display = 'none';
    document.body.appendChild(otherButtonsContainer);
  }

  if (!toggleButtonsContainer) {
    toggleButtonsContainer = document.createElement('div');
    toggleButtonsContainer.id = 'toggle-buttons';
    toggleButtonsContainer.style.display = 'flex';
    document.body.appendChild(toggleButtonsContainer);
  }

  return { otherButtonsContainer, toggleButtonsContainer };
}

othersButton.addEventListener('click', () => {
  const containers = initializeContainers();
  otherButtonsContainer = containers.otherButtonsContainer;
  toggleButtonsContainer = containers.toggleButtonsContainer;
  
  if (otherButtonsContainer.style.display === 'none') {
    otherButtonsContainer.style.display = 'flex';
    toggleButtonsContainer.style.display = 'none';
  } else {
    otherButtonsContainer.style.display = 'none';
    toggleButtonsContainer.style.display = 'flex';
  }
});

const donateButton = document.getElementById('donate-button');
const githubButton = document.getElementById('github-button');
const discordButton = document.getElementById('discord-button');
const newsButton = document.getElementById('news-button');
const f1Button = document.getElementById('f1-button');

donateButton.addEventListener('click', () => {
  window.open('https://buymeacoffee.com/batuhantrkgl', '_blank');
});

githubButton.addEventListener('click', () => {
  window.open('https://github.com/batuhantrkgl/bwoah-extension/tree/src', '_blank');
});

discordButton.addEventListener('click', () => {
  window.open('https://discord.com/invite/your-invite-code', '_blank');
});


document.addEventListener('visibilitychange', async () => {
  console.log('Visibility changed:', document.visibilityState);
  if (document.visibilityState === 'visible') {
    console.log('Tab became visible, refreshing content');
    displayRandomImage();
    fetchRandomWord();
  }
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

const backButton = document.getElementById('back-button');

const raceScheduleContainerinnerHTML = `
<div id="toggle-buttons">
      <button id="f1-button" class="toggle-button">
        <img src="images/f1.svg" alt="F1 Website">
      </button>
      <button id="track-button" class="toggle-button">
        <img src="images/flag.png" alt="Track Details">
      </button>
      <button id="schedule-button" class="toggle-button">
        <img src="images/schedule.png" alt="Schedule Details">
      </button>
      <button id="news-button" class="toggle-button">
        <img src="images/news.png" alt="News from F1">
      </button>
      <button id="others-button" class="toggle-button">
        <img src="images/others.png" alt="Other Stuff">
      </button>
</div>
`;

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

function attachEventListeners() {
  const othersButton = document.getElementById('others-button');
  if (!othersButton) {
    console.error("others-button not found!");
    return;
  }

  othersButton.addEventListener('click', () => {
    const otherButtonsContainer = document.getElementById('others-container');
    const toggleButtonsContainer = document.getElementById('toggle-buttons');
    if (!otherButtonsContainer || !toggleButtonsContainer) {
      console.error("otherButtonsContainer or toggleButtonsContainer is null!");
      return;
    }
    otherButtonsContainer.style.display = 'flex';
    toggleButtonsContainer.style.display = 'none';
  });

  // Initialize f1Button only once here
  const f1Button = document.getElementById('f1-button');
  if (f1Button) {
    f1Button.addEventListener('click', () => {
      window.open('https://f1.com/', '_blank');
    });
  }

  document.getElementById('track-button').addEventListener('click', async () => {
    showTrackDetails = true;
    showSchedule = false;
    const raceName = 'pre-season-testing';
    const trackDetails = await fetchTrackDetails(raceName);
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
  });

  document.getElementById('schedule-button').addEventListener('click', () => {
    showTrackDetails = false;
    showSchedule = true;
    fetchRaceSchedule();
  });

  document.getElementById('news-button').addEventListener('click', () => {
    window.open('https://www.formula1.com/en/latest/all.html', '_blank');
  });

  backButton.addEventListener('click', handleBackButtonClick);

  document.querySelectorAll('.toggle-button').forEach(button => {
    button.classList.add('animated-button');
  });
}

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
    const otherButtonsContainer = document.getElementById('others-container');
    const toggleButtonsContainer = document.getElementById('toggle-buttons');
    
    if (otherButtonsContainer && otherButtonsContainer.style.display === 'flex') {
      handleBackButtonClick();
    }
    
    const driversLeaderboard = document.getElementById('drivers-leaderboard');
    const teamsLeaderboard = document.getElementById('teams-leaderboard');
    if (driversLeaderboard && driversLeaderboard.style.display === 'block') {
      driversLeaderboard.style.display = 'none';
      teamsLeaderboard.style.display = 'none';
    }

    // Add this new block to handle race schedule
    if (showTrackDetails || showSchedule) {
      showTrackDetails = false;
      showSchedule = false;
      raceScheduleContainer.innerHTML = raceScheduleContainerinnerHTML;
      attachEventListeners();
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

standingsButton.addEventListener('click', () => {
  const driversLeaderboard = document.getElementById('drivers-leaderboard');
  const teamsLeaderboard = document.getElementById('teams-leaderboard');
  
  if (driversLeaderboard.style.display === 'none') {
    driversLeaderboard.style.display = 'block';
    teamsLeaderboard.style.display = 'block';
    fetchLeaderboard(2024);
  } else {
    driversLeaderboard.style.display = 'none';
    teamsLeaderboard.style.display = 'none';
  }
});

standingsButton.addEventListener('click', async () => {
  const driversLeaderboard = document.getElementById('drivers-leaderboard');
  const teamsLeaderboard = document.getElementById('teams-leaderboard');
  
  if (!driversLeaderboard || !teamsLeaderboard) return;
  
  const isHidden = driversLeaderboard.style.display === 'none';
  
  driversLeaderboard.style.display = isHidden ? 'block' : 'none';
  teamsLeaderboard.style.display = isHidden ? 'block' : 'none';
  
  if (isHidden) {
    await fetchLeaderboard(2024);
  }
});

document.addEventListener('DOMContentLoaded', async () => {
  const pageLoadTimer = 'pageLoad:' + Date.now();
  console.time(pageLoadTimer);
  
  try {
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

    const safeRandomWord = () => fetchRandomWord().catch(err => {
      console.error('Random word fetch failed:', err);
      return null;
    });

    // Execute all initialization tasks in parallel
    await Promise.all([
      safeInitialize(),
      safeLeaderboard(),
      safeRandomWord()
    ]);

    // Initialize UI elements after core functionality is loaded
    const containers = initializeContainers();
    const overlay = document.getElementById('overlay');

    // Initialize dev mode
    isDevMode = localStorage.getItem(devModeKey) === 'true';
    if (isDevMode) {
      const elements = ['drivers-leaderboard', 'teams-leaderboard', 'race-schedule']
        .map(id => document.getElementById(id))
        .forEach(el => el && (el.style.display = 'none'));
      
      updateLiveSessionData();
    }

    // Initialize buttons and event listeners
    setupUIElements(overlay);
    attachEventListeners();

  } catch (error) {
    console.error('Error during page initialization:', error);
  } finally {
    console.timeEnd(pageLoadTimer);
  }
});

// Add new helper function to organize UI initialization
function setupUIElements(overlay) {
  // Initialize leaderboards
  const driversLeaderboard = document.getElementById('drivers-leaderboard');
  const teamsLeaderboard = document.getElementById('teams-leaderboard');
  if (driversLeaderboard) driversLeaderboard.style.display = 'none';
  if (teamsLeaderboard) teamsLeaderboard.style.display = 'none';

  // Initialize buttons
  setupButton('blur-button', overlay, 'isBlurred', 'blur(2px)', 'none', 
    ['blur_off.png', 'blur_on.png']);
  
  setupButton('darkness-button', overlay, 'isDark', 'rgba(0, 0, 0, 0.6)', 'none',
    ['darkness.png', 'darkness_off.png']);

  // Initialize back button
  const backButton = document.getElementById('back-button');
  if (backButton) {
    backButton.style.display = 'none';
    backButton.addEventListener('click', handleBackButtonClick);
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

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    const otherButtonsContainer = document.getElementById('others-container');
    const toggleButtonsContainer = document.getElementById('toggle-buttons');
    
    if (otherButtonsContainer && otherButtonsContainer.style.display === 'flex') {
      handleBackButtonClick();
    }
    
    const driversLeaderboard = document.getElementById('drivers-leaderboard');
    const teamsLeaderboard = document.getElementById('teams-leaderboard');
    if (driversLeaderboard && driversLeaderboard.style.display === 'block') {
      driversLeaderboard.style.display = 'none';
      teamsLeaderboard.style.display = 'none';
    }

    // Add this new block to handle race schedule
    if (showTrackDetails || showSchedule) {
      showTrackDetails = false;
      showSchedule = false;
      raceScheduleContainer.innerHTML = raceScheduleContainerinnerHTML;
      attachEventListeners();
    }
  } else if (event.ctrlKey && event.shiftKey && event.key === 'Q') {
    toggleDevMode();
  }
});

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

standingsButton.addEventListener('click', async () => {
  const driversLeaderboard = document.getElementById('drivers-leaderboard');
  const teamsLeaderboard = document.getElementById('teams-leaderboard');
  
  if (!driversLeaderboard || !teamsLeaderboard) return;
  
  const isHidden = driversLeaderboard.style.display === 'none';
  
  driversLeaderboard.style.display = isHidden ? 'block' : 'none';
  teamsLeaderboard.style.display = isHidden ? 'block' : 'none';
  
  if (isHidden) {
    await fetchLeaderboard(2024);
  }
});