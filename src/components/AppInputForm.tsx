import React, { useState } from 'react';
import AppSearchInput from './AppSearchInput';

interface AppInputFormProps {
  onSubmit: (appId: string) => Promise<void>;
  isLoading: boolean;
}

export default function AppInputForm({ onSubmit, isLoading }: AppInputFormProps) {
  const [appId, setAppId] = useState('');
  const [selectedAppName, setSelectedAppName] = useState('');
  const [error, setError] = useState('');

  const handleSelectApp = async (newAppId: string, appName: string) => {
    if (!newAppId.trim()) {
      setError('Invalid app selected');
      return;
    }
    
    setAppId(newAppId);
    setSelectedAppName(appName);
    setError('');
    
    try {
      await onSubmit(newAppId);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Analysis failed');
    }
  };

  return (
    <div className="w-full">
      <AppSearchInput 
        onSelect={handleSelectApp} 
        disabled={isLoading} 
      />
      {error && <p className="mt-1 text-sm text-red-600">Error: {error}</p>}
    </div>
  );
} 