/**
 * Race Schedule & Countdown Logic
 */

import { RACE_SCHEDULE_CACHE_DURATION, F1_CIRCUITS_DATA, CIRCUIT_SLUGS } from "./constants.js";
import { storage } from "./storage.js";
import { formatDate, formatTime, pad, escapeHTML, getCircuitImageUrl } from "./utils.js";

export let closestRace = null;
let countdownInterval = null;

export async function fetchRaceScheduleData() {
  const currentYear = new Date().getFullYear();
  const cacheKey = `bwoah_race_schedule_${currentYear}`;

  try {
    const cached = await storage.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < RACE_SCHEDULE_CACHE_DURATION) && cached.races) {
      return cached.races;
    }
  } catch (e) {}

  const url = `https://raw.githubusercontent.com/sportstimes/f1/main/_db/f1/${currentYear}.json`;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    if (data && data.races) {
      await storage.set(cacheKey, {
        timestamp: Date.now(),
        races: data.races
      });
      return data.races;
    }
  } catch (error) {
    console.warn('[Bwoah] Trying next year schedule fallback:', error.message);
    try {
      const nextYearUrl = `https://raw.githubusercontent.com/sportstimes/f1/main/_db/f1/${currentYear + 1}.json`;
      const nextRes = await fetch(nextYearUrl);
      if (nextRes.ok) {
        const nextData = await nextRes.json();
        return nextData.races || [];
      }
    } catch (err) {}
  }
  return [];
}

export function getRaceStartTime(race) {
  if (!race || !race.sessions) return null;
  const s = race.sessions;
  const timeStr = s.gp || s.feature || s.race2 || s.race;
  return timeStr ? new Date(timeStr) : null;
}

export function findUpcomingRace(races) {
  if (!Array.isArray(races) || races.length === 0) return null;
  const now = new Date();
  const RACE_DURATION_MS = 2.5 * 60 * 60 * 1000; // Keep race active for 2.5 hours post-start

  const sorted = races
    .filter(r => {
      const t = getRaceStartTime(r);
      return t && (t.getTime() + RACE_DURATION_MS) > now.getTime();
    })
    .sort((a, b) => getRaceStartTime(a) - getRaceStartTime(b));

  return sorted[0] || null;
}

