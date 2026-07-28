import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  formatDate,
  timeAgo,
  truncate,
  capitalize,
  formatCategory,
  clamp,
  uid,
} from '../../src/lib/utils';

describe('formatDate', () => {
  it('formats ISO string to readable date', () => {
    const result = formatDate('2024-06-15T00:00:00.000Z');
    expect(result).toMatch(/Jun/);
    expect(result).toMatch(/2024/);
  });
});

describe('timeAgo', () => {
  afterEach(() => vi.useRealTimers());

  it('returns "just now" for < 1 minute ago', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T12:00:30Z'));
    expect(timeAgo('2024-01-01T12:00:00Z')).toBe('just now');
  });

  it('returns minutes ago', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T12:05:00Z'));
    expect(timeAgo('2024-01-01T12:00:00Z')).toBe('5m ago');
  });

  it('returns hours ago', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T15:00:00Z'));
    expect(timeAgo('2024-01-01T12:00:00Z')).toBe('3h ago');
  });

  it('returns days ago', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-04T12:00:00Z'));
    expect(timeAgo('2024-01-01T12:00:00Z')).toBe('3d ago');
  });

  it('returns formatted date for > 7 days', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-20T12:00:00Z'));
    const result = timeAgo('2024-01-01T12:00:00Z');
    expect(result).toMatch(/Jan/);
  });
});

describe('truncate', () => {
  it('returns original string if within limit', () => {
    expect(truncate('Hello', 10)).toBe('Hello');
  });

  it('truncates and appends ellipsis', () => {
    const result = truncate('Hello World', 5);
    expect(result).toBe('Hello…');
    expect(result.length).toBe(6);
  });

  it('uses default max of 60', () => {
    const long = 'a'.repeat(70);
    expect(truncate(long)).toHaveLength(61); // 60 chars + ellipsis
  });
});

describe('capitalize', () => {
  it('capitalizes first letter', () => {
    expect(capitalize('hello')).toBe('Hello');
  });

  it('handles already capitalized', () => {
    expect(capitalize('World')).toBe('World');
  });

  it('handles empty string', () => {
    expect(capitalize('')).toBe('');
  });
});

describe('formatCategory', () => {
  it('formats hyphenated category', () => {
    expect(formatCategory('campus-services')).toBe('Campus Services');
  });

  it('handles single word', () => {
    expect(formatCategory('admissions')).toBe('Admissions');
  });
});

describe('clamp', () => {
  it('returns value when within range', () => {
    expect(clamp(5, 1, 10)).toBe(5);
  });

  it('clamps to min', () => {
    expect(clamp(-5, 0, 10)).toBe(0);
  });

  it('clamps to max', () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });
});

describe('uid', () => {
  it('returns a non-empty string', () => {
    expect(uid().length).toBeGreaterThan(0);
  });

  it('returns unique values', () => {
    expect(uid()).not.toBe(uid());
  });
});
