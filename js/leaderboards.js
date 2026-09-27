/**
 * Leaderboards & Standings Management (No-Scroll Paginated Views)
 */

import { TEAM_NAME_MAPPING } from "./constants.js";
import { storage } from "./storage.js";
import { escapeHTML, sanitizeUrl, getTeamUrlSlug, getDriverUrlSlug } from "./utils.js";

const PAGE_SIZE = 10;
let currentDriversPage = 1;
let currentTeamsPage = 1;
let currentDriversData = [];
let currentTeamsData = [];

export async function loadLeaderboard(targetYear = new Date().getFullYear()) {
  const driversList = document.getElementById('drivers-list');
  const teamsList = document.getElementById('teams-list');
  const yearContainer = document.getElementById('year-selector-container');

  if (!driversList || !teamsList) return;

  driversList.innerHTML = '<div class="leaderboard-message">Loading standings...</div>';
  teamsList.innerHTML = '<div class="leaderboard-message">Loading standings...</div>';

  const currentYear = new Date().getFullYear();
  const availableYears = [currentYear, currentYear - 1, currentYear - 2];

  if (yearContainer) {
    yearContainer.innerHTML = availableYears.map(y => `
      <button class="year-button ${Number(targetYear) === y ? 'active' : ''}" data-year="${y}" type="button" aria-pressed="${Number(targetYear) === y}">
        ${y}
      </button>
    `).join('');
  }

  const cacheKey = `bwoah_standings_${targetYear}`;
  try {
    const cached = await storage.get(cacheKey);
    if (cached && cached.drivers && cached.teams) {
      renderStandings(cached.drivers, cached.teams);
    }
  } catch (e) {}

  const driversUrl = `https://api.jolpi.ca/ergast/f1/${targetYear}/driverstandings/?format=json`;
  const teamsUrl = `https://api.jolpi.ca/ergast/f1/${targetYear}/constructorstandings/?format=json`;

  try {
    const [dRes, tRes] = await Promise.all([
      fetch(driversUrl).catch(() => ({ ok: false })),
      fetch(teamsUrl).catch(() => ({ ok: false }))
    ]);

    if (!dRes.ok || !tRes.ok) {
      if (Number(targetYear) === currentYear) {
        return loadLeaderboard(targetYear - 1);
      }
      throw new Error('Standings endpoint returned non-200');
    }

    const [dData, tData] = await Promise.all([dRes.json(), tRes.json()]);

    const driverStandings = dData?.MRData?.StandingsTable?.StandingsLists?.[0]?.DriverStandings || [];
    const teamStandings = tData?.MRData?.StandingsTable?.StandingsLists?.[0]?.ConstructorStandings || [];

    if (driverStandings.length === 0 && Number(targetYear) === currentYear) {
      return loadLeaderboard(targetYear - 1);
    }

    currentDriversData = driverStandings;
    currentTeamsData = teamStandings;
    currentDriversPage = 1;
    currentTeamsPage = 1;

    renderStandings(driverStandings, teamStandings);
    await storage.set(cacheKey, {
      drivers: driverStandings,
      teams: teamStandings
    });
  } catch (error) {
    console.warn('[Bwoah] Standings load failed:', error);
    if (!driversList.querySelector('.leaderboard-item')) {
      driversList.innerHTML = '<div class="leaderboard-message">Unable to load driver standings.</div>';
    }
    if (!teamsList.querySelector('.leaderboard-item')) {
      teamsList.innerHTML = '<div class="leaderboard-message">Unable to load constructor standings.</div>';
    }
  }
}

export function renderStandings(drivers, teams) {
  currentDriversData = drivers || [];
  currentTeamsData = teams || [];

  renderDriversPage();
  renderTeamsPage();
}

