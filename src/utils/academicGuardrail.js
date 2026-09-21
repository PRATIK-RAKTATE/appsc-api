/**
 * academicGuardrail.js
 *
 * Validates student queries to ensure they are relevant to competitive exam
 * preparation before passing them to paid external APIs.
 *
 * Two-pass approach:
 *   1. Block known off-topic / harmful categories (blocklist).
 *   2. Require at least a weak signal of academic relevance (allowlist).
 *
 * Designed for low false-negative rate (academic questions get through) and
 * reasonable false-positive rate (clearly off-topic gets blocked).
 */

// ---------------------------------------------------------------------------
// Off-topic / harmful patterns that should ALWAYS be blocked
// ---------------------------------------------------------------------------
const BLOCKED_PATTERNS = [
  // Prompt injection attempts
  /ignore\s+(previous|all|above)\s+instructions?/i,
  /you\s+are\s+now\s+(a\s+)?[^.]{0,30}(assistant|bot|ai|gpt|model)/i,
  /forget\s+(what\s+you\s+(know|were\s+told)|your\s+instructions?)/i,
  /act\s+as\s+(if\s+you\s+(are|were)\s+)?[^.]{0,40}(without\s+(restrictions?|limits?|safety))/i,
  /jailbreak/i,
  /dan\s+mode/i,
  /pretend\s+(you|there)\s+(are|is|have)\s+no/i,

  // Adult / harmful content
  /\b(porn|pornography|nude|naked|sex\s+video|xxx|hentai|nsfw)\b/i,
  /\b(rape|molest|grooming|pedophil|child\s+(abuse|exploitation))\b/i,
  /\b(self[- ]harm|suicide\s+(method|how\s+to)|cut\s+myself|kill\s+myself)\b/i,

  // Violence / weapons
  /\b(how\s+to\s+(make|build|create|synthesize)\s+(bomb|explosive|poison|drug|meth|heroin))\b/i,
  /\b(weapon\s+of\s+mass|bioweapon|chemical\s+weapon)\b/i,

  // Clearly off-topic programming (not exam-related CS theory)
  /\b(write\s+(me\s+)?(a\s+)?(python|java|javascript|c\+\+|nodejs?|react|angular|vue)\s+(code|script|program|function|class|app|project))\b/i,
  /\b(debug\s+my\s+code|fix\s+this\s+(code|bug|error)|code\s+review)\b/i,
  /\b(full\s*stack|frontend|backend|api\s+(development|endpoint|route)|database\s+schema)\b/i,

  // Generic entertainment / unrelated
  /\b(movie|series|netflix|cricket\s+score|ipl|football\s+match|recipe|cooking)\b/i,
  /\b(girlfriend|boyfriend|dating\s+(advice|tips|app)|love\s+letter|breakup)\b/i,
  /\b(stock\s+tips|crypto|bitcoin\s+(price|buy|sell)|nft|trading\s+signal)\b/i,
];

// ---------------------------------------------------------------------------
// Academic topic keywords — query must contain at least one of these signals
// (or pass the heuristic minimum length check for general academic phrasing)
// ---------------------------------------------------------------------------
const ACADEMIC_SIGNALS = [
  // Exam names
  /\b(upsc|ias|ips|ifs|appsc|tspsc|apsc|psc|ssc|cgl|chsl|cds|nda|capf|ibps|rbi|sebi|nabard|rrb|ntpc|group\s*[dbc]|gate|ugc|net|jee|neet|cat|xat|gmat|gre|clat|ailet)\b/i,

  // GK / Polity / Governance
  /\b(constitution|parliament|lok\s*sabha|rajya\s*sabha|article\s+\d|amendment|fundamental\s+right|directive\s+principle|preamble|federalism|governance|election\s+commission|president|prime\s+minister|cabinet|judiciary|supreme\s+court|high\s+court)\b/i,

  // Economy / Finance
  /\b(gdp|gni|inflation|deflation|fiscal\s+policy|monetary\s+policy|rbi|budget|five[-\s]year\s+plan|niti\s+aayog|planning\s+commission|tax|gst|demonetisation|current\s+account|trade\s+deficit|balance\s+of\s+payment|poverty|unemployment|msme)\b/i,

  // History / Culture / Geography
  /\b(ancient|medieval|modern|mughal|british\s+raj|independence|partition|revolt\s+of\s+1857|freedom\s+fighter|gandhi|nehru|ambedkar|subhas|bose|tilak|geography|state|capital|river|mountain|plateau|peninsula|climate|monsoon|soil|forest)\b/i,

  // Science / Environment
  /\b(physics|chemistry|biology|ecology|environment|biodiversity|climate\s+change|global\s+warming|ozone|carbon|renewable\s+energy|nuclear|space|isro|nasa|satellite|periodic\s+table|cell|dna|rna|vaccine|disease|atom|molecule)\b/i,

  // Current Affairs markers
  /\b(current\s+affairs?|recent|latest|news|scheme|policy|act\s+\d{4}|bill|mission|yojana|pradhan\s+mantri|atal|swachh|beti|make\s+in\s+india|digital\s+india|smart\s+city|g20|g7|un|nato|brics|sco|quad|asean)\b/i,

  // Generic academic phrasing
  /\b(syllabus|exam|preparation|study|notes|topic|chapter|subject|concept|theory|definition|explain|difference\s+between|compare|analyse|upsc\s+mains|prelims|mcq|question|answer|previous\s+year)\b/i,

  // Maths / Reasoning (common in competitive exams)
  /\b(arithmetic|algebra|geometry|trigonometry|probability|statistics|data\s+interpretation|reasoning|aptitude|puzzle|number\s+series|analogy|coding[-\s]decoding)\b/i,
];

/**
 * Validates whether a student query is appropriate for the academic AI assistant.
 *
 * @param {string} query
 * @returns {{ valid: boolean, reason: string }}
 */
export const validateAcademicPrompt = (query) => {
  if (!query || typeof query !== "string") {
    return {
      valid: false,
      reason: "Query must be a non-empty string.",
    };
  }

  const trimmed = query.trim();

  if (trimmed.length < 5) {
    return {
      valid: false,
      reason: "Query is too short. Please ask a complete question.",
    };
  }

  if (trimmed.length > 2000) {
    return {
      valid: false,
      reason: "Query is too long. Please keep your question under 2000 characters.",
    };
  }

  // --- Pass 1: Block harmful / off-topic patterns ---
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        valid: false,
        reason:
          "Your question appears to be off-topic or contains inappropriate content. " +
          "This assistant is designed exclusively for competitive exam preparation (UPSC, APPSC, SSC, etc.). " +
          "Please ask questions related to GK, Polity, Economy, History, Science, Current Affairs, or your exam syllabus.",
      };
    }
  }

  // --- Pass 2: Require at least one academic signal ---
  const hasAcademicSignal = ACADEMIC_SIGNALS.some((pattern) => pattern.test(trimmed));

  if (!hasAcademicSignal) {
    return {
      valid: false,
      reason:
        "Your question does not seem to be related to competitive exam preparation. " +
        "Please ask questions about topics like Polity, Economy, History, Geography, Science, " +
        "Current Affairs, or specific exam syllabi (UPSC, APPSC, SSC, etc.).",
    };
  }

  return { valid: true, reason: "" };
};
