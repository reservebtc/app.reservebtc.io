// API endpoint for fetching user balance history
import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const db = new Pool({
  connectionString: process.env.DATABASE_URL
});

export async function GET(
  request: NextRequest,
  { params }: { params: { address: string, token: string } }
) {
  try {
    const { address, token } = params;
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || '30d'; // 24h, 7d, 30d, all

    let timeFilter = '';
    switch(period) {
      case '24h':
        timeFilter = "AND snapshot_timestamp > NOW() - INTERVAL '24 hours'";
        break;
      case '7d':
        timeFilter = "AND snapshot_timestamp > NOW() - INTERVAL '7 days'";
        break;
      case '30d':
        timeFilter = "AND snapshot_timestamp > NOW() - INTERVAL '30 days'";
        break;
    }

    const result = await db.query(
      `SELECT * FROM balance_snapshots 
       WHERE user_address = $1 AND token_type = $2 ${timeFilter}
       ORDER BY snapshot_timestamp DESC
       LIMIT 1000`,
      [address.toLowerCase(), token.toLowerCase()]
    );

    return NextResponse.json({
      snapshots: result.rows,
      address: address,
      token: token
    });
  } catch (error) {
    console.error('Error fetching balance history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch balance history' },
      { status: 500 }
    );
  }
}