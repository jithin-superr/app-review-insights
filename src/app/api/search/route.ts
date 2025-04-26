import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get the search term from the URL query parameters
    const searchParams = request.nextUrl.searchParams;
    const term = searchParams.get('term');

    if (!term) {
      return NextResponse.json(
        { error: 'Search term is required' },
        { status: 400 }
      );
    }

    console.log('Searching for apps with term:', term);
    
    // Construct the URL for the Play Store API Wrapper
    const apiUrl = process.env.PLAYSTORE_API_URL || 'https://playstore-api-wrapper.onrender.com';
    const url = `${apiUrl}/search?term=${encodeURIComponent(term)}`;
    
    console.log('Fetching from Play Store API wrapper:', url);
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API error response:', errorText);
      throw new Error(`API error: ${response.status} - ${errorText}`);
    }
    
    const searchResults = await response.json();
    
    // Fetch icon URLs for each app in the search results (limit to first 10 for performance)
    const limitedResults = searchResults.slice(0, 10);
    const resultsWithIcons = await Promise.all(
      limitedResults.map(async (app: any) => {
        try {
          const iconResponse = await fetch(`${apiUrl}/icon?appId=${encodeURIComponent(app.appId)}`);
          if (iconResponse.ok) {
            const iconData = await iconResponse.json();
            return {
              ...app,
              iconUrl: iconData.url || iconData.icon || null
            };
          }
          return app;
        } catch (error) {
          console.error(`Error fetching icon for ${app.appId}:`, error);
          return app;
        }
      })
    );
    
    // If there are more results, add them without icons
    if (searchResults.length > 10) {
      resultsWithIcons.push(...searchResults.slice(10).map((app: any) => app));
    }
    
    return NextResponse.json(resultsWithIcons);
  } catch (error) {
    console.error('Error in search API:', error);
    return NextResponse.json(
      { error: 'Failed to search for apps' },
      { status: 500 }
    );
  }
} 