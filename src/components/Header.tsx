import React from 'react';

export function Header() {
  return (
    <header className="w-full p-6 flex flex-col items-center justify-center bg-gradient-to-b from-orange-100 to-transparent">
      <h1 className="text-3xl font-bold text-orange-800 tracking-tight">Zoya AI</h1>
      <p className="text-orange-600 font-medium mt-1">ISKCON Spiritual Voice Assistant</p>
    </header>
  );
}
