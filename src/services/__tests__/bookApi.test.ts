import { isValidISBN, cleanAndValidateISBN } from '../bookApi';

describe('isValidISBN', () => {
  describe('ISBN-10 validation', () => {
    it('should validate correct ISBN-10', () => {
      // Real valid ISBN-10s
      expect(isValidISBN('0306406152')).toBe(true);
      expect(isValidISBN('0201633612')).toBe(true);
    });

    it('should validate ISBN-10 with X check digit', () => {
      expect(isValidISBN('155860832X')).toBe(true);
      expect(isValidISBN('080442957X')).toBe(true);
    });

    it('should validate ISBN-10 with lowercase x', () => {
      expect(isValidISBN('155860832x')).toBe(true);
    });

    it('should validate ISBN-10 with hyphens', () => {
      expect(isValidISBN('0-306-40615-2')).toBe(true);
      expect(isValidISBN('0-201-63361-2')).toBe(true);
    });

    it('should validate ISBN-10 with spaces', () => {
      expect(isValidISBN('0 306 40615 2')).toBe(true);
    });

    it('should reject invalid ISBN-10 with wrong check digit', () => {
      expect(isValidISBN('0306406153')).toBe(false); // Wrong check digit
      expect(isValidISBN('0306406151')).toBe(false);
    });

    it('should reject ISBN-10 with non-numeric characters', () => {
      expect(isValidISBN('030640615A')).toBe(false);
      expect(isValidISBN('O306406152')).toBe(false); // O instead of 0
    });

    it('should reject ISBN-10 with wrong length', () => {
      expect(isValidISBN('030640615')).toBe(false); // 9 digits
      expect(isValidISBN('03064061521')).toBe(false); // 11 digits
    });
  });

  describe('ISBN-13 validation', () => {
    it('should validate correct ISBN-13', () => {
      // Real valid ISBN-13s
      expect(isValidISBN('9780306406157')).toBe(true);
      expect(isValidISBN('9784873119038')).toBe(true); // Japanese book
    });

    it('should validate ISBN-13 with hyphens', () => {
      expect(isValidISBN('978-0-306-40615-7')).toBe(true);
      expect(isValidISBN('978-4-87311-903-8')).toBe(true);
    });

    it('should validate ISBN-13 with spaces', () => {
      expect(isValidISBN('978 0 306 40615 7')).toBe(true);
    });

    it('should reject invalid ISBN-13 with wrong check digit', () => {
      expect(isValidISBN('9780306406158')).toBe(false); // Wrong check digit
      expect(isValidISBN('9780306406156')).toBe(false);
    });

    it('should reject ISBN-13 with non-numeric characters', () => {
      expect(isValidISBN('978030640615X')).toBe(false);
      expect(isValidISBN('978O306406157')).toBe(false); // O instead of 0
    });

    it('should reject ISBN-13 with wrong length', () => {
      expect(isValidISBN('978030640615')).toBe(false); // 12 digits
      expect(isValidISBN('97803064061577')).toBe(false); // 14 digits
    });
  });

  describe('edge cases', () => {
    it('should reject empty string', () => {
      expect(isValidISBN('')).toBe(false);
    });

    it('should reject random strings', () => {
      expect(isValidISBN('abc')).toBe(false);
      expect(isValidISBN('not-an-isbn')).toBe(false);
    });

    it('should reject partially valid ISBNs', () => {
      expect(isValidISBN('1234567890')).toBe(false); // Wrong check digit
      expect(isValidISBN('1234567890123')).toBe(false);
    });
  });
});

describe('cleanAndValidateISBN', () => {
  it('should return cleaned ISBN-10 for valid input', () => {
    expect(cleanAndValidateISBN('0-306-40615-2')).toBe('0306406152');
    expect(cleanAndValidateISBN('0 306 40615 2')).toBe('0306406152');
  });

  it('should return cleaned ISBN-13 for valid input', () => {
    expect(cleanAndValidateISBN('978-0-306-40615-7')).toBe('9780306406157');
    expect(cleanAndValidateISBN('978 0 306 40615 7')).toBe('9780306406157');
  });

  it('should handle ISBN-10 with X', () => {
    expect(cleanAndValidateISBN('155860832X')).toBe('155860832X');
    expect(cleanAndValidateISBN('1-558-60832-X')).toBe('155860832X');
  });

  it('should return null for invalid ISBN format', () => {
    expect(cleanAndValidateISBN('123')).toBeNull();
    expect(cleanAndValidateISBN('12345')).toBeNull();
    expect(cleanAndValidateISBN('123456789012345')).toBeNull();
  });

  it('should return null for non-numeric characters', () => {
    expect(cleanAndValidateISBN('123456789A')).toBeNull();
    expect(cleanAndValidateISBN('abcdefghij')).toBeNull();
  });

  it('should return null for empty string', () => {
    expect(cleanAndValidateISBN('')).toBeNull();
  });

  it('should strip hyphens and spaces only', () => {
    expect(cleanAndValidateISBN('978-4873119038')).toBe('9784873119038');
    expect(cleanAndValidateISBN('978 4873119038')).toBe('9784873119038');
  });
});
