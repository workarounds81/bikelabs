/**
 * BikeLabs Live Lookup — API Ninjas Motorcycles
 * https://api.api-ninjas.com/v1/motorcycles
 */
const API_KEY = 'IF8GCTqSrhJUxuMWighqHBj3xBFuACqvS9rx4Vgt';

/* ─── Common makes (datalist + fuzzy fallback) ─────────────────────────── */
const COMMON_MAKES = [
  'Aprilia','Benelli','Beta','BMW','BSA','Buell','CFMoto','Can-Am',
  'Ducati','Energica','Gas Gas','Harley-Davidson','Honda','Husqvarna',
  'Indian','Kawasaki','KTM','Kymco','Lambretta','Moto Guzzi','MV Agusta',
  'Norton','Piaggio','Royal Enfield','Sherco','Suzuki','Triumph',
  'Vespa','Yamaha','Zero'
];

/** Simple fuzzy match — returns closest make from COMMON_MAKES or null */
function fuzzyMake(input) {
  const q = input.toLowerCase().trim();
  const exact = COMMON_MAKES.find(m => m.toLowerCase() === q);
  if (exact) return exact;
  const contains = COMMON_MAKES.filter(m => m.toLowerCase().includes(q) || q.includes(m.toLowerCase().slice(0, 4)));
  if (contains.length) return contains[0];
  /* Levenshtein distance fallback */
  function dist(a, b) {
    const m = a.length, n = b.length;
    const dp = Array.from({length: m+1}, (_, i) => Array.from({length: n+1}, (_, j) => i || j));
    for (let i=1;i<=m;i++) for (let j=1;j<=n;j++)
      dp[i][j] = a[i-1]===b[j-1] ? dp[i-1][j-1] : 1+Math.min(dp[i-1][j],dp[i][j-1],dp[i-1][j-1]);
    return dp[m][n];
  }
  const scored = COMMON_MAKES.map(m => ({m, d: dist(q, m.toLowerCase())})).sort((a,b)=>a.d-b.d);
  return scored[0].d <= 4 ? scored[0].m : null;
}

/* ─── API helpers ───────────────────────────────────────────────────────── */
async function _apiFetch(params) {
  const url = 'https://api.api-ninjas.com/v1/motorcycles?' + new URLSearchParams(params);
  const res = await fetch(url, { headers: { 'X-Api-Key': API_KEY } });
  if (!res.ok) {
    let detail = '';
    try { const body = await res.text(); detail = body ? ': ' + body.slice(0, 120) : ''; } catch(_) {}
    throw new Error(`API ${res.status}${detail}`);
  }
  return res.json();
}

/** Fetch all results for a make (up to 30). Used to build model list. */
async function fetchMakeModels(make) {
  return _apiFetch({ make });
}

/** Fetch all year variants for a make+model. */
async function fetchModelYears(make, model) {
  return _apiFetch({ make, model });
}

/** Fetch a single spec record for make+model+year. */
async function fetchBikeSpecs(make, model, year) {
  const params = { make, model };
  if (year) params.year = year;
  const data = await _apiFetch(params);
  return data && data.length ? data[0] : null;
}

/* ─── Tyre code parser ──────────────────────────────────────────────────── */
function parseTyreCode(str) {
  if (!str) return null;
  const m = str.match(/(\d{2,3})\s*\/\s*(\d{2,3})\s*(?:ZR|R|-)\s*(\d{2})/i);
  return m ? { width: parseInt(m[1]), aspect: parseInt(m[2]), rim: parseInt(m[3]) } : null;
}

/* ─── Shared loading / status UI ────────────────────────────────────────── */
function showLookupLoading(container) {
  let el = container.querySelector('.bl-loading');
  if (!el) { el = document.createElement('div'); el.className='bl-loading'; el.innerHTML='<span class="bl-spinner"></span> Searching…'; container.appendChild(el); }
  el.style.display = 'flex';
}
function hideLookupLoading(container) {
  const el = container.querySelector('.bl-loading');
  if (el) el.style.display = 'none';
}
function showLookupStatus(container, msg, type) {
  let el = container.querySelector('.bl-status');
  if (!el) { el = document.createElement('div'); el.className='bl-status'; container.appendChild(el); }
  el.textContent = msg;
  el.className = 'bl-status bl-status--' + (type||'success');
  el.style.display = 'block';
}
function hideLookupStatus(container) {
  const el = container.querySelector('.bl-status');
  if (el) el.style.display = 'none';
}

/* ─── BikeFinder component ──────────────────────────────────────────────── */
/**
 * Renders a 3-step Make → Model → Year finder inside `containerId`.
 * Calls `onLoad(specObject)` when the user clicks Load Specs.
 *
 * Usage:
 *   BikeFinder.init('my-container', function(spec){ ... });
 */
