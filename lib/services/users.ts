import { prisma } from "@/lib/prisma";

export async function getPrimaryUser() {
  try {
    return await prisma.user.findFirst({
      where: { isPrimary: true },
      orderBy: { updatedAt: "desc" },
    });
  } catch {
    return null;
  }
}

export async function getUserById(userId: string) {
  try {
    return await prisma.user.findUnique({
      where: { id: userId },
    });
  } catch {
    return null;
  }
}

export async function getAllUsers() {
  try {
    return await prisma.user.findMany({
      orderBy: [{ isPrimary: "desc" }, { totalSolved: "desc" }],
    });
  } catch {
    return [];
  }
}

export async function setPrimaryUser(input: {
  username: string;
  leetcodeSession?: string | null;
  leetcodeCsrfToken?: string | null;
}) {
  await prisma.user.updateMany({
    data: { isPrimary: false },
  });

  return prisma.user.upsert({
    where: { username: input.username },
    create: {
      username: input.username,
      displayName: input.username,
      isPrimary: true,
      leetcodeSession: input.leetcodeSession || null,
      leetcodeCsrfToken: input.leetcodeCsrfToken || null,
    },
    update: {
      displayName: input.username,
      isPrimary: true,
      leetcodeSession: input.leetcodeSession ?? null,
      leetcodeCsrfToken: input.leetcodeCsrfToken ?? null,
    },
  });
}
