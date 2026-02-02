export const runtime = "nodejs";

import { Webhook } from "svix";
import { headers } from "next/headers";
import { WebhookEvent } from "@clerk/nextjs/server";
import { createClerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

const clerk = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY!,
});

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;
  if (!WEBHOOK_SECRET) {
    console.error("WEBHOOK_SECRET missing");
    return new Response("OK", { status: 200 });
  }

  const body = await req.text();
  const headerList = await headers();

  const svixId = headerList.get("svix-id");
  const svixTimestamp = headerList.get("svix-timestamp");
  const svixSignature = headerList.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return new Response("OK", { status: 200 });
  }

  const wh = new Webhook(WEBHOOK_SECRET);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(body, {
      "svix-id": svixId,
      "svix-timestamp": svixTimestamp,
      "svix-signature": svixSignature,
    }) as WebhookEvent;
  } catch (err) {
    console.error("Webhook verification failed:", err);
    return new Response("OK", { status: 200 });
  }

  /* =========================
     USER CREATED
  ========================== */
  if (evt.type === "user.created") {
    const user = evt.data;

    const username =
      user.username ||
      (user.unsafe_metadata as any)?.username ||
      `user_${user.id.slice(0, 8)}`; // ✅ fallback

    const email = user.email_addresses?.[0]?.email_address ?? "";
    const phone =
      user.phone_numbers?.[0]?.phone_number ||
      (user.unsafe_metadata as any)?.mobile ||
      null;

    const shopName = (user.unsafe_metadata as any)?.shopName ?? "My Shop";
    const address = (user.unsafe_metadata as any)?.address ?? "";

    try {
      const dbUser = await prisma.user.upsert({
        where: { clerkUserId: user.id },
        update: {
          username,
          email,
          mobile: phone,
        },
        create: {
          clerkUserId: user.id,
          username,
          email,
          mobile: phone,
          shopName,
          address,
          isActive: true,
        },
      });

      await clerk.users.updateUser(user.id, {
        publicMetadata: {
          dbUserId: dbUser.id,
          role: "owner",
        },
      });
    } catch (err) {
      console.error("DB sync failed:", err);
      // ❗ DO NOT FAIL THE WEBHOOK
    }
  }

  /* =========================
     USER DELETED
  ========================== */
  if (evt.type === "user.deleted") {
    try {
      await prisma.user.update({
        where: { clerkUserId: evt.data.id },
        data: {
          isActive: false,
          deletedAt: new Date(),
        },
      });
    } catch (err) {
      console.error("Delete sync failed:", err);
    }
  }

  return new Response("OK", { status: 200 });
}
