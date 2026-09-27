import { describe, expect, test } from "bun:test";
import {
  escapeHTML,
  sanitizeUrl,
  getDriverUrlSlug,
  getTeamUrlSlug,
  getCircuitImageUrl,
  pad,
  shuffleArray,
  formatDate,
  formatTime,
  parseResolutionFromTitle,
  isHighResolution
} from "../js/utils.js";
import { getRaceStartTime, findUpcomingRace } from "../js/schedule.js";
import { storage } from "../js/storage.js";
import { DRIVER_MAPPING, TEAM_NAME_MAPPING, CIRCUIT_SLUGS } from "../js/constants.js";

describe("Security & Sanitization", () => {
  test("escapeHTML correctly neutralizes XSS payloads", () => {
    expect(escapeHTML("<script>alert(1)</script>")).toBe("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(escapeHTML('" onclick="evil()')).toBe("&quot; onclick=&quot;evil()");
    expect(escapeHTML("Hamilton & Russell")).toBe("Hamilton &amp; Russell");
    expect(escapeHTML(null)).toBe("");
    expect(escapeHTML(undefined)).toBe("");
  });

  test("sanitizeUrl permits valid http and https URLs and rejects dangerous schemes", () => {
    expect(sanitizeUrl("https://www.formula1.com/")).toBe("https://www.formula1.com/");
    expect(sanitizeUrl("http://example.com")).toBe("http://example.com");
    expect(sanitizeUrl("javascript:alert(1)")).toBe("#");
    expect(sanitizeUrl("data:text/html,<script>alert(1)</script>")).toBe("#");
    expect(sanitizeUrl("vbscript:msgbox")).toBe("#");
    expect(sanitizeUrl("")).toBe("#");
    expect(sanitizeUrl(null)).toBe("#");
  });
});

describe("Slug & URL Generation", () => {
  test("getDriverUrlSlug formats special driver slugs for formula1.com", () => {
    expect(getDriverUrlSlug({ givenName: "Alexander", familyName: "Albon" })).toBe("alex-albon");
    expect(getDriverUrlSlug({ givenName: "Guanyu", familyName: "Zhou" })).toBe("zhou-guanyu");
    expect(getDriverUrlSlug({ givenName: "Andrea Kimi", familyName: "Antonelli" })).toBe("kimi-antonelli");
    expect(getDriverUrlSlug({ givenName: "Oliver", familyName: "Bearman" })).toBe("ollie-bearman");
    expect(getDriverUrlSlug({ givenName: "Carlos", familyName: "Sainz" })).toBe("carlos-sainz");
    expect(getDriverUrlSlug({ givenName: "Max", familyName: "Verstappen" })).toBe("max-verstappen");
    expect(getDriverUrlSlug({ givenName: "Lando", familyName: "Norris" })).toBe("lando-norris");
  });

  test("getTeamUrlSlug correctly resolves team slugs", () => {
    expect(getTeamUrlSlug("Ferrari")).toBe("ferrari");
    expect(getTeamUrlSlug("Red Bull")).toBe("red-bull-racing");
    expect(getTeamUrlSlug("Kick Sauber")).toBe("kick-sauber");
    expect(getTeamUrlSlug("Cadillac F1 Team")).toBe("cadillac");
    expect(getTeamUrlSlug("Audi")).toBe("audi");
    expect(getTeamUrlSlug("Non Existent Team")).toBe("non-existent-team");
  });

  test("getCircuitImageUrl correctly maps slugs and avoids Monaco typo and unencoded spaces", () => {
    const monacoUrl = getCircuitImageUrl("Monaco Grand Prix");
    expect(monacoUrl).toContain("monaco_Circuit.png");
    expect(monacoUrl).not.toContain("monoco");
    expect(monacoUrl).not.toContain(" ");

    const spaUrl = getCircuitImageUrl("Belgian Grand Prix");
    expect(spaUrl).toContain("belgium_Circuit.png");

    const vegasUrl = getCircuitImageUrl("Las Vegas Grand Prix");
    expect(vegasUrl).toContain("las_vegas_Circuit.png");
  });
});

describe("Race Calculations & Countdown Math", () => {
  test("pad handles positive and negative numbers safely", () => {
    expect(pad(5)).toBe("05");
    expect(pad(12)).toBe("12");
    expect(pad(0)).toBe("00");
    expect(pad(-4)).toBe("00");
  });

  test("getRaceStartTime extracts valid date from various session formats", () => {
    const race1 = { sessions: { gp: "2026-05-24T13:00:00Z" } };
    expect(getRaceStartTime(race1)?.toISOString()).toBe("2026-05-24T13:00:00.000Z");

    const race2 = { sessions: { feature: "2026-06-01T14:00:00Z" } };
    expect(getRaceStartTime(race2)?.toISOString()).toBe("2026-06-01T14:00:00.000Z");

    const emptyRace = {};
    expect(getRaceStartTime(emptyRace)).toBeNull();
  });

  test("findUpcomingRace selects the nearest future or ongoing race", () => {
    const now = Date.now();
    const races = [
      { name: "Past Race", sessions: { gp: new Date(now - 1000 * 60 * 60 * 24).toISOString() } },
      { name: "Ongoing Race", sessions: { gp: new Date(now - 1000 * 60 * 30).toISOString() } }, // started 30 mins ago
      { name: "Future Race", sessions: { gp: new Date(now + 1000 * 60 * 60 * 48).toISOString() } }
    ];

    const chosen = findUpcomingRace(races);
    expect(chosen?.name).toBe("Ongoing Race");
  });

  test("findUpcomingRace falls back to future race when ongoing race exceeded 2.5 hours", () => {
    const now = Date.now();
    const races = [
      { name: "Completed Race", sessions: { gp: new Date(now - 1000 * 60 * 60 * 4).toISOString() } }, // 4 hrs ago
      { name: "Next Grand Prix", sessions: { gp: new Date(now + 1000 * 60 * 60 * 48).toISOString() } }
    ];

    const chosen = findUpcomingRace(races);
    expect(chosen?.name).toBe("Next Grand Prix");
  });
});

describe("Utility Functions", () => {
  test("shuffleArray shuffles elements without losing items", () => {
    const input = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const shuffled = shuffleArray(input);
    expect(shuffled.length).toBe(input.length);
    expect(shuffled.sort()).toEqual(input.sort());
  });

  test("formatDate handles valid and invalid dates", () => {
    expect(formatDate("2026-05-24T13:00:00Z")).not.toBe("TBD");
    expect(formatDate("invalid-date-string")).toBe("TBD");
  });
});

describe("Storage Fallback", () => {
  test("storage get and set fallback to in-memory store in test environment", async () => {
    await storage.set("test_key", { value: 42 });
    const result = await storage.get("test_key");
    expect(result).toEqual({ value: 42 });

    await storage.remove("test_key");
    const afterRemove = await storage.get("test_key", "default_val");
    expect(afterRemove).toBe("default_val");
  });
});

describe("High-Resolution Wallpaper Filtering", () => {
  test("parseResolutionFromTitle extracts width and height across various format styles", () => {
    expect(parseResolutionFromTitle("Audi F1 Team R26 [7600×5100]")).toEqual({ width: 7600, height: 5100 });
    expect(parseResolutionFromTitle("Max Verstappen, Red Bull Ring (1024 x 632)")).toEqual({ width: 1024, height: 632 });
    expect(parseResolutionFromTitle("Ferrari pit crew [1357 x 1080]")).toEqual({ width: 1357, height: 1080 });
    expect(parseResolutionFromTitle("Charles Leclerc [1920x1080] Monaco")).toEqual({ width: 1920, height: 1080 });
    expect(parseResolutionFromTitle("Lando Norris 3840x2160")).toEqual({ width: 3840, height: 2160 });
    expect(parseResolutionFromTitle("No resolution in title")).toBeNull();
  });

  test("isHighResolution enforces desktop standards (minimum 1920px width & landscape)", () => {
    // Valid High-res landscape
    expect(isHighResolution(1920, 1080)).toBe(true);
    expect(isHighResolution(2560, 1440)).toBe(true);
    expect(isHighResolution(3840, 2160)).toBe(true);
    expect(isHighResolution(7600, 5100)).toBe(true);

    // Reject low resolution
    expect(isHighResolution(1024, 632)).toBe(false);
    expect(isHighResolution(1357, 1080)).toBe(false);
    expect(isHighResolution(1280, 720)).toBe(false);

    // Reject vertical/portrait mobile wallpapers
    expect(isHighResolution(1080, 1920)).toBe(false);
    expect(isHighResolution(2160, 3840)).toBe(false);

    // Handle invalid inputs
    expect(isHighResolution(undefined, undefined)).toBe(false);
    expect(isHighResolution(null, 1080)).toBe(false);
  });
});

describe("Constants Integrity", () => {
  test("DRIVER_MAPPING and TEAM_NAME_MAPPING are complete", () => {
    expect(DRIVER_MAPPING["1"]).toBe("Max Verstappen");
    expect(DRIVER_MAPPING["44"]).toBe("Lewis Hamilton");
    expect(DRIVER_MAPPING["30"]).toBe("Liam Lawson");
    expect(TEAM_NAME_MAPPING["Ferrari"]).toBe("Scuderia Ferrari HP");
    expect(TEAM_NAME_MAPPING["Cadillac F1 Team"]).toBe("Cadillac F1 Team");
  });
});
