const anydateparser = require('any-date-parser');

// Matched directly in full OCR text — most reliable brand detection
const KNOWN_BRANDS = [
  'medtronic', 'boston scientific', 'abbott', 'biotronik',
  'st. jude', 'st jude medical', 'sorin', 'microport',
  'ela medical', 'guidant', 'pacesetter', 'vitatron'
];

// keyword → chars to capture after it
const PATTERNS = {
  'shock impedance':    8,
  'battery':            4,
  'measured impedance': 15,  // Medtronic inline: "Measured Impedance 557ohms"
  'impedance':          15,  // general inline fallback
  'implant':            26,  // covers "implanted: 10-Apr-2019" and "implant date: ..."
  'device:':            32,  // colon required — avoids "Device Status", "Device Information"
  'pacemaker model:':   40,  // older Medtronic: "Pacemaker Model: Medtronic Adapta ADDR01"
};

// Result keys for pattern variants that differ from the key name
const RESULT_KEY = {
  'device:':            'device',
  'pacemaker model:':   'device',
  'measured impedance': 'impedance',
};

// Scan full OCR text for impedance values.
// Tesseract consistently misreads Ω as "q" in lowercase text.
// Also handles: ohms, ohm, Ω, O (capital O).
// Realistic pacemaker impedance range: 50–2500 Ω.
function extractAllImpedanceValues(text) {
  const matches = [];
  const re = /\b(\d{2,4})\s*(?:q|ohms?|Ω|[oO](?=\s|\(|$))\b/gi;
  let m;
  while ((m = re.exec(text)) !== null) {
    const val = parseInt(m[1]);
    if (val >= 50 && val <= 2500) matches.push(String(val));
  }
  return [...new Set(matches)];
}

function cleanString(str) {
  return str.trim().replace(/[^\w\s.]/gi, '').trim();
}

function titleCase(str) {
  return str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function parseImplantDate(rawText) {
  let datePart;

  if (/date:/i.test(rawText)) {
    datePart = rawText.split(/date:/i)[1];
  } else {
    // "implanted: 10-Apr-2019" or "implanted: 14.Jul-2015)"
    datePart = rawText.replace(/^[^0-9a-z]*/i, '').replace(/^[a-z]+:\s*/i, '');
  }

  if (!datePart) return null;

  datePart = datePart
    .trim()
    .replace(/[)}\]]+.*$/, '')  // strip trailing ) and anything after
    .replace(/\./g, '-')         // 14.Jul-2015 → 14-Jul-2015
    .replace(/\s+/g, ' ')
    .trim();

  const parsed = anydateparser.attempt(datePart);
  if (!parsed || !parsed.year) return null;

  return Date.UTC(parsed.year, (parsed.month || 1) - 1, parsed.day || 1);
}

function deduplicateDevice(arr) {
  const seen = new Set();
  return arr.filter(item => {
    const key = item.toLowerCase().replace(/\s+/g, ' ').trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function mapToCommonTerms(text) {
  const result = {
    implant:           [],
    impedance:         [],
    battery:           [],
    'shock impedance': [],
    device:            [],
  };

  // --- Direct brand name scan (most reliable) ---
  for (const brand of KNOWN_BRANDS) {
    if (text.includes(brand)) {
      const label = titleCase(brand);
      if (!result.device.includes(label)) {
        result.device.unshift(label);
      }
    }
  }

  // --- Keyword-based extraction ---
  for (const [key, windowSize] of Object.entries(PATTERNS)) {
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escapedKey})(.{0,${windowSize}})`, 'gi');
    let match;

    while ((match = regex.exec(text)) !== null) {
      const afterKeyword = match[2];
      if (!afterKeyword) continue;

      // --- Implant date ---
      if (key === 'implant') {
        const ts = parseImplantDate(afterKeyword);
        if (ts) result.implant.push(ts);
        continue;
      }

      let cleaned = cleanString(afterKeyword);
      if (!cleaned) continue;

      const resultKey = RESULT_KEY[key] || key;

      // --- Device / model ---
      if (resultKey === 'device') {
        cleaned = cleaned
          .replace(/\bserial\b.*/i, '')
          .replace(/\bsn\b.*/i, '')
          .replace(/\bdate\b.*/i, '')
          .replace(/\bid\b.*/i, '')
          .trim();
        if (!cleaned) continue;

        const alreadyHasBrand = result.device.some(
          d => cleaned.toLowerCase().startsWith(d.toLowerCase().substring(0, 5))
        );
        if (!alreadyHasBrand) result.device.push(cleaned);
        continue;
      }

      result[resultKey].push(cleaned);
    }
  }

  // --- Post-processing ---

  // Scan full text for impedance values using OCR-aware pattern
  // This handles tabular layouts where values appear on separate lines
  const allOhms = extractAllImpedanceValues(text);
  result.impedance.push(...allOhms);

  // Remove shock impedance values from regular impedance list
  result.impedance = result.impedance.filter(
    item => !result['shock impedance'].includes(item)
  );

  // Deduplicate
  result.impedance = [...new Set(result.impedance)];
  result.device    = deduplicateDevice(result.device);
  result.implant   = [...new Set(result.implant)];

  return result;
}

module.exports = mapToCommonTerms;
