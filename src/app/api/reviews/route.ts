import { NextRequest, NextResponse } from 'next/server';

// Define interfaces for the API response
interface PlayStoreReview {
  id?: string;
  score?: number;
  text?: string;
  userName?: string;
  date?: string;
}

// Define the structure of a review (consistent format)
interface Review {
  id: string;
  rating: number;
  text: string;
  author: string;
  date: string;
}

// Define timing information structures
interface TimingInfo {
  startTime: string;
  endTime: string;
  durationMs: number;
  durationSec: number;
}

// Define data structure for transformed reviews
interface ReviewsData {
  appName: string;
  reviews: Review[];
  fetchTiming?: TimingInfo;
  insightsTiming?: TimingInfo;
}

// Define the structure for insights
interface Insights {
  commonPraises: string[];
  commonComplaints: string[];
  featureRequests: string[];
  userExperience: string;
  sentimentAnalysis: {
    positivePercentage: number;
    negativePercentage: number;
    keyEmotions: string[];
  };
  actionableRecommendations: string[];
}

// Define constants for DeepSeek API
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_API_URL = process.env.DEEPSEEK_API_URL || "https://api.deepseek.com/v1/chat/completions";
const MODEL = process.env.DEEPSEEK_MODEL || "deepseek-chat";

// Commented out OpenRouter constants
// const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
// const OPENROUTER_API_URL = process.env.OPENROUTER_URL || "https://openrouter.ai/api/v1/chat/completions";
// const OPENROUTER_MODEL = "mistralai/mistral-7b-instruct:free";

