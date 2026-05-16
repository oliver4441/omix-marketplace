import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const sections = await prisma.section.findMany()
    return NextResponse.json({ sections })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch sections' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name } = body

    const section = await prisma.section.create({
      data: { name },
    })

    return NextResponse.json({ message: 'Section created', section })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Section ID is required' }, { status: 400 })
    }

    const body = await request.json()
    const { name } = body

    const section = await prisma.section.update({
      where: { id: parseInt(id) },
      data: { name },
    })

    return NextResponse.json({ message: 'Section updated', section })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Section ID is required' }, { status: 400 })
    }

    await prisma.section.delete({
      where: { id: parseInt(id) },
    })

    return NextResponse.json({ message: 'Section deleted' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
