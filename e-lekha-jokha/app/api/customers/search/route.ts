// BACKEND: app/api/customers/search/route.ts
import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

type CustomerWithPledges = {
  id: string;
  name: string;
  pledges: { itemName: string; createdAt: Date }[];
};

export async function GET(req: Request) {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkUserId }, select: { id: true } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("q")?.trim() || "";
    const filter = searchParams.get("filter") || "all";
    const pledgeStatus = searchParams.get("status") || "";

    const whereClause: any = {
      userId: user.id,
      deletedAt: null,
    };

    if (search) {
      if (filter === "name") {
        whereClause.name = { contains: search, mode: "insensitive" };
      } else if (filter === "address") {
        whereClause.address = { contains: search, mode: "insensitive" };
      } else if (filter === "itemName") {
        whereClause.pledges = {
          some: {
            itemName: { contains: search, mode: "insensitive" },
            ...(pledgeStatus ? { status: pledgeStatus } : {}),
          },
        };
      } else if (filter === "all") {
        whereClause.OR = [
          { name: { contains: search, mode: "insensitive" } },
          { address: { contains: search, mode: "insensitive" } },
          {
            pledges: {
              some: {
                itemName: { contains: search, mode: "insensitive" },
                ...(pledgeStatus ? { status: pledgeStatus } : {}),
              },
            },
          },
        ];
      }
    }

    const customers = await prisma.customer.findMany({
      where: whereClause,
      include: {
        pledges: {
          where: pledgeStatus ? { status: pledgeStatus } : {},
          select: { itemName: true, createdAt: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

   const result = (customers as CustomerWithPledges[]).map((cust) => {
  const sortedPledges = [...cust.pledges].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
  );

      return {
        id: cust.id,
        name: cust.name,
        pledgeCount: cust.pledges.length,
        latestItem: sortedPledges[0]?.itemName || null,
      };
    });

    return NextResponse.json({ customers: result });
  } catch (err) {
    console.error("CUSTOMER SEARCH ERROR:", err);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
