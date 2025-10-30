// ---------------- ELEMENT REFERENCES ----------------
const lyricsInput = document.getElementById('lyricsInput');
const analyzeBtn = document.getElementById('analyzeBtn');
const clearBtn = document.getElementById('clearBtn');
const sampleBtn = document.getElementById('sampleBtn');
const toneSlider = document.getElementById('toneSlider');
const sectionSelect = document.getElementById('sectionSelect');
const moodSelect = document.getElementById('moodSelect');
const genreSelect = document.getElementById('genreSelect');

const summaryEl = document.getElementById('summary');
const creativeListEl = document.getElementById('creativeList');
const criticalListEl = document.getElementById('criticalList');
const lineSuggestionsEl = document.getElementById('lineSuggestions');
const metricsEl = document.getElementById('metrics');
const themeToggle = document.getElementById('themeToggle');

// Loading overlay element
const loadingOverlay = document.getElementById('loadingOverlay');

// ---------------- THEME TOGGLE ----------------
themeToggle.addEventListener('click', () => {
  document.body.classList.toggle('light');
});

// ---------------- SAMPLE LYRICS ----------------
const SAMPLE = `Verse:
City lights hum, I'm a flicker in the rain,
Echoes in the alley keep repeating your name.
Chorus:
Hold me like the sky holds the neon tight,
I'm breaking but I'm burning, you’re my afterlight.`;

sampleBtn.addEventListener('click', () => {
  lyricsInput.value = SAMPLE;
});

// ---------------- CLEAR ----------------
clearBtn.addEventListener('click', () => {
  lyricsInput.value = '';
  clearOutput();
});

function clearOutput() {
  summaryEl.innerHTML = '';
  creativeListEl.innerHTML = '';
  criticalListEl.innerHTML = '';
  lineSuggestionsEl.innerHTML = '';
  metricsEl.innerHTML = '';
}

// ---------------- LOADING OVERLAY ----------------
function showLoading() {
  loadingOverlay.classList.remove('hidden');
}

function hideLoading() {
  loadingOverlay.classList.add('hidden');
}

// ---------------- ANALYZE ----------------
analyzeBtn.addEventListener('click', async () => {
  const text = lyricsInput.value.trim();
  if (!text) {
    alert('Please enter lyrics to analyze.');
    return;
  }

  const payload = {
    lyrics: text,
    tone: Number(toneSlider.value),
    section: sectionSelect.value,
    mood: moodSelect.value,
    genre: genreSelect.value
  };

  try {
    showLoading(); // show spinner
    const res = await fetch('/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    hideLoading(); // hide spinner

    if (data.error) {
      console.error("Backend error:", data);
      alert("Error: " + data.error);
      return;
    }

    renderOutput(data.analysis);
  } catch (err) {
    hideLoading(); // hide spinner even on error
    console.error(err);
    alert('Error contacting Apollo backend.');
  }
});

// ---------------- RENDER OUTPUT ----------------
function renderOutput(analysis) {
  if (!analysis) {
    summaryEl.innerHTML = '<p>No analysis returned.</p>';
    return;
  }

  // Summary
  summaryEl.innerHTML = `<p>${escapeHTML(analysis.summary || '')}</p>`;

  // Creative Sparks
  creativeListEl.innerHTML = '';
  if (analysis.creative && analysis.creative.length > 0) {
    analysis.creative.forEach(item => {
      const block = document.createElement('div');
      block.className = 'feedback-block';
      block.innerHTML = `
        <h4>${escapeHTML(item.label)}</h4>
        <p>${escapeHTML(item.text)}</p>
      `;
      creativeListEl.appendChild(block);
    });
  }

  // Polish & Precision
  criticalListEl.innerHTML = '';
  if (analysis.critical && analysis.critical.length > 0) {
    analysis.critical.forEach(item => {
      const block = document.createElement('div');
      block.className = 'feedback-block';
      block.innerHTML = `
        <h4>${escapeHTML(item.label)}</h4>
        <p>${escapeHTML(item.text)}</p>
      `;
      criticalListEl.appendChild(block);
    });
  }

  // Line-by-line
  lineSuggestionsEl.innerHTML = '';
  (analysis.lineByLine || []).forEach(sug => {
    const div = document.createElement('div');
    div.className = 'suggestion-line';
    div.innerHTML = `
      <div class="orig"><strong>Original:</strong> ${escapeHTML(sug.orig)}</div>
      <div class="creative"><strong>Creative:</strong> ${escapeHTML(sug.creative)}</div>
      <div class="critical"><strong>Critical:</strong> ${escapeHTML(sug.critical)}</div>
    `;
    lineSuggestionsEl.appendChild(div);
  });

  // Metrics
  metricsEl.innerHTML = '';
  if (analysis.metrics) {
    Object.entries(analysis.metrics).forEach(([k, v]) => {
      const m = document.createElement('div');
      m.className = 'metric';
      m.innerHTML = `
        <h4>${escapeHTML(k)}</h4>
        <div class="value">${escapeHTML(String(v))}</div>
      `;
      metricsEl.appendChild(m);
    });
  }
}

// ---------------- HELPERS ----------------
function escapeHTML(str) {
  return str.replace(/[&<>"']/g, m =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m])
  );
}