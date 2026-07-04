/**
 * Insurance OCR Token Audit Script — BEFORE vs AFTER
 * Tests all PDFs against both OLD and NEW pipeline to show exact benefit.
 * Usage: node insurance_token_audit.js
 */

const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// ─── PIPELINE A: CURRENT (old) ─────────────────────────────────────────────────
function extractText_OLD(fullText) {
  const HIGH_VALUE_KEYWORDS = [
    'registration no', 'vehicle no', 'engine number', 'chassis', 'make', 'model',
    'policy no', 'policy number', 'valid from', 'valid till', 'period of insurance',
    'premium', 'total premium', 'insured', 'insured name', 'receipt', 'proposal',
    'certificate of insurance', 'policy schedule', 'fuel type', 'seating capacity',
    'mfg. year', 'manufacture year', 'date of registration', 'body type'
  ];
  const segments = fullText.split(/(?:Page\s*(?:no\.?|number)?\s*[:\-]?\s*\d+\s*(?:of\s*\d+)?)/i)
    .filter(s => s.trim().length > 50);
  if (segments.length <= 1) return { text: fullText.slice(0, 10000), method: 'FALLBACK', segCount: 0 };
  const scored = segments.map((seg, i) => {
    const lower = seg.toLowerCase();
    const score = HIGH_VALUE_KEYWORDS.reduce((acc, kw) => acc + (lower.includes(kw) ? 1 : 0), 0);
    return { seg, score, i };
  });
  const top = scored.sort((a, b) => b.score - a.score).slice(0, 5).sort((a, b) => a.i - b.i);
  return { text: top.map(s => s.seg.trim()).join('\n\n---\n\n').slice(0, 12000), method: 'SMART', segCount: segments.length };
}

// ─── PIPELINE B: NEW (optimized) ───────────────────────────────────────────────
function extractText_NEW(fullText) {
  const HIGH_VALUE_KEYWORDS = [
    'registration no', 'vehicle no', 'engine number', 'chassis', 'make', 'model',
    'policy no', 'policy number', 'valid from', 'valid till', 'period of insurance',
    'premium', 'total premium', 'insured', 'insured name', 'receipt', 'proposal',
    'certificate of insurance', 'policy schedule', 'fuel type', 'seating capacity',
    'mfg. year', 'manufacture year', 'date of registration', 'body type'
  ];

  // Step 1: Strip Hindi/Devanagari — biggest token win (NIC, TATA AIG all have bilingual text)
  let cleaned = fullText.replace(/[\u0900-\u097F]+/g, '').trim();

  // Step 2: Strip legal boilerplate that's never useful for extraction
  const BOILERPLATE_PATTERNS = [
    /Motor Vehicles? Act[^\n]{0,300}/gi,
    /IRDAI[^\n]{0,200}/gi,
    /Central Motor Vehicle[^\n]{0,200}/gi,
    /amended from time to time[^\n]{0,200}/gi,
    /Arbitration Clause[^\n]{0,200}/gi,
    /AVOIDANCE OF CERTAIN[^\n]{0,300}/gi,
    /RIGHT OF RECOVERY[^\n]{0,300}/gi,
    /Office of the Insurance Ombudsman[^\n]{0,400}/gi,
    /IN WITNESS WHEREOF[^\n]{0,400}/gi,
    /PersonsorClassofPersons[^\n]{0,400}/gi,
    /Usein connection[^\n]{0,400}/gi,
    /Thepolicydoesnot[^\n]{0,400}/gi,
  ];
  for (const pattern of BOILERPLATE_PATTERNS) {
    cleaned = cleaned.replace(pattern, '');
  }

  // Step 3: Collapse whitespace noise
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n').replace(/[ \t]{2,}/g, ' ').trim();

  // Step 4: Smart segment + score
  const segments = cleaned.split(/(?:Page\s*(?:no\.?|number)?\s*[:\-]?\s*\d+\s*(?:of\s*\d+)?)/i)
    .filter(s => s.trim().length > 50);

  if (segments.length <= 1) {
    return { text: cleaned.slice(0, 6000), method: 'FALLBACK', segCount: 0 };
  }

  const scored = segments.map((seg, i) => {
    const lower = seg.toLowerCase();
    const score = HIGH_VALUE_KEYWORDS.reduce((acc, kw) => acc + (lower.includes(kw) ? 1 : 0), 0);
    return { seg, score, i };
  });

  const top = scored.sort((a, b) => b.score - a.score).slice(0, 4).sort((a, b) => a.i - b.i);
  const result = top.map(s => s.seg.trim()).join('\n\n---\n\n').slice(0, 7000);
  return { text: result, method: 'SMART_OPTIMIZED', segCount: segments.length };
}

// ─── Token estimation and prompt sizing ────────────────────────────────────────
const sanitize = (text) => text
  .replace(/ﬀ/g, 'ff').replace(/ﬁ/g, 'fi').replace(/ﬂ/g, 'fl')
  .replace(/ﬃ/g, 'ffi').replace(/ﬄ/g, 'ffl').replace(/ﬅ/g, 'st')
  .replace(/\u0000/g, ' ')
  .replace(/[^\x09\x0A\x0D\x20-\x7E\u00A0-\uFFFF]/g, ' ')
  .replace(/[ \t]{3,}/g, '  ')
  .trim();

