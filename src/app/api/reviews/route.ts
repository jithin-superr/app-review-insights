import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get the app ID from the URL query parameters
    const searchParams = request.nextUrl.searchParams;
    const appId = searchParams.get('appId');

    if (!appId) {
      return NextResponse.json(
        { error: 'App ID is required' },
        { status: 400 }
      );
    }

    console.log('Fetching reviews for app ID:', appId);
    
    // Use the custom API endpoint
    try {
      const url = `https://playstore-api-wrapper.onrender.com/reviews?appId=${encodeURIComponent(appId)}`;
      console.log('Fetching from Play Store API wrapper:', url);
      
      const response = await fetch(url);
      
      console.log('API response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error response:', errorText);
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }
      
      const apiData = await response.json();
      console.log(`Found ${apiData.reviews?.length || 0} reviews for ${appId}`);
      
      // Extract app name from the app ID if not available from the API
      const appName = formatAppName(appId);
      
      // Transform API response to our app's format
      if (!apiData.reviews || !Array.isArray(apiData.reviews) || apiData.reviews.length === 0) {
        console.warn('No reviews found in API response');
        return generateSampleResponse(appId);
      }
      
      const data = {
        appName: appName,
        reviews: apiData.reviews.map((review: any, index: number) => {
          return {
            id: review.id || String(index + 1),
            rating: review.score || 0,
            text: review.text || '',
            author: review.userName || 'Anonymous',
            date: review.date || new Date().toISOString()
          };
        })
      };
      
      console.log('Successfully transformed reviews data');
      return NextResponse.json(data);
    } catch (error) {
      console.error('Error fetching from API:', error);
      
      // Fall back to sample data if there's an error
      return generateSampleResponse(appId);
    }
  } catch (error) {
    console.error('Error in reviews API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  }
}

// Helper function to format app name from ID
function formatAppName(appId: string): string {
  // If not a package name format, return as is
  if (!appId.includes('.')) return capitalizeWords(appId);
  
  // Extract the last part of the package name (e.g., "maps" from "com.google.maps")
  const lastPart = appId.split('.').pop();
  if (!lastPart) return capitalizeWords(appId);
  
  // For known company domains, try to create a more readable name
  const domain = appId.split('.').slice(0, -1).join('.');
  
  if (domain === 'com.google') {
    return `Google ${capitalizeWords(lastPart)}`;
  } else if (domain === 'com.facebook') {
    return `Facebook ${capitalizeWords(lastPart)}`;
  } else if (domain === 'com.amazon') {
    return `Amazon ${capitalizeWords(lastPart)}`;
  } else if (domain === 'com.spotify') {
    return `Spotify ${capitalizeWords(lastPart)}`;
  } else if (domain === 'com.netflix') {
    return `Netflix ${capitalizeWords(lastPart)}`;
  } else if (domain.includes('instagram')) {
    return `Instagram ${capitalizeWords(lastPart)}`;
  } else if (domain.includes('whatsapp')) {
    return `WhatsApp ${capitalizeWords(lastPart)}`;
  } else if (domain.includes('twitter') || domain.includes('x.com')) {
    return `Twitter ${capitalizeWords(lastPart)}`;
  } else if (domain.includes('tiktok')) {
    return `TikTok ${capitalizeWords(lastPart)}`;
  } else if (domain.includes('snapchat')) {
    return `Snapchat ${capitalizeWords(lastPart)}`;
  } else if (domain === 'com.duolingo') {
    return 'Duolingo';
  }
  
  // For other apps, just capitalize the last part
  return capitalizeWords(lastPart);
}

// Helper function to capitalize words
function capitalizeWords(text: string): string {
  // Split by non-word characters
  return text
    .split(/[^a-zA-Z0-9]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

// Helper function to generate sample response
function generateSampleResponse(appId: string) {
  console.log('Generating sample reviews for demonstration');
  
  const sampleReviews = [
    { 
      id: '1', 
      rating: 5, 
      text: 'This is a sample review since the API did not return real reviews. Great app with lots of features!', 
      author: 'Sample User 1', 
      date: new Date().toISOString().split('T')[0]
    },
    { 
      id: '2', 
      rating: 4, 
      text: 'Sample review: The app works well but has some minor bugs that need fixing.', 
      author: 'Sample User 2', 
      date: new Date().toISOString().split('T')[0]
    },
    { 
      id: '3', 
      rating: 3, 
      text: 'Sample review: Average app, needs more features to compete with others.', 
      author: 'Sample User 3', 
      date: new Date().toISOString().split('T')[0]
    },
    { 
      id: '4', 
      rating: 5, 
      text: 'Sample review: I use this daily and it helps me a lot with productivity.', 
      author: 'Sample User 4', 
      date: new Date().toISOString().split('T')[0]
    },
    { 
      id: '5', 
      rating: 2, 
      text: 'Sample review: The app crashes frequently on my device.', 
      author: 'Sample User 5', 
      date: new Date().toISOString().split('T')[0]
    }
  ];
  
  return NextResponse.json({ 
    appName: formatAppName(appId),
    reviews: sampleReviews,
    message: "Using sample reviews as the API did not return real reviews. Check the server logs for details."
  });
} 