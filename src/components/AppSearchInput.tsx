import React, { useState, useEffect, useRef } from 'react';
// import LoadingSpinner from './LoadingSpinner'; // Keep commented or remove if not used elsewhere
import RiveLoader from './RiveLoader'; // This might become unused now
import { Search } from 'lucide-react';

interface AppSearchInputProps {
  onSelect: (appId: string, appName: string) => void;
  disabled?: boolean;
}

interface AppSuggestion {
  title: string;
  appId: string;
  iconUrl?: string;
}

export default function AppSearchInput({ onSelect, disabled = false }: AppSearchInputProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<AppSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [error, setError] = useState('');
  const [imageErrors, setImageErrors] = useState<{[key: string]: boolean}>({});
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Restore hardcoded popular apps with icons
  const popularApps: AppSuggestion[] = [
    { 
      title: 'Spotify: Music and Podcasts', 
      appId: 'com.spotify.music',
      iconUrl: 'https://play-lh.googleusercontent.com/7ynvVIRdhJNAngCg_GI7i8TtH8BqkJYmffeUHsG-mJOdzt1XLvGmbsKuc5Q1SInBjDKN'
    },
    { 
      title: 'Instagram', 
      appId: 'com.instagram.android',
      iconUrl: 'https://play-lh.googleusercontent.com/VRMWkE5p3CkWhJs6nv-9ZsLAs1QOg5ob1_3qg-rckwYW7yp1fMrYZqnEFpk0IoVP4LM'
    },
    { 
      title: 'TikTok', 
      appId: 'com.zhiliaoapp.musically',
      iconUrl: 'https://play-lh.googleusercontent.com/BmUViDVOKNJe0GYJe22hsr7juFndRVbvr1fGmHGXqHfJjNAXjd26bfuGRQpVrpJ6YbA'
    },
    { 
      title: 'WhatsApp Messenger', 
      appId: 'com.whatsapp',
      iconUrl: 'https://play-lh.googleusercontent.com/bYtqbOcTYOlgc6gqZ2rwb8lptHuwlNE75zYJu6Bn076-hTmvd96HH-6v7S0YUAAJXoJN'
    },
    { 
      title: 'Netflix', 
      appId: 'com.netflix.mediaclient',
      iconUrl: 'https://play-lh.googleusercontent.com/TBRwjS_qfJCSj1m7zZB93FnpJM5fSpMA_wUlFDLxWAb45T9RmwBvQd5cWR5viJJOhkI'
    },
    { 
      title: 'YouTube', 
      appId: 'com.google.android.youtube',
      iconUrl: 'https://play-lh.googleusercontent.com/6am0i3walYwNLc08QOOhRJttQENNGkhlKajXSERf3JnPVRQczIyxw2w3DxeMRTOSdsY'
    },
    { 
      title: 'Duolingo: Language Lessons', 
      appId: 'com.duolingo',
      iconUrl: 'https://play-lh.googleusercontent.com/ZYKTGrS5CresqrZJb-ewGyIHY2bA6dOKrTJqMAb6n4HXVQY4S9tOfhg0aiY8JH5zxg'
    }
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
        setImageErrors({});
      } catch (error) {
        setError('Failed to fetch suggestions');
        console.error('Error fetching suggestions:', error);
      } finally {
        setIsLoading(false);
      }
    };

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

  const handleImageError = (appId: string) => {
    setImageErrors(prev => ({ ...prev, [appId]: true }));
  };

  const handleInputFocus = () => {
    if (searchTerm.length >= 2) {
      setShowSuggestions(true);
    } else {
      // Show hardcoded popular apps when input is empty or too short
      setSuggestions(popularApps);
      setShowSuggestions(true);
    }
  };

  return (
    <div className="relative w-full">
      <div className="flex items-center border border-[#D0D9E6] rounded-xl overflow-hidden h-10 bg-white">
        <div className="pl-3 text-gray-400">
          <Search size={16} />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          placeholder="Search for an app..."
          className="px-3 py-2 w-full focus:outline-none text-gray-800 placeholder:text-sm placeholder:text-gray-400 text-sm"
          disabled={disabled}
        />
      </div>
      
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      
      {showSuggestions && suggestions.length > 0 && (
        <div 
          ref={suggestionsRef}
          className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto"
        >
          {searchTerm.length < 2 && (
            <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
              <span className="text-xs text-gray-500 font-medium">Popular Apps</span>
            </div>
          )}
          <ul>
            {suggestions.map((suggestion, index) => {
              const hasError = imageErrors[suggestion.appId];
              const displayIcon = suggestion.iconUrl && !hasError;
              
              return (
                <li 
                  key={suggestion.appId || index}
                  className="px-4 py-2 hover:bg-gray-50 transition-colors duration-150 cursor-pointer border-b border-gray-100 last:border-0"
                  onClick={() => handleSelectApp(suggestion)}
                >
                  <div className="flex items-center gap-3">
                    {/* App Icon */}
                    {displayIcon ? (
                      <img 
                        src={suggestion.iconUrl} 
                        alt={`${suggestion.title} icon`} 
                        className="w-8 h-8 rounded-md object-cover"
                        loading="lazy"
                        onError={() => handleImageError(suggestion.appId)}
                      />
                    ) : (
                      <div className="w-8 h-8 bg-gray-200 rounded-md flex items-center justify-center text-gray-500 text-sm font-medium">
                        {suggestion.title?.charAt(0)?.toUpperCase() || 'A'}
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-medium text-gray-900">{suggestion.title}</div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
} 