const estimateTokens = (str) => Math.ceil(str.length / 4);

// OLD: 4-message prompt structure
function buildPrompt_OLD(documentText) {
  const system = 'You are a strict data extraction assistant. When given an insurance document, you extract ONLY values that literally appear in the document text. You never guess, infer, or invent values. You output only valid JSON.';
  const userMsg1 = 'I am sharing the raw text extracted from an insurance PDF document. This is the SOURCE DATA:\n\n<DOCUMENT>\n' + documentText + '\n</DOCUMENT>\n\nConfirm you have received the document.';
  const ack = 'I have received the insurance document text. I will extract only values that actually appear in it.';
  const task = `Extract the details from this vehicle insurance policy document.
- Extract the vehicle registration number (remove any hyphens/spaces, e.g. CG-23-J-8800 should become CG23J8800).
- Extract the policy number, policy holder name, insurance company name (e.g. HDFC ERGO, ICICI Lombard).
- Extract valid from date and valid to date in DD-MM-YYYY format.
- Extract the policy holder / owner's address if present in the document.
- Extract the total premium amount after GST (look for "Total Premium", "Gross Premium", "Premium After GST", or "Total Amount" on the document). Return only the numeric value, e.g. "12500" or "12500.50". Do not include currency symbols or commas.
- Also extract as many of these RC/vehicle details as available in the document: chassis number, engine number, make/manufacturer name, model name, year of manufacture, cubic capacity (CC), seating capacity, body type.
- If a field is not present, return empty string "".
- If multiple policy holder names or owners are mentioned, pick the primary one.
Respond ONLY with a valid JSON object matching this structure exactly (use empty string "" if a field is not found):
{"vehicleNumber":"","policyNumber":"","policyHolderName":"","validFrom":"","validTo":"","insuranceCompany":"","totalPremium":"","address":"","chassisNumber":"","engineNumber":"","makerName":"","makerModel":"","manufactureYear":"","cubicCapacity":"","seatingCapacity":"","bodyType":""}`;
  return estimateTokens(system) + estimateTokens(userMsg1) + estimateTokens(ack) + estimateTokens(task);
}

// NEW: single-turn combined prompt
function buildPrompt_NEW(documentText) {
  const system = 'You are a precise insurance document data extractor. Extract ONLY values that literally appear in the document. Output valid JSON only. Never invent values.';
  const userMsg = `Extract fields from this insurance policy document text:\n\n<DOCUMENT>\n${documentText}\n</DOCUMENT>\n\nRules:\n- vehicleNumber: remove hyphens/spaces (CG-04-AA-1234 → CG04AA1234)\n- validFrom/validTo: DD-MM-YYYY format\n- totalPremium: numeric only after GST (look for "Total Premium","Gross Premium","Total Amount","Premium After GST")\n- insuranceCompany: full insurer name as it appears\n- If a field is absent, use ""\n\nRespond ONLY with JSON:\n{"vehicleNumber":"","policyNumber":"","policyHolderName":"","validFrom":"","validTo":"","insuranceCompany":"","totalPremium":"","address":"","chassisNumber":"","engineNumber":"","makerName":"","makerModel":"","manufactureYear":"","cubicCapacity":"","seatingCapacity":"","bodyType":""}`;
  return estimateTokens(system) + estimateTokens(userMsg);
}

const INSURANCE_DIR = path.join(__dirname, '../frontend/public/insurance');

async function processPdf(filePath) {
  const buffer = fs.readFileSync(filePath);
  const pdfData = await pdfParse(buffer);
  const rawText = pdfData.text;
  const rawChars = rawText.length;

  const oldExtracted = extractText_OLD(rawText);
  const newExtracted = extractText_NEW(rawText);

  const oldSanitized = sanitize(oldExtracted.text);
  const newSanitized = sanitize(newExtracted.text);

  const oldTokens = buildPrompt_OLD(oldSanitized);
  const newTokens = buildPrompt_NEW(newSanitized);

  const devanagariChars = (rawText.match(/[\u0900-\u097F]/g) || []).length;
  const devanagariPct = ((devanagariChars / rawChars) * 100).toFixed(1);

  return {
    rawChars,
    rawTokensEst: estimateTokens(rawText),
    devanagariChars,
    devanagariPct,
    old: {
      method: oldExtracted.method,
      segCount: oldExtracted.segCount,
      chars: oldSanitized.length,
      tokens: oldTokens,
    },
    new: {
      method: newExtracted.method,
      segCount: newExtracted.segCount,
      chars: newSanitized.length,
      tokens: newTokens,
    },
    saved: {
      tokens: oldTokens - newTokens,
      pct: (((oldTokens - newTokens) / oldTokens) * 100).toFixed(1),
    }
  };
}

