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

    const url = new URL(req.url)
    const path = url.pathname

    // GET /docs/search
    if (path === '/docs/search' && req.method === 'GET') {
      const docType = url.searchParams.get('doc_type')
      const docNumber = url.searchParams.get('doc_number')
      const rev = url.searchParams.get('rev')
      const issueDateFrom = url.searchParams.get('issue_date_from')
      const issueDateTo = url.searchParams.get('issue_date_to')
      const text = url.searchParams.get('text')

      let query = supabase.from('documents').select('*')

      if (docType) query = query.eq('doc_type', docType)
      if (docNumber) query = query.eq('doc_number', docNumber)
      if (rev) query = query.eq('rev', rev)
      if (issueDateFrom) query = query.gte('issue_date', issueDateFrom)
      if (issueDateTo) query = query.lte('issue_date', issueDateTo)
      if (text) {
        query = query.or(`title.ilike.%${text}%,project.ilike.%${text}%`)
      }

      const { data, error } = await query.order('issue_date', { ascending: false })

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify(data),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // GET /docs/:id
    const docIdMatch = path.match(/^\/docs\/([^\/]+)$/)
    if (docIdMatch && req.method === 'GET') {
      const docId = docIdMatch[1]
      
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('id', docId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return new Response(
            JSON.stringify({ error: 'Document not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify(data),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // GET /docs/:id/download
    const downloadMatch = path.match(/^\/docs\/([^\/]+)\/download$/)
    if (downloadMatch && req.method === 'GET') {
      const docId = downloadMatch[1]
      
      const { data: document, error } = await supabase
        .from('documents')
        .select('storage_path')
        .eq('id', docId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          return new Response(
            JSON.stringify({ error: 'Document not found' }),
            { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Create presigned URL for download
      const { data: signedUrl, error: signError } = await supabase.storage
        .from('datalake-docs')
        .createSignedUrl(document.storage_path, 3600) // 1 hour expiry

      if (signError) {
        return new Response(
          JSON.stringify({ error: 'Failed to generate download URL' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      return new Response(
        JSON.stringify({ download_url: signedUrl.signedUrl }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Not found' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})