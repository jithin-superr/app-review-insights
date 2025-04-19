import React, { useState, useEffect, useRef } from 'react';
import LoadingSpinner from './LoadingSpinner';

interface AppSearchInputProps {
  onSelect: (appId: string, appName: string) => void;
  disabled?: boolean;
}

interface AppSuggestion {
  title: string;
  appId: string;
}

export default function AppSearchInput({ onSelect, disabled = false }: AppSearchInputProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<AppSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [error, setError] = useState('');
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Popular apps to show when search is empty
  const popularApps: AppSuggestion[] = [
    { title: 'Spotify: Music and Podcasts', appId: 'com.spotify.music' },
    { title: 'Instagram', appId: 'com.instagram.android' },
    { title: 'TikTok', appId: 'com.zhiliaoapp.musically' },
    { title: 'WhatsApp Messenger', appId: 'com.whatsapp' },
    { title: 'Netflix', appId: 'com.netflix.mediaclient' },
    { title: 'YouTube', appId: 'com.google.android.youtube' },
    { title: 'Duolingo: Language Lessons', appId: 'com.duolingo' }
  ];

  // Function to handle click outside of suggestions dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node) &&
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch app suggestions when search term changes
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!searchTerm || searchTerm.length < 2) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      setError('');

      try {
        const response = await fetch(`/api/search?term=${encodeURIComponent(searchTerm)}`);
        
        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }
        
        const data = await response.json();
        setSuggestions(data || []);
      } catch (error) {
        setError('Failed to fetch suggestions');
        console.error('Error fetching suggestions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Add debounce to prevent too many API calls
    const debounceTimer = setTimeout(() => {
      if (searchTerm.length >= 2) {
        fetchSuggestions();
      }
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setShowSuggestions(true);
  };

  const handleSelectApp = (suggestion: AppSuggestion) => {
    setSearchTerm(suggestion.title);
    setShowSuggestions(false);
    onSelect(suggestion.appId, suggestion.title);
  };

  const handleInputFocus = () => {
    if (searchTerm.length >= 2) {
      setShowSuggestions(true);
    } else {
      // Show popular apps when input is empty or too short
      setSuggestions(popularApps);
      setShowSuggestions(true);
    }
  };

  return (
    <div className="relative w-full">
      <div className="flex items-center border border-gray-200 rounded-md overflow-hidden">
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder="Search for an app (e.g., Spotify, Netflix, TikTok)"
          className="px-4 py-2 w-full focus:outline-none text-black"
          disabled={disabled}
        />
        {isLoading && (
          <div className="px-2">
            <LoadingSpinner size="sm" />
          </div>
        )}
      </div>
      
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      
      {showSuggestions && suggestions.length > 0 && (
        <div 
          ref={suggestionsRef}
          className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto"
        >
          {searchTerm.length < 2 && (
            <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
              <span className="text-sm text-gray-500 font-medium">Popular Apps</span>
            </div>
          )}
          <ul>
            {suggestions.map((suggestion, index) => (
              <li 
                key={index}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-0"
                onClick={() => handleSelectApp(suggestion)}
              >
                <div className="font-medium text-black">{suggestion.title}</div>
                <div className="text-xs text-gray-500">{suggestion.appId}</div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
} 