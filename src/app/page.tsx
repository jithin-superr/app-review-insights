'use client';

import { useState, useEffect } from 'react';
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

// Helper function to add retry logic
async function fetchWithRetry(url: string, options: RequestInit = {}, retries = 3, delay = 1000) {
  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    return response;
  } catch (error) {
    if (retries <= 1) throw error;
    console.log(`Retrying fetch to ${url}. Retries left: ${retries - 1}`);
    await new Promise(resolve => setTimeout(resolve, delay));
    return fetchWithRetry(url, options, retries - 1, delay * 2);
  }
}

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [appName, setAppName] = useState<string | undefined>(undefined);
  const [reviewsData, setReviewsData] = useState<ReviewsData | null>(null);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [appId, setAppId] = useState<string | null>(null);

  // Effect to load insights after reviews are loaded
  useEffect(() => {
    // If we have reviews but no insights, and we're not already loading insights
    if (reviewsData && !insights && !isGeneratingInsights && appId) {
      loadInsights(appId);
    }
  }, [reviewsData, insights, isGeneratingInsights, appId]);

  const loadInsights = async (appId: string) => {
    if (!appId) return;
    
    setIsGeneratingInsights(true);
    setError(null);
    
    try {
      console.log('Generating insights for app ID:', appId);
      // Use retry mechanism for the potentially slow insights API
      const response = await fetchWithRetry(
        `/api/insights?appId=${encodeURIComponent(appId)}`, 
        {}, // Default options
        3,  // 3 retries
        2000 // Initial 2-second delay, doubles each retry
      );

      const data = await response.json();
      
      if (data.insights) {
        setInsights(data.insights);
      } else if (data.error) {
        setError(`Insights generation failed: ${data.error}`);
      }
    } catch (error) {
      console.error('Error generating insights:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setError(`Failed to generate insights: ${errorMessage}`);
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  const handleSubmit = async (appIdInput: string) => {
    setError(null);
    setIsLoading(true);
    setInsights(null);
    setReviewsData(null);
    setAppName(undefined);
    setAppId(appIdInput);

    try {
      // First, just fetch reviews without insights to avoid timeout
      console.log('Fetching reviews for app ID:', appIdInput);
      // Use retry mechanism for the reviews API
      const response = await fetchWithRetry(
        `/api/reviews?appId=${encodeURIComponent(appIdInput)}&skipInsights=true`,
        {}, // Default options
        3,  // 3 retries
        2000 // Initial 2-second delay, doubles each retry
      );

      const data = await response.json();
      console.log('Received review data:', data);

      // Store app name and reviews
      const simplifiedAppName = data.appName || appIdInput.split('.').pop() || appIdInput;
      setAppName(simplifiedAppName.charAt(0).toUpperCase() + simplifiedAppName.slice(1));
      setReviewsData({ appName: data.appName, reviews: data.reviews });

      // Insights will be loaded by the useEffect

    } catch (error) {
      console.error('Error in handleSubmit:', error);
      setReviewsData(null);
      setInsights(null);
      setAppName(undefined);
      setAppId(null);
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
                Fetching reviews...
              </p>
            </div>
          )}
          
          {!isLoading && reviewsData && (
            <InsightsSection 
              appName={appName}
              isGeneratingInsights={isGeneratingInsights}
              reviews={reviewsData?.reviews}
              insights={insights}
            />
          )}
          
          {!isLoading && isGeneratingInsights && (
            <div className="mt-4 flex flex-col items-center">
              <LoadingSpinner size="md" />
              <p className="mt-2 text-gray-600">
                Generating AI insights...
              </p>
            </div>
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
