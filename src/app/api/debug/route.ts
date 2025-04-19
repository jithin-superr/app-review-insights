import { NextResponse } from 'next/server';

export async function GET() {
  // Check environment variables
  const hasOpenRouterKey = !!process.env.OPENROUTER_API_KEY;
  const openRouterUrl = process.env.OPENROUTER_URL || 'Default URL used';
  const playstoreApiUrl = process.env.PLAYSTORE_API_URL || 'Default URL used';
  
  // Return masked config for debugging (don't expose actual key values)
  return NextResponse.json({
    environment: process.env.NODE_ENV,
    config: {
      hasOpenRouterKey,
      openRouterKeyFirstChars: hasOpenRouterKey ? 
        `${process.env.OPENROUTER_API_KEY!.substring(0, 4)}...${process.env.OPENROUTER_API_KEY!.slice(-4)}` : 
        'not set',
      openRouterUrl,
      playstoreApiUrl
    }
  });
} 