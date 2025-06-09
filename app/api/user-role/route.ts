import { NextRequest, NextResponse } from 'next/server'
import { getUserRole } from '@/app/api/users'

export async function GET(request: NextRequest) {
  try {
    const role = await getUserRole()
    return NextResponse.json({ role })
  } catch (error) {
    console.log('User not authenticated')
    return NextResponse.json({ role: null }, { status: 401 })
  }
} 