import React from "react";
import Image from "next/image";
import { IconStarFilled } from "@tabler/icons-react";

export function TestimonialSection() {
  return (
    <section className="bg-[#282828] text-white py-20 px-4 md:px-8 lg:px-16">
      <div className="max-w-4xl mx-auto bg-[#8B5CF6] bg-opacity-20 rounded-lg p-8 md:p-12 text-center">
        <p className="text-xl md:text-2xl italic mb-6 leading-relaxed">
          &quot;AgencyFlow has transformed our development process. The clear architecture and robust tools have significantly boosted our team&apos;s productivity and the scalability of our applications. A truly foundational blueprint for modern SaaS!&quot;
        </p>
        <div className="flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-gray-600 flex items-center justify-center overflow-hidden mb-3">
            {/* Placeholder for avatar */}
            <Image
              src="/placeholder-avatar.png" // This image needs to be created or replaced
              alt="Client Avatar"
              width={64}
              height={64}
              className="object-cover"
            />
          </div>
          <p className="font-semibold text-lg">A Satisfied Client</p>
          <div className="flex text-yellow-400 mt-1">
            <IconStarFilled size={20} />
            <IconStarFilled size={20} />
            <IconStarFilled size={20} />
            <IconStarFilled size={20} />
            <IconStarFilled size={20} />
          </div>
        </div>
      </div>
    </section>
  );
}