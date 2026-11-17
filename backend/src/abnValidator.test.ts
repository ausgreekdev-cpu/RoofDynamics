import {
  validateABNChecksum,
  validateABNFormat,
  isValidABN,
  lookupABN,
} from './utils/abnValidator'

describe('ABN Validator (ATO modulus 89)', () => {
  describe('validateABNFormat', () => {
    it('accepts 11 digits without spaces', () => {
      expect(validateABNFormat('51824753556')).toBe(true)
    })

    it('accepts 11 digits with spaces', () => {
      expect(validateABNFormat('51 824 753 556')).toBe(true)
    })

    it('rejects fewer than 11 digits', () => {
      expect(validateABNFormat('1234567890')).toBe(false)
    })

    it('rejects non-numeric characters', () => {
      expect(validateABNFormat('51 824 753 55a')).toBe(false)
    })
  })

  describe('validateABNChecksum', () => {
    it('accepts the known valid ATO ABN 51 824 753 556', () => {
      expect(validateABNChecksum('51 824 753 556')).toBe(true)
    })

    it('accepts other valid ABNs', () => {
      expect(validateABNChecksum('71902294131')).toBe(true)
      expect(validateABNChecksum('78961183673')).toBe(true)
      expect(validateABNChecksum('64710276773')).toBe(true)
    })

    it('rejects an invalid checksum ABN', () => {
      expect(validateABNChecksum('12 345 678 901')).toBe(false)
    })

    it('rejects malformed input', () => {
      expect(validateABNChecksum('12345')).toBe(false)
    })
  })

  describe('isValidABN', () => {
    it('combines format and checksum validation', () => {
      expect(isValidABN('51 824 753 556')).toBe(true)
      expect(isValidABN('12 345 678 901')).toBe(false)
      expect(isValidABN('abc')).toBe(false)
    })
  })

  describe('lookupABN', () => {
    it('returns a deterministic checksum result for a valid ABN', async () => {
      const result = await lookupABN('51 824 753 556')
      expect(result.isValid).toBe(true)
      expect(result.checksumValid).toBe(true)
      expect(result.abn).toBe('51824753556')
      expect(result.source).toBe('checksum')
    })

    it('returns invalid for a bad checksum', async () => {
      const result = await lookupABN('12 345 678 901')
      expect(result.isValid).toBe(false)
      expect(result.checksumValid).toBe(false)
      expect(result.message).toContain('checksum invalid')
    })

    it('reports format errors', async () => {
      const result = await lookupABN('12345')
      expect(result.formatValid).toBe(false)
      expect(result.message).toContain('11 digits')
    })
  })
})
