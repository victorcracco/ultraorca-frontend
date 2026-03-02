import React from 'react';
import { Helmet } from 'react-helmet-async';

export default function MobileWrapper({ children, title = "UltraOrça", className = "" }) {
  return (
    <>
      <Helmet>
        <title>{title} - UltraOrça</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Helmet>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 mobile-first desktop">
        <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 shadow-sm border-b border-gray-200">
          <div className="p-4 sm:p-6">
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              UltraOrça
            </h1>
          </div>
        </header>
        <main className={`space-y-6 p-4 sm:p-6 ${className}`}>
          {children}
        </main>
      </div>
    </>
  );
}
