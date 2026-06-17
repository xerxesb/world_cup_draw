// FIFA 3-letter codes for names that are too long to fit in a team chip (8+ chars)
const DISPLAY_NAMES = new Map<string, string>([
  // 8+ character names → FIFA code
  ["Democratic Republic of the Congo", "COD"],
  ["Democratic Republic of Congo", "COD"],
  ["DR Congo", "COD"],
  ["Bosnia and Herzegovina", "BIH"],
  ["Czech Republic", "CZE"],
  ["Czechia", "CZE"],
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
]);

export function displayTeamName(name: string): string {
  return DISPLAY_NAMES.get(name) ?? name;
}
