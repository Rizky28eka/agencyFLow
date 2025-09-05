import Image from "next/image";
import React from "react";

export function HeroSection() {
  return (
    <section className="relative bg-[#282828] text-white py-20 px-4 md:px-8 lg:px-16">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-12">
        {/* Left Content */}
        <div className="flex-1 text-center lg:text-left">
          <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6">
            AgencyFlow: The Technical Blueprint for a Modern SaaS Platform
          </h1>
          <p className="text-lg md:text-xl text-gray-300 mb-8">
            This comprehensive technical blueprint guides development teams in building scalable, maintainable, and secure SaaS applications using Next.js and PostgreSQL.
          </p>
          <button className="bg-[#8B5CF6] hover:bg-[#7c3aed] text-white font-semibold py-3 px-8 rounded-lg text-lg transition duration-300">
            Get started
          </button>
        </div>

        {/* Right Image/Mockup with Charts */}
        <div className="flex-1 flex flex-col items-center lg:items-end gap-4">
          {/* Small Charts/Graphs */}
          <div className="flex gap-4 w-full max-w-2xl">
            <div className="flex-1 bg-gray-700 rounded-lg p-4 h-32 flex items-center justify-center">
              {/* Monthly plan chart placeholder */}
              <div className="w-24 h-24 rounded-full border-4 border-purple-500 flex items-center justify-center text-sm font-bold">
                200
              </div>
            </div>
            <div className="flex-1 bg-gray-700 rounded-lg p-4 h-32 flex items-center justify-center">
              {/* Spending frequency chart placeholder */}
              <div className="w-full h-full bg-gray-600 rounded"></div>
            </div>
          </div>

          {/* Main Dashboard Screenshot */}
          <div className="w-full max-w-2xl bg-gray-700 rounded-lg shadow-lg overflow-hidden">
            <Image
              src="/placeholder-dashboard.png" // This image needs to be created or replaced
              alt="Dashboard Mockup"
              width={800}
              height={500}
              layout="responsive"
              objectFit="cover"
              className="rounded-lg"
            />
          </div>
        </div>
      </div>
    </section>
  );
}