const DISPLAY_NAMES = new Map<string, string>([
  // Already-mapped long names
  ["Democratic Republic of the Congo", "DR Congo"],
  ["Democratic Republic of Congo", "DR Congo"],
  ["Bosnia and Herzegovina", "Bosnia"],
  ["Netherlands", "NED"],
  ["South Korea", "S. Korea"],
  ["Korea Republic", "S. Korea"],
  ["United States", "USA"],
  // Long names that clip in compact chip layout
  ["Czech Republic", "Czechia"],
  ["South Africa", "S. Africa"],
  ["Saudi Arabia", "S. Arabia"],
  ["Switzerland", "Switz."],
  ["Ivory Coast", "Ivory Cst."],
  ["New Zealand", "N. Zeal."],
  ["Cape Verde", "C. Verde"],
  ["Uzbekistan", "Uzbek."],
]);

export function displayTeamName(name: string): string {
  return DISPLAY_NAMES.get(name) ?? name;
}
