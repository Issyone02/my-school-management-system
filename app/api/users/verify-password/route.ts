import { NextRequest, NextResponse } from 'next/server';
import { createClerkClient } from '@clerk/backend';

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { userId, password } = await request.json();

    if (!userId || !password) {
      return NextResponse.json(
        { error: 'User ID and password are required' },
        { status: 400 }
      );
    }

    // Verify password by attempting to create a session
    // This is a secure way to validate credentials without exposing them
    const { data: verification, errors } = await clerkClient.users.verifyPassword({
      userId,
      password,
    });

    if (errors && errors.length > 0) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Password verified',
    });

  } catch (error: any) {
    console.error('Password verification error:', error);
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    );
  }
}