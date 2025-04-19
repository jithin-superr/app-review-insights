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
  const [isGeneratingInsights, setIsGeneratingInsights] = useState(false);
  const [appName, setAppName] = useState<string | undefined>(undefined);
  const [reviewsData, setReviewsData] = useState<ReviewsData | null>(null);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const handleSubmit = async (appId: string) => {
    setError(null);
    setIsLoading(true);
    setInsights(null);
    
    try {
      // Step 1: Call the API to fetch reviews
      console.log('Fetching reviews for app ID:', appId);
      
      // Call our API endpoint to get the reviews
      const response = await fetch(`/api/reviews?appId=${encodeURIComponent(appId)}`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Received reviews:', data.reviews);
      
      // Store the reviews data
      setReviewsData(data);
      
      // Extract app name from response
      const simplifiedAppName = data.appName || appId.split('.').pop() || appId;
      setAppName(simplifiedAppName.charAt(0).toUpperCase() + simplifiedAppName.slice(1));
      
      // Step 2: Generate insights from reviews
      if (data.reviews && data.reviews.length > 0) {
        await generateInsights(data.appName, data.reviews);
      }
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      setReviewsData(null);
      setError('Failed to fetch reviews. Please check the app ID and try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const generateInsights = async (appName: string, reviews: Review[]) => {
    setIsGeneratingInsights(true);
    
    try {
      console.log('Generating insights for', appName);
      
      // Call the insights API
      const response = await fetch('/api/insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appName,
          reviews
        })
      });
      
      if (!response.ok) {
        throw new Error(`Insights API error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Received insights:', data.insights);
      
      // Store the insights
      setInsights(data.insights);
    } catch (error) {
      console.error('Error generating insights:', error);
      setError('Failed to generate insights. You can still view the reviews.');
    } finally {
      setIsGeneratingInsights(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">App Review Insights</h1>
          <p className="mt-1 text-sm text-gray-500">
            Generate AI-powered insights from Play Store app reviews
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
          
          {(isLoading || isGeneratingInsights) && (
            <div className="mt-8 flex flex-col items-center">
              <LoadingSpinner size="lg" />
              <p className="mt-4 text-gray-600">
                {isLoading ? 'Fetching reviews...' : 'Generating insights with AI...'}
              </p>
            </div>
          )}
          
          <InsightsSection 
            appName={appName}
            isLoading={isLoading}
            isGeneratingInsights={isGeneratingInsights}
            reviews={reviewsData?.reviews}
            insights={insights}
          />
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
