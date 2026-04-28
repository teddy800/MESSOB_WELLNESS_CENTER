import { prisma } from "../config/prisma";

/**
 * Get all unique regions from centers
 */
export async function getRegions() {
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

  return centers.map((c) => c.region);
}

/**
 * Get all active centers, optionally filtered by region
 */
export async function getCenters(region?: string) {
  return prisma.center.findMany({
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
}
