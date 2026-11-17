/**
 * RoofDynamics - Australian Business Number (ABN) Validator
 * Implements the official ATO ABN checksum algorithm (modulus 89).
 * Optionally enriches with the ABR ABN Lookup web service when a GUID key
 * is configured, with deterministic offline fallback.
 */
import { env } from '../env'

export interface ABNValidationResult {
  abn: string;
  isValid: boolean;
  checksumValid: boolean;
  formatValid: boolean;
  entityName?: string;
  entityType?: string;
  status?: string;
  source: "checksum" | "abr-lookup";
  message: string;
}

const WEIGHTS = [10, 1, 3, 5, 7, 9, 11, 13, 15, 17, 19];

/**
 * Official ATO ABN checksum validation (modulus 89).
 * 1. Subtract 1 from the first digit.
 * 2. Multiply each digit by its weight.
 * 3. Sum the products.
 * 4. If the sum is divisible by 89, the ABN is valid.
 */
export function validateABNChecksum(abn: string): boolean {
  const clean = abn.replace(/\s/g, "");
  if (!/^\d{11}$/.test(clean)) return false;

  const digits = clean.split("").map(Number);
  digits[0] -= 1; // subtract 1 from first digit

  const sum = digits.reduce((acc, digit, i) => acc + digit * WEIGHTS[i], 0);
  return sum % 89 === 0;
}

/**
 * Validate ABN format only (11 digits after stripping spaces).
 */
export function validateABNFormat(abn: string): boolean {
  return /^\d{11}$/.test(abn.replace(/\s/g, ""));
}

/**
 * Look up ABN details from the ABR ABN Lookup web service.
 * Falls back to checksum validation when no GUID key is configured or
 * when the service is unreachable.
 */
export async function lookupABN(abn: string): Promise<ABNValidationResult> {
  const clean = abn.replace(/\s/g, "");
  const formatValid = validateABNFormat(clean);
  const checksumValid = validateABNChecksum(clean);
  const guid = env.ABR_GUID;

  const baseResult: ABNValidationResult = {
    abn: clean,
    isValid: formatValid && checksumValid,
    checksumValid,
    formatValid,
    source: "checksum",
    message: checksumValid
      ? "ABN checksum valid (offline verification)"
      : "ABN checksum invalid — failed modulus 89 verification",
  };

  if (!formatValid) {
    return { ...baseResult, message: "ABN must be 11 digits" };
  }

  // Enrich via ABR web service if a GUID is configured
  if (guid) {
    try {
      const url = `https://abr.business.gov.au/abrxmlsearch/ABNSearchWebService.asmx/AbnRetrievalXML?ABN=${clean}&guid=${guid}`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (response.ok) {
        const xml = await response.text();
        const nameMatch = xml.match(/<businessName>([^<]+)<\/businessName>/i);
        const typeMatch = xml.match(/<entityTypeName>([^<]+)<\/entityTypeName>/i);
        const statusMatch = xml.match(/<abnStatus>([^<]+)<\/abnStatus>/i);
        return {
          ...baseResult,
          isValid: checksumValid && (statusMatch ? /active/i.test(statusMatch[1]) : true),
          entityName: nameMatch?.[1],
          entityType: typeMatch?.[1],
          status: statusMatch?.[1],
          source: "abr-lookup",
          message: "ABN verified against ABR register",
        };
      }
    } catch {
      // Fall through to deterministic checksum result
    }
  }

  return baseResult;
}

/** Synchronous validation for hot paths */
export function isValidABN(abn: string): boolean {
  return validateABNFormat(abn) && validateABNChecksum(abn);
}
