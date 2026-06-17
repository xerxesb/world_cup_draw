import { describe, expect, it } from "vitest";
import { displayTeamName } from "./display";

describe("displayTeamName", () => {
  it.each([
    ["Democratic Republic of the Congo", "DR Congo"],
    ["Democratic Republic of Congo", "DR Congo"],
    ["Bosnia and Herzegovina", "Bosnia"],
    ["Netherlands", "NED"],
    ["South Korea", "S. Korea"],
    ["Korea Republic", "S. Korea"],
    ["United States", "USA"],
    ["Czech Republic", "Czechia"],
    ["South Africa", "S. Africa"],
    ["Saudi Arabia", "S. Arabia"],
    ["Switzerland", "Switz."],
    ["Ivory Coast", "Ivory Cst."],
    ["New Zealand", "N. Zeal."],
    ["Cape Verde", "C. Verde"],
    ["Uzbekistan", "Uzbek."],
  ])("shortens %s to %s", (input, expected) => {
    expect(displayTeamName(input)).toBe(expected);
  });
});
