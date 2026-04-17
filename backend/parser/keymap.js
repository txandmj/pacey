const anydateparser = require('any-date-parser');

// Matched directly in full OCR text — most reliable brand detection
const KNOWN_BRANDS = [
  'medtronic', 'boston scientific', 'abbott', 'biotronik',
  'st. jude', 'st jude medical', 'sorin', 'microport',
  'ela medical', 'guidant', 'pacesetter', 'vitatron'
];

// keyword → chars to capture after it
// Keys with ":" are intentionally specific to avoid noise (e.g. "device:" vs "device status")
const PATTERNS = {
  'shock impedance':    8,
  'battery':            4,
  'measured impedance': 15,  // Medtronic: "Measured Impedance 557ohms"
  'impedance':          15,  // general fallback
  'implant':            26,  // covers "implanted: 10-Apr-2019" and "implant date: ..."
  'device:':            32,  // MUST have colon — avoids "Device Status", "Device Information"
  'pacemaker model:':   40,  // older Medtronic format: "Pacemaker Model: Medtronic Adapta ADDR01"
};

// Result keys for pattern variants
const RESULT_KEY = {
  'device:':            'device',
  'pacemaker model:':   'device',
  'measured impedance': 'impedance',
};

function cleanString(str) {
  return str.trim().replace(/[^\w\s.]/gi, '').trim();
}

function titleCase(str) {
  return str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function parseImplantDate(rawText) {
  let datePart;

  if (/date:/i.test(rawText)) {
    // "implant date: 01/25/2010"
    datePart = rawText.split(/date:/i)[1];
  } else {
    // "implanted: 10-Apr-2019" or "implanted: 14.Jul-2015)"
    datePart = rawText.replace(/^[^0-9a-z]*/i, '').replace(/^[a-z]+:\s*/i, '');
  }

  if (!datePart) return null;

  datePart = datePart
    .trim()
    .replace(/[)}\]]+.*$/, '')   // strip trailing ) and anything after
    .replace(/\./g, '-')          // 14.Jul-2015 → 14-Jul-2015
    .replace(/\s+/g, ' ')
    .trim();

  const parsed = anydateparser.attempt(datePart);
  if (!parsed || !parsed.year) return null;

  return new Date(parsed.year, (parsed.month || 1) - 1, parsed.day || 1).getTime();
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
    implant:          [],
    impedance:        [],
    battery:          [],
    'shock impedance': [],
    device:           [],
  };

  // --- Direct brand name scan (most reliable) ---
  for (const brand of KNOWN_BRANDS) {
    if (text.includes(brand)) {
      const label = titleCase(brand);
      if (!result.device.includes(label)) {
        result.device.unshift(label); // brand listed first
      }
    }
  }

  // --- Keyword-based extraction ---
  for (const [key, windowSize] of Object.entries(PATTERNS)) {
    // Escape special regex chars in key (e.g. the colon is safe, but be defensive)
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
        // Strip trailing noise: "Serial Number", "SN:", "Date", "ID:", etc.
        cleaned = cleaned
          .replace(/\bserial\b.*/i, '')
          .replace(/\bsn\b.*/i, '')
          .replace(/\bdate\b.*/i, '')
          .replace(/\bid\b.*/i, '')
          .trim();
        if (!cleaned) continue;

        // Skip if it duplicates a brand we already have (e.g. "Medtronic Amplia..." when "Medtronic" already added)
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

  // Remove shock impedance values from regular impedance list
  result.impedance = result.impedance.filter(
    item => !result['shock impedance'].includes(item)
  );

  // Deduplicate device list (same model string repeated across PDF pages)
  result.device = deduplicateDevice(result.device);

  // Deduplicate implant dates (same date on multiple pages)
  result.implant = [...new Set(result.implant)];

  return result;
}

module.exports = mapToCommonTerms;
