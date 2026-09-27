import { describe, expect, test } from "bun:test";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

const rootDir = join(__dirname, "..");

describe("Manifest Validation", () => {
  test("Chrome manifest.json is valid Manifest V3", () => {
    const raw = readFileSync(join(rootDir, "manifest.json"), "utf8");
    const manifest = JSON.parse(raw);

    expect(manifest.manifest_version).toBe(3);
    expect(manifest.name).toBe("Bwoah! - Your F1 Homepage");
    expect(manifest.version).toBeDefined();
    expect(manifest.action).toBeDefined();
    expect(manifest.chrome_url_overrides?.newtab).toBe("newtab.html");
    expect(manifest.permissions).toContain("storage");
    expect(manifest.host_permissions).toBeArray();
    expect(manifest.host_permissions).toContain("https://www.reddit.com/*");
    expect(manifest.host_permissions).toContain("https://api.jolpi.ca/*");

    // All icons declared must exist on disk
    for (const size of ["16", "48", "128"]) {
      const iconPath = manifest.icons[size];
      expect(existsSync(join(rootDir, iconPath))).toBe(true);
    }
  });

  test("Firefox manifest.firefox.json is valid Manifest V3", () => {
    const raw = readFileSync(join(rootDir, "manifest.firefox.json"), "utf8");
    const manifest = JSON.parse(raw);

    expect(manifest.manifest_version).toBe(3);
    expect(manifest.name).toBe("Bwoah! - Your F1 Homepage");
    expect(manifest.browser_specific_settings?.gecko?.id).toBeDefined();
    expect(manifest.chrome_url_overrides?.newtab).toBe("newtab.html");

    // All icons declared must exist on disk
    for (const size of ["16", "48", "128"]) {
      const iconPath = manifest.icons[size];
      expect(existsSync(join(rootDir, iconPath))).toBe(true);
    }
  });
});

describe("Assets & Files Integrity", () => {
  test("All HTML referenced images exist in images/ directory", () => {
    const html = readFileSync(join(rootDir, "newtab.html"), "utf8");
    const imageMatches = [...html.matchAll(/src=["']images\/([^"']+)["']/g)];

    expect(imageMatches.length).toBeGreaterThan(0);
    for (const match of imageMatches) {
      const imgFile = match[1];
      const filePath = join(rootDir, "images", imgFile);
      expect(existsSync(filePath)).toBe(true);
    }
  });

  test("drivers.json is valid JSON with valid driver numbers", () => {
    const raw = readFileSync(join(rootDir, "jsons", "drivers.json"), "utf8");
    const drivers = JSON.parse(raw);

    expect(typeof drivers).toBe("object");
    expect(drivers["1"]).toBe("Max Verstappen");
    expect(drivers["44"]).toBe("Lewis Hamilton");
    expect(drivers["16"]).toBe("Charles Leclerc");
    expect(drivers["4"]).toBe("Lando Norris");
    expect(drivers["30"]).toBe("Liam Lawson");
  });

  test("LICENSE, README.md, and PRIVACY.md exist and are non-empty", () => {
    expect(existsSync(join(rootDir, "LICENSE"))).toBe(true);
    expect(readFileSync(join(rootDir, "LICENSE"), "utf8").length).toBeGreaterThan(50);

    expect(existsSync(join(rootDir, "README.md"))).toBe(true);
    expect(readFileSync(join(rootDir, "README.md"), "utf8").length).toBeGreaterThan(50);

    expect(existsSync(join(rootDir, "PRIVACY.md"))).toBe(true);
    expect(readFileSync(join(rootDir, "PRIVACY.md"), "utf8").length).toBeGreaterThan(50);
  });
});
