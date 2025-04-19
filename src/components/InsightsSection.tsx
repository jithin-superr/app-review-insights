import React from 'react';

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

interface InsightsSectionProps {
  appName?: string;
  reviews?: Review[];
  insights?: Insights | null;
  isLoading?: boolean;
  isGeneratingInsights?: boolean;
}

export default function InsightsSection({ 
  appName, 
  reviews = [], 
  insights = null,
  isLoading = false,
  isGeneratingInsights = false
}: InsightsSectionProps) {
  
  // If no data yet, show placeholder message
  if (!appName && !isLoading && !isGeneratingInsights && reviews.length === 0) {
    return (
      <div className="w-full mt-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Insights will appear here</h2>
        <p className="text-gray-500">
          Enter a Play Store app ID or URL above and click "Analyze Reviews" to generate insights.
        </p>
      </div>
    );
  }
  
  // Loading state for entire section
  if (isLoading) {
    return (
      <div className="w-full mt-8 p-6 bg-gray-50 rounded-lg border border-gray-200 animate-pulse">
        <div className="h-7 bg-gray-200 rounded-md w-3/4 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded-md w-full"></div>
          <div className="h-4 bg-gray-200 rounded-md w-5/6"></div>
          <div className="h-4 bg-gray-200 rounded-md w-4/6"></div>
        </div>
      </div>
    );
  }
  
  // Calculate basic stats from reviews
  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0 
    ? (reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews).toFixed(1) 
    : 'N/A';
  
  // Display insights
  return (
    <div className="w-full mt-8">
      {appName && (
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Insights for {appName}
          </h2>
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-600">
              <span className="font-semibold">{totalReviews}</span> reviews analyzed
            </div>
            <div className="text-sm text-gray-600">
              <span className="font-semibold">{averageRating}</span> average rating
            </div>
          </div>
        </div>
      )}
      
      {/* Review Summary Section */}
      <div className="mb-8 p-4 bg-white rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold mb-3">Review Summary</h3>
        <p className="text-gray-700 mb-4">
          {totalReviews} reviews were analyzed with an average rating of {averageRating}.
        </p>
        
        {/* Rating Distribution - Simple version */}
        <div className="mb-4">
          <h4 className="text-md font-medium mb-2">Rating Distribution</h4>
          <div className="flex flex-col gap-2">
            {[5, 4, 3, 2, 1].map(rating => {
              const count = reviews.filter(r => r.rating === rating).length;
              const percentage = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
              
              return (
                <div key={rating} className="flex items-center gap-2">
                  <div className="text-sm font-medium w-6">{rating}★</div>
                  <div className="flex-1 bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full" 
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <div className="text-xs text-gray-500 w-12">{count} ({percentage}%)</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Recent Reviews Section */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-3">Recent Reviews</h3>
        <div className="space-y-4">
          {reviews.slice(0, 3).map(review => (
            <div key={review.id} className="p-4 bg-white rounded-lg border border-gray-200">
              <div className="flex justify-between items-start mb-2">
                <div className="font-medium">{review.author}</div>
                <div className="flex items-center gap-1">
                  <span className="text-yellow-500">{review.rating}★</span>
                  <span className="text-xs text-gray-500">{review.date}</span>
                </div>
              </div>
              <p className="text-gray-700">{review.text}</p>
            </div>
          ))}
        </div>
      </div>
      
      {/* AI Generated Insights Section */}
      <div className="mt-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">AI Generated Insights</h3>
          {isGeneratingInsights && (
            <div className="flex items-center">
              <div className="w-4 h-4 mr-2 rounded-full bg-blue-600 opacity-75 animate-ping"></div>
              <span className="text-sm text-gray-600">Generating insights...</span>
            </div>
          )}
        </div>
        
        {/* Insight Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {insights ? (
            // Real insights from LLM
            <>
              <InsightCard 
                title="Common Praises" 
                items={insights.commonPraises} 
                icon="👍" 
              />
              <InsightCard 
                title="Common Complaints" 
                items={insights.commonComplaints} 
                icon="👎" 
              />
              <InsightCard 
                title="Feature Requests" 
                items={insights.featureRequests} 
                icon="💡" 
              />
              <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
                <h4 className="flex items-center text-lg font-semibold mb-3">
                  <span className="mr-2">📊</span>
                  User Experience
                </h4>
                <p className="text-gray-700">{insights.userExperience}</p>
              </div>
            </>
          ) : (
            // Placeholder cards while generating insights
            [
              { title: 'Common Praises', description: 'What users love about the app', icon: '👍' },
              { title: 'Common Complaints', description: 'Areas for improvement', icon: '👎' },
              { title: 'Feature Requests', description: 'What users want to see next', icon: '💡' },
              { title: 'User Experience', description: 'How users feel using the app', icon: '📊' }
            ].map((placeholderInsight, i) => (
              <div 
                key={i}
                className={`p-6 bg-white rounded-lg border border-gray-200 shadow-sm ${isGeneratingInsights ? 'opacity-60' : ''}`}
              >
                <h4 className="flex items-center text-lg font-semibold mb-2">
                  <span className="mr-2">{placeholderInsight.icon}</span>
                  {placeholderInsight.title}
                </h4>
                <p className="text-gray-600">
                  {placeholderInsight.description} {isGeneratingInsights ? '' : '(AI analysis will appear here)'}
                </p>
              </div>
            ))
          )}
        </div>
        
        {/* Sentiment Analysis Section */}
        {insights && insights.sentimentAnalysis && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Sentiment Analysis</h3>
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <div className="mb-4">
                <h4 className="text-md font-medium mb-2">Review Sentiment</h4>
                <div className="flex flex-col md:flex-row gap-4">
                  {/* Sentiment Chart */}
                  <div className="flex-1">
                    <div className="h-8 w-full bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500 rounded-l-full flex items-center justify-end"
                        style={{ width: `${insights.sentimentAnalysis.positivePercentage}%` }}
                      >
                        <span className="px-2 text-xs text-white font-medium">
                          {insights.sentimentAnalysis.positivePercentage}%
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between mt-1 text-xs text-gray-500">
                      <span>Positive</span>
                      <span>Negative</span>
                    </div>
                  </div>
                  
                  {/* Key Emotions */}
                  <div className="flex-1">
                    <h5 className="text-sm font-medium mb-1">Key Emotions Detected</h5>
                    <div className="flex flex-wrap gap-2">
                      {insights.sentimentAnalysis.keyEmotions.map((emotion, index) => (
                        <span 
                          key={index}
                          className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
                        >
                          {emotion}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Actionable Recommendations Section */}
        {insights && insights.actionableRecommendations && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-3">Actionable Recommendations</h3>
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
              <ul className="space-y-4">
                {insights.actionableRecommendations.map((recommendation, index) => (
                  <li key={index} className="flex items-start">
                    <div className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-blue-100 text-blue-800 font-bold mr-3">
                      {index + 1}
                    </div>
                    <p className="text-gray-700">{recommendation}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper component for displaying insight items
function InsightCard({ title, items, icon }: { title: string; items: string[]; icon: string }) {
  return (
    <div className="p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
      <h4 className="flex items-center text-lg font-semibold mb-3">
        <span className="mr-2">{icon}</span>
        {title}
      </h4>
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li key={index} className="text-gray-700">
            • {item}
          </li>
        ))}
      </ul>
    </div>
  );
} 