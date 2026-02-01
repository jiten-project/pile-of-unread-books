import {
  formatDate,
  formatPublishedDate,
  formatPrice,
  parsePrice,
  getDaysSince,
  joinWithComma,
  getTimestamp,
  compareDates,
} from '../format';

describe('formatDate', () => {
  it('should return "-" for undefined', () => {
    expect(formatDate(undefined)).toBe('-');
  });

  it('should return "-" for empty string', () => {
    expect(formatDate('')).toBe('-');
  });

  it('should return "-" for invalid date', () => {
    expect(formatDate('invalid-date')).toBe('-');
  });

  it('should format ISO date string', () => {
    const result = formatDate('2024-01-15T00:00:00.000Z');
    expect(result).toMatch(/2024年1月15日/);
  });

  it('should format YYYY-MM-DD date string', () => {
    const result = formatDate('2024-06-20');
    expect(result).toMatch(/2024年6月20日/);
  });

  it('should handle date with time component', () => {
    const result = formatDate('2023-12-25T10:30:00');
    expect(result).toMatch(/2023年12月25日/);
  });
});

describe('formatPublishedDate', () => {
  it('should return "-" for undefined', () => {
    expect(formatPublishedDate(undefined)).toBe('-');
  });

  it('should return "-" for empty string', () => {
    expect(formatPublishedDate('')).toBe('-');
  });

  it('should return existing Japanese format as-is', () => {
    expect(formatPublishedDate('2024年1月')).toBe('2024年1月');
    expect(formatPublishedDate('2024年1月15日')).toBe('2024年1月15日');
  });

  it('should format YYYYMMDD format', () => {
    expect(formatPublishedDate('20240115')).toBe('2024年1月15日');
    expect(formatPublishedDate('20231201')).toBe('2023年12月1日');
  });

  it('should format YYYY-MM-DD format', () => {
    expect(formatPublishedDate('2024-01-15')).toBe('2024年1月15日');
    expect(formatPublishedDate('2023-12-01')).toBe('2023年12月1日');
  });

  it('should format YYYY/MM/DD format', () => {
    expect(formatPublishedDate('2024/01/15')).toBe('2024年1月15日');
    expect(formatPublishedDate('2023/12/01')).toBe('2023年12月1日');
  });

  it('should format YYYY-MM format', () => {
    expect(formatPublishedDate('2024-01')).toBe('2024年1月');
    expect(formatPublishedDate('2023-12')).toBe('2023年12月');
  });

  it('should format YYYY/MM format', () => {
    expect(formatPublishedDate('2024/01')).toBe('2024年1月');
    expect(formatPublishedDate('2023/12')).toBe('2023年12月');
  });

  it('should format YYYY format', () => {
    expect(formatPublishedDate('2024')).toBe('2024年');
    expect(formatPublishedDate('2023')).toBe('2023年');
  });

  it('should return unrecognized format as-is', () => {
    expect(formatPublishedDate('Jan 2024')).toBe('Jan 2024');
    expect(formatPublishedDate('不明')).toBe('不明');
  });

  it('should handle whitespace', () => {
    expect(formatPublishedDate('  2024-01-15  ')).toBe('2024年1月15日');
  });
});

describe('formatPrice', () => {
  it('should return "-" for undefined', () => {
    expect(formatPrice(undefined)).toBe('-');
  });

  it('should return "-" for null', () => {
    expect(formatPrice(null as unknown as number)).toBe('-');
  });

  it('should return "-" for NaN', () => {
    expect(formatPrice(NaN)).toBe('-');
  });

  it('should format integer price', () => {
    expect(formatPrice(1000)).toBe('¥1,000');
    expect(formatPrice(500)).toBe('¥500');
  });

  it('should format large price with commas', () => {
    expect(formatPrice(1234567)).toBe('¥1,234,567');
  });

  it('should format zero price', () => {
    expect(formatPrice(0)).toBe('¥0');
  });

  it('should handle decimal prices', () => {
    expect(formatPrice(1500.5)).toBe('¥1,500.5');
  });
});

