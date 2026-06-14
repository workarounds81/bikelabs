/**
 * BikeLabs Live Lookup — API Ninjas Motorcycles
 * https://api.api-ninjas.com/v1/motorcycles
 *
 * Replace the placeholder below with your real API key.
 * Get one free at: https://api-ninjas.com/
 */
const API_KEY = 'IF8GCTFrNmFBpzPfDvDX8m4i7KdjsoNxzK2E62at';

/**
 * Fetch factory specs for a given make and model.
 * Returns the first matching result object, or null on failure.
 *
 * @param {string} make  - e.g. "Honda"
 * @param {string} model - e.g. "CB650R"
 * @returns {Promise<Object|null>}
 */
async function fetchBikeSpecs(make, model) {
  const params = new URLSearchParams({ make: make.trim(), model: model.trim() });
  const url = `https://api.api-ninjas.com/v1/motorcycles?${params}`;

  const res = await fetch(url, {
    headers: { 'X-Api-Key': API_KEY }
  });

  if (!res.ok) throw new Error(`API error ${res.status}`);

  const data = await res.json();
  return data && data.length > 0 ? data[0] : null;
}

/**
 * Parse a numeric value out of a string like:
 *   "52.3 HP (38.2 kW)"   → { hp: 52.3, kw: 38.2 }
 *   "192.1 kg (423.4 lbs)" → { kg: 192.1, lbs: 423.4 }
 *   "15.14 litres (4.00 US gallons)" → { litres: 15.14, gallons: 4.00 }
 */
function parseValuePair(str) {
  if (!str) return null;
  const nums = [...str.matchAll(/([\d.]+)/g)].map(m => parseFloat(m[1]));
  return nums.length >= 2 ? nums : (nums.length === 1 ? [nums[0]] : null);
}

/**
 * Parse a tyre size string like "120/70ZR17" or "160/60-17" into parts.
 * Returns { width, aspect, rim } or null.
 */
function parseTyreCode(str) {
  if (!str) return null;
  const m = str.match(/(\d{2,3})\s*\/\s*(\d{2,3})\s*(?:ZR|R|-)\s*(\d{2})/i);
  if (!m) return null;
  return { width: parseInt(m[1]), aspect: parseInt(m[2]), rim: parseInt(m[3]) };
}

/**
 * Show a loading overlay inside `container` (a DOM element).
 */
function showLookupLoading(container) {
  let el = container.querySelector('.bl-loading');
  if (!el) {
    el = document.createElement('div');
    el.className = 'bl-loading';
    el.innerHTML = '<span class="bl-spinner"></span> Looking up specs…';
    container.appendChild(el);
  }
  el.style.display = 'flex';
}

function hideLookupLoading(container) {
  const el = container.querySelector('.bl-loading');
  if (el) el.style.display = 'none';
}

/**
 * Show a status message inside `container`.
 * type: 'success' | 'warn' | 'error'
 */
function showLookupStatus(container, msg, type) {
  let el = container.querySelector('.bl-status');
  if (!el) {
    el = document.createElement('div');
    el.className = 'bl-status';
    container.appendChild(el);
  }
  el.textContent = msg;
  el.className = 'bl-status bl-status--' + (type || 'success');
  el.style.display = 'block';
}

function hideLookupStatus(container) {
  const el = container.querySelector('.bl-status');
  if (el) el.style.display = 'none';
}
