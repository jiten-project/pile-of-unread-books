import { getMaturityLevel, calculateTsundokuDays } from '../getMaturityRank';

describe('getMaturityLevel', () => {
  it('should return 新酒 for 0 days', () => {
    const level = getMaturityLevel(0);
    expect(level.id).toBe('shinshu');
    expect(level.name).toBe('新酒');
  });

  it('should return 新酒 for 30 days', () => {
    const level = getMaturityLevel(30);
    expect(level.id).toBe('shinshu');
  });

  it('should return 若酒 for 31 days', () => {
    const level = getMaturityLevel(31);
    expect(level.id).toBe('wakashu');
    expect(level.name).toBe('若酒');
  });

  it('should return 若酒 for 90 days', () => {
    const level = getMaturityLevel(90);
    expect(level.id).toBe('wakashu');
  });

  it('should return 熟成酒 for 91 days', () => {
    const level = getMaturityLevel(91);
    expect(level.id).toBe('jukuseishu');
    expect(level.name).toBe('熟成酒');
  });

  it('should return 熟成酒 for 180 days', () => {
    const level = getMaturityLevel(180);
    expect(level.id).toBe('jukuseishu');
  });

  it('should return ヴィンテージ for 181 days', () => {
    const level = getMaturityLevel(181);
    expect(level.id).toBe('vintage');
    expect(level.name).toBe('ヴィンテージ');
  });

  it('should return ヴィンテージ for 365 days', () => {
    const level = getMaturityLevel(365);
    expect(level.id).toBe('vintage');
  });

  it('should return プレミアム for 366 days', () => {
    const level = getMaturityLevel(366);
    expect(level.id).toBe('premium');
    expect(level.name).toBe('プレミアム');
  });

  it('should return プレミアム for 3 years (1095 days)', () => {
    const level = getMaturityLevel(365 * 3);
    expect(level.id).toBe('premium');
  });

  it('should return 秘蔵酒 for 3 years + 1 day', () => {
    const level = getMaturityLevel(365 * 3 + 1);
    expect(level.id).toBe('hizoushu');
    expect(level.name).toBe('秘蔵酒');
  });

  it('should return 秘蔵酒 for 5 years', () => {
    const level = getMaturityLevel(365 * 5);
    expect(level.id).toBe('hizoushu');
  });

  it('should return 伝説の銘酒 for 5 years + 1 day', () => {
    const level = getMaturityLevel(365 * 5 + 1);
    expect(level.id).toBe('densetsu');
    expect(level.name).toBe('伝説の銘酒');
  });

  it('should return 伝説の銘酒 for 10 years', () => {
    const level = getMaturityLevel(365 * 10);
    expect(level.id).toBe('densetsu');
  });

  it('should return 幻の逸品 for 10 years + 1 day', () => {
    const level = getMaturityLevel(365 * 10 + 1);
    expect(level.id).toBe('maboroshi');
    expect(level.name).toBe('幻の逸品');
  });

  it('should return 幻の逸品 for very large number of days', () => {
    const level = getMaturityLevel(10000);
    expect(level.id).toBe('maboroshi');
  });

  it('should have correct icons for each level', () => {
    expect(getMaturityLevel(0).icon).toBe('🍶');
    expect(getMaturityLevel(50).icon).toBe('🫗');
    expect(getMaturityLevel(100).icon).toBe('🍷');
    expect(getMaturityLevel(200).icon).toBe('🥃');
    expect(getMaturityLevel(400).icon).toBe('✨');
    expect(getMaturityLevel(1200).icon).toBe('🏺');
    expect(getMaturityLevel(2000).icon).toBe('🌟');
    expect(getMaturityLevel(4000).icon).toBe('👑');
  });
});

describe('calculateTsundokuDays', () => {
  it('should use purchaseDate when provided', () => {
    const now = new Date();
    const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);
    const createdAt = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString();

    const days = calculateTsundokuDays(tenDaysAgo.toISOString(), createdAt);
    expect(days).toBe(10);
  });

  it('should use createdAt when purchaseDate is null', () => {
    const now = new Date();
    const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);

    const days = calculateTsundokuDays(null, fiveDaysAgo.toISOString());
    expect(days).toBe(5);
  });

  it('should use createdAt when purchaseDate is undefined', () => {
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

    const days = calculateTsundokuDays(undefined, threeDaysAgo.toISOString());
    expect(days).toBe(3);
  });

  it('should return 0 for today', () => {
    const now = new Date().toISOString();
    const days = calculateTsundokuDays(now, now);
    expect(days).toBe(0);
  });

  it('should handle large time differences', () => {
    const now = new Date();
    const twoYearsAgo = new Date(now.getTime() - 730 * 24 * 60 * 60 * 1000);

    const days = calculateTsundokuDays(twoYearsAgo.toISOString(), now.toISOString());
    expect(days).toBe(730);
  });
});
