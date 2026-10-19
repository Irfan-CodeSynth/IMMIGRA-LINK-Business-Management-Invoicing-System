/**
 * Precise Financial Math Utilities for UAE Dirham (AED) and Fils (1 AED = 100 Fils)
 */
export declare function aedToFils(aed: number | string): number;
export declare function filsToAed(fils: number): number;
export declare function formatAed(filsOrAed: number, isFils?: boolean): string;
/**
 * Converts AED amount to official uppercase words in UAE standard format:
 * e.g., 7857.91 -> "SEVEN THOUSAND EIGHT HUNDRED FIFTY-SEVEN DHS AND NINETY-ONE FILS"
 */
export declare function numberToAedWords(amount: number, isFils?: boolean): string;
//# sourceMappingURL=currency.d.ts.map