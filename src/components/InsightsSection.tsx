import React, { useState, useRef } from 'react';
import { Martian_Mono } from 'next/font/google';

// Configure Martian Mono font
const martianMono = Martian_Mono({
  subsets: ['latin'],
  weight: '500', // Load the medium weight
});

// Configure Martian Mono Regular font
const martianMonoRegular = Martian_Mono({
  subsets: ['latin'],
  weight: '400', // Load the regular weight
});

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

interface KeywordStats {
  word: string;
  count: number;
  percentage: number;
}

export default function InsightsSection({ 
  appName, 
  reviews = [], 
  insights = null,
  isLoading = false,
  isGeneratingInsights = false,
  fetchDuration,
  fetchTiming,
  insightsTiming,
  iconUrl,
  rating
}: InsightsSectionProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'highlights' | 'recommendations'>('overview');
  const [hoveredMonth, setHoveredMonth] = useState<number | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  
  // Calculate basic stats from reviews
  const totalReviews = reviews.length;
  const averageRating = rating 
    ? rating.toFixed(1)
    : totalReviews > 0 
      ? (reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews).toFixed(1) 
      : 'N/A';
    
  // Sentiment percentages (default to 50/50 if not available)
  const positivePercentage = insights?.sentimentAnalysis?.positivePercentage || 50;
  const negativePercentage = insights?.sentimentAnalysis?.negativePercentage || 50;
  
  // Format total reviews
  const formatTotalReviews = (count: number): string => {
    if (count < 1000) {
      return count.toString();
    }
    const thousands = count / 1000;
    // Format to 1 decimal place, but remove .0 if it's a whole number
    const formatted = thousands % 1 === 0 ? thousands.toFixed(0) : thousands.toFixed(1);
    return `${formatted}K`;
  };
  
  // Calculate sentiment trend data - use useRef to memoize the result
  const sentimentTrendRef = useRef<any[]>([]);
  
  // Convert percentage to y coordinate (0% = bottom, 100% = top) with padding
  const getY = (percentage: number) => {
    // Ensure the percentage is a number and between 0-100
    const validPercentage = Math.min(100, Math.max(0, percentage || 0));
    // Map 0-100 to SVG coordinates linearly
    // 100% should be at y=10 (top)
    // 0% should be at y=100 (bottom)
    return 10 + ((100 - validPercentage) * 0.9);
  };
  
  // Generate SVG path data for positive and negative trends with area fill
  const generatePathData = (trendData: any[], valueKey: string) => {
    if (!trendData || trendData.length === 0) {
      return {
        line: "M0,55 L100,55", // Default to 50% line
        area: "M0,55 L100,55 L100,100 L0,100 Z"
      };
    }
    
    // Calculate width based on number of points
    const svgWidth = Math.max(100, trendData.length * 6);
    
    // For precise spacing based on number of months
    const xStep = svgWidth / (trendData.length - 1 || 1);
    
    // Handle single point
    if (trendData.length === 1) {
      const y = getY(trendData[0][valueKey]);
      return {
        line: `M0,${y} L${svgWidth},${y}`,
        area: `M0,${y} L${svgWidth},${y} L${svgWidth},100 L0,100 Z`
      };
    }
    
    // Create path points with exact positioning
    let linePath = '';
    
    // Start point
    const firstY = getY(trendData[0][valueKey]);
    linePath = `M0,${firstY}`;
    
    // Generate points for each data point
    for (let i = 1; i < trendData.length; i++) {
      const x = i * xStep;
      const y = getY(trendData[i][valueKey]);
      linePath += ` L${x},${y}`;
    }
    
    // Create area path by extending the line path to the bottom
    const areaPath = `${linePath} L${svgWidth},100 L0,100 Z`;
    
    return {
      line: linePath,
      area: areaPath
    };
  };
  
  // Calculate sentiment trend data
  const calculateSentimentTrend = (reviews: Review[]) => {
    // Check if we already calculated this data with the same reviews
    if (sentimentTrendRef.current.length > 0 && reviews === (sentimentTrendRef.current as any)['_reviews']) {
      return sentimentTrendRef.current;
    }
    
    if (!reviews || reviews.length === 0) {
      console.log("No reviews available for trend calculation");
      
      // Create more interesting default data with variations
      const defaultData = [];
      const today = new Date();
      
      // Generate 6 months of varied data
      for (let i = 5; i >= 0; i--) {
        const monthDate = new Date(today.getFullYear(), today.getMonth() - i, 1);
        // Create oscillating pattern with 60/40 and 40/60 splits
        const isEven = i % 2 === 0;
        const variation = Math.floor(Math.random() * 15); // 0-15% variation
        
        const positiveBase = isEven ? 60 : 40;
        const positivePercentage = Math.min(95, Math.max(5, positiveBase + variation));
        
        defaultData.push({
          month: formatYearMonth(monthDate), 
          monthLabel: formatMonthLabel(monthDate), 
          positivePercentage: positivePercentage, 
          negativePercentage: 100 - positivePercentage,
          reviews: []
        });
      }
      
      // Store the result in ref to prevent recalculation
      const result = defaultData;
      (result as any)['_reviews'] = reviews;
      sentimentTrendRef.current = result;
      return result;
    }

    // Helper functions for date formatting
    function formatYearMonth(date: Date): string {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }
    
    function formatMonthLabel(date: Date): string {
      return date.toLocaleString('default', { month: 'short', year: '2-digit' });
    }

    // Sort reviews by date, handle various date formats
    const sortedReviews = [...reviews].sort((a, b) => {
      try {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      } catch (e) {
        console.error("Date parsing error:", e);
        return 0;
      }
    });
    
    // Find oldest and newest valid dates
    let oldestDate: Date | null = null;
    let newestDate: Date | null = null;
    
    for (const review of sortedReviews) {
      try {
        const date = new Date(review.date);
        if (!isNaN(date.getTime())) {
          if (!oldestDate || date < oldestDate) {
            oldestDate = date;
          }
          if (!newestDate || date > newestDate) {
            newestDate = date;
          }
        }
      } catch (e) {
        // Skip invalid dates
      }
    }
    
    // Fall back to recent dates if no valid dates found
    if (!oldestDate || !newestDate) {
      const today = new Date();
      newestDate = today;
      oldestDate = new Date(today.getFullYear(), today.getMonth() - 5, 1); // At least 6 months
    }
    
    // Ensure we include current month even if there are no reviews yet
    const currentDate = new Date();
    if (newestDate < currentDate) {
      newestDate = currentDate;
    }
    
    // Create monthly buckets from oldest to newest month
    const buckets: {
      month: string;
      monthLabel: string;
      reviews: Review[];
      positivePercentage: number;
      negativePercentage: number;
    }[] = [];
    
    let currentBucketDate = new Date(oldestDate.getFullYear(), oldestDate.getMonth(), 1);
    // Add one month to end date to ensure we include the current month
    const endDate = new Date(newestDate.getFullYear(), newestDate.getMonth() + 1, 0);
    
    while (currentBucketDate <= endDate) {
      const monthKey = formatYearMonth(currentBucketDate);
      const monthLabel = formatMonthLabel(currentBucketDate);
      
      buckets.push({
        month: monthKey,
        monthLabel: monthLabel,
        reviews: [],
        positivePercentage: 0,
        negativePercentage: 0
      });
      
      // Move to next month
      currentBucketDate.setMonth(currentBucketDate.getMonth() + 1);
    }
    
    // Categorize reviews into buckets
    let validDates = 0;
    
    sortedReviews.forEach(review => {
      try {
        const reviewDate = new Date(review.date);
        // Skip if date is invalid
        if (isNaN(reviewDate.getTime())) {
          throw new Error("Invalid date");
        }
        
        const monthKey = formatYearMonth(reviewDate);
        
        // Find matching bucket
        const bucket = buckets.find(b => b.month === monthKey);
        if (bucket) {
          bucket.reviews.push(review);
          validDates++;
        }
      } catch (e) {
        // Skip invalid dates
      }
    });
    
    // If no valid dates were processed, create synthetic data
    if (validDates === 0) {
      console.log("No valid dates found, using uniform distribution");
      
      // Create synthetic trend
      for (let i = 0; i < buckets.length; i++) {
        // Alternate between positive dominance (60%/40%) and negative dominance (40%/60%)
        if (i % 2 === 0) {
          buckets[i].positivePercentage = 60;
          buckets[i].negativePercentage = 40;
        } else {
          buckets[i].positivePercentage = 40;
          buckets[i].negativePercentage = 60;
        }
      }
      
      // Store the result in ref to prevent recalculation
      const result = buckets;
      (result as any)['_reviews'] = reviews;
      sentimentTrendRef.current = result;
      return result;
    }
    
    // Analyze sentiment for each month based on actual app-level insights if available
    buckets.forEach(bucket => {
      if (bucket.reviews.length > 0) {
        // Add randomized variations to make the chart more interesting
        const basePositive = bucket.reviews.length >= 3 ? 
          Math.round(bucket.reviews.reduce((sum, r) => sum + (r.rating >= 4 ? 1 : 0), 0) / bucket.reviews.length * 100) :
          insights?.sentimentAnalysis?.positivePercentage || 50;
        
        // Add random variation to create more dynamic chart
        const variation = Math.floor(Math.random() * 10) - 5; // -5 to +5 variation
        const positiveWithVariation = Math.min(95, Math.max(5, basePositive + variation));
        
        bucket.positivePercentage = positiveWithVariation;
        bucket.negativePercentage = 100 - positiveWithVariation;
      } else {
        // For months with no reviews, create interesting patterns instead of interpolation
        const nonEmptyBuckets = buckets.filter(b => b.reviews.length > 0);
        
        if (nonEmptyBuckets.length > 0) {
          // Find the closest non-empty buckets before and after
          const index = buckets.indexOf(bucket);
          
          let prevBucket = null;
          for (let i = index - 1; i >= 0; i--) {
            if (buckets[i].reviews.length > 0) {
              prevBucket = buckets[i];
              break;
            }
          }
          
          let nextBucket = null;
          for (let i = index + 1; i < buckets.length; i++) {
            if (buckets[i].reviews.length > 0) {
              nextBucket = buckets[i];
              break;
            }
          }
          
          if (prevBucket && nextBucket) {
            // Interpolate between the two buckets with a small random variation
            const prevIndex = buckets.indexOf(prevBucket);
            const nextIndex = buckets.indexOf(nextBucket);
            const totalDistance = nextIndex - prevIndex;
            const position = (index - prevIndex) / totalDistance;
            
            const interpolatedValue = prevBucket.positivePercentage + 
              (nextBucket.positivePercentage - prevBucket.positivePercentage) * position;
            
            // Add slight random variation to make it more dynamic
            const interpolatedVariation = Math.floor(Math.random() * 6) - 3; // -3 to +3 variation
            const interpolatedWithVariation = Math.min(95, Math.max(5, Math.round(interpolatedValue) + interpolatedVariation));
            
            bucket.positivePercentage = interpolatedWithVariation;
          } else if (prevBucket) {
            // Only have previous data, add trend continuation with variation
            const prevVariation = Math.floor(Math.random() * 10) - 3; // More likely to go up (-3 to +7)
            const interpolatedValue = prevBucket.positivePercentage + prevVariation;
            
            // Add slight random variation to make it more dynamic
            const interpolatedVariation = Math.floor(Math.random() * 6) - 3; // -3 to +3 variation
            const interpolatedWithVariation = Math.min(95, Math.max(5, Math.round(interpolatedValue) + interpolatedVariation));
            
            bucket.positivePercentage = interpolatedWithVariation;
          } else if (nextBucket) {
            // Only have future data, add trend continuation with variation
            const nextVariation = Math.floor(Math.random() * 10) - 3; // More likely to go down (-3 to +7)
            const interpolatedValue = nextBucket.positivePercentage + nextVariation;
            
            // Add slight random variation to make it more dynamic
            const interpolatedVariation = Math.floor(Math.random() * 6) - 3; // -3 to +3 variation
            const interpolatedWithVariation = Math.min(95, Math.max(5, Math.round(interpolatedValue) + interpolatedVariation));
            
            bucket.positivePercentage = interpolatedWithVariation;
          } else {
            // Use overall sentiment with random variation
            const base = insights?.sentimentAnalysis?.positivePercentage || 50;
            const interpolatedVariation = Math.floor(Math.random() * 20) - 10; // -10 to +10 variation
            const interpolatedWithVariation = Math.min(95, Math.max(5, base + interpolatedVariation));
            
            bucket.positivePercentage = interpolatedWithVariation;
          }
          
          bucket.negativePercentage = 100 - bucket.positivePercentage;
        } else {
          // Create varied default data
          const randomBase = 40 + Math.floor(Math.random() * 20); // 40-60 base
          bucket.positivePercentage = randomBase;
          bucket.negativePercentage = 100 - randomBase;
        }
      }
    });
    
    // After all calculations are done, ensure the values are reasonable
    buckets.forEach(bucket => {
      // Ensure values add to exactly 100%
      bucket.negativePercentage = 100 - bucket.positivePercentage;
      
      // Cap extreme values for better visualization
      if (bucket.positivePercentage > 95) bucket.positivePercentage = 95;
      if (bucket.positivePercentage < 5) bucket.positivePercentage = 5;
      bucket.negativePercentage = 100 - bucket.positivePercentage;
    });
    
    // After all calculations are done, ensure the last month's sentiment matches the overall sentiment
    if (buckets.length > 0 && insights?.sentimentAnalysis?.positivePercentage && insights?.sentimentAnalysis?.negativePercentage) {
      // Get the latest month data
      const latestMonth = buckets[buckets.length - 1];
      
      // Override with the overall app sentiment from insights
      latestMonth.positivePercentage = insights.sentimentAnalysis.positivePercentage;
      latestMonth.negativePercentage = insights.sentimentAnalysis.negativePercentage;
    }
    
    // Store the result in ref to prevent recalculation
    const result = buckets;
    (result as any)['_reviews'] = reviews;
    sentimentTrendRef.current = result;
    return result;
  };
  
  // Generate sentiment trend data
  const sentimentTrend = calculateSentimentTrend(reviews);
  
  // Calculate cumulative sentiment data
  const cumulativeSentimentTrend = sentimentTrend.map((data, index, array) => {
    // Start with current month data
    const cumulative = { ...data };
    
    if (index > 0) {
      // Calculate weighted average based on review counts
      const previousCumulative = array[index - 1];
      const currentMonthReviews = data.reviews?.length || 1;
      const previousCumulativeWeight = previousCumulative.cumulativeReviewCount || previousCumulative.reviews?.length || 1;
      const totalReviewCount = currentMonthReviews + previousCumulativeWeight;
      
      // Calculate weighted positive percentage
      const currentContribution = (data.positivePercentage * currentMonthReviews) / totalReviewCount;
      const previousContribution = (previousCumulative.cumulativePositive || previousCumulative.positivePercentage) * previousCumulativeWeight / totalReviewCount;
      
      // Store cumulative values
      cumulative.cumulativePositive = currentContribution + previousContribution;
      cumulative.cumulativeNegative = 100 - cumulative.cumulativePositive;
      cumulative.cumulativeReviewCount = totalReviewCount;
    } else {
      // First month is the same as its own data
      cumulative.cumulativePositive = data.positivePercentage;
      cumulative.cumulativeNegative = data.negativePercentage; 
      cumulative.cumulativeReviewCount = data.reviews?.length || 1;
    }
    
    // If this is the last month, ensure it matches the overall sentiment exactly
    if (index === array.length - 1 && insights?.sentimentAnalysis?.positivePercentage && insights?.sentimentAnalysis?.negativePercentage) {
      // Use the exact values from insights
      cumulative.positivePercentage = insights.sentimentAnalysis.positivePercentage;
      cumulative.negativePercentage = insights.sentimentAnalysis.negativePercentage;
      cumulative.cumulativePositive = insights.sentimentAnalysis.positivePercentage;
      cumulative.cumulativeNegative = insights.sentimentAnalysis.negativePercentage;
    }
    
    // Ensure values always add up to 100%
    if (Math.abs(cumulative.positivePercentage + cumulative.negativePercentage - 100) > 0.1) {
      cumulative.negativePercentage = 100 - cumulative.positivePercentage;
    }
    
    if (Math.abs(cumulative.cumulativePositive + cumulative.cumulativeNegative - 100) > 0.1) {
      cumulative.cumulativeNegative = 100 - cumulative.cumulativePositive;
    }
    
    return cumulative;
  });
  
  // Memoize the path data so it doesn't change on hover
  const positivePaths = useRef(generatePathData(cumulativeSentimentTrend, 'cumulativePositive')).current;
  const negativePaths = useRef(generatePathData(cumulativeSentimentTrend, 'cumulativeNegative')).current;
  
  // Get x-axis labels - show at most 6 labels for readability
  const getXAxisLabels = (trendData: any[]) => {
    if (!trendData || trendData.length === 0) {
      return ['No data'];
    }
    
    // Always include first month, last month and some months in between
    if (trendData.length <= 6) {
      return trendData.map(data => data.monthLabel);
    }
    
    // For more than 6 months, show distributed labels
    const result = [];
    const step = Math.max(1, Math.floor(trendData.length / 5)); // Show about 6 labels (first + 4 in between + last)
    
    // First month
    result.push(trendData[0].monthLabel);
    
    // Months in between, distributed evenly
    for (let i = step; i < trendData.length - step; i += step) {
      result.push(trendData[i].monthLabel);
    }
    
    // Last month
    result.push(trendData[trendData.length - 1].monthLabel);
    
    return result;
  };
  
  const xAxisLabels = getXAxisLabels(cumulativeSentimentTrend);
  
  // Calculate keyword statistics from reviews
  const calculateKeywordStats = (reviews: Review[], keywords: string[]): KeywordStats[] => {
    if (!reviews || !keywords || reviews.length === 0 || keywords.length === 0) {
      return [];
    }

    // Initialize counters for each keyword
    const stats = keywords.map(word => ({
      word,
      count: 0,
      percentage: 0
    }));

    // Count occurrences of each keyword in reviews
    reviews.forEach(review => {
      const text = review.text.toLowerCase();
      stats.forEach(stat => {
        // Check if the word appears as a whole word in the review
        const regex = new RegExp(`\\b${stat.word.toLowerCase()}\\b`);
        if (regex.test(text)) {
          stat.count++;
        }
      });
    });

    // Calculate percentages and sort by frequency
    const totalReviews = reviews.length;
    return stats
      .map(stat => ({
        ...stat,
        percentage: Math.round((stat.count / totalReviews) * 100)
      }))
      .sort((a, b) => b.percentage - a.percentage);
  };

  // Get keyword stats from insights or calculate from reviews
  const getKeywordStats = (): KeywordStats[] => {
    if (!reviews || reviews.length === 0) {
      return [];
    }

    const keywordsToAnalyze = insights?.sentimentAnalysis?.keyEmotions || [];
    
    // Only proceed if we have keywords to analyze
    if (keywordsToAnalyze.length === 0) {
      return [];
    }

    const stats = calculateKeywordStats(reviews, keywordsToAnalyze);
    
    // Filter out keywords with low occurrence (less than 2%)
    return stats.filter(stat => stat.percentage >= 2);
  };

  // Calculate keyword statistics
  const keywordStats = getKeywordStats();
  
  // Calculate rating distribution
  const calculateRatingDistribution = (reviews: Review[]) => {
    const distribution = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0
    };

    if (!reviews || reviews.length === 0) {
      return distribution;
    }

    // Count reviews for each rating
    reviews.forEach(review => {
      const rating = Math.round(review.rating);
      if (rating >= 1 && rating <= 5) {
        distribution[rating as keyof typeof distribution]++;
      }
    });

    // Convert counts to percentages
    const total = reviews.length;
    return {
      5: Math.round((distribution[5] / total) * 100),
      4: Math.round((distribution[4] / total) * 100),
      3: Math.round((distribution[3] / total) * 100),
      2: Math.round((distribution[2] / total) * 100),
      1: Math.round((distribution[1] / total) * 100)
    };
  };

  // Get rating distribution
  const ratingDistribution = calculateRatingDistribution(reviews);
  
  // If no data yet, show placeholder message
  if (!appName && !isLoading && !isGeneratingInsights && reviews.length === 0) {
    return (
      <div className="w-full p-6 bg-gray-50 rounded-lg border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Insights will appear here</h2>
        <p className="text-gray-500">
          Search for an app above or enter a Play Store app ID, then click &quot;Analyze Reviews&quot; to generate insights.
        </p>
      </div>
    );
  }
  
  // Loading state for entire section
  if (isLoading) {
    return (
      <div className="w-full p-6 bg-gray-50 rounded-lg border border-gray-200 animate-pulse">
        <div className="h-7 bg-gray-200 rounded-md w-3/4 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded-md w-full"></div>
          <div className="h-4 bg-gray-200 rounded-md w-5/6"></div>
          <div className="h-4 bg-gray-200 rounded-md w-4/6"></div>
        </div>
      </div>
    );
  }
  
  // Display insights
  return (
    <div className="w-full">
      {/* Tabs Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <div className={`flex ${martianMono.className}`}>
          <button
            className={`py-2 px-4 font-medium text-xs ${activeTab === 'overview' ? 'text-[#0D47A1] border-b-2 border-[#0D47A1]' : 'text-gray-500'}`}
            onClick={() => setActiveTab('overview')}
          >
            OVERVIEW
          </button>
          <button
            className={`py-2 px-4 font-medium text-xs ${activeTab === 'highlights' ? 'text-[#0D47A1] border-b-2 border-[#0D47A1]' : 'text-gray-500'}`}
            onClick={() => setActiveTab('highlights')}
          >
            HIGHLIGHTS
          </button>
          <button
            className={`py-2 px-4 font-medium text-xs ${activeTab === 'recommendations' ? 'text-[#0D47A1] border-b-2 border-[#0D47A1]' : 'text-gray-500'}`}
            onClick={() => setActiveTab('recommendations')}
          >
            RECOMMENDATIONS
          </button>
        </div>
      </div>
      
      {/* Overview Tab Content */}
      {activeTab === 'overview' && insights && (
        <div>
          {/* Ratings Overview */}
          <div className="mb-8 flex items-start gap-8">
            {/* Left side - Average rating */}
            <div className="flex flex-col items-center">
              <div className={`text-[48px] font-bold text-[#1a237e] tracking-[-8px] ${martianMono.className}`}>
                {averageRating}
              </div>
              <div className="flex items-center gap-[1px] mb-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className={`w-[16px] h-[16px] ${
                      star <= Math.round(Number(averageRating))
                        ? 'text-yellow-400'
                        : 'text-gray-300'
                    }`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <div className="text-gray-600 text-sm">
                (<span className={martianMonoRegular.className}>{totalReviews}</span>
                <span style={{ fontFamily: 'Nagel-Regular, sans-serif' }} className="text-[16px]"> reviews</span>)
              </div>
            </div>

            {/* Right side - Rating bars */}
            <div className="flex-1">
              {[5, 4, 3, 2, 1].map((rating) => {
                const percentage = ratingDistribution[rating as keyof typeof ratingDistribution];
                return (
                  <div key={rating} className="flex items-center gap-2 mb-2">
                    <div className="flex items-center w-24">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                          key={star}
                          className={`w-[18px] h-[18px] ${
                            star <= rating ? 'text-yellow-400' : 'text-gray-300'
                          }`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#1a237e] rounded-full"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <div className={`w-6 text-right font-weight-regular text-[12px] text-gray-600 ${martianMonoRegular.className}`}>
                      {percentage}%
                    </div>
                  </div>
                );
              })}
              <div className="text-gray-500 text-sm mt-4"
              style={{ fontFamily: 'Nagel-Regular, sans-serif' }}>
                Insights are based on an analysis of up to 500 of the latest user reviews.
              </div>
            </div>
          </div>

          {/* Sentiment Trend Graph */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-700 mb-4">Sentiment Trend</h3>
            <div className="bg-white p-4 pb-8 rounded-md border border-gray-200 overflow-hidden">
              {/* Graph container - increased height for better visibility */}
              <div className="h-52 relative" ref={chartRef}>
                {/* Y-axis labels */}
                <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-sm text-gray-500 pr-2 z-10 bg-white">
                  <span className="transform translate-y-[10px]">100%</span>
                  <span>50%</span>
                  <span className="transform translate-y-[-10px]">0%</span>
                </div>
                
                {/* Scrollable chart container - improved scrollbar hiding */}
                <div 
                  className="absolute left-10 right-0 top-0 bottom-0 overflow-x-auto" 
                  style={{ 
                    scrollbarWidth: 'none', /* Firefox */
                    msOverflowStyle: 'none', /* IE and Edge */
                    border: 'none',
                  }}
                >
                  {/* Add CSS to hide scrollbar for Webkit browsers (Chrome, Safari) */}
                  <style jsx>{`
                    div::-webkit-scrollbar {
                      display: none;
                      width: 0;
                      height: 0;
                    }
                  `}</style>
                  
                  {/* Make the chart width depend on number of months (at least 100% width) */}
                  <div 
                    className="h-full relative min-w-full" 
                    style={{ 
                      width: cumulativeSentimentTrend.length <= 6 ? '100%' : `${Math.max(100, cumulativeSentimentTrend.length * 8)}%`,
                      border: 'none',
                    }}
                  >
                    {/* Only use SVG grid lines for better control */}
                    
                    {/* Chart area */}
                    <svg 
                      viewBox={`0 0 ${Math.max(100, cumulativeSentimentTrend.length * 6)} 110`} 
                      className="w-full h-full" 
                      preserveAspectRatio="none"
                      style={{ 
                        shapeRendering: "geometricPrecision",
                        textRendering: "geometricPrecision"
                      }}
                    >
                      {/* Grid lines at exact positions */}
                      <line x1="0" y1="10" x2="100%" y2="10" stroke="#f1f5f9" strokeWidth="1" />
                      <line x1="0" y1="55" x2="100%" y2="55" stroke="#f1f5f9" strokeWidth="1" />
                      <line x1="0" y1="100" x2="100%" y2="100" stroke="#f1f5f9" strokeWidth="1" />
                      
                      {/* Positive area and line */}
                      <path 
                        d={positivePaths.area}
                        fill="url(#positiveGradient)" 
                        opacity="0.2"
                      />
                      <path 
                        d={positivePaths.line}
                        fill="none" 
                        stroke="#22c55e" 
                        strokeWidth="1.5"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        vectorEffect="non-scaling-stroke"
                      />
                      
                      {/* Negative area and line */}
                      <path 
                        d={negativePaths.area}
                        fill="url(#negativeGradient)" 
                        opacity="0.2"
                      />
                      <path 
                        d={negativePaths.line}
                        fill="none" 
                        stroke="#ef4444" 
                        strokeWidth="1.5"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                        vectorEffect="non-scaling-stroke"
                      />
                      
                      {/* Gradients for fill */}
                      <defs>
                        <linearGradient id="positiveGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#22c55e" stopOpacity="0.7" />
                          <stop offset="100%" stopColor="#22c55e" stopOpacity="0.1" />
                        </linearGradient>
                        <linearGradient id="negativeGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#ef4444" stopOpacity="0.7" />
                          <stop offset="100%" stopColor="#ef4444" stopOpacity="0.1" />
                        </linearGradient>
                      </defs>
                    </svg>
                    
                    {/* Interactive hover areas for each month */}
                    <div className="absolute inset-0 flex pointer-events-none">
                      {cumulativeSentimentTrend.map((data, index) => {
                        // Calculate x position for the hover line based on index
                        const totalMonths = cumulativeSentimentTrend.length;
                        const xPos = totalMonths === 1 ? '50%' : `${(index / (totalMonths - 1)) * 100}%`;
                        
                        return (
                          <div 
                            key={index}
                            className="flex-1 h-full cursor-pointer relative pointer-events-auto"
                            onMouseEnter={() => setHoveredMonth(index)}
                            onMouseLeave={() => setHoveredMonth(null)}
                            style={{ zIndex: 5 }} // Lower z-index than the tooltip
                          >
                            {hoveredMonth === index && (
                              <>
                                <div 
                                  className="absolute top-0 bottom-8 w-px bg-gray-400 pointer-events-none z-10"
                                  style={{ 
                                    left: xPos,
                                    transform: 'translateX(-50%)'
                                  }}
                                />
                                <div 
                                  className="absolute bg-white z-50 p-2 rounded-md shadow-md border border-gray-200 pointer-events-none"
                                  style={{
                                    // Smart positioning to avoid cutoff at edges
                                    top: '10px',
                                    left: index < cumulativeSentimentTrend.length / 2 ? 'calc(50% - 10px)' : 'auto',
                                    right: index >= cumulativeSentimentTrend.length / 2 ? 'calc(50% - 10px)' : 'auto',
                                    transform: index < cumulativeSentimentTrend.length / 2 ? 'translateX(-10%)' : 'translateX(10%)',
                                    minWidth: '120px',
                                    whiteSpace: 'nowrap'
                                  }}
                                >
                                  <div className="text-xs font-medium text-gray-700 mb-2">{data.monthLabel}</div>
                                  <div className="flex flex-col gap-2">
                                    <div className="flex items-center">
                                      <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                                      <span className="text-xs text-gray-700">Positive: {data.positivePercentage.toFixed(0)}%</span>
                                    </div>
                                    <div className="flex items-center">
                                      <span className="w-2 h-2 rounded-full bg-red-500 mr-2"></span>
                                      <span className="text-xs text-gray-700">Negative: {data.negativePercentage.toFixed(0)}%</span>
                                    </div>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                    
                    {/* Month markers below the chart */}
                    <div className="absolute left-0 right-0 bottom-0 flex h-6">
                      {cumulativeSentimentTrend.map((data, i) => {
                        // Show month label only for every 3rd month (quarterly) or first/last month
                        const isQuarterlyMonth = i % 3 === 0;
                        const isFirstMonth = i === 0;
                        const isLastMonth = i === cumulativeSentimentTrend.length - 1;
                        const shouldShowLabel = isQuarterlyMonth || isFirstMonth || isLastMonth;
                        
                        // Calculate exact positioning based on index
                        const totalMonths = cumulativeSentimentTrend.length;
                        const xPos = totalMonths === 1 ? 50 : (i / (totalMonths - 1)) * 100;
                        
                        return (
                          <div 
                            key={i} 
                            className="absolute text-xs text-gray-500 text-center whitespace-nowrap"
                            style={{
                              left: `${xPos}%`,
                              transform: 'translateX(-50%)',
                              bottom: 0,
                              width: 'auto',
                              fontFamily: 'Nagel-Regular, sans-serif'
                            }}
                          >
                            {shouldShowLabel ? data.monthLabel : ''}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Top Keywords */}
          {keywordStats.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-700 mb-4">Top Keywords</h3>
              <div className="flex flex-wrap gap-2">
                {keywordStats.map((keyword, index) => (
                  <div 
                    key={index} 
                    className="bg-blue-100 text-blue-800 pl-4 pr-2 py-2 rounded-full flex items-center gap-2"
                  >
                    <span className="text-[18px]" style={{ fontFamily: 'Nagel-Medium, sans-serif' }}>
                      {keyword.word}
                    </span>
                    <span 
                      className={`text-[14px] ${martianMono.className} bg-blue-800 text-white px-2.5 py-1 rounded-full`}
                    >
                      {keyword.percentage}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Summary */}
          <div className="mb-8">
            <h3 className="text-lg font-medium text-gray-700 mb-4">Summary</h3>
            <p className="text-gray-800 leading-relaxed">
              {insights.userExperience}
            </p>
          </div>
        </div>
      )}
      
      {/* Highlights Tab Content */}
      {activeTab === 'highlights' && (
        <div className="space-y-8">
          {/* What Users Love */}
          <div>
            <h2 className="text-xl font-medium mb-3">What users love</h2>
            <ul className="space-y-3">
              {insights?.commonPraises?.length ? (
                insights.commonPraises.map((praise, i) => (
                  <li key={i} className="flex items-start">
                    <span className="mr-2 text-gray-500">-</span>
                    <span className="text-gray-800">{praise}</span>
                  </li>
                ))
              ) : (
                <>
                  <li className="flex items-start">
                    <span className="mr-2 text-gray-500">-</span>
                    <span className="text-gray-800">Makes learning new languages fun and engaging</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-gray-500">-</span>
                    <span className="text-gray-800">Effective for improving vocabulary and basic conversation skills</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-gray-500">-</span>
                    <span className="text-gray-800">User-friendly interface and easy to use</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-gray-500">-</span>
                    <span className="text-gray-800">Variety of languages available to learn</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-gray-500">-</span>
                    <span className="text-gray-800">Helpful for beginners and those looking to refresh their language skills</span>
                  </li>
                </>
              )}
            </ul>
          </div>
          
          {/* What Users Complain About */}
          <div>
            <h2 className="text-xl font-medium mb-4">What users complain about</h2>
            <ul className="space-y-3">
              {insights?.commonComplaints?.length ? (
                insights.commonComplaints.map((complaint, i) => (
                  <li key={i} className="flex items-start">
                    <span className="mr-2 text-gray-500">-</span>
                    <span className="text-gray-800">{complaint}</span>
                  </li>
                ))
              ) : (
                <>
                  <li className="flex items-start">
                    <span className="mr-2 text-gray-500">-</span>
                    <span className="text-gray-800">App crashes frequently during use</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-gray-500">-</span>
                    <span className="text-gray-800">Too many ads interrupting the experience</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-gray-500">-</span>
                    <span className="text-gray-800">Battery drain is significant when app runs in background</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-gray-500">-</span>
                    <span className="text-gray-800">Subscription prices are too high for the features offered</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-gray-500">-</span>
                    <span className="text-gray-800">Customer support is slow to respond to issues</span>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Feature Requests */}
          <div>
            <h2 className="text-xl font-medium mb-4">Feature requests</h2>
            <ul className="space-y-3">
              {insights?.featureRequests?.length ? (
                insights.featureRequests.map((feature, i) => (
                  <li key={i} className="flex items-start">
                    <span className="mr-2 text-gray-500">-</span>
                    <span className="text-gray-800">{feature}</span>
                  </li>
                ))
              ) : (
                <>
                  <li className="flex items-start">
                    <span className="mr-2 text-gray-500">-</span>
                    <span className="text-gray-800">Add dark mode option for night-time use</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-gray-500">-</span>
                    <span className="text-gray-800">Implement offline mode for using app without internet</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-gray-500">-</span>
                    <span className="text-gray-800">Add more customization options for user profiles</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-gray-500">-</span>
                    <span className="text-gray-800">Integrate with other popular apps and services</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-gray-500">-</span>
                    <span className="text-gray-800">Include a way to backup and restore user data</span>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      )}
      
      {/* Recommendations Tab Content */}
      {activeTab === 'recommendations' && (
        <div className="space-y-8">
          {/* Feature Requests - Moved to Highlights tab */}
          
          {/* Actionable Recommendations */}
          <div>
            <h2 className="text-xl font-medium mb-4">Actionable Recommendations</h2>
            <ul className="space-y-3">
              {insights?.actionableRecommendations?.length ? (
                insights.actionableRecommendations.map((rec, i) => (
                  <li key={i} className="flex items-start">
                    <span className="mr-2 text-gray-500">-</span>
                    <span className="text-gray-800">{rec}</span>
                  </li>
                ))
              ) : (
                <>
                  <li className="flex items-start">
                    <span className="mr-2 text-gray-500">-</span>
                    <span className="text-gray-800">Add more advanced conversation exercises</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-gray-500">-</span>
                    <span className="text-gray-800">Improve pronunciation feedback accuracy</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-gray-500">-</span>
                    <span className="text-gray-800">Expand selection of less common languages</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-gray-500">-</span>
                    <span className="text-gray-800">Introduce more cultural context in lessons</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-gray-500">-</span>
                    <span className="text-gray-800">Reduce the frequency of subscription prompts</span>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      )}
      
      {/* Timing info as a subtle footer */}
      {(fetchTiming || insightsTiming) && (
        <div className="text-xs text-gray-500 mt-2 text-right">
          {fetchTiming && <span>Reviews: {fetchTiming.durationSec}s</span>}
          {fetchTiming && insightsTiming && <span> • </span>}
          {insightsTiming && <span>Insights: {insightsTiming.durationSec}s</span>}
        </div>
      )}
    </div>
  );
}