export function normalizeName(name: string) {
  return name.trim().replace(/\s+/g, " ");
}

export function foldTr(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .replace(/[ıiİI]/g, "i")
    .replace(/[şŞ]/g, "s")
    .replace(/[ğĞ]/g, "g")
    .replace(/[üÜ]/g, "u")
    .replace(/[öÖ]/g, "o")
    .replace(/[çÇ]/g, "c")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function namesMatch(a: string, b: string) {
  return foldTr(a) === foldTr(b);
}

export function initialsFromName(name: string) {
  const parts = normalizeName(name)
    .split(" ")
    .filter((part) => !["t.c", "tc", "a.s", "as", "a.ş", "aş"].includes(foldTr(part)));
  const letters = parts
    .map((part) => part[0] ?? "")
    .join("")
    .toLocaleUpperCase("tr-TR")
    .replace(/[^A-ZÇĞİÖŞÜ]/g, "")
    .slice(0, 3);
  return letters || "B";
}

export function searchHaystack(parts: string[]) {
  return foldTr(parts.join(" "));
}

export function queryMatches(query: string, parts: string[]) {
  const needle = foldTr(query);
  if (!needle) return true;
  return searchHaystack(parts).includes(needle);
}
