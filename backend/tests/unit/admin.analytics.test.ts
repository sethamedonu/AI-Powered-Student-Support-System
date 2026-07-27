import { describe, it, expect, vi, beforeEach } from 'vitest';

// ─── Isolated aggregation logic (extracted for testability) ──────────────────

type Period = 'day' | 'week' | 'month';

function getPeriodDays(period: Period): number {
  return period === 'day' ? 1 : period === 'week' ? 7 : 30;
}

function getDates(from: Date, to: Date): string[] {
  const dates: string[] = [];
  const cur = new Date(from);
  while (cur <= to) {
    dates.push(cur.toISOString().split('T')[0]!);
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

function aggregateByDate(
  messageEvents: { date: string; metadata?: Record<string, unknown> }[],
  cacheHitEvents: { date: string; metadata?: Record<string, unknown> }[],
  dates: string[],
) {
  const byDate = new Map<string, { messages: number; cacheHits: number; aiCalls: number }>();
  for (const d of dates) byDate.set(d, { messages: 0, cacheHits: 0, aiCalls: 0 });

  for (const e of messageEvents) {
    const row = byDate.get(e.date);
    if (row) { row.messages++; row.aiCalls++; }
  }
  for (const e of cacheHitEvents) {
    const row = byDate.get(e.date);
    if (row) { row.messages++; row.cacheHits++; }
  }
  return dates.map(d => ({ date: d, ...(byDate.get(d) ?? { messages: 0, cacheHits: 0, aiCalls: 0 }) }));
}

function buildTopCategories(events: { metadata?: Record<string, unknown> }[]) {
  const counts = new Map<string, number>();
  for (const e of events) {
    const cat = (e.metadata?.['category'] as string) ?? 'general';
    counts.set(cat, (counts.get(cat) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([category, count]) => ({ category, count }));
}

function buildModelUsage(events: { metadata?: Record<string, unknown> }[]) {
  const counts = new Map<string, number>();
  for (const e of events) {
    const model = (e.metadata?.['model'] as string) ?? 'unknown';
    counts.set(model, (counts.get(model) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([model, count]) => ({ model, count }));
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('Analytics aggregation', () => {
  describe('getDates', () => {
    it('returns correct number of dates for a range', () => {
      const from = new Date('2024-01-01');
      const to = new Date('2024-01-07');
      expect(getDates(from, to)).toHaveLength(7);
    });

    it('returns single date when from equals to', () => {
      const d = new Date('2024-06-15');
      expect(getDates(d, d)).toEqual(['2024-06-15']);
    });
  });

  describe('aggregateByDate', () => {
    it('counts messages and cache hits per date', () => {
      const dates = ['2024-01-01', '2024-01-02'];
      const msgEvents = [
        { date: '2024-01-01', metadata: {} },
        { date: '2024-01-01', metadata: {} },
        { date: '2024-01-02', metadata: {} },
      ];
      const cacheEvents = [{ date: '2024-01-01', metadata: {} }];

      const result = aggregateByDate(msgEvents, cacheEvents, dates);

      expect(result[0]).toMatchObject({ date: '2024-01-01', messages: 3, cacheHits: 1, aiCalls: 2 });
      expect(result[1]).toMatchObject({ date: '2024-01-02', messages: 1, cacheHits: 0, aiCalls: 1 });
    });

    it('returns zeros for dates with no events', () => {
      const result = aggregateByDate([], [], ['2024-03-01']);
      expect(result[0]).toMatchObject({ messages: 0, cacheHits: 0, aiCalls: 0 });
    });

    it('ignores events outside the date range', () => {
      const result = aggregateByDate(
        [{ date: '2024-05-01', metadata: {} }],
        [],
        ['2024-04-01'],
      );
      expect(result[0]).toMatchObject({ messages: 0, aiCalls: 0 });
    });
  });

  describe('buildTopCategories', () => {
    it('counts and sorts categories descending', () => {
      const events = [
        { metadata: { category: 'admissions' } },
        { metadata: { category: 'admissions' } },
        { metadata: { category: 'tuition' } },
        { metadata: { category: 'admissions' } },
        { metadata: { category: 'tuition' } },
      ];
      const result = buildTopCategories(events);
      expect(result[0]).toEqual({ category: 'admissions', count: 3 });
      expect(result[1]).toEqual({ category: 'tuition', count: 2 });
    });

    it('defaults to general when category metadata is missing', () => {
      const result = buildTopCategories([{ metadata: {} }, { metadata: {} }]);
      expect(result[0]).toEqual({ category: 'general', count: 2 });
    });

    it('returns at most 6 categories', () => {
      const events = ['a', 'b', 'c', 'd', 'e', 'f', 'g'].map(c => ({ metadata: { category: c } }));
      expect(buildTopCategories(events)).toHaveLength(6);
    });
  });

  describe('buildModelUsage', () => {
    it('counts model usage and sorts descending', () => {
      const events = [
        { metadata: { model: 'nova-lite' } },
        { metadata: { model: 'nova-lite' } },
        { metadata: { model: 'claude-3-5-sonnet' } },
      ];
      const result = buildModelUsage(events);
      expect(result[0]).toEqual({ model: 'nova-lite', count: 2 });
      expect(result[1]).toEqual({ model: 'claude-3-5-sonnet', count: 1 });
    });

    it('defaults to unknown when model metadata is missing', () => {
      const result = buildModelUsage([{ metadata: {} }]);
      expect(result[0]).toEqual({ model: 'unknown', count: 1 });
    });
  });

  describe('getPeriodDays', () => {
    it('returns correct days for each period', () => {
      expect(getPeriodDays('day')).toBe(1);
      expect(getPeriodDays('week')).toBe(7);
      expect(getPeriodDays('month')).toBe(30);
    });
  });
});
