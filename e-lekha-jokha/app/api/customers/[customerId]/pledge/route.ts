import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';
import { Prisma, ItemType, CompoundingDuration, PledgeStatus } from '@prisma/client';

/* =========================
   Validation Schema
========================= */
const pledgeSchema = z.object({
  pledgeDate: z.string().datetime(),
  loanAmount: z.number().positive(),

  itemType: z.nativeEnum(ItemType),
  itemName: z.string().min(1),

  purity: z.number().positive(),
  grossWeight: z.number().positive(),
  netWeight: z.number().positive(),

  interestRate: z.number().positive(),
  compoundingDuration: z.nativeEnum(CompoundingDuration),

  remark: z.string().optional(),
});

/* =========================
   POST → Add Pledge
========================= */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ customerId: string }> }
) {
  try {
    /* -------- UNWRAP PARAMS (REQUIRED IN NEW NEXT.JS) -------- */
    const { customerId } = await context.params;

    /* -------- AUTH -------- */
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    /* -------- USER -------- */
    const user = await prisma.user.findUnique({
      where: { clerkUserId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    /* -------- CUSTOMER OWNERSHIP CHECK -------- */
    const customer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        userId: user.id,
        deletedAt: null,
      },
      select: { id: true },
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found or access denied' },
        { status: 404 }
      );
    }

    /* -------- VALIDATION -------- */
    const body = await request.json();
    const data = pledgeSchema.parse(body);

    /* -------- CREATE PLEDGE -------- */
    const pledge = await prisma.pledge.create({
      data: {
        customerId: customer.id, // 🔑 RELATION LINK

        pledgeDate: new Date(data.pledgeDate),
        loanAmount: new Prisma.Decimal(data.loanAmount),

        itemType: data.itemType,
        itemName: data.itemName,

        purity: new Prisma.Decimal(data.purity),
        grossWeight: new Prisma.Decimal(data.grossWeight),
        netWeight: new Prisma.Decimal(data.netWeight),

        interestRate: new Prisma.Decimal(data.interestRate),
        compoundingDuration: data.compoundingDuration,

        remark: data.remark,
        status: PledgeStatus.ACTIVE,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Pledge added successfully',
        pledge,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('❌ ADD PLEDGE ERROR:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}