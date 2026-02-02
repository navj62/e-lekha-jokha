"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { Gender } from "@prisma/client";

export async function completeOnboarding(data: {
  shopName: string;
  address: string;
  gender: Gender;
}) {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const client = await clerkClient();
  const clerkUser = await client.users.getUser(userId);

  const dbUserId = clerkUser.privateMetadata.dbUserId as string;
  if (!dbUserId) {
    throw new Error("DB user not linked");
  }

  await prisma.user.update({
    where: { id: dbUserId },
    data: {
      shopName: data.shopName,
      address: data.address,
      gender: data.gender,
    },
  });
}
