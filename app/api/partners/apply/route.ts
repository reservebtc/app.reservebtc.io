// app/api/partners/apply/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const ENCRYPTION_KEY = process.env.PARTNER_ENCRYPTION_KEY || 'secure-key-for-production-must-be-32-bytes-long!'

function encryptData(data: string): string {
  try {
    const algorithm = 'aes-256-cbc'
    const key = crypto.scryptSync(ENCRYPTION_KEY, 'salt', 32)
    const iv = crypto.randomBytes(16)
    
    const cipher = crypto.createCipheriv(algorithm, key, iv)
    let encrypted = cipher.update(data, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    return iv.toString('hex') + ':' + encrypted
  } catch (error) {
    // Fallback to base64 encoding
    return Buffer.from(data).toString('base64')
  }
}

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase configuration missing')
  }
  
  return createClient(supabaseUrl, supabaseKey)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { protocol, contact, tvl, description } = body

    // Validate input
    if (!protocol || !contact || !tvl || !description) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(contact)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Generate unique ID
    const applicationId = crypto.randomBytes(16).toString('hex')

    // Prepare data matching exact table structure
    const applicationData = {
      id: applicationId,
      protocol: encryptData(protocol),
      contact: encryptData(contact),
      tvl: encryptData(tvl),
      description: encryptData(description),
      status: 'pending',
      created_at: new Date().toISOString()
    }

    try {
      const supabase = getSupabaseClient()
      
      // Insert into partner_applications table
      const { data, error } = await supabase
        .from('partner_applications')
        .insert(applicationData)
        .select('id, status, created_at')
        .single()

      if (error) {
        console.error('Supabase error details:', {
          message: error.message,
          code: error.code,
          details: error.details
        })
        throw error
      }

      console.log('Application saved successfully:', {
        id: data.id,
        status: data.status
      })

      return NextResponse.json({
        success: true,
        message: 'Application submitted successfully',
        applicationId: data.id
      })

    } catch (dbError: any) {
      console.error('Database error:', dbError)
      
      // Log but don't expose database errors to client
      return NextResponse.json({
        success: false,
        error: 'Failed to save application. Please try again.',
        applicationId: applicationId // Still return ID for reference
      }, { status: 500 })
    }

  } catch (error: any) {
    console.error('Application processing error:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to submit application. Please try again later.',
        success: false 
      },
      { status: 500 }
    )
  }
}