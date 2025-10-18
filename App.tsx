
import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { UploadCard } from './components/UploadCard';
import { ResultView } from './components/ResultView';
import { CreditsModal } from './components/CreditsModal';
import { BottomNav } from './components/BottomNav';
import { LoadingSpinner } from './components/LoadingSpinner';
import { useCredits } from './hooks/useCredits';
import { removeBackground } from './services/geminiService';
import { fileToBase64 } from './utils/fileUtils';
import { COST_PER_REMOVAL } from './constants';
import type { AppState, ImageFile } from './types';

export default function App() {
  const [appState, setAppState] = useState<AppState>('idle');
  const [originalImage, setOriginalImage] = useState<ImageFile | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCreditsModalOpen, setCreditsModalOpen] = useState(false);

  const { credits, spendCredits, addCredits } = useCredits();

  const handleImageUpload = useCallback(async (file: File) => {
    if (credits < COST_PER_REMOVAL) {
      setCreditsModalOpen(true);
      return;
    }

    setAppState('loading');
    setError(null);
    setOriginalImage({ url: URL.createObjectURL(file), name: file.name });

    try {
      const { base64, mimeType } = await fileToBase64(file);
      const resultBase64 = await removeBackground(base64, mimeType);
      
      if (resultBase64) {
        setProcessedImage(`data:image/png;base64,${resultBase64}`);
        spendCredits(COST_PER_REMOVAL);
        setAppState('result');
      } else {
        throw new Error("AI model did not return an image.");
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
      setAppState('error');
    }
  }, [credits, spendCredits]);

  const handleRemoveAnother = () => {
    setAppState('idle');
    setOriginalImage(null);
    setProcessedImage(null);
    setError(null);
  };
  
  const renderContent = () => {
    switch (appState) {
      case 'loading':
        return <LoadingSpinner />;
      case 'result':
        if (originalImage && processedImage) {
          return (
            <ResultView
              originalImage={originalImage}
              processedImage={processedImage}
              onRemoveAnother={handleRemoveAnother}
            />
          );
        }
        return null; // Should not happen
      case 'error':
        return (
          <div className="text-center p-8">
            <p className="text-red-500 font-semibold mb-4">{error}</p>
            <button
              onClick={handleRemoveAnother}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg shadow-md hover:bg-indigo-700 transition"
            >
              Try Again
            </button>
          </div>
        );
      case 'idle':
      default:
        return <UploadCard onImageUpload={handleImageUpload} />;
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col">
      <Header credits={credits} />
      <main className="flex-grow flex flex-col items-center justify-center p-4">
        {renderContent()}
      </main>
      <BottomNav />
      {isCreditsModalOpen && (
        <CreditsModal
          onClose={() => setCreditsModalOpen(false)}
          onWatchAd={() => {
            addCredits(2);
            setCreditsModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