function renderDriversPage() {
  const driversList = document.getElementById('drivers-list');
  const driversContainer = document.getElementById('drivers-leaderboard');
  if (!driversList || !driversContainer) return;

  const total = currentDriversData.length;
  if (total === 0) return;

  const totalPages = Math.ceil(total / PAGE_SIZE);
  currentDriversPage = Math.max(1, Math.min(currentDriversPage, totalPages));

  const start = (currentDriversPage - 1) * PAGE_SIZE;
  const pageItems = currentDriversData.slice(start, start + PAGE_SIZE);

  driversList.innerHTML = pageItems.map((item, idx) => {
    const globalIndex = start + idx;
    const d = item.Driver || {};
    const num = d.permanentNumber ? `#${d.permanentNumber}` : '';
    const name = `${d.givenName || ''} ${d.familyName || ''}`.trim() || 'Unknown Driver';
    const points = item.points !== undefined ? `${item.points} pts` : '0 pts';
    const pos = item.position || (globalIndex + 1);
    const url = sanitizeUrl(`https://www.formula1.com/en/drivers/${getDriverUrlSlug(d)}`);

    return `
      <a class="leaderboard-item" style="--index: ${idx}" href="${url}" target="_blank" rel="noopener noreferrer" title="View ${escapeHTML(name)} on Formula1.com">
        <span class="leaderboard-position">${escapeHTML(pos)}</span>
        <span class="leaderboard-name">${escapeHTML(num)} ${escapeHTML(name)}</span>
        <span class="leaderboard-points">${escapeHTML(points)}</span>
      </a>
    `;
  }).join('');

  // Update or insert pagination controls without scrolling
  let paginationEl = driversContainer.querySelector('.pagination-controls');
  if (totalPages > 1) {
    if (!paginationEl) {
      paginationEl = document.createElement('div');
      paginationEl.className = 'pagination-controls';
      driversContainer.appendChild(paginationEl);
    }
    paginationEl.innerHTML = `
      <button class="pagination-arrow prev" ${currentDriversPage === 1 ? 'disabled' : ''} aria-label="Previous Page" type="button">
        <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-chevron-left arrow-icon" width="14" height="14" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
          <path d="M15 6l-6 6l6 6" />
        </svg>
      </button>
      <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600;">${currentDriversPage} / ${totalPages}</span>
      <button class="pagination-arrow next" ${currentDriversPage === totalPages ? 'disabled' : ''} aria-label="Next Page" type="button">
        <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-chevron-right arrow-icon" width="14" height="14" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
          <path d="M9 6l6 6l-6 6" />
        </svg>
      </button>
    `;

    paginationEl.querySelector('.prev')?.addEventListener('click', () => {
      if (currentDriversPage > 1) {
        currentDriversPage--;
        renderDriversPage();
      }
    });

    paginationEl.querySelector('.next')?.addEventListener('click', () => {
      if (currentDriversPage < totalPages) {
        currentDriversPage++;
        renderDriversPage();
      }
    });
  } else if (paginationEl) {
    paginationEl.remove();
  }
}

function renderTeamsPage() {
  const teamsList = document.getElementById('teams-list');
  const teamsContainer = document.getElementById('teams-leaderboard');
  if (!teamsList || !teamsContainer) return;

  const total = currentTeamsData.length;
  if (total === 0) return;

  const totalPages = Math.ceil(total / PAGE_SIZE);
  currentTeamsPage = Math.max(1, Math.min(currentTeamsPage, totalPages));

  const start = (currentTeamsPage - 1) * PAGE_SIZE;
  const pageItems = currentTeamsData.slice(start, start + PAGE_SIZE);

  teamsList.innerHTML = pageItems.map((item, idx) => {
    const globalIndex = start + idx;
    const c = item.Constructor || {};
    const rawName = c.name || 'Unknown Team';
    const cleanName = TEAM_NAME_MAPPING[rawName] || rawName;
    const points = item.points !== undefined ? `${item.points} pts` : '0 pts';
    const pos = item.position || (globalIndex + 1);
    const url = sanitizeUrl(`https://www.formula1.com/en/teams/${getTeamUrlSlug(rawName)}`);

    return `
      <a class="leaderboard-item" style="--index: ${idx}" href="${url}" target="_blank" rel="noopener noreferrer" title="View ${escapeHTML(cleanName)} on Formula1.com">
        <span class="leaderboard-position">${escapeHTML(pos)}</span>
        <span class="leaderboard-name">${escapeHTML(cleanName)}</span>
        <span class="leaderboard-points">${escapeHTML(points)}</span>
      </a>
    `;
  }).join('');

  let paginationEl = teamsContainer.querySelector('.pagination-controls');
  if (totalPages > 1) {
    if (!paginationEl) {
      paginationEl = document.createElement('div');
      paginationEl.className = 'pagination-controls';
      teamsContainer.appendChild(paginationEl);
    }
    paginationEl.innerHTML = `
      <button class="pagination-arrow prev" ${currentTeamsPage === 1 ? 'disabled' : ''} aria-label="Previous Page" type="button">
        <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-chevron-left arrow-icon" width="14" height="14" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
          <path d="M15 6l-6 6l6 6" />
        </svg>
      </button>
      <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600;">${currentTeamsPage} / ${totalPages}</span>
      <button class="pagination-arrow next" ${currentTeamsPage === totalPages ? 'disabled' : ''} aria-label="Next Page" type="button">
        <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-tabler icon-tabler-chevron-right arrow-icon" width="14" height="14" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" fill="none" stroke-linecap="round" stroke-linejoin="round">
          <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
          <path d="M9 6l6 6l-6 6" />
        </svg>
      </button>
    `;

    paginationEl.querySelector('.prev')?.addEventListener('click', () => {
      if (currentTeamsPage > 1) {
        currentTeamsPage--;
        renderTeamsPage();
      }
    });

    paginationEl.querySelector('.next')?.addEventListener('click', () => {
      if (currentTeamsPage < totalPages) {
        currentTeamsPage++;
        renderTeamsPage();
      }
    });
  } else if (paginationEl) {
    paginationEl.remove();
  }
}
