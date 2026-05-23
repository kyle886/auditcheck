export type Firm = 'PwC' | 'Deloitte' | 'EY' | 'KPMG';

export const FIRMS: readonly Firm[] = ['PwC', 'Deloitte', 'EY', 'KPMG'];

export type Row = [Firm, string, string, string, string?] & {
  yMin?: number;
  yMax?: number;
};

export type ByFirm = Partial<Record<Firm, Row[]>>;
export type Ticker2Firms = Record<string, Set<Firm>>;
