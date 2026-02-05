// app/api/pledges/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

// Validation schema for pledge
const pledgeSchema = z.object({
  customerId: z.string().uuid(),
  pledgeDate: z.string().datetime(),
  loanAmount: z.number().positive('Loan amount must be positive'),
  itemType: z.enum(['GOLD', 'SILVER']),
  itemName: z.string().min(1, 'Item name is required'),
  purity: z.number().positive('Purity must be positive'),
  grossWeight: z.number().positive('Gross weight must be positive'),
  netWeight: z.number().positive('Net weight must be positive'),
  interestRate: z.number().positive('Interest rate must be positive'),
  compoundingDuration: z.enum(['MONTHLY', 'QUARTERLY', 'YEARLY']),
  remark: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkUserId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = pledgeSchema.parse(body);

    // Verify customer belongs to user
    const customer = await prisma.customer.findFirst({
      where: {
        id: validatedData.customerId,
        userId: user.id,
        deletedAt: null,
      },
    });

    if (!customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Validate net weight <= gross weight
    if (validatedData.netWeight > validatedData.grossWeight) {
      return NextResponse.json(
        { error: 'Net weight cannot be greater than gross weight' },
        { status: 400 }
      );
    }

    const pledge = await prisma.pledge.create({
      data: {
        customerId: validatedData.customerId,
        pledgeDate: new Date(validatedData.pledgeDate),
        loanAmount: validatedData.loanAmount,
        itemType: validatedData.itemType,
        itemName: validatedData.itemName,
        purity: validatedData.purity,
        grossWeight: validatedData.grossWeight,
        netWeight: validatedData.netWeight,
        interestRate: validatedData.interestRate,
        compoundingDuration: validatedData.compoundingDuration,
        remark: validatedData.remark,
        status: 'ACTIVE',
      },
      include: {
        customer: true,
      },
    });

    return NextResponse.json(
      { 
        success: true, 
        pledge,
        message: 'Pledge added successfully'
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

    console.error('Error creating pledge:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET all pledges for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();
    
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkUserId },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const pledges = await prisma.pledge.findMany({
      where: {
        customer: {
          userId: user.id,
          deletedAt: null,
        },
      },
      include: {
        customer: true,
      },
      orderBy: {
        pledgeDate: 'desc',
      },
    });

    return NextResponse.json({ pledges }, { status: 200 });

  } catch (error) {
    console.error('Error fetching pledges:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}