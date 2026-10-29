declare module '*normalize-name.mjs' {
  export function normalizeName(s: string): string;
}

declare module '*backfill.mjs' {
  type SecEntry = { cik_str?: number; ticker: string; title: string };
  type TickerIndex = { map: Map<string, string>; ambiguous: Set<string> };
  export function assertSecShape(sec: unknown): SecEntry[];
  export function buildTickerMap(sec: unknown): TickerIndex;
  export function backfillRows(
    rows: string[][],
    index: TickerIndex,
  ): { filled: number; skippedAmbiguous: number; stillEmpty: number; uniqueTickersAfter: number };
}
