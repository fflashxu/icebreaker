import { prisma } from '../../lib/prisma';

export async function getStats() {
  const since = new Date();
  since.setDate(since.getDate() - 29);
  since.setHours(0, 0, 0, 0);

  const [users, totalGenerationsAgg, recentUsers] = await Promise.all([
    prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        generationLogs: { select: { count: true } },
      },
    }),
    prisma.generationLog.aggregate({ _sum: { count: true } }),
    prisma.user.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true },
    }),
  ]);

  const usersWithCount = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    createdAt: u.createdAt,
    generationCount: u.generationLogs.reduce((sum, log) => sum + log.count, 0),
  }));

  usersWithCount.sort((a, b) => b.generationCount - a.generationCount);

  // Group recent users by date string (YYYY-MM-DD)
  const countByDate: Record<string, number> = {};
  for (const u of recentUsers) {
    const date = u.createdAt.toISOString().slice(0, 10);
    countByDate[date] = (countByDate[date] ?? 0) + 1;
  }
  // Fill all 30 days (even zeros omitted — only include days with data)
  const dailyRegistrations = Object.entries(countByDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));

  return {
    totalUsers: users.length,
    totalGenerations: totalGenerationsAgg._sum.count ?? 0,
    users: usersWithCount,
    dailyRegistrations,
  };
}
