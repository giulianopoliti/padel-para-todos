import { NextRequest, NextResponse } from 'next/server'
import { getClubesWithServices } from '@/app/api/users'

export async function GET(request: NextRequest) {
  try {
    const clubes = await getClubesWithServices()
    return NextResponse.json(clubes)
  } catch (error) {
    console.error('Error fetching clubes:', error)
    return NextResponse.json({ error: 'Error fetching clubes' }, { status: 500 })
  }
} 