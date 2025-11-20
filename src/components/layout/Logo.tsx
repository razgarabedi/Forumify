"use client";

import { useEffect, useState } from 'react';

interface LogoProps {
  customLogoUrl?: string | null;
}

export function Logo({ customLogoUrl }: LogoProps) {
  const [logoError, setLogoError] = useState(false);

  // Reset error state when customLogoUrl changes
  useEffect(() => {
    setLogoError(false);
  }, [customLogoUrl]);

  if (customLogoUrl) {
    return <img src={customLogoUrl} alt="Logo" className="h-6 w-auto" />;
  }

  if (logoError) {
    // Fallback to default icon if logo.png doesn't exist
    return (
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-primary">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
      </svg>
    );
  }

  return (
    <img 
      src="/logo.png" 
      alt="Logo" 
      className="h-6 w-auto" 
      onError={() => setLogoError(true)}
    />
  );
}

