import { NextRequest, NextResponse } from 'next/server'
import { clerkClient } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase'

export async function DELETE(request: NextRequest) {
  try {
    const { userId, requestedBy, password } = await request.json()

    if (!userId || !requestedBy) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // 🔐 SECURITY: Verify password for destructive action
    if (password) {
      try {
        const { verified } = await clerkClient.users.verifyPassword({
          userId: requestedBy, // The admin doing the deleting
          password,
        })
        
        if (!verified) {
          return NextResponse.json(
            { error: 'Invalid password' },
            { status: 401 }
          )
        }
      } catch (error) {
        return NextResponse.json(
          { error: 'Invalid password' },
          { status: 401 }
        )
      }
    }

    // 🔐 SECURITY: Prevent deletion of admin accounts
    const { data: targetUser } = await supabase
      .from('users')
      .select('role, email, full_name')
      .eq('id', userId)
      .single()

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (targetUser.role === 'admin') {
      return NextResponse.json(
        { error: 'Cannot delete admin accounts' },
        { status: 403 }
      )
    }

    // Delete from Supabase
    const { error: supabaseError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId)

    if (supabaseError) {
      console.error('Supabase delete error:', supabaseError)
      return NextResponse.json(
        { error: 'Failed to delete user from database' },
        { status: 500 }
      )
    }

    // Delete from Clerk if they have a portal account
    if (targetUser.email) {
      try {
        const clerkUsers = await clerkClient.users.getUserList({
          emailAddress: [targetUser.email],
        })
        
        if (clerkUsers.data.length > 0) {
          await clerkClient.users.deleteUser(clerkUsers.data[0].id)
        }
      } catch (clerkError) {
        console.error('Clerk delete error:', clerkError)
        // Don't fail the whole operation if Clerk deletion fails
      }
    }

    return NextResponse.json(
      { message: 'User deleted successfully' },
      { status: 200 }
    )

  } catch (error: any) {
    console.error('=== ERROR DELETING USER ===')
    console.error('Error:', error.message)

    return NextResponse.json(
      { error: error.message || 'Failed to delete user' },
      { status: 500 }
    )
  }
}