import { NextRequest, NextResponse } from 'next/server';
import { AVAILABLE_SCHEDULES } from '@/features/timetables/timetable-dataset';

// GET /api/timetables/versions
export async function GET() {
  try {
    return NextResponse.json({
      data: AVAILABLE_SCHEDULES.map((s) => ({
        version: s.version,
        label: s.label,
        sourceType: s.sourceType,
        attribution: s.attribution,
        isSynthetic: s.isSynthetic,
      })),
    });
  } catch (error) {
    console.error('Failed to get timetable versions:', error);
    return NextResponse.json({ error: 'Failed to retrieve timetable versions' }, { status: 500 });
  }
}
