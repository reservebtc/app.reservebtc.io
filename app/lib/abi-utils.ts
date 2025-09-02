import { parseAbiItem } from 'viem';

/**
 * Convert string-based ABI format to viem-compatible object format
 * This adapter allows us to use existing tested ABI definitions with viem
 */
export function parseStringAbi(stringAbi: readonly string[]) {
  return stringAbi.map(item => {
    try {
      return parseAbiItem(item);
    } catch (e) {
      console.warn('Failed to parse ABI item:', item, e);
      return null;
    }
  }).filter(Boolean);
}

// Cache for converted ABIs to avoid re-parsing
const abiCache = new Map<string, any[]>();

/**
 * Get viem-compatible ABI from string array format
 * Uses caching to improve performance
 */
export function getOracleAbi(stringAbi: readonly string[]): any[] {
  const cacheKey = stringAbi.join('|');
  
  if (!abiCache.has(cacheKey)) {
    abiCache.set(cacheKey, parseStringAbi(stringAbi));
  }
  
  return abiCache.get(cacheKey)!;
}

/**
 * Convert all contract ABIs to viem format
 * This maintains compatibility with existing tested code
 */
export function convertContractAbis(abis: Record<string, readonly string[]>): Record<string, any[]> {
  const converted: Record<string, any[]> = {};
  
  for (const [key, value] of Object.entries(abis)) {
    converted[key] = getOracleAbi(value);
  }
  
  return converted;
}