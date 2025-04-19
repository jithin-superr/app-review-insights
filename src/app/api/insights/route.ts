import { NextRequest, NextResponse } from 'next/server';

// Define the structure of a review
interface Review {
  id: string;
  rating: number;
  text: string;
  author: string;
  date: string;
}

// Interface for the request body
interface RequestBody {
  appName: string;
  reviews: Review[];
}

// Define constants for API
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_API_URL = process.env.OPENROUTER_URL || "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "google/gemma-3-27b-it:free"; // You can change this to your preferred model

export async function POST(request: NextRequest) {
  try {
    // Check if we have a valid API key
    if (!OPENROUTER_API_KEY || OPENROUTER_API_KEY === 'your_openrouter_api_key_here') {
      return NextResponse.json(
        { error: 'Valid OpenRouter API key is required. Please set the OPENROUTER_API_KEY environment variable.' },
        { status: 400 }
      );
    }
    
    // Parse the request body
    const body: RequestBody = await request.json();
    
    if (!body.appName || !body.reviews || !Array.isArray(body.reviews) || body.reviews.length === 0) {
      return NextResponse.json(
        { error: 'Valid app name and reviews array are required' },
        { status: 400 }
      );
    }
    
    console.log(`Generating insights for ${body.appName} with ${body.reviews.length} reviews using model: ${MODEL}`);
    
    // Call OpenRouter API to generate insights
    try {
      // Format reviews for the prompt
      const reviewsForAnalysis = body.reviews.slice(0, 500);
      
      // Calculate rating distribution
      const ratingCounts = [0, 0, 0, 0, 0];
      reviewsForAnalysis.forEach(review => {
        if (review.rating >= 1 && review.rating <= 5) {
          ratingCounts[review.rating - 1]++;
        }
      });
      
      const avgRating = reviewsForAnalysis.reduce((sum, review) => sum + review.rating, 0) / reviewsForAnalysis.length;
      
      // Format reviews for the prompt
      const reviewsForPrompt = reviewsForAnalysis.map(review => 
        `[Rating: ${review.rating}/5] "${review.text}" - ${review.author}, ${review.date}`
      ).join('\n\n');
      
      // Create the prompt
      const prompt = `
You are an expert app review analyst for the app "${body.appName}". I'm providing you with ${reviewsForAnalysis.length} user reviews from the Google Play Store. The average rating is ${avgRating.toFixed(1)}/5.

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

Format your response as JSON with the following structure:
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

      // Call OpenRouter API
      const response = await fetch(OPENROUTER_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'https://app-review-insights.app',
          'X-Title': 'App Review Insights'
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
          response_format: { type: 'json_object' }
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenRouter API error response:', errorText);
        return NextResponse.json(
          { error: `Failed to generate insights: OpenRouter API error: ${response.status}` },
          { status: 500 }
        );
      }

      const llmResponse = await response.json();
      console.log('OpenRouter model used:', llmResponse.model || MODEL);
      
      const content = llmResponse.choices?.[0]?.message?.content;
      
      if (!content) {
        console.error('No content returned from OpenRouter API');
        return NextResponse.json(
          { error: 'Failed to generate insights: No content returned from API' },
          { status: 500 }
        );
      }
      
      // Parse the JSON response
      try {
        const cleanedContent = content
          .replace(/^```json\n|\n```$/g, '')
          .replace(/\*\*(.*?)\*\*/g, '$1')
          .trim();
        const insights = JSON.parse(cleanedContent);
        return NextResponse.json({ insights });
      } catch (_) {
        console.error('Failed to parse LLM response as JSON:', content);
        return NextResponse.json(
          { error: 'Failed to parse API response as JSON' },
          { status: 500 }
        );
      }
    } catch (error) {
      console.error('Error calling OpenRouter API:', error);
      return NextResponse.json(
        { error: `Failed to generate insights: ${error instanceof Error ? error.message : 'Unknown error'}` },
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