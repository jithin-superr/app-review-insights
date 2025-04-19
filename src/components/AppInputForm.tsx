import React, { useState } from 'react';
import LoadingSpinner from './LoadingSpinner';

interface AppInputFormProps {
  onSubmit: (appId: string) => Promise<void>;
}

export default function AppInputForm({ onSubmit }: AppInputFormProps) {
  const [appInput, setAppInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!appInput.trim()) {
      setError('Please enter an app ID or URL');
      return;
    }
    
    // Extract app ID if URL was entered
    let appId = appInput;
    if (appInput.includes('play.google.com/store/apps/details')) {
      try {
        const url = new URL(appInput);
        const idParam = url.searchParams.get('id');
        if (idParam) {
          appId = idParam;
        }
      } catch (_) {
        // URL parsing failed, continue with original input
      }
    }

    setError('');
    setIsLoading(true);
    
    try {
      await onSubmit(appId);
    } catch (_) {
      setError('Failed to fetch reviews. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col">
          <label htmlFor="app-input" className="text-sm font-medium mb-1 text-black">
            Play Store App ID or URL
          </label>
          <input
            id="app-input"
            type="text"
            value={appInput}
            onChange={(e) => setAppInput(e.target.value)}
            placeholder="Enter app ID (e.g., com.duolingo, com.spotify.music)"
            className="px-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            disabled={isLoading}
          />
          {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>
        
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <LoadingSpinner size="sm" />
              <span className="ml-2">Fetching reviews...</span>
            </div>
          ) : (
            'Analyze Reviews'
          )}
        </button>
      </form>
    </div>
  );
} 