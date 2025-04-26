import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

// IMPORTANT: Replace with your actual Supabase URL and Anon Key
// It's best practice to store these in environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase URL or Anon Key is missing. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.');
  // In a real app, you might throw an error or handle this differently
}

// Initialize Supabase client
// Note: For server-side operations like this, you might consider using the service_role key
// if you need to bypass Row Level Security (RLS). However, using the anon key
// is generally safer if RLS is configured correctly for your 'jobs' table.
const supabase = createClient(supabaseUrl!, supabaseAnonKey!); // Use non-null assertion operator (!) assuming check above ensures they exist

export async function POST(request: Request) {
  try {
    // 1. Get task parameters from the request (optional)
    // const { param1, param2 } = await request.json();

    // 2. Generate a unique job ID
    const jobId = uuidv4();

    // 3. Store job details in Supabase
    const { data, error } = await supabase
      .from('jobs') // Replace 'jobs' with your actual table name
      .insert([
        {
          id: jobId,
          status: 'pending',
          created_at: new Date().toISOString(),
          // Add any other relevant initial data, e.g., parameters
          // parameters: { param1, param2 }
        },
      ])
      .select(); // Optionally select the inserted data if needed

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json({ error: 'Failed to create job', details: error.message }, { status: 500 });
    }

    // 4. Trigger the background task (Mechanism depends on your setup)
    //    - If using Supabase Edge Functions triggered by DB changes, the insert above might be enough.
    //    - If using a queue (e.g., Vercel KV Queue, Upstash QStash), enqueue the job ID here.
    //    - If calling another API endpoint (e.g., Render, AWS Lambda), make the API call here.
    // Example (placeholder - adapt to your chosen method):
    // await triggerBackgroundTask(jobId, { param1, param2 });
    console.log(`Job ${jobId} created and background task trigger initiated (adapt trigger mechanism).`);

    // 5. Return the job ID immediately
    return NextResponse.json({ jobId });

  } catch (error) {
    console.error('Error starting task:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to start task', details: errorMessage }, { status: 500 });
  }
}

// --- Helper function placeholder for triggering background task ---
// Replace this with your actual trigger logic
// async function triggerBackgroundTask(jobId: string, params: any) {
//   console.log(`Triggering background task for job ${jobId} with params:`, params);
//   // Example: Fetch call to another service
//   // await fetch('YOUR_BACKGROUND_WORKER_URL', {
//   //   method: 'POST',
//   //   headers: { 'Content-Type': 'application/json' },
//   //   body: JSON.stringify({ jobId, ...params })
//   // });
//   // Example: Add to a queue
//   // await queue.enqueue({ jobId, ...params });
// }

// Add a simple GET handler for testing or basic info
export async function GET() {
  return NextResponse.json({ message: 'This endpoint initiates background tasks via POST request.' });
}