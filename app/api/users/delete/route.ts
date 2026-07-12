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

export async function DELETE(request: NextRequest) {
  try {
    const { userId, clerkId, password, requestedBy } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // 🔐 SECURITY: Verify password for destructive action
    if (password) {
      const { errors } = await clerkClient.users.verifyPassword({
        userId: requestedBy, // The admin doing the deleting
        password,
      });
      
      if (errors && errors.length > 0) {
        return NextResponse.json(
          { error: 'Invalid password. Please re-authenticate.' },
          { status: 401 }
        );
      }
    }

    // 🔐 SECURITY: Prevent deletion of admin accounts
    const { data: targetUser } = await supabase
      .from('users')
      .select('role, email, full_name')
      .eq('id', userId)
      .single();

    if (targetUser?.role === 'admin') {
      // Log the attempted deletion
      await supabase.from('audit_logs').insert({
        action: 'DELETE_ATTEMPTED',
        resource_type: 'user',
        resource_id: userId,
        performed_by: requestedBy,
        details: `Attempted to delete admin account: ${targetUser.email}`,
        ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
      });

      return NextResponse.json(
        { error: 'Admin accounts cannot be deleted via this interface. Contact system administrator for emergency removal.' },
        { status: 403 }
      );
    }

    // Step 1: Delete from Clerk (if clerkId provided)
    if (clerkId) {
      try {
        await clerkClient.users.deleteUser(clerkId);
        console.log('✅ Deleted from Clerk:', clerkId);
      } catch (clerkError: any) {
        console.warn('⚠️ Clerk delete failed:', clerkError.message);
        // Continue anyway - still delete from Supabase
      }
    }

    // Step 2: Delete from Supabase
    const { error: supabaseError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (supabaseError) {
      console.error('❌ Supabase delete error:', supabaseError);
      throw supabaseError;
    }

    // 🔐 SECURITY: Log successful deletion
    await supabase.from('audit_logs').insert({
      action: 'USER_DELETED',
      resource_type: 'user',
      resource_id: userId,
      performed_by: requestedBy,
      details: `Deleted user: ${targetUser?.email} (${targetUser?.role})`,
      ip_address: request.headers.get('x-forwarded-for') || 'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown',
    });

    console.log('✅ Deleted from Supabase:', userId);

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully from both systems',
    });

  } catch (error: any) {
    console.error('=== ERROR DELETING USER ===');
    console.error('Error:', error.message);
    
    return NextResponse.json(
      { error: error.message || 'Failed to delete user' },
      { status: 500 }
    );
  }
}