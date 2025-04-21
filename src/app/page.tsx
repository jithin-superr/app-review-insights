'use client';

import { useState } from 'react';
import AppInputForm from '@/components/AppInputForm';
import InsightsSection from '@/components/InsightsSection';
import LoadingSpinner from '@/components/LoadingSpinner';

// Define types for our app data
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

interface ReviewsData {
  appName: string;
  reviews: Review[];
  fetchDuration?: string;
  fetchTiming?: {
    durationMs: number;
    durationSec: number;
  };
  insightsTiming?: {
    durationMs: number;
    durationSec: number;
  };
}

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  // isGeneratingInsights is no longer needed as it's part of the main loading state
  const [appName, setAppName] = useState<string | undefined>(undefined);
  const [reviewsData, setReviewsData] = useState<ReviewsData | null>(null);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (appId: string) => {
    setIsLoading(true);
    setError(null);
    setInsights(null);
    setReviewsData(null); // Clear previous reviews
    setAppName(undefined); // Clear previous app name

    // Overall request timing
    console.time('TOTAL_API_REQUEST_DURATION');
    console.log('🔍 [DEBUG] Starting API request flow');

    try {
      // Record the time before fetch starts
      const fetchStartTime = new Date();
      console.log(`🔍 [DEBUG] Fetching reviews and insights for app ID: ${appId}`);
      console.log(`🔍 [DEBUG] Request URL: /api/reviews?appId=${encodeURIComponent(appId)}`);
      
      // Network request preparation phase
      console.time('NETWORK_REQUEST_PREPARATION');
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60s timeout
      console.timeEnd('NETWORK_REQUEST_PREPARATION');
      
      // Before sending the request
      console.time('NETWORK_REQUEST_DURATION');
      console.log('🔍 [DEBUG] Before sending API request');
      
      // Call the combined API endpoint to get reviews and insights
      const response = await fetch(`/api/reviews?appId=${encodeURIComponent(appId)}`, {
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json'
        }
      }).catch(e => {
        console.error('🔍 [DEBUG] Network error during fetch:', e);
        throw e;
      });
      
      // Clear the timeout
      clearTimeout(timeoutId);
      
      // After receiving the response
      console.timeEnd('NETWORK_REQUEST_DURATION');
      console.log('🔍 [DEBUG] After receiving API response');
      console.log(`🔍 [DEBUG] Response status: ${response.status}`);
      console.log(`🔍 [DEBUG] Response headers:`, Object.fromEntries([...response.headers.entries()]));
      
      // Record the time after fetch completes
      const fetchEndTime = new Date();
      const fetchDuration = fetchEndTime.getTime() - fetchStartTime.getTime();
      
      // Log the network request duration
      console.log(`🔍 [DEBUG] Network request completed in ${fetchDuration}ms`);
      
      if (!response.ok) {
        console.error(`🔍 [DEBUG] Response not OK: ${response.status} ${response.statusText}`);
        const errorData = await response.json().catch(() => {
          console.error('🔍 [DEBUG] Failed to parse error response as JSON');
          return {};
        });
        throw new Error(errorData.error || `API error: ${response.status}`);
      }

      // Before parsing response
      console.time('RESPONSE_PARSING_DURATION');
      console.log('🔍 [DEBUG] Before parsing response body');
      
      // Get the clone of response to check its size
      const responseClone = response.clone();
      const responseText = await responseClone.text();
      console.log(`🔍 [DEBUG] Response payload size: ${responseText.length} characters`);
      
      // Parse the actual response
      const data = await response.json();
      
      // After parsing response
      console.timeEnd('RESPONSE_PARSING_DURATION');
      console.log('🔍 [DEBUG] After parsing response body');
      console.log(`🔍 [DEBUG] Parsed data has ${data.reviews?.length || 0} reviews`);
      console.log(`🔍 [DEBUG] Response contains insights: ${data.insights ? 'Yes' : 'No'}`);
      
      // Format the timing information using data from the server and client
      let timingInfo = `Client: ${(fetchDuration/1000).toFixed(2)}s`;
      
      // Create detailed timing info with seconds prominently displayed
      if (data.fetchTiming) {
        timingInfo = `Reviews: ${data.fetchTiming.durationSec}s`;
        console.log('🔍 [DEBUG] Server reviews timing:', `${data.fetchTiming.durationSec}s (${data.fetchTiming.durationMs}ms)`);
      }
      
      // Add insights timing if available
      let insightsTimingInfo = '';
      if (data.insightsTiming) {
        insightsTimingInfo = `Insights: ${data.insightsTiming.durationSec}s`;
        console.log('🔍 [DEBUG] Insights generation timing:', `${data.insightsTiming.durationSec}s (${data.insightsTiming.durationMs}ms)`);
      }
      
      // Start timing state updates
      console.time('STATE_UPDATE_DURATION');
      console.log('🔍 [DEBUG] Before updating component state');
      
      // Store app name and reviews
      const simplifiedAppName = data.appName || appId.split('.').pop() || appId;
      setAppName(simplifiedAppName.charAt(0).toUpperCase() + simplifiedAppName.slice(1));
      setReviewsData({ 
        appName: data.appName, 
        reviews: data.reviews,
        fetchDuration: timingInfo,
        fetchTiming: data.fetchTiming,
        insightsTiming: data.insightsTiming
      });

      // Store insights if available
      if (data.insights) {
        setInsights(data.insights);
      } else {
        setInsights(null); // Ensure insights are null if not returned
      }

      // After state updates
      console.timeEnd('STATE_UPDATE_DURATION');
      console.log('🔍 [DEBUG] After updating component state');

      // Handle potential insight generation errors reported by the API
      if (data.insightError) {
        console.warn('🔍 [DEBUG] Insight generation failed:', data.insightError);
        // Set a specific error message, but keep the reviews visible
        setError(data.insightError);
      } else if (!data.insights && data.reviews && data.reviews.length > 0) {
        // If reviews exist but insights are missing without an error, show a generic message
        console.warn('🔍 [DEBUG] Reviews present but no insights returned');
        setError('AI insights could not be generated for these reviews. You can still view the reviews.');
      }

    } catch (error) {
      console.error('🔍 [DEBUG] Error in handleSubmit:', error);
      if (error instanceof DOMException && error.name === 'AbortError') {
        console.error('🔍 [DEBUG] Request was aborted due to timeout');
      }
      if (error instanceof TypeError && error.message.includes('NetworkError')) {
        console.error('🔍 [DEBUG] Network error - check connection or CORS issues');
      }
      setReviewsData(null);
      setInsights(null);
      setAppName(undefined);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(`Failed to fetch data: ${errorMessage}. Please check the app ID and try again.`);
    } finally {
      console.timeEnd('TOTAL_API_REQUEST_DURATION');
      console.log('🔍 [DEBUG] API request flow completed');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">App Review Insights</h1>
          <p className="mt-1 text-sm text-gray-500">
            Search for any app, analyze reviews, and get AI-powered insights
          </p>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4 text-black">Enter App Details</h2>
            
            <AppInputForm onSubmit={handleSubmit} />
            
            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
                <p className="text-red-600">{error}</p>
              </div>
            )}
          </div>
          
          {isLoading && (
            <div className="mt-8 flex flex-col items-center">
              <LoadingSpinner size="lg" />
              <p className="mt-4 text-gray-600">
                Fetching reviews and generating insights...
              </p>
            </div>
          )}
          
          {/* Render InsightsSection only when not loading and data is potentially available */}
          {!isLoading && (reviewsData || insights || error) && (
            <InsightsSection 
              appName={appName}
              // Pass loading states if needed by InsightsSection, otherwise remove
              // isLoading={isLoading} 
              // isGeneratingInsights={false} // No longer separate state
              reviews={reviewsData?.reviews}
              insights={insights}
              fetchDuration={reviewsData?.fetchDuration}
            />
          )}
        </div>
      </main>
      
      <footer className="bg-white mt-12 border-t border-gray-200">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <p className="text-sm text-gray-500 text-center">
            App Review Insights - Powered by Play Store API Wrapper and OpenRouter AI
          </p>
        </div>
      </footer>
    </div>
  );
}