describe('parsePrice', () => {
  it('should return undefined for empty string', () => {
    expect(parsePrice('')).toBeUndefined();
  });

  it('should return undefined for whitespace only', () => {
    expect(parsePrice('   ')).toBeUndefined();
  });

  it('should return undefined for NaN result', () => {
    expect(parsePrice('abc')).toBeUndefined();
  });

  it('should return undefined for negative values', () => {
    expect(parsePrice('-100')).toBeUndefined();
  });

  it('should parse valid integer string', () => {
    expect(parsePrice('1000')).toBe(1000);
    expect(parsePrice('500')).toBe(500);
  });

  it('should parse valid decimal string', () => {
    expect(parsePrice('1500.5')).toBe(1500.5);
  });

  it('should parse zero', () => {
    expect(parsePrice('0')).toBe(0);
  });
});

describe('getDaysSince', () => {
  it('should return 0 for today', () => {
    const today = new Date().toISOString();
    const days = getDaysSince(today);
    expect(days).toBe(0);
  });

  it('should return positive number for past date', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 10);
    const days = getDaysSince(pastDate.toISOString());
    expect(days).toBe(10);
  });

  it('should handle ISO date strings', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 5);
    const days = getDaysSince(pastDate.toISOString());
    expect(days).toBe(5);
  });
});

describe('joinWithComma', () => {
  it('should join array with comma and space', () => {
    expect(joinWithComma(['a', 'b', 'c'])).toBe('a, b, c');
  });

  it('should return single item without comma', () => {
    expect(joinWithComma(['single'])).toBe('single');
  });

  it('should return empty string for empty array', () => {
    expect(joinWithComma([])).toBe('');
  });

  it('should handle Japanese text', () => {
    expect(joinWithComma(['著者A', '著者B'])).toBe('著者A, 著者B');
  });
});

describe('getTimestamp', () => {
  it('should return 0 for undefined', () => {
    expect(getTimestamp(undefined)).toBe(0);
  });

  it('should return 0 for null', () => {
    expect(getTimestamp(null)).toBe(0);
  });

  it('should return 0 for empty string', () => {
    expect(getTimestamp('')).toBe(0);
  });

  it('should return 0 for invalid date', () => {
    expect(getTimestamp('invalid')).toBe(0);
  });

  it('should return timestamp for valid ISO date', () => {
    const timestamp = getTimestamp('2024-01-15T00:00:00.000Z');
    expect(timestamp).toBe(new Date('2024-01-15T00:00:00.000Z').getTime());
  });

  it('should return timestamp for YYYY-MM-DD format', () => {
    const timestamp = getTimestamp('2024-06-20');
    expect(timestamp).toBeGreaterThan(0);
  });
});

describe('compareDates', () => {
  it('should return 0 for same dates', () => {
    expect(compareDates('2024-01-15', '2024-01-15')).toBe(0);
  });

  it('should return negative for earlier date first (asc)', () => {
    expect(compareDates('2024-01-01', '2024-01-15', 'asc')).toBeLessThan(0);
  });

  it('should return positive for later date first (asc)', () => {
    expect(compareDates('2024-01-15', '2024-01-01', 'asc')).toBeGreaterThan(0);
  });

  it('should return positive for earlier date first (desc)', () => {
    expect(compareDates('2024-01-01', '2024-01-15', 'desc')).toBeGreaterThan(0);
  });

  it('should return negative for later date first (desc)', () => {
    expect(compareDates('2024-01-15', '2024-01-01', 'desc')).toBeLessThan(0);
  });

  it('should handle undefined values', () => {
    expect(compareDates(undefined, '2024-01-15')).toBeLessThan(0);
    expect(compareDates('2024-01-15', undefined)).toBeGreaterThan(0);
    expect(compareDates(undefined, undefined)).toBe(0);
  });

  it('should handle null values', () => {
    expect(compareDates(null, '2024-01-15')).toBeLessThan(0);
    expect(compareDates('2024-01-15', null)).toBeGreaterThan(0);
  });

  it('should default to ascending order', () => {
    const ascending = compareDates('2024-01-01', '2024-01-15');
    const explicitAsc = compareDates('2024-01-01', '2024-01-15', 'asc');
    expect(ascending).toBe(explicitAsc);
  });
});
