import { NextRequest, NextResponse } from 'next/server'
import { clerkClient } from '@clerk/nextjs/server'

export async function POST(request: NextRequest) {
  try {
    const { userId, password } = await request.json()

    if (!userId || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify password using Clerk API
    const clerk = await clerkClient()
    const { verified } = await clerk.users.verifyPassword({
      userId,
      password,
    })

    if (!verified) {
      return NextResponse.json(
        { error: 'Invalid password' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { verified: true },
      { status: 200 }
    )

  } catch (error: any) {
    console.error('=== ERROR VERIFYING PASSWORD ===')
    console.error('Error:', error.message)

    return NextResponse.json(
      { error: error.message || 'Failed to verify password' },
      { status: 500 }
    )
  }
}