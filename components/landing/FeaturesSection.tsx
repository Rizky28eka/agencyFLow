import React from "react";
import { IconScale, IconRocket, IconShieldCheck } from "@tabler/icons-react"; // New icons

export function FeaturesSection() {
  return (
    <section className="bg-[#282828] text-white py-20 px-4 md:px-8 lg:px-16">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-4xl md:text-5xl font-bold text-center mb-12">
          Key Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Feature 1: Scalable Architecture */}
          <div className="flex flex-col items-center text-center">
            <div className="p-4 rounded-full bg-gray-700 mb-4">
              <IconScale size={48} className="text-[#8B5CF6]" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Scalable Architecture</h3>
            <p className="text-gray-400">
              Built with a domain-based folder structure for maintainability, scalability, and efficient team collaboration.
            </p>
          </div>

          {/* Feature 2: Optimized Performance */}
          <div className="flex flex-col items-center text-center">
            <div className="p-4 rounded-full bg-gray-700 mb-4">
              <IconRocket size={48} className="text-[#8B5CF6]" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Optimized Performance</h3>
            <p className="text-gray-400">
              Leveraging Next.js hybrid rendering (SSG/SSR/CSR) for maximum speed and a seamless user experience.
            </p>
          </div>

          {/* Feature 3: Robust API & Type Safety */}
          <div className="flex flex-col items-center text-center">
            <div className="p-4 rounded-full bg-gray-700 mb-4">
              <IconShieldCheck size={48} className="text-[#8B5CF6]" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Robust API & Type Safety</h3>
            <p className="text-gray-400">
              Designed with RESTful Route Handlers and Prisma ORM for reliable, secure, and type-safe data operations.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}