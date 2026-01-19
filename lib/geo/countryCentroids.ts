import worldCountries from 'world-countries';

type WorldCountry = {
  cca2?: string;
  ccn3?: string;
  name?: { common?: string };
  latlng?: [number, number];
};

export type CountryCentroid = {
  iso2: string;
  ccn3: string;
  name: string;
  lat: number;
  lng: number;
};

let iso2Map: Map<string, CountryCentroid> | null = null;
let nameMap: Map<string, CountryCentroid> | null = null;

function normalizeName(s: string): string {
  return s.trim().toLowerCase();
}

function ensureMaps() {
  if (iso2Map && nameMap) return;

  const iso = new Map<string, CountryCentroid>();
  const names = new Map<string, CountryCentroid>();

  for (const raw of worldCountries as WorldCountry[]) {
    const iso2 = (raw.cca2 ?? '').trim().toUpperCase();
    const ccn3 = (raw.ccn3 ?? '').trim();
    const name = (raw.name?.common ?? '').trim();
    const lat = raw.latlng?.[0];
    const lng = raw.latlng?.[1];

    if (!iso2 || iso2.length !== 2) continue;
    if (!ccn3) continue;
    if (!name) continue;
    if (typeof lat !== 'number' || typeof lng !== 'number') continue;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;

    const c: CountryCentroid = { iso2, ccn3, name, lat, lng };
    iso.set(iso2, c);
    names.set(normalizeName(name), c);
  }

  iso2Map = iso;
  nameMap = names;
}

export function lookupCountryCentroid(value: string): CountryCentroid | null {
  const v = (value ?? '').trim();
  if (!v) return null;
  ensureMaps();
  const byIso = iso2Map?.get(v.toUpperCase());
  if (byIso) return byIso;
  return nameMap?.get(normalizeName(v)) ?? null;
}
