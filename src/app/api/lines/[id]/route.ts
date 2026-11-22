import { NextRequest, NextResponse } from 'next/server';
import { getLineById } from '@/lib/railway-data';


export async function GET(request: NextRequest) {
  try {
    const id = request.nextUrl.pathname.split('/').pop();
    if (!id) {
      return NextResponse.json({ error: 'Line id is required' }, { status: 400 });
    }

    const line = getLineById(id);
    if (!line) {
      return NextResponse.json({ error: 'Line not found' }, { status: 404 });
    }

    return NextResponse.json({ data: line });
  } catch (error) {
    console.error('Failed to get line:', error);
    return NextResponse.json({ error: 'Failed to retrieve line' }, { status: 500 });
  }
}
