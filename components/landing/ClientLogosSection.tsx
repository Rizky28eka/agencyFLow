import React from "react";

export function ClientLogosSection() {
  return (
    <section className="bg-[#282828] py-12 px-4 md:px-8 lg:px-16 border-t border-b border-gray-700">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-around gap-8">
        {/* Placeholder for client logos */}
        <div className="h-10 w-32 bg-gray-700 rounded flex items-center justify-center text-gray-400 text-sm">
          Accenture
        </div>
        <div className="h-10 w-32 bg-gray-700 rounded flex items-center justify-center text-gray-400 text-sm">
          Apple
        </div>
        <div className="h-10 w-32 bg-gray-700 rounded flex items-center justify-center text-gray-400 text-sm">
          Microsoft
        </div>
        <div className="h-10 w-32 bg-gray-700 rounded flex items-center justify-center text-gray-400 text-sm">
          Google
        </div>
        <div className="h-10 w-32 bg-gray-700 rounded flex items-center justify-center text-gray-400 text-sm">
          BearingPoint.
        </div>
      </div>
    </section>
  );
}