import React from "react";
import Image from "next/image";

export function ContactSection() {
  return (
    <section className="bg-[#282828] text-white py-20 px-4 md:px-8 lg:px-16 border-t border-gray-700"> {/* Added border-t */}
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-12">
        {/* Left Content */}
        <div className="flex-1 text-center lg:text-left">
          <h2 className="text-4xl md:text-5xl font-bold leading-tight mb-4">
            Have Technical Questions? Let&apos;s Talk.
          </h2>
          <p className="text-lg md:text-xl text-gray-300 mb-8">
            Dive deeper into the AgencyFlow blueprint. Our team is ready to discuss architectural details, implementation strategies, and how it can benefit your project.
          </p>
          <button className="bg-[#FACC15] hover:bg-[#eab308] text-gray-900 font-semibold py-3 px-8 rounded-lg text-lg transition duration-300">
            Get started
          </button>
        </div>

        {/* Right Image/Mockup */}
        <div className="flex-1 flex justify-center lg:justify-end">
          {/* Placeholder for the card mockup */}
          <div className="w-full max-w-md bg-gray-700 rounded-lg shadow-lg overflow-hidden p-6 border border-gray-600"> {/* Adjusted padding and added border */}
            <Image
              src="/placeholder-card.png" // This image needs to be created or replaced
              alt="Card Mockup"
              width={400}
              height={300}
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