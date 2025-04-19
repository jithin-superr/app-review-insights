import React, { useState } from 'react';
import LoadingSpinner from './LoadingSpinner';
import AppSearchInput from './AppSearchInput';

interface AppInputFormProps {
  onSubmit: (appId: string) => Promise<void>;
}

export default function AppInputForm({ onSubmit }: AppInputFormProps) {
  const [appId, setAppId] = useState('');
  const [selectedAppName, setSelectedAppName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [inputMethod, setInputMethod] = useState<'search' | 'manual'>('search');

  const handleSelectApp = (newAppId: string, appName: string) => {
    setAppId(newAppId);
    setSelectedAppName(appName);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!appId.trim()) {
      setError('Please select an app or enter an app ID');
      return;
    }

    setError('');
    setIsLoading(true);
    
    try {
      await onSubmit(appId);
    } catch {
      setError('Failed to fetch reviews. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="flex justify-between mb-4">
        <button
          type="button"
          onClick={() => setInputMethod('search')}
          className={`px-4 py-2 text-sm font-medium rounded-md ${
            inputMethod === 'search' 
              ? 'bg-blue-100 text-blue-700' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Search for app
        </button>
        <button
          type="button"
          onClick={() => setInputMethod('manual')}
          className={`px-4 py-2 text-sm font-medium rounded-md ${
            inputMethod === 'manual' 
              ? 'bg-blue-100 text-blue-700' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Enter app ID manually
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col">
          {inputMethod === 'search' ? (
            <>
              <label htmlFor="app-search" className="text-sm font-medium mb-1 text-black">
                Search for a Play Store app
              </label>
              <AppSearchInput 
                onSelect={handleSelectApp} 
                disabled={isLoading} 
              />
              {selectedAppName && (
                <p className="mt-2 text-sm text-green-600">
                  Selected: <span className="font-medium">{selectedAppName}</span> ({appId})
                </p>
              )}
            </>
          ) : (
            <>
              <label htmlFor="app-input" className="text-sm font-medium mb-1 text-black">
                Play Store App ID
              </label>
              <input
                id="app-input"
                type="text"
                value={appId}
                onChange={(e) => setAppId(e.target.value)}
                placeholder="Enter app ID (e.g., com.duolingo, com.spotify.music)"
                className="px-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                disabled={isLoading}
              />
            </>
          )}
          {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>
        
        <button
          type="submit"
          disabled={isLoading || (!appId && inputMethod === 'search')}
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