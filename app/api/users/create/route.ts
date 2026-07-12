import { NextRequest, NextResponse } from 'next/server';
import { createClerkClient } from '@clerk/backend';
import { createClient } from '@supabase/supabase-js';

const clerkClient = createClerkClient({
  secretKey: process.env.CLERK_SECRET_KEY,
});

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, fullName, role, phone } = body;

    if (!email || !fullName || !role) {
      return NextResponse.json(
        { error: 'Email, full name, and role are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('clerk_id')
      .eq('email', email)
      .single();

    if (existingUser?.clerk_id) {
      return NextResponse.json({
        success: true,
        clerkId: existingUser.clerk_id,
        message: 'User already exists',
      });
    }

    const tempPassword = `TempPass${Math.random().toString(36).slice(-8)}!`;

    const clerkUser = await clerkClient.users.createUser({
      emailAddress: [email],
      password: tempPassword,
      firstName: fullName.split(' ')[0],
      lastName: fullName.split(' ').slice(1).join(' ') || '',
      publicMetadata: { role: role },
    });

    const { data, error } = await supabase
      .from('users')
      .insert([{
        clerk_id: clerkUser.id,
        email: email,
        full_name: fullName,
        role: role,
        phone: phone || null,
        active: true,
        created_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) {
      await clerkClient.users.deleteUser(clerkUser.id);
      throw error;
    }

    return NextResponse.json({
      success: true,
      user: data,
      clerkId: clerkUser.id,
      message: 'User created! Check email for credentials.',
    });

  } catch (error: any) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create user' },
      { status: 500 }
    );
  }
}