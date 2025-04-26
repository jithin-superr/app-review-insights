import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// IMPORTANT: Replace with your actual Supabase URL and Anon Key
// It's best practice to store these in environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Anon Key is missing. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.');
  // In a real app, you might throw an error or handle this differently
}

// Initialize Supabase client
const supabase = createClient(supabaseUrl!, supabaseAnonKey!); // Use non-null assertion operator (!)

export async function GET(
  request: Request,
  { params }: { params: { jobId: string } }
) {
  const jobId = params.jobId;

  if (!jobId) {
    return NextResponse.json({ error: 'Job ID is required' }, { status: 400 });
  }

  try {
    // Fetch job status from Supabase
    const { data: job, error } = await supabase
      .from('jobs') // Replace 'jobs' with your actual table name
      .select('id, status, created_at, updated_at, result, error_message') // Select desired columns
      .eq('id', jobId)
      .single(); // Expecting only one row for a given job ID

    if (error && error.code !== 'PGRST116') { // PGRST116: Row not found is okay
      console.error('Supabase query error:', error);
      return NextResponse.json({ error: 'Failed to fetch job status', details: error.message }, { status: 500 });
    }

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Return the job status
    return NextResponse.json(job);

  } catch (error) {
    console.error('Error fetching task status:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to fetch task status', details: errorMessage }, { status: 500 });
  }
}