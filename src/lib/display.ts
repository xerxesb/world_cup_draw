const DISPLAY_NAMES = new Map<string, string>([
  ["Democratic Republic of the Congo", "DR Congo"],
  ["Democratic Republic of Congo", "DR Congo"],
  ["Bosnia and Herzegovina", "Bosnia & Herz."],
  ["Netherlands", "NED"],
  ["South Korea", "Korea Rep."],
  ["United States", "USA"],
]);

export function displayTeamName(name: string): string {
  return DISPLAY_NAMES.get(name) ?? name;
}
