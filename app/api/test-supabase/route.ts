import { NextResponse } from 'next/server';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ 
      error: 'Supabase not configured',
      hasUrl: !!supabaseUrl,
      hasKey: !!supabaseKey 
    }, { status: 500 });
  }

  try {
    // Test connection by fetching users count
    const response = await fetch(
      `${supabaseUrl}/rest/v1/users?select=*`,
      {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Range': '0-0',
          'Prefer': 'count=exact'
        }
      }
    );

    const contentRange = response.headers.get('content-range');
    const data = await response.json();
    
    return NextResponse.json({
      success: true,
      status: response.status,
      userCount: contentRange ? contentRange.split('/')[1] : 'unknown',
      data: data
    });
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message 
    }, { status: 500 });
  }
}