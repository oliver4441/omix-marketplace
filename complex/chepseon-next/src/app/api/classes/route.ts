import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const classes = await prisma.myClass.findMany({
      include: { classType: true, section: true },
    })
    return NextResponse.json({ classes })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch classes' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, classTypeId, sectionId } = body

    const myClass = await prisma.myClass.create({
      data: { name, classTypeId, sectionId },
    })

    return NextResponse.json({ message: 'Class created', class: myClass })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
