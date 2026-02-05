import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ customerId: string }> }
) {
  try {
    const { customerId } = await context.params;

    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { clerkUserId },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const customer = await prisma.customer.findFirst({
      where: {
        id: customerId,
        userId: user.id,
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        mobile: true,
        address: true,
        aadharNo: true,
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    // ✅ SAFE LOGGING (no confusion)
    console.log('Fetched customer:', JSON.stringify(customer, null, 2));

    return NextResponse.json({ customer }, { status: 200 });
  } catch (error) {
    console.error('GET CUSTOMER ERROR:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