const BikeFinder = {
  _container: null,
  _onLoad: null,
  _results: [],   /* raw API results for current make */

  init(containerId, onLoad) {
    this._container = document.getElementById(containerId);
    this._onLoad = onLoad;
    this._render();
  },

  _render() {
    const c = this._container;
    c.innerHTML = `
      <div class="bf-row">
        <div class="form-group">
          <label>Make</label>
          <input type="text" id="bf-make" list="bf-makes-list" placeholder="e.g. Honda" autocomplete="off">
          <datalist id="bf-makes-list">
            ${COMMON_MAKES.map(m=>`<option value="${m}">`).join('')}
          </datalist>
        </div>
        <div class="form-group">
          <label>&nbsp;</label>
          <button class="btn-lookup" id="bf-search-btn" onclick="BikeFinder._searchMake()">Find Models</button>
        </div>
      </div>
      <div class="bf-row" id="bf-model-row" style="display:none">
        <div class="form-group" style="flex:1">
          <label>Model</label>
          <select id="bf-model" onchange="BikeFinder._onModelChange()">
            <option value="">-- Select Model --</option>
          </select>
        </div>
        <div class="form-group" id="bf-year-group" style="display:none">
          <label>Year</label>
          <select id="bf-year">
            <option value="">Any</option>
          </select>
        </div>
        <div class="form-group">
          <label>&nbsp;</label>
          <button class="btn-lookup btn-load" id="bf-load-btn" onclick="BikeFinder._loadSpecs()" style="display:none">Load Specs</button>
        </div>
      </div>
    `;
  },

  async _searchMake() {
    const input = document.getElementById('bf-make').value.trim();
    if (!input) { showLookupStatus(this._container, 'Enter a make first.', 'warn'); return; }

    /* Fuzzy resolve */
    const resolved = fuzzyMake(input);
    if (!resolved) { showLookupStatus(this._container, `"${input}" not recognised. Try Honda, Yamaha, Kawasaki…`, 'warn'); return; }

    /* If fuzzy corrected, update the field */
    if (resolved.toLowerCase() !== input.toLowerCase()) {
      document.getElementById('bf-make').value = resolved;
      showLookupStatus(this._container, `Showing results for "${resolved}"`, 'warn');
    } else {
      hideLookupStatus(this._container);
    }

    const btn = document.getElementById('bf-search-btn');
    btn.disabled = true; btn.textContent = 'Searching…';
    showLookupLoading(this._container);
    document.getElementById('bf-model-row').style.display = 'none';

    try {
      const data = await fetchMakeModels(resolved);
      hideLookupLoading(this._container);
      btn.disabled = false; btn.textContent = 'Find Models';

      if (!data || !data.length) {
        showLookupStatus(this._container, `No bikes found for "${resolved}". Try a different make.`, 'warn');
        return;
      }

      this._results = data;

      /* Build unique sorted model list */
      const models = [...new Set(data.map(b => b.model))].sort();
      const modelSel = document.getElementById('bf-model');
      modelSel.innerHTML = '<option value="">-- Select Model --</option>' +
        models.map(m => `<option value="${m}">${m}</option>`).join('');

      document.getElementById('bf-model-row').style.display = 'flex';
      document.getElementById('bf-year-group').style.display = 'none';
      document.getElementById('bf-load-btn').style.display = 'none';
      hideLookupStatus(this._container);

    } catch(err) {
      hideLookupLoading(this._container);
      btn.disabled = false; btn.textContent = 'Find Models';
      showLookupStatus(this._container, 'Search failed: ' + err.message, 'error');
    }
  },

  async _onModelChange() {
    const make = document.getElementById('bf-make').value.trim();
    const model = document.getElementById('bf-model').value;
    const yearGroup = document.getElementById('bf-year-group');
    const loadBtn = document.getElementById('bf-load-btn');

    if (!model) { yearGroup.style.display='none'; loadBtn.style.display='none'; return; }

    /* Fetch year variants for this make+model */
    showLookupLoading(this._container);
    try {
      const variants = await fetchModelYears(make, model);
      hideLookupLoading(this._container);

      const years = [...new Set(variants.map(b => b.year))].sort((a,b)=>b-a);
      const yearSel = document.getElementById('bf-year');
      yearSel.innerHTML = '<option value="">Latest available</option>' +
        years.map(y => `<option value="${y}">${y}</option>`).join('');

      yearGroup.style.display = years.length > 1 ? 'block' : 'none';
      loadBtn.style.display = 'block';
      hideLookupStatus(this._container);

    } catch(err) {
      hideLookupLoading(this._container);
      /* Still show Load Specs even if year fetch fails */
      yearGroup.style.display = 'none';
      loadBtn.style.display = 'block';
    }
  },

  async _loadSpecs() {
    const make  = document.getElementById('bf-make').value.trim();
    const model = document.getElementById('bf-model').value;
    const year  = document.getElementById('bf-year').value;
    const btn   = document.getElementById('bf-load-btn');

    if (!model) { showLookupStatus(this._container, 'Select a model first.', 'warn'); return; }

    btn.disabled = true; btn.textContent = 'Loading…';
    showLookupLoading(this._container);
    hideLookupStatus(this._container);

    try {
      const spec = await fetchBikeSpecs(make, model, year || null);
      hideLookupLoading(this._container);
      btn.disabled = false; btn.textContent = 'Load Specs';

      if (!spec) { showLookupStatus(this._container, 'No spec data found for this selection.', 'warn'); return; }

      if (this._onLoad) this._onLoad(spec);

    } catch(err) {
      hideLookupLoading(this._container);
      btn.disabled = false; btn.textContent = 'Load Specs';
      showLookupStatus(this._container, 'Load failed: ' + err.message, 'error');
    }
  }
};
