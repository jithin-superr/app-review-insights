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
}

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  // isGeneratingInsights is no longer needed as it's part of the main loading state
  const [appName, setAppName] = useState<string | undefined>(undefined);
  const [reviewsData, setReviewsData] = useState<ReviewsData | null>(null);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (appId: string) => {
    setError(null);
    setIsLoading(true);
    setInsights(null);
    setReviewsData(null); // Clear previous reviews
    setAppName(undefined); // Clear previous app name

    try {
      // Call the combined API endpoint to get reviews and insights
      console.log('Fetching reviews and insights for app ID:', appId);
      const response = await fetch(`/api/reviews?appId=${encodeURIComponent(appId)}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('Received data:', data);

      // Store app name and reviews
      const simplifiedAppName = data.appName || appId.split('.').pop() || appId;
      setAppName(simplifiedAppName.charAt(0).toUpperCase() + simplifiedAppName.slice(1));
      setReviewsData({ appName: data.appName, reviews: data.reviews }); // Store raw appName too

      // Store insights if available
      if (data.insights) {
        setInsights(data.insights);
      } else {
        setInsights(null); // Ensure insights are null if not returned
      }

      // Handle potential insight generation errors reported by the API
      if (data.insightError) {
        console.warn('Insight generation failed:', data.insightError);
        // Set a specific error message, but keep the reviews visible
        setError(data.insightError);
      } else if (!data.insights && data.reviews && data.reviews.length > 0) {
        // If reviews exist but insights are missing without an error, show a generic message
        setError('AI insights could not be generated for these reviews. You can still view the reviews.');
      }

    } catch (error) {
      console.error('Error in handleSubmit:', error);
      setReviewsData(null);
      setInsights(null);
      setAppName(undefined);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(`Failed to fetch data: ${errorMessage}. Please check the app ID and try again.`);
    } finally {
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
