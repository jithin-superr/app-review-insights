import { NextRequest, NextResponse } from 'next/server';

// Define interfaces
interface Review {
  id: string;
  rating: number;
  text: string;
  author: string;
  date: string;
}

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

// Add cache and edge runtime config
export const fetchCache = 'force-no-store'; // Disable the fetch cache
export const revalidate = 3600; // Revalidate every hour
export const runtime = 'edge'; // Use edge runtime to avoid serverless function timeouts

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

    console.log('Generating insights for app ID:', appId);
    
    try {
      // First, fetch the reviews using the reviews API
      const reviewsUrl = `${request.nextUrl.origin}/api/reviews?appId=${encodeURIComponent(appId)}&skipInsights=true`;
      console.log('Fetching reviews from internal API:', reviewsUrl);
      
      const reviewsResponse = await fetch(reviewsUrl, {
        // Add a longer timeout for the external API request
        signal: AbortSignal.timeout(15000) // 15 seconds timeout
      });
      
      if (!reviewsResponse.ok) {
        const errorText = await reviewsResponse.text();
        console.error('Reviews API error response:', errorText);
        throw new Error(`Reviews API error: ${reviewsResponse.status} - ${errorText}`);
      }
      
      const reviewsData = await reviewsResponse.json();
      
      if (!reviewsData.reviews || !Array.isArray(reviewsData.reviews) || reviewsData.reviews.length === 0) {
        console.warn('No reviews found in reviews API response');
        return NextResponse.json(
          { error: 'No reviews found for this app ID' },
          { status: 404 }
        );
      }
      
      console.log(`Generating insights for ${reviewsData.appName} with ${reviewsData.reviews.length} reviews`);

      // Generate insights
      let insights: Insights | null = null;
      let insightError: string | null = null;

      try {
        console.log(`Attempting to generate insights using model: ${MODEL}`);
        
        // Check for API key before calling DeepSeek
        if (!DEEPSEEK_API_KEY || DEEPSEEK_API_KEY === 'YOUR_DEEPSEEK_API_KEY_HERE') {
          throw new Error('Valid DeepSeek API key is required. Please set the DEEPSEEK_API_KEY environment variable in .env.local.');
        }

        insights = await generateInsightsFromReviews(reviewsData.appName, reviewsData.reviews);
        console.log('Successfully generated insights.');

      } catch (genError) {
        console.error('Error generating insights:', genError);
        insightError = `Failed to generate AI insights: ${genError instanceof Error ? genError.message : 'Unknown error'}`;
        return NextResponse.json(
          { error: insightError },
          { status: 500 }
        );
      }

      // Return the insights
      return NextResponse.json({
        insights: insights
      });
    } catch (error) {
      console.error('Error fetching reviews or generating insights:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in insights API:', error);
    return NextResponse.json(
      { error: 'Failed to generate insights' },
      { status: 500 }
    );
  }
}

// Insights generation function
async function generateInsightsFromReviews(appName: string, reviews: Review[]): Promise<Insights> {
  // Format reviews for the prompt
  const reviewsForAnalysis = reviews.slice(0, 100); // Limit reviews for API call

  // Calculate rating distribution
  const ratingCounts = [0, 0, 0, 0, 0];
  reviewsForAnalysis.forEach(review => {
    if (review.rating >= 1 && review.rating <= 5) {
      ratingCounts[review.rating - 1]++;
    }
  });

  const avgRating = reviewsForAnalysis.length > 0 
    ? reviewsForAnalysis.reduce((sum, review) => sum + review.rating, 0) / reviewsForAnalysis.length
    : 0;

  // Format reviews for the prompt
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

  // Call DeepSeek API
  const response = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
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
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('DeepSeek API error response:', errorText);
    throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`);
  }

  const responseText = await response.text();
  console.log('Raw DeepSeek API response text:', responseText);

  let llmResponse;
  try {
    llmResponse = JSON.parse(responseText);
  } catch (parseError) {
    console.error('Failed to parse DeepSeek response as JSON:', parseError);
    console.error('Raw response was:', responseText);
    throw new Error('Could not parse API response');
  }

  console.log('DeepSeek model used:', llmResponse.model || MODEL);

  if (llmResponse.error) {
    console.error('DeepSeek API returned an error object:', llmResponse.error);
    throw new Error(`API returned error: ${llmResponse.error.message || 'Unknown error'}`);
  }

  const content = llmResponse.choices?.[0]?.message?.content;

  if (!content) {
    console.error('No content found in DeepSeek API response. Full response:', JSON.stringify(llmResponse, null, 2));
    throw new Error('No content returned from API');
  }

  // Parse the actual content string (which should be JSON)
  try {
    // Clean potential markdown/formatting issues before parsing the content string
    const cleanedContent = content
      .replace(/^```json\n|\n```$/g, '') // Remove markdown code fences
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove markdown bold
      .trim();
    const insights = JSON.parse(cleanedContent);
    return insights as Insights;
  } catch (error) {
    console.error('Failed to parse the content string from LLM response as JSON:', error);
    console.error('Original content string was:', content);
    throw new Error('Failed to parse the generated insights JSON from API response');
  }
} 