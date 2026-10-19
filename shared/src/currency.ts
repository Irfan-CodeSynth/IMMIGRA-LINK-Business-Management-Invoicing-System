/**
 * Precise Financial Math Utilities for UAE Dirham (AED) and Fils (1 AED = 100 Fils)
 */

export function aedToFils(aed: number | string): number {
  if (typeof aed === "string") {
    // strip commas or currency symbols
    const clean = aed.replace(/[^0-9.-]+/g, "");
    const parsed = parseFloat(clean);
    if (isNaN(parsed)) return 0;
    return Math.round(parsed * 100);
  }
  if (isNaN(aed)) return 0;
  return Math.round(aed * 100);
}

export function filsToAed(fils: number): number {
  if (isNaN(fils)) return 0;
  return Number((fils / 100).toFixed(2));
}

export function formatAed(filsOrAed: number, isFils = true): string {
  const amount = isFils ? filsToAed(filsOrAed) : filsOrAed;
  return new Intl.NumberFormat("en-AE", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

const ONES = [
  "", "ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE",
  "TEN", "ELEVEN", "TWELVE", "THIRTEEN", "FOURTEEN", "FIFTEEN", "SIXTEEN",
  "SEVENTEEN", "EIGHTEEN", "NINETEEN",
];

const TENS = [
  "", "", "TWENTY", "THIRTY", "FORTY", "FIFTY", "SIXTY", "SEVENTY", "EIGHTY", "NINETY",
];

function convertThreeDigitChunk(n: number): string {
  let str = "";
  if (n >= 100) {
    str += ONES[Math.floor(n / 100)] + " HUNDRED ";
    n %= 100;
  }
  if (n >= 20) {
    str += TENS[Math.floor(n / 10)] + (n % 10 !== 0 ? "-" + ONES[n % 10] : "");
  } else if (n > 0) {
    str += ONES[n];
  }
  return str.trim();
}

/**
 * Converts AED amount to official uppercase words in UAE standard format:
 * e.g., 7857.91 -> "SEVEN THOUSAND EIGHT HUNDRED FIFTY-SEVEN DHS AND NINETY-ONE FILS"
 */
export function numberToAedWords(amount: number, isFils = false): string {
  const totalFils = isFils ? Math.round(amount) : Math.round(amount * 100);
  if (totalFils === 0) {
    return "ZERO DHS AND ZERO FILS";
  }

  const isNegative = totalFils < 0;
  const absFils = Math.abs(totalFils);

  const dirhams = Math.floor(absFils / 100);
  const fils = absFils % 100;

  let words = "";

  if (dirhams === 0) {
    words = "ZERO";
  } else {
    let d = dirhams;
    const billions = Math.floor(d / 1_000_000_000);
    d %= 1_000_000_000;
    const millions = Math.floor(d / 1_000_000);
    d %= 1_000_000;
    const thousands = Math.floor(d / 1_000);
    const remainder = d % 1_000;

    const parts: string[] = [];

    if (billions > 0) {
      parts.push(convertThreeDigitChunk(billions) + " BILLION");
    }
    if (millions > 0) {
      parts.push(convertThreeDigitChunk(millions) + " MILLION");
    }
    if (thousands > 0) {
      parts.push(convertThreeDigitChunk(thousands) + " THOUSAND");
    }
    if (remainder > 0) {
      parts.push(convertThreeDigitChunk(remainder));
    }

    words = parts.join(" ");
  }

  let filsWords = "ZERO";
  if (fils > 0) {
    filsWords = convertThreeDigitChunk(fils);
  }

  const prefix = isNegative ? "MINUS " : "";
  return `${prefix}${words} DHS AND ${filsWords} FILS`.trim();
}
