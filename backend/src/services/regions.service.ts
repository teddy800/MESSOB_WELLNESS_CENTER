import { prisma } from "../config/prisma";

/**
 * Get all unique regions from centers
 */
export async function getRegions() {
  try {
    const centers = await prisma.center.findMany({
      where: {
        status: "ACTIVE",
      },
      select: {
        region: true,
      },
      distinct: ["region"],
      orderBy: {
        region: "asc",
      },
    });

    const regions = centers.map((c) => c.region).filter(Boolean);
    console.log('✓ Regions fetched:', regions);
    return regions;
  } catch (error) {
    console.error('Error fetching regions:', error);
    throw error;
  }
}

/**
 * Get all active centers, optionally filtered by region
 */
export async function getCenters(region?: string) {
  try {
    console.log('Querying centers with region filter:', region || 'none');
    const centers = await prisma.center.findMany({
      where: {
        status: "ACTIVE",
        ...(region && { region }),
      },
      select: {
        id: true,
        name: true,
        code: true,
        region: true,
        city: true,
        address: true,
        phone: true,
        email: true,
        capacity: true,
      },
      orderBy: [
        { region: "asc" },
        { name: "asc" },
      ],
    });
    console.log(`✓ Found ${centers.length} centers`);
    return centers;
  } catch (error) {
    console.error('Error fetching centers:', error);
    throw error;
  }
}
