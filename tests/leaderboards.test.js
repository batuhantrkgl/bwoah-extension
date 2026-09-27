import { describe, expect, test, beforeEach } from "bun:test";
import { renderStandings } from "../js/leaderboards.js";

describe("Leaderboards No-Scroll Pagination", () => {
  beforeEach(() => {
    // Setup simulated DOM
    global.document = {
      getElementById(id) {
        if (!this._elements[id]) {
          this._elements[id] = {
            id,
            innerHTML: "",
            style: {},
            children: [],
            querySelector(sel) { return null; },
            querySelectorAll(sel) { return []; },
            appendChild(el) { this.children.push(el); },
            setAttribute(k, v) {},
            getAttribute(k) { return null; }
          };
        }
        return this._elements[id];
      },
      createElement(tag) {
        return {
          tagName: tag,
          innerHTML: "",
          style: {},
          children: [],
          className: "",
          appendChild(el) { this.children.push(el); },
          querySelector(sel) { return null; },
          addEventListener(evt, fn) {}
        };
      },
      _elements: {}
    };
  });

  test("renderStandings splits 20 drivers into exactly 10 visible items on Page 1", () => {
    const mockDrivers = Array.from({ length: 20 }, (_, i) => ({
      position: String(i + 1),
      points: "100",
      Driver: {
        permanentNumber: String(i + 1),
        givenName: `Driver`,
        familyName: `${i + 1}`
      }
    }));

    const mockTeams = Array.from({ length: 10 }, (_, i) => ({
      position: String(i + 1),
      points: "200",
      Constructor: {
        name: `Team ${i + 1}`
      }
    }));

    renderStandings(mockDrivers, mockTeams);

    const driversList = document.getElementById("drivers-list");
    const teamsList = document.getElementById("teams-list");

    // Count rendered items in drivers list HTML
    const driverItemsCount = (driversList.innerHTML.match(/class="leaderboard-item"/g) || []).length;
    expect(driverItemsCount).toBe(10); // Page 1 has exactly 10, no overflow scrolling!

    const teamItemsCount = (teamsList.innerHTML.match(/class="leaderboard-item"/g) || []).length;
    expect(teamItemsCount).toBe(10);
  });
});
