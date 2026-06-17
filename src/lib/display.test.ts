import { describe, expect, it } from "vitest";
import { displayTeamName } from "./display";

describe("displayTeamName", () => {
  it.each([
    ["Democratic Republic of the Congo", "COD"],
    ["Democratic Republic of Congo", "COD"],
    ["Bosnia and Herzegovina", "BIH"],
    ["Czech Republic", "CZE"],
    ["United States", "USA"],
    ["South Africa", "RSA"],
    ["Saudi Arabia", "KSA"],
    ["South Korea", "KOR"],
    ["Korea Republic", "KOR"],
    ["Switzerland", "SUI"],
    ["Ivory Coast", "CIV"],
    ["Netherlands", "NED"],
    ["New Zealand", "NZL"],
    ["Cape Verde", "CPV"],
    ["Uzbekistan", "UZB"],
    ["Australia", "AUS"],
    ["Argentina", "ARG"],
    ["Scotland", "SCO"],
    ["Paraguay", "PAR"],
    ["Portugal", "POR"],
    ["Colombia", "COL"],
    ["DR Congo", "COD"],
    ["Czechia", "CZE"],
    ["Mexico", "Mexico"],
  ])("displays %s as %s", (input, expected) => {
    expect(displayTeamName(input)).toBe(expected);
  });
});
