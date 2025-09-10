import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Get user from auth header
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const formData = await req.formData()
    const file = formData.get('file') as File
    const overwrite = new URL(req.url).searchParams.get('overwrite') === 'true'

    if (!file) {
      return new Response(
        JSON.stringify({ error: 'File is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      return new Response(
        JSON.stringify({ error: 'Only PDF files are allowed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate file size (50MB)
    const maxSize = 50 * 1024 * 1024
    if (file.size > maxSize) {
      return new Response(
        JSON.stringify({ error: 'File size exceeds 50MB limit' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Extract metadata from form
    const docType = formData.get('doc_type') as string
    const docNumber = formData.get('doc_number') as string
    const rev = formData.get('rev') as string
    const title = formData.get('title') as string
    const customer = formData.get('customer') as string
    const project = formData.get('project') as string
    const contractor = formData.get('contractor') as string
    const issueDate = formData.get('issue_date') as string
    const classification = formData.get('classification') as string
    const location = formData.get('location') as string

    // Parse arrays
    const disciplines = formData.get('disciplines') ? JSON.parse(formData.get('disciplines') as string) : []
    const norms = formData.get('norms') ? JSON.parse(formData.get('norms') as string) : []
    const figuresTables = formData.get('figures_tables') ? JSON.parse(formData.get('figures_tables') as string) : []
    const extra = formData.get('extra') ? JSON.parse(formData.get('extra') as string) : {}

    // Validate required fields
    if (!docType || !docNumber || !rev || !title) {
      return new Response(
        JSON.stringify({ error: 'doc_type, doc_number, rev, and title are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (docType !== 'especificacao_tecnica') {
      return new Response(
        JSON.stringify({ error: 'Invalid doc_type. Only especificacao_tecnica is supported' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Calculate checksum
    const fileBuffer = await file.arrayBuffer()
    const hashBuffer = await crypto.subtle.digest('SHA-256', fileBuffer)
    const hashArray = new Uint8Array(hashBuffer)
    const checksum = Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('')

    // Create storage path
    const storagePath = `${user.id}/especificacao_tecnica/${docNumber}/Rev_${rev}/file.pdf`

    // Check if document already exists
    const { data: existingDoc } = await supabase
      .from('documents')
      .select('*')
      .eq('doc_number', docNumber)
      .eq('rev', rev)
      .single()

    if (existingDoc && !overwrite) {
      return new Response(
        JSON.stringify({ error: 'Document already exists. Use ?overwrite=true to update' }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from('datalake-docs')
      .upload(storagePath, fileBuffer, {
        contentType: 'application/pdf',
        upsert: overwrite
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return new Response(
        JSON.stringify({ error: 'Failed to upload file' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Prepare document data
    const documentData = {
      doc_type: docType,
      doc_number: docNumber,
      rev,
      title,
      customer,
      project,
      contractor,
      issue_date: issueDate || null,
      classification,
      disciplines,
      norms,
      location,
      figures_tables: figuresTables,
      extra: {
        ...extra,
        upload_info: {
          original_filename: file.name,
          file_size: file.size,
          upload_timestamp: new Date().toISOString(),
          user_agent: req.headers.get('user-agent'),
        }
      },
      storage_path: storagePath,
      checksum_sha256: checksum,
      status: 'ingested' as const,
      uploader: user.id
    }

    // Insert or update document
    let result
    if (existingDoc) {
      result = await supabase
        .from('documents')
        .update(documentData)
        .eq('id', existingDoc.id)
        .select()
        .single()
    } else {
      result = await supabase
        .from('documents')
        .insert(documentData)
        .select()
        .single()
    }

    if (result.error) {
      console.error('Database error:', result.error)
      return new Response(
        JSON.stringify({ error: 'Failed to save document metadata' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        id: result.data.id,
        storage_path: storagePath,
        checksum_sha256: checksum,
        status: 'ingested'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})