export async function GET(request: NextRequest) {
  // Start timing the entire request
  console.time('TotalReviewsRequest-Duration');
  const requestStartTime = new Date();
  console.log(`🔍 [SERVER-DEBUG] Total request processing started at ${requestStartTime.toISOString()}`);
  console.log(`🔍 [SERVER-DEBUG] Request URL: ${request.url}`);

  try {
    // Get the app ID from the URL query parameters
    console.time('REQUEST_PARAMS_PARSING');
    const searchParams = request.nextUrl.searchParams;
    const appId = searchParams.get('appId');
    console.timeEnd('REQUEST_PARAMS_PARSING');

    if (!appId) {
      console.timeEnd('TotalReviewsRequest-Duration');
      const requestEndTime = new Date();
      const requestDuration = requestEndTime.getTime() - requestStartTime.getTime();
      console.log(`🔍 [SERVER-DEBUG] Request ended (no appId) after ${requestDuration}ms`);
      return NextResponse.json(
        { error: 'App ID is required' },
        { status: 400 }
      );
    }

    console.log(`🔍 [SERVER-DEBUG] Fetching reviews for app ID: ${appId}`);
    
    // Use the custom API endpoint
    try {
      const url = `https://playstore-api-wrapper.onrender.com/reviews?appId=${encodeURIComponent(appId)}`;
      console.log(`🔍 [SERVER-DEBUG] Fetching from Play Store API wrapper: ${url}`);
      
      // Start timing the API call using console.time
      console.time('PlayStore-API-Call-Duration');
      
      // Also use Date for more explicit timing
      const fetchStartTime = new Date();
      console.log(`🔍 [SERVER-DEBUG] Play Store API call started at ${fetchStartTime.toISOString()}`);
      
      // Network connection phase
      console.time('API_DNS_RESOLUTION');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 2-minute timeout 
      console.timeEnd('API_DNS_RESOLUTION');
      
      // Before making the request
      console.log(`🔍 [SERVER-DEBUG] Before sending HTTP request to Play Store API`);
      
      const response = await fetch(url, { 
        signal: controller.signal,
        headers: {
          'User-Agent': 'AppReviewInsights/1.0',
        }
      }).catch(error => {
        console.error(`🔍 [SERVER-DEBUG] Fetch error: ${error.message}`);
        throw error;
      });
      
      // Clear the timeout
      clearTimeout(timeoutId);
      
      // After receiving the response
      console.log(`🔍 [SERVER-DEBUG] After receiving response from Play Store API`);
      console.log(`🔍 [SERVER-DEBUG] Response status: ${response.status}`);
      
      if (!response.ok) {
        // End timing if there's an error
        console.timeEnd('PlayStore-API-Call-Duration');
        const fetchEndTime = new Date();
        const fetchDuration = fetchEndTime.getTime() - fetchStartTime.getTime();
        const fetchDurationSec = (fetchDuration / 1000).toFixed(2);
        console.log(`⏱️ 🔍 [SERVER-DEBUG] TIMING ERROR: Play Store API call failed after ${fetchDuration}ms (${fetchDurationSec}s) ⏱️`);
        
        const errorText = await response.text();
        console.error(`🔍 [SERVER-DEBUG] API error response: ${errorText}`);
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }
      
      // Response size check
      console.time('RESPONSE_SIZE_CHECK');
      const responseClone = response.clone();
      const responseText = await responseClone.text();
      console.log(`🔍 [SERVER-DEBUG] Play Store API response size: ${responseText.length} characters`);
      console.timeEnd('RESPONSE_SIZE_CHECK');
      
      // Before parsing response
      console.time('RESPONSE_PARSING');
      console.log(`🔍 [SERVER-DEBUG] Before parsing response as JSON`);
      
      const apiData = await response.json();
      
      // After parsing response
      console.timeEnd('RESPONSE_PARSING');
      console.log(`🔍 [SERVER-DEBUG] After parsing response as JSON`);
      console.log(`🔍 [SERVER-DEBUG] Review count in response: ${apiData.reviews?.length || 0}`);
      
      // End timing after we've got the data and parsed it
      console.timeEnd('PlayStore-API-Call-Duration');
      const fetchEndTime = new Date();
      const fetchDuration = fetchEndTime.getTime() - fetchStartTime.getTime();
      const fetchDurationSec = (fetchDuration / 1000).toFixed(2);
      console.log(`⏱️ 🔍 [SERVER-DEBUG] TIMING: Play Store API call completed in ${fetchDuration}ms (${fetchDurationSec}s) ⏱️`);
      
      // Before data transformation
      console.time('DATA_TRANSFORMATION');
      console.log(`🔍 [SERVER-DEBUG] Before data transformation`);
      
      // Add timing info to the response data for the client
      apiData.fetchTiming = {
        startTime: fetchStartTime.toISOString(),
        endTime: fetchEndTime.toISOString(),
        durationMs: fetchDuration,
        durationSec: parseFloat(fetchDurationSec)
      };
      
      console.log(`🔍 [SERVER-DEBUG] Found ${apiData.reviews?.length || 0} reviews for ${appId}`);
      
      // Extract app name from the app ID if not available from the API
      const appName = formatAppName(appId);
      
      // Transform API response to our app's format
      if (!apiData.reviews || !Array.isArray(apiData.reviews) || apiData.reviews.length === 0) {
        console.warn(`🔍 [SERVER-DEBUG] No reviews found in API response`);
        console.timeEnd('DATA_TRANSFORMATION');
        return generateSampleResponse(appId);
      }
      
      const data: ReviewsData = {
        appName: appName,
        reviews: apiData.reviews.map((review: PlayStoreReview, index: number) => {
          return {
            id: review.id || String(index + 1),
            rating: review.score || 0,
            text: review.text || '',
            author: review.userName || 'Anonymous',
            date: review.date || new Date().toISOString()
          };
        }),
        fetchTiming: apiData.fetchTiming
      };
      
      // After data transformation
      console.timeEnd('DATA_TRANSFORMATION');
      console.log(`🔍 [SERVER-DEBUG] Successfully transformed reviews data`);

      // --- Start: Generate Insights --- 
      let insights: Insights | null = null;
      let insightError: string | null = null;

      if (data.reviews && data.reviews.length > 0) {
        try {
          console.log(`🔍 [SERVER-DEBUG] Attempting to generate insights for ${data.appName} with ${data.reviews.length} reviews using model: ${MODEL}`);
          
          // Check for API key before calling DeepSeek
          if (!DEEPSEEK_API_KEY || DEEPSEEK_API_KEY === 'YOUR_DEEPSEEK_API_KEY_HERE') {
            throw new Error('Valid DeepSeek API key is required. Please set the DEEPSEEK_API_KEY environment variable in .env.local.');
          }

          // Start timing insights generation
          console.time('InsightsGeneration-Duration');
          const insightsStartTime = new Date();
          
          insights = await generateInsightsFromReviews(data.appName, data.reviews);
          
          // End timing insights generation
          console.timeEnd('InsightsGeneration-Duration');
          const insightsEndTime = new Date();
          const insightsDuration = insightsEndTime.getTime() - insightsStartTime.getTime();
          const insightsDurationSec = (insightsDuration / 1000).toFixed(2);
          console.log(`⏱️ 🔍 [SERVER-DEBUG] TIMING: Insights generation completed in ${insightsDuration}ms (${insightsDurationSec}s) ⏱️`);
          
          // Add insights timing to the data object
          data.insightsTiming = {
            startTime: insightsStartTime.toISOString(),
            endTime: insightsEndTime.toISOString(),
            durationMs: insightsDuration,
            durationSec: parseFloat(insightsDurationSec)
          };
          
          console.log(`🔍 [SERVER-DEBUG] Successfully generated insights.`);

        } catch (genError) {
          console.error(`🔍 [SERVER-DEBUG] Error generating insights:`, genError);
          insightError = `Failed to generate AI insights: ${genError instanceof Error ? genError.message : 'Unknown error'}. Reviews are still available.`;
          // Do not throw here, return reviews even if insights fail
        }
      }
      // --- End: Generate Insights ---

      // Before preparing response
      console.time('RESPONSE_PREPARATION');
      console.log(`🔍 [SERVER-DEBUG] Before preparing response`);
      
      // Return combined data
      const combinedData = {
        appName: data.appName,
        reviews: data.reviews,
        insights: insights, // Will be null if generation failed or no reviews
        ...(insightError && { insightError: insightError }), // Include error message if insights failed
        fetchTiming: data.fetchTiming,
        ...(data.insightsTiming && { insightsTiming: data.insightsTiming })
      };
      
      // After preparing response
      console.timeEnd('RESPONSE_PREPARATION');
      console.log(`🔍 [SERVER-DEBUG] Successfully prepared response data`);
      console.log(`🔍 [SERVER-DEBUG] Response size: ${JSON.stringify(combinedData).length} characters`);

      // End timing for the request
      console.timeEnd('TotalReviewsRequest-Duration');
      const requestEndTime = new Date();
      const requestDuration = requestEndTime.getTime() - requestStartTime.getTime();
      console.log(`🔍 [SERVER-DEBUG] Total request processing completed in ${requestDuration}ms (${(requestDuration/1000).toFixed(2)}s)`);
      return NextResponse.json(combinedData);
    } catch (error) {
      console.error(`🔍 [SERVER-DEBUG] Error fetching from API:`, error);
      
      // Fall back to sample data if there's an error
      const response = generateSampleResponse(appId);
      console.timeEnd('TotalReviewsRequest-Duration');
      const requestEndTime = new Date();
      const requestDuration = requestEndTime.getTime() - requestStartTime.getTime();
      console.log(`🔍 [SERVER-DEBUG] TIMING ERROR: Request failed (using sample data) after ${requestDuration}ms (${(requestDuration/1000).toFixed(2)}s)`);
      return response;
    }
  } catch (error) {
    console.error(`🔍 [SERVER-DEBUG] Error in reviews API:`, error);
    console.timeEnd('TotalReviewsRequest-Duration');
    const requestEndTime = new Date();
    const requestDuration = requestEndTime.getTime() - requestStartTime.getTime();
    console.log(`🔍 [SERVER-DEBUG] TIMING ERROR: Request failed with error after ${requestDuration}ms (${(requestDuration/1000).toFixed(2)}s)`);
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

// Helper function to generate sample response (now only returns reviews)
function generateSampleResponse(appId: string) {
  console.log('Generating sample reviews for demonstration');
  
  // Start timing sample generation
  console.time('SampleReviews-Generation-Duration');
  
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
  
  // End timing sample generation
  console.timeEnd('SampleReviews-Generation-Duration');
  
  return NextResponse.json({ 
    appName: formatAppName(appId),
    reviews: sampleReviews,
    message: "Using sample reviews as the API did not return real reviews. Check the server logs for details.",
    insights: null // No insights for sample data
  });
}

// --- Start: Insight Generation Logic (Moved from insights/route.ts) ---
async function generateInsightsFromReviews(appName: string, reviews: Review[]): Promise<Insights> {
  console.time('TOTAL_INSIGHTS_GENERATION');
  console.log(`🔍 [SERVER-DEBUG] Starting insights generation for ${appName}`);
  
  // Format reviews for the prompt
  const reviewsForAnalysis = reviews.slice(0, 500); // Limit reviews for API call
  console.log(`🔍 [SERVER-DEBUG] Using ${reviewsForAnalysis.length}/${reviews.length} reviews for analysis`);

  // Calculate rating distribution
  console.time('RATING_CALCULATION');
  const ratingCounts = [0, 0, 0, 0, 0];
  reviewsForAnalysis.forEach(review => {
    if (review.rating >= 1 && review.rating <= 5) {
      ratingCounts[review.rating - 1]++;
    }
  });

  const avgRating = reviewsForAnalysis.length > 0 
    ? reviewsForAnalysis.reduce((sum, review) => sum + review.rating, 0) / reviewsForAnalysis.length
    : 0;
  console.timeEnd('RATING_CALCULATION');

  // Format reviews for the prompt
  console.time('PROMPT_PREPARATION');
  const reviewsForPrompt = reviewsForAnalysis.map(review =>
    `[Rating: ${review.rating}/5] "${review.text}" - ${review.author}, ${review.date}`
  ).join('\n\n');

  // Create the prompt
  const prompt = `
You are an expert app review analyst for the app "${appName}". The average rating is ${avgRating.toFixed(1)}/5.

Rating distribution:
5 stars: ${ratingCounts[4]} reviews
4 stars: ${ratingCounts[3]} reviews
3 stars: ${ratingCounts[2]} reviews
2 stars: ${ratingCounts[1]} reviews
1 star: ${ratingCounts[0]} reviews

REVIEWS:
${reviewsForPrompt}

Based on these reviews, provide the following insights:

1. Common Praises: What features or aspects do users love about the app? (Provide 3-5 specific things that multiple users mention positively)

2. Common Complaints: What issues or areas for improvement do users mention? (Provide 3-5 specific problems that multiple users report)

3. Feature Requests: What new features or improvements do users want to see? (Provide 3-5 specific feature requests mentioned by users)

4. User Experience: Summarize the overall user experience in a paragraph. Highlight strengths and weaknesses.

5. Sentiment Analysis: What percentage of reviews are positive vs negative? What emotions do users express?

6. Actionable Recommendations: What 3 specific actions should the developers take to improve the app based on this feedback?

Format your response strictly as JSON with the following structure:
{
  "commonPraises": ["praise 1", "praise 2", ...],
  "commonComplaints": ["complaint 1", "complaint 2", ...],
  "featureRequests": ["feature 1", "feature 2", ...],
  "userExperience": "A paragraph summarizing overall user experience",
  "sentimentAnalysis": {
    "positivePercentage": number,
    "negativePercentage": number,
    "keyEmotions": ["emotion 1", "emotion 2", ...]
  },
  "actionableRecommendations": ["recommendation 1", "recommendation 2", "recommendation 3"]
}
`;

  console.log(`🔍 [SERVER-DEBUG] Prompt size: ${prompt.length} characters`);
  console.timeEnd('PROMPT_PREPARATION');

  // Call DeepSeek API
  console.time('DeepSeekAPI-Call-Duration');
  const deepseekStartTime = new Date();
  console.log(`🔍 [SERVER-DEBUG] Initiating DeepSeek API call at ${deepseekStartTime.toISOString()}`);
  console.log(`🔍 [SERVER-DEBUG] Using model: ${MODEL}`);
  console.log(`🔍 [SERVER-DEBUG] API endpoint: ${DEEPSEEK_API_URL}`);
  
  // Prepare the request body
  console.time('API_REQUEST_PREPARATION');
  const requestBody = JSON.stringify({
    model: MODEL,
    messages: [
      {
        role: 'system',
        content: 'You are an expert app review analyst that provides structured insights from app reviews.'
      },
      {
        role: 'user',
        content: prompt
      }
    ],
    response_format: { type: 'json_object' } // Request JSON output
  });
  console.log(`🔍 [SERVER-DEBUG] Request payload size: ${requestBody.length} characters`);
  console.timeEnd('API_REQUEST_PREPARATION');
  
  // Before making the DeepSeek API request
  console.log(`🔍 [SERVER-DEBUG] Before sending HTTP request to DeepSeek API`);
  
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 120000); // 2-minute timeout
  
  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: requestBody,
      signal: controller.signal
    });
    
    // Clear the timeout
    clearTimeout(timeoutId);
    
    // After receiving the DeepSeek API response
    console.log(`🔍 [SERVER-DEBUG] DeepSeek API response received: status ${response.status}`);
    
    if (!response.ok) {
      console.timeEnd('DeepSeekAPI-Call-Duration');
      const errorText = await response.text();
      console.error(`🔍 [SERVER-DEBUG] DeepSeek API error response: ${errorText}`);
      throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`);
    }
    
    // Before parsing DeepSeek response
    console.time('DEEPSEEK_RESPONSE_PARSING');
    console.log(`🔍 [SERVER-DEBUG] Before parsing DeepSeek response as text`);
    
    const responseText = await response.text();
    console.log(`🔍 [SERVER-DEBUG] Response size from DeepSeek: ${responseText.length} characters`);
    
    // After parsing DeepSeek response
    console.timeEnd('DEEPSEEK_RESPONSE_PARSING');
    console.timeEnd('DeepSeekAPI-Call-Duration');
    
    const deepseekEndTime = new Date();
    const deepseekDuration = deepseekEndTime.getTime() - deepseekStartTime.getTime();
    const deepseekDurationSec = (deepseekDuration / 1000).toFixed(2);
    console.log(`⏱️ 🔍 [SERVER-DEBUG] TIMING: DeepSeek API call completed in ${deepseekDuration}ms (${deepseekDurationSec}s) ⏱️`);
    
    // Before JSON parsing
    console.time('JSON_PARSE_DURATION');
    console.log(`🔍 [SERVER-DEBUG] Before parsing DeepSeek response JSON structure`);
    
    let llmResponse;
    try {
      llmResponse = JSON.parse(responseText);
    } catch (parseError) {
      console.timeEnd('JSON_PARSE_DURATION');
      console.error(`🔍 [SERVER-DEBUG] Failed to parse DeepSeek response as JSON:`, parseError);
      console.error(`🔍 [SERVER-DEBUG] Raw response was:`, responseText);
      throw new Error('Could not parse API response');
    }
    
    console.timeEnd('JSON_PARSE_DURATION');
    console.log(`🔍 [SERVER-DEBUG] Successfully parsed DeepSeek API response structure`);
    
    console.log(`🔍 [SERVER-DEBUG] DeepSeek model used: ${llmResponse.model || MODEL}`);
    
    if (llmResponse.error) {
      console.error(`🔍 [SERVER-DEBUG] DeepSeek API returned an error object:`, llmResponse.error);
      throw new Error(`API returned error: ${llmResponse.error.message || 'Unknown error'}`);
    }
    
    const content = llmResponse.choices?.[0]?.message?.content;
    
    if (!content) {
      console.error(`🔍 [SERVER-DEBUG] No content found in DeepSeek API response. Full response:`, JSON.stringify(llmResponse, null, 2));
      throw new Error('No content returned from API');
    }
    
    // Parse the actual content string (which should be JSON)
    console.time('INSIGHTS_PARSE_DURATION');
    console.log(`🔍 [SERVER-DEBUG] Before parsing insights JSON from content string`);
    
    try {
      // Clean potential markdown/formatting issues before parsing the content string
      const cleanedContent = content
        .replace(/^```json\n|\n```$/g, '') // Remove markdown code fences
        .replace(/\*\*(.*?)\*\*/g, '$1') // Remove markdown bold
        .trim();
      console.log(`🔍 [SERVER-DEBUG] Cleaned content length: ${cleanedContent.length} characters`);
      
      const insights = JSON.parse(cleanedContent);
      console.timeEnd('INSIGHTS_PARSE_DURATION');
      console.log(`🔍 [SERVER-DEBUG] Successfully parsed insights JSON`);
      
      console.timeEnd('TOTAL_INSIGHTS_GENERATION');
      console.log(`🔍 [SERVER-DEBUG] Insights generation completed`);
      return insights as Insights;
    } catch (error) {
      console.timeEnd('INSIGHTS_PARSE_DURATION');
      console.error(`🔍 [SERVER-DEBUG] Failed to parse the content string from LLM response as JSON:`, error);
      console.error(`🔍 [SERVER-DEBUG] Original content string was:`, content);
      throw new Error('Failed to parse the generated insights JSON from API response');
    }
  } catch (error) {
    // Clear the timeout if there's an error
    clearTimeout(timeoutId);
    console.timeEnd('DeepSeekAPI-Call-Duration');
    console.timeEnd('TOTAL_INSIGHTS_GENERATION');
    console.error(`🔍 [SERVER-DEBUG] Error during DeepSeek API call:`, error);
    throw error;
  }
}
// --- End: Insight Generation Logic ---