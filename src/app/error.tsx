'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('App Error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg border border-red-100 text-center space-y-6">
        <div className="mx-auto w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-2">
          <AlertCircle className="w-8 h-8" />
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-900">Something went wrong!</h2>
          <p className="text-slate-500 text-sm">
            We encountered an unexpected error. Please try again or contact support if the issue persists.
          </p>
        </div>

        <Button 
          onClick={() => reset()}
          className="w-full bg-slate-900 hover:bg-slate-800 text-white"
        >
          Try again
        </Button>
      </div>
    </div>
  );
}