export function updateCountdown(targetDate) {
  const countdownTimer = document.getElementById('countdown-timer');
  if (!countdownTimer || !targetDate) return;

  const now = new Date();
  const diff = targetDate.getTime() - now.getTime();

  // If race started within last 2.5 hours
  if (diff <= 0 && diff > -(2.5 * 60 * 60 * 1000)) {
    countdownTimer.innerHTML = `
      <div class="race-live" style="display: inline-flex; align-items: center; justify-content: center; gap: 8px; font-size: 1.35rem; font-weight: 700; color: #ffffff; text-shadow: 0 0 16px rgba(255,255,255,0.6);">
        <span class="live-pulse-dot" style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: #ffffff; box-shadow: 0 0 10px rgba(255,255,255,0.8); animation: pulseLive 1.5s infinite;"></span>
        <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-broadcast" width="22" height="22" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;">
          <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
          <path d="M18.364 19.364a9 9 0 1 0 -12.728 0" />
          <path d="M15.536 16.536a5 5 0 1 0 -7.072 0" />
          <path d="M12 13m-1 0a1 1 0 1 0 2 0a1 1 0 1 0 -2 0" />
        </svg>
        <span>RACE IS LIVE!</span>
      </div>
    `;
    return;
  }

  if (diff <= -(2.5 * 60 * 60 * 1000)) {
    initScheduleAndCountdown();
    return;
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  const daysEl = document.getElementById('days-count');
  if (!daysEl) {
    countdownTimer.innerHTML = `
      <div class="time-unit"><span id="days-count">${pad(days)}</span><label>DAYS</label></div>
      <div class="time-unit"><span id="hours-count">${pad(hours)}</span><label>HRS</label></div>
      <div class="time-unit"><span id="minutes-count">${pad(minutes)}</span><label>MIN</label></div>
      <div class="time-unit"><span id="seconds-count">${pad(seconds)}</span><label>SEC</label></div>
    `;
  } else {
    daysEl.textContent = pad(days);
    document.getElementById('hours-count').textContent = pad(hours);
    document.getElementById('minutes-count').textContent = pad(minutes);
    document.getElementById('seconds-count').textContent = pad(seconds);
  }
}

export async function initScheduleAndCountdown() {
  const races = await fetchRaceScheduleData();
  closestRace = findUpcomingRace(races);

  const titleEl = document.getElementById('next-race-title');
  const detailsEl = document.getElementById('next-race-details');

  if (!closestRace) {
    if (titleEl) titleEl.textContent = "Season Complete";
    const countdownTimer = document.getElementById('countdown-timer');
    if (countdownTimer) countdownTimer.innerHTML = '<p class="text-muted">No upcoming races found.</p>';
    if (detailsEl) detailsEl.style.display = 'none';
    return;
  }

  const raceName = closestRace.name || closestRace.slug || "Grand Prix";
  if (titleEl) titleEl.textContent = raceName;

  const raceDate = getRaceStartTime(closestRace);
  if (detailsEl && raceDate) {
    detailsEl.textContent = `${formatDate(raceDate)} • Round ${closestRace.round || ''}`;
    detailsEl.style.display = 'inline-block';
  }

  if (countdownInterval) clearInterval(countdownInterval);
  if (raceDate) {
    updateCountdown(raceDate);
    countdownInterval = setInterval(() => updateCountdown(raceDate), 1000);
  }
}

export function renderGrandPrixHub(activeTab = 'sessions') {
  const container = document.getElementById('race-schedule');
  if (!container || !closestRace) return;

  container.setAttribute('data-mode', activeTab);
  const raceName = closestRace.name || closestRace.slug || "Grand Prix";
  const circuitImg = getCircuitImageUrl(raceName);

  // Look up circuit metadata
  const lowerName = raceName.toLowerCase();
  let slug = 'bahrain';
  for (const [key, s] of Object.entries(CIRCUIT_SLUGS)) {
    if (lowerName.includes(key)) {
      slug = s;
      break;
    }
  }

  const circuitData = F1_CIRCUITS_DATA[slug] || {
    name: closestRace?.circuit?.name || raceName,
    location: closestRace?.location || 'F1 World Championship',
    firstGrandPrix: '—',
    laps: '—',
    length: '—',
    raceDistance: '—',
    lapRecord: '—'
  };

  const sessions = closestRace.sessions || {};
  const sessionLabels = [
    { key: 'fp1', label: 'Practice 1' },
    { key: 'fp2', label: 'Practice 2' },
    { key: 'fp3', label: 'Practice 3' },
    { key: 'sprintQualifying', label: 'Sprint Qualifying' },
    { key: 'sprint', label: 'Sprint' },
    { key: 'qualifying', label: 'Qualifying' },
    { key: 'gp', label: 'Grand Prix' },
    { key: 'feature', label: 'Grand Prix' }
  ];

  const sessionsHtml = sessionLabels
    .filter(s => sessions[s.key])
    .map(s => {
      const time = sessions[s.key];
      return `
        <div class="session-time">
          <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-clock" width="16" height="16" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round" style="color: #ffffff; opacity: 0.9; flex-shrink: 0;">
            <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
            <path d="M3 12a9 9 0 1 0 18 0a9 9 0 0 0 -18 0" />
            <path d="M12 7v5l3 3" />
          </svg>
          <div style="display: flex; flex-direction: column; gap: 2px;">
            <strong style="color: #fff; font-size: 0.8rem;">${escapeHTML(s.label)}</strong>
            <span style="color: var(--text-muted); font-size: 0.75rem;">${formatDate(time)} • ${formatTime(time)}</span>
          </div>
        </div>
      `;
    }).join('') || '<p class="text-muted" style="padding: 16px; text-align: center;">Session times to be announced.</p>';

  const circuitHtml = `
    <div class="circuit-map-wrapper">
      <img src="${circuitImg}" alt="${escapeHTML(circuitData.name)} Track Map" class="circuit-map-img" onerror="this.parentElement.style.display='none'">
    </div>
    <div class="track-grid">
      <div class="track-stat">
        <div class="track-stat-header">
          <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-flag" width="14" height="14" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
            <path d="M5 5a5 5 0 0 1 7 0a5 5 0 0 0 7 0v9a5 5 0 0 1 -7 0a5 5 0 0 0 -7 0v-9z" />
            <path d="M5 21v-7" />
          </svg>
          <span>Laps</span>
        </div>
        <div class="track-stat-value">${escapeHTML(String(circuitData.laps))}</div>
      </div>

      <div class="track-stat">
        <div class="track-stat-header">
          <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-ruler-2" width="14" height="14" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
            <path d="M17 3l4 4l-14 14l-4 -4z" />
            <path d="M16 7l-1.5 -1.5" />
            <path d="M13 10l-1.5 -1.5" />
            <path d="M10 13l-1.5 -1.5" />
            <path d="M7 16l-1.5 -1.5" />
          </svg>
          <span>Circuit Length</span>
        </div>
        <div class="track-stat-value">${escapeHTML(circuitData.length)}</div>
      </div>

      <div class="track-stat">
        <div class="track-stat-header">
          <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-road" width="14" height="14" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
            <path d="M4 19l4 -14" />
            <path d="M16 5l4 14" />
            <path d="M12 8v-2" />
            <path d="M12 13v-2" />
            <path d="M12 18v-2" />
          </svg>
          <span>Race Distance</span>
        </div>
        <div class="track-stat-value">${escapeHTML(circuitData.raceDistance)}</div>
      </div>

      <div class="track-stat">
        <div class="track-stat-header">
          <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-stopwatch" width="14" height="14" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
            <path d="M5 13a7 7 0 1 0 14 0a7 7 0 0 0 -14 0z" />
            <path d="M14.5 10.5l-2.5 2.5" />
            <path d="M17 8l1 -1" />
            <path d="M14 3h-4" />
          </svg>
          <span>Lap Record</span>
        </div>
        <div class="track-stat-value" title="${escapeHTML(circuitData.lapRecord)}">${escapeHTML(circuitData.lapRecord)}</div>
      </div>

      <div class="track-stat">
        <div class="track-stat-header">
          <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-calendar" width="14" height="14" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
            <path d="M4 7a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v12a2 2 0 0 1 -2 2h-12a2 2 0 0 1 -2 -2v-12z" />
            <path d="M16 3v4" />
            <path d="M8 3v4" />
            <path d="M4 11h16" />
          </svg>
          <span>First GP</span>
        </div>
        <div class="track-stat-value">${escapeHTML(String(circuitData.firstGrandPrix))}</div>
      </div>

      <div class="track-stat">
        <div class="track-stat-header">
          <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-map-pin" width="14" height="14" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
            <path d="M9 11a3 3 0 1 0 6 0a3 3 0 0 0 -6 0" />
            <path d="M17.657 16.657l-4.243 4.243a2 2 0 0 1 -2.827 0l-4.244 -4.243a8 8 0 1 1 11.314 0z" />
          </svg>
          <span>Location</span>
        </div>
        <div class="track-stat-value" title="${escapeHTML(circuitData.location)}">${escapeHTML(circuitData.location)}</div>
      </div>
    </div>
  `;

  container.innerHTML = `
    <div class="hub-header">
      <div style="display: flex; flex-direction: column; gap: 2px;">
        <h2 class="card-title" style="margin: 0; padding: 0; border: none; font-size: 1rem; color: #fff;">${escapeHTML(raceName)}</h2>
        <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 500;">${escapeHTML(circuitData.name)} • Round ${escapeHTML(String(closestRace?.round || '1'))}</span>
      </div>
      <div class="hub-tabs">
        <button class="hub-tab-btn ${activeTab === 'sessions' ? 'active' : ''}" data-hub-tab="sessions">
          <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-calendar-time" width="15" height="15" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
            <path d="M11.795 21h-6.795a2 2 0 0 1 -2 -2v-12a2 2 0 0 1 2 -2h12a2 2 0 0 1 2 2v4" />
            <path d="M18 18m-4 0a4 4 0 1 0 8 0a4 4 0 1 0 -8 0" />
            <path d="M15 3v4" />
            <path d="M7 3v4" />
            <path d="M3 11h16" />
            <path d="M18 16.496v1.504l1 1" />
          </svg>
          <span>Schedule</span>
        </button>
        <button class="hub-tab-btn ${activeTab === 'circuit' ? 'active' : ''}" data-hub-tab="circuit">
          <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-map-2" width="15" height="15" viewBox="0 0 24 24" stroke-width="2" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
            <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
            <path d="M12 18.5l-3 -1.5l-6 3v-13l6 -3l6 3l6 -3v7.5" />
            <path d="M9 4v13" />
            <path d="M15 7v5.5" />
            <path d="M21.121 20.121a3 3 0 1 0 -4.242 0c.418 .419 1.125 1.045 2.121 1.879c1.051 -.89 1.759 -1.516 2.121 -1.879z" />
            <path d="M19 18v.01" />
          </svg>
          <span>Circuit Map</span>
        </button>
      </div>
    </div>
    <div class="hub-content" style="margin-top: 14px;">
      ${activeTab === 'sessions' ? `<div class="horizontal-schedule">${sessionsHtml}</div>` : circuitHtml}
    </div>
  `;
}

export function showGrandPrixHub(initialTab = 'sessions') {
  const container = document.getElementById('race-schedule');
  const hubBtn = document.getElementById('schedule-button');
  if (!container || !closestRace) return;

  const currentMode = container.getAttribute('data-mode');
  if (container.style.display !== 'none' && currentMode === initialTab) {
    container.style.display = 'none';
    hubBtn?.classList.remove('active');
    hubBtn?.setAttribute('aria-expanded', 'false');
    return;
  }

  container.style.display = 'block';
  hubBtn?.classList.add('active');
  hubBtn?.setAttribute('aria-expanded', 'true');
  renderGrandPrixHub(initialTab);
}

export function showTrackDetailsCard() {
  showGrandPrixHub('circuit');
}

export function showRaceScheduleCard() {
  showGrandPrixHub('sessions');
}
