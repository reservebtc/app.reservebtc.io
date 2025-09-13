// API endpoint for fetching user transactions with pagination
import { NextRequest, NextResponse } from 'next/server';
import { Pool } from 'pg';

const db = new Pool({
  connectionString: process.env.DATABASE_URL
});

export async function GET(
  request: NextRequest,
  { params }: { params: { address: string } }
) {
  try {
    const { address } = params;
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    // Get total count
    const countResult = await db.query(
      'SELECT COUNT(*) FROM transactions WHERE user_address = $1',
      [address.toLowerCase()]
    );
    const totalCount = parseInt(countResult.rows[0].count);

    // Get transactions
    const result = await db.query(
      `SELECT * FROM transactions 
       WHERE user_address = $1 
       ORDER BY block_timestamp DESC 
       LIMIT $2 OFFSET $3`,
      [address.toLowerCase(), limit, offset]
    );

    return NextResponse.json({
      transactions: result.rows,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    );
  }
}