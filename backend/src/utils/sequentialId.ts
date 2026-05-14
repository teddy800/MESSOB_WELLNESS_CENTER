/**
 * Sequential ID Generator
 * Generates user-friendly sequential IDs like 0001, 0002, etc.
 * These IDs are used as the userId field for all users.
 */

import { prisma } from '../config/prisma';

/**
 * Generate the next sequential display ID for a user (userId)
 * Format: 4-digit zero-padded number (e.g., "0001", "0042", "1234")
 * 
 * @returns Promise<string> The next sequential userId
 */
export async function generateNextDisplayId(): Promise<string> {
  try {
    // Use PostgreSQL sequence to get next ID atomically
    const result = await prisma.$queryRaw<Array<{ nextval: bigint }>>`
      SELECT nextval('user_display_id_seq') as nextval
    `;
    
    const nextId = Number(result[0].nextval);
    
    // Format as 4-digit zero-padded string
    return nextId.toString().padStart(4, '0');
  } catch (error) {
    console.error('Error generating sequential ID:', error);
    throw new Error('Failed to generate display ID');
  }
}

/**
 * Format a display ID for UI presentation
 * Adds prefix or formatting as needed
 * 
 * @param displayId The sequential userId
 * @returns Formatted display ID
 */
export function formatDisplayId(displayId: string): string {
  // Currently just returns the ID as-is
  // Can be extended to add prefixes like "PT-0001" for patients, "ST-0001" for staff
  return displayId;
}

/**
 * Parse and validate a display ID (userId)
 * 
 * @param displayId The userId to validate
 * @returns boolean True if valid
 */
export function isValidDisplayId(displayId: string): boolean {
  // Check if it's a 4-digit number (with leading zeros)
  return /^\d{4}$/.test(displayId);
}
