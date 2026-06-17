import { describe, expect, it } from "vitest";
import { displayTeamName } from "./display";

describe("displayTeamName", () => {
  it.each([
    ["Democratic Republic of the Congo", "DR Congo"],
    ["Democratic Republic of Congo", "DR Congo"],
    ["Bosnia and Herzegovina", "Bosnia & Herz."],
    ["Netherlands", "NED"],
    ["South Korea", "Korea Rep."],
    ["United States", "USA"],
  ])("shortens %s to %s", (input, expected) => {
    expect(displayTeamName(input)).toBe(expected);
  });
});