async function runAudit() {
  const allFiles = fs.readdirSync(INSURANCE_DIR).filter(f => f.endsWith('.pdf'));
  // Deduplicate: skip " (1)" copies
  const files = allFiles.filter(f => !f.match(/\s\(\d+\)\.pdf$/));

  console.log(`\n${'═'.repeat(100)}`);
  console.log('  INSURANCE OCR TOKEN AUDIT — OLD vs NEW PIPELINE');
  console.log(`${'═'.repeat(100)}`);
  console.log(`\n  Scanning: ${INSURANCE_DIR}`);
  console.log(`  Files found: ${allFiles.length} total | ${files.length} unique (skipped ${allFiles.length - files.length} duplicates)\n`);

  const results = [];
  let totalOld = 0, totalNew = 0;

  for (const file of files) {
    const filePath = path.join(INSURANCE_DIR, file);
    const kb = (fs.statSync(filePath).size / 1024).toFixed(0);
    process.stdout.write(`  Processing ${file.substring(0, 55).padEnd(55)} ${kb.padStart(5)} KB ... `);
    try {
      const r = await processPdf(filePath);
      results.push({ file, kb, ...r });
      totalOld += r.old.tokens;
      totalNew += r.new.tokens;
      console.log(`OLD ~${r.old.tokens.toLocaleString().padStart(5)} tok | NEW ~${r.new.tokens.toLocaleString().padStart(5)} tok | SAVE ${r.saved.pct}% | Hindi: ${r.devanagariPct}%`);
    } catch (e) {
      console.log(`ERROR: ${e.message}`);
    }
  }

  // ─── Summary table ────────────────────────────────────────────────────────────
  const n = results.length;
  const avgOld = Math.round(totalOld / n);
  const avgNew = Math.round(totalNew / n);
  const avgSaved = avgOld - avgNew;
  const avgSavedPct = ((avgSaved / avgOld) * 100).toFixed(1);

  console.log(`\n${'─'.repeat(100)}`);
  console.log('  PER-FILE BREAKDOWN');
  console.log(`${'─'.repeat(100)}`);
  console.log(`  ${'File'.padEnd(52)} ${'Size'.padStart(6)} ${'Raw Chars'.padStart(11)} ${'Hindi%'.padStart(7)} ${'OLD tok'.padStart(8)} ${'NEW tok'.padStart(8)} ${'Saved'.padStart(8)} ${'%'.padStart(5)}`);
  console.log(`  ${'-'.repeat(96)}`);
  for (const r of results) {
    console.log(
      `  ${r.file.substring(0, 52).padEnd(52)} ${(r.kb + ' KB').padStart(6)} ${r.rawChars.toLocaleString().padStart(11)} ${(r.devanagariPct + '%').padStart(7)} ${r.old.tokens.toLocaleString().padStart(8)} ${r.new.tokens.toLocaleString().padStart(8)} ${r.saved.tokens.toLocaleString().padStart(8)} ${(r.saved.pct + '%').padStart(5)}`
    );
  }
  console.log(`  ${'-'.repeat(96)}`);
  console.log(`  ${'AVERAGE'.padEnd(52)} ${''.padStart(6)} ${''.padStart(11)} ${''.padStart(7)} ${avgOld.toLocaleString().padStart(8)} ${avgNew.toLocaleString().padStart(8)} ${avgSaved.toLocaleString().padStart(8)} ${(avgSavedPct + '%').padStart(5)}`);

  const GROQ_LIMIT = 6000;
  const outputTokPerCall = 150;
  const callsPerMin_Old = Math.floor(GROQ_LIMIT / (avgOld + outputTokPerCall));
  const callsPerMin_New = Math.floor(GROQ_LIMIT / (avgNew + outputTokPerCall));

  console.log(`\n${'═'.repeat(100)}`);
  console.log('  SUMMARY');
  console.log(`${'═'.repeat(100)}`);
  console.log(`  PDFs tested              : ${n}`);
  console.log(`  OLD pipeline avg tokens  : ~${avgOld.toLocaleString()} input tokens/call`);
  console.log(`  NEW pipeline avg tokens  : ~${avgNew.toLocaleString()} input tokens/call`);
  console.log(`  Average token reduction  : ~${avgSaved.toLocaleString()} tokens/call (${avgSavedPct}% less)`);
  console.log(`  Output tokens (fixed)    : ~${outputTokPerCall} tokens/call (JSON response)`);
  console.log(`  Total cost per call OLD  : ~${(avgOld + outputTokPerCall).toLocaleString()} tokens`);
  console.log(`  Total cost per call NEW  : ~${(avgNew + outputTokPerCall).toLocaleString()} tokens`);
  console.log(`\n  Groq llama-3.3-70b rate limit: ${GROQ_LIMIT.toLocaleString()} tokens/min (free tier)`);
  console.log(`  OLD: max ~${callsPerMin_Old} calls/min → ~${(callsPerMin_Old * 60).toLocaleString()} calls/hour`);
  console.log(`  NEW: max ~${callsPerMin_New} calls/min → ~${(callsPerMin_New * 60).toLocaleString()} calls/hour`);
  console.log(`  Throughput improvement   : +${((callsPerMin_New / callsPerMin_Old - 1) * 100).toFixed(0)}% more extractions per hour`);
  console.log(`${'═'.repeat(100)}\n`);
}

runAudit().catch(console.error);
