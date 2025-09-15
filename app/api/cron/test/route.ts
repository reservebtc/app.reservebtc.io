import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'Test cron is working',
    timestamp: new Date().toISOString()
  });
}