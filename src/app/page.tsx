'use client';

import { useState } from 'react';
import AppInputForm from '@/components/AppInputForm';
import InsightsSection from '@/components/InsightsSection';
import LoadingSpinner from '@/components/LoadingSpinner';
import RiveLoader from '@/components/RiveLoader';

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
  iconUrl?: string;
  rating?: number;
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
        insightsTiming: data.insightsTiming,
        iconUrl: data.iconUrl,
        rating: data.rating
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
    <div className="min-h-screen bg-[#EFF1F3]">
      {/* Top navigation bar - Logo only */}
      <header className="py-0">
        <div className="px-6 pb-3 pt-6">
          <div className="flex items-center justify-start rounded-xl border border-[#D0D9E6] w-full bg-white flex-shrink-0 px-4 py-2">
            {/* Logo on the left */}
            <div className="flex items-center gap-2" style={{ color: '#0D47A1' }}>
              {/* SVG Icon */}
              <svg width="20" height="20" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="11.9999" height="11.9999" rx="2" fill="url(#paint0_linear_172_6459)"/>
                <mask id="mask0_172_6459" style={{ maskType: 'alpha' }} maskUnits="userSpaceOnUse" x="0" y="0" width="12" height="12">
                  <rect width="11.9999" height="11.9999" rx="2" fill="#D9D9D9"/>
                </mask>
                <g mask="url(#mask0_172_6459)">
                  <circle opacity="0.75" cx="-2.96042" cy="6.06985" r="5.37552" stroke="white" strokeWidth="0.489021"/>
                  <circle opacity="0.625" cx="-2.95869" cy="6.07011" r="7.59209" stroke="white" strokeWidth="0.441477"/>
                  <circle opacity="0.375" cx="-2.95946" cy="6.06983" r="11.9058" stroke="white" strokeWidth="0.343371"/>
                  <circle opacity="0.5" cx="-2.96079" cy="6.07046" r="9.67593" stroke="white" strokeWidth="0.392424"/>
                  <circle opacity="0.25" cx="-2.96116" cy="6.07009" r="13.9763" stroke="white" strokeWidth="0.294318"/>
                </g>
                <defs>
                  <linearGradient id="paint0_linear_172_6459" x1="0" y1="0" x2="11.9999" y2="11.9999" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#518BE6"/>
                    <stop offset="1" stopColor="#033B91"/>
                  </linearGradient>
                </defs>
              </svg>
              
              {/* Text with correct color and font */}
              <div className="text-[20px]">
                <span style={{ fontFamily: 'Nagel, sans-serif', fontWeight: 500 }}>Echo</span><span style={{ fontFamily: 'Nagel, sans-serif', fontWeight: 400 }}>Box</span>
              </div>
            </div>

            {/* Search bar removed from here */}
          </div>
        </div>
      </header>
      
      <main className="px-6">
        {/* Initial search input when no app is selected yet */}
        {!appName && !isLoading && (
          <div className="mb-8 w-full max-w-xl mx-auto">
            <AppInputForm onSubmit={handleSubmit} isLoading={isLoading} />
          </div>
        )}
        
        {error && (
          <div className="my-4 p-4 bg-red-50 border border-red-200 rounded-md max-w-xl mx-auto">
            <p className="text-red-600">{error}</p>
          </div>
        )}
        
        {isLoading && (
          <div className="my-6 flex flex-col items-center">
            <RiveLoader size="lg" />
            <p className="mt-4 text-gray-600">
              Fetching reviews and generating insights...
            </p>
          </div>
        )}
        
        {/* Render content in a two-column layout when not loading and data is available */}
        {!isLoading && (reviewsData || insights) && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
            {/* App information column - takes 4/12 of grid on medium screens and up */}
            <div className="md:col-span-4">
              
              {/* Search Bar Above App Info */}
              <div className="mb-3">
                <AppInputForm onSubmit={handleSubmit} isLoading={isLoading} />
              </div>
              
              {/* Combined App Info and Screenshots Card */}
              {appName && reviewsData && (
                <div className="bg-white rounded-xl border border-[#D0D9E6] p-6">
                  {/* App Info Section */}
                  <div className="flex items-center gap-4 mb-6">
                    {/* App Icon - Update size and radius */}
                    {reviewsData.iconUrl ? (
                      <img 
                        src={reviewsData.iconUrl} 
                        alt={`${appName} icon`} 
                        className="w-[72px] h-[72px] rounded-xl object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const parent = target.parentElement;
                          if (parent) {
                            // Ensure fallback div also gets updated size/radius
                            parent.classList.add('bg-green-500', 'flex', 'items-center', 'justify-center', 'text-white', 'text-2xl', 'w-[72px]', 'h-[72px]', 'rounded-xl');
                            parent.textContent = appName?.charAt(0) || 'A';
                          }
                        }}
                      />
                    ) : (
                      <div className="w-[72px] h-[72px] bg-green-500 rounded-xl flex items-center justify-center text-white text-2xl overflow-hidden">
                        {appName?.charAt(0) || 'A'}
                      </div>
                    )}
                    
                    {/* App Text Info - Adjust height to match new icon */}
                    <div className="flex flex-col justify-between h-[72px]">
                      <h2 className="text-[16px] font-medium text-gray-800">
                        {appName}
                      </h2>
                      <div className="flex items-center">
                        <span className="text-[12px] font-medium text-gray-700">{reviewsData?.rating?.toFixed(1) || 'N/A'}</span>
                        <svg width="16" height="16" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg" className="ml-1">
                          <g clipPath="url(#clip0_171_6331)">
                            <path d="M9.15144 4.48637L7.39363 6.00317L7.92917 8.27153C7.95872 8.39467 7.95111 8.5238 7.90731 8.64262C7.8635 8.76143 7.78547 8.8646 7.68306 8.93909C7.58065 9.01358 7.45846 9.05604 7.33193 9.06112C7.20539 9.0662 7.08019 9.03366 6.97214 8.96762L4.99949 7.75356L3.02566 8.96762C2.91762 9.03328 2.79257 9.06551 2.66626 9.06024C2.53995 9.05498 2.41801 9.01246 2.31582 8.93803C2.21362 8.86361 2.13573 8.76061 2.09195 8.64201C2.04817 8.52341 2.04047 8.3945 2.0698 8.27153L2.6073 6.00317L0.849487 4.48637C0.753901 4.40376 0.684771 4.29482 0.650731 4.17315C0.616691 4.05148 0.619249 3.92248 0.658087 3.80226C0.696925 3.68204 0.770321 3.57592 0.869108 3.49716C0.967896 3.4184 1.0877 3.3705 1.21355 3.35942L3.51824 3.17348L4.4073 1.02192C4.45542 0.90466 4.53733 0.804359 4.6426 0.733769C4.74787 0.663179 4.87176 0.625488 4.99851 0.625488C5.12526 0.625488 5.24915 0.663179 5.35442 0.733769C5.45969 0.804359 5.5416 0.90466 5.58972 1.02192L6.47839 3.17348L8.78308 3.35942C8.90918 3.37008 9.02934 3.41772 9.12848 3.49637C9.22763 3.57502 9.30136 3.68118 9.34044 3.80155C9.37952 3.92192 9.38221 4.05114 9.34817 4.17303C9.31414 4.29492 9.24488 4.40406 9.1491 4.48676L9.15144 4.48637Z" fill="url(#paint0_linear_171_6331)"/>
                          </g>
                          <defs>
                            <linearGradient id="paint0_linear_171_6331" x1="9" y1="9" x2="1" y2="1" gradientUnits="userSpaceOnUse">
                              <stop stopColor="#FFB700"/>
                              <stop offset="1" stopColor="#FFE600"/>
                            </linearGradient>
                            <clipPath id="clip0_171_6331">
                              <rect width="10" height="10" fill="white"/>
                            </clipPath>
                          </defs>
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  {/* Screenshots section moved inside */}
                  <div>
                    <h3 className="text-lg font-medium text-gray-700 mb-4">Screenshots</h3>
                    <div className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                      {/* Hide WebKit/Chrome scrollbar */}
                      <style jsx>{`
                        div::-webkit-scrollbar {
                          display: none;
                        }
                      `}</style>
                      {/* Sample screenshots - fixed dimensions */}
                      <div className="w-[122px] h-[217px] bg-gray-200 rounded-lg flex-shrink-0"></div>
                      <div className="w-[122px] h-[217px] bg-gray-200 rounded-lg flex-shrink-0"></div>
                      <div className="w-[122px] h-[217px] bg-gray-200 rounded-lg flex-shrink-0"></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Insights column - takes 8/12 of grid on medium screens and up */}
            <div className="md:col-span-8">
              {/* Wrap InsightsSection in a styled box */}
              <div className="bg-white rounded-xl border border-[#D0D9E6] p-6">
                <InsightsSection 
                  appName={appName}
                  reviews={reviewsData?.reviews}
                  insights={insights}
                  fetchDuration={reviewsData?.fetchDuration}
                  fetchTiming={reviewsData?.fetchTiming}
                  insightsTiming={reviewsData?.insightsTiming}
                  iconUrl={reviewsData?.iconUrl}
                  rating={reviewsData?.rating}
                />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
