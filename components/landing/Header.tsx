import React from "react";
import Link from "next/link";

export function Header() {
  return (
    <header className="bg-[#282828] text-white py-4 px-4 md:px-8 lg:px-16 border-b border-gray-700">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo/Brand Name */}
        <Link href="/" className="text-xl font-semibold">
          Wallet
        </Link>

        {/* Navigation/Auth Buttons */}
        <nav className="flex items-center gap-4">
          <Link href="/signup" className="text-gray-300 hover:text-white transition duration-300">
            Sign up
          </Link>
          <Link href="/login" className="bg-[#8B5CF6] hover:bg-[#7c3aed] text-white font-semibold py-2 px-5 rounded-lg transition duration-300">
            Log in
          </Link>
        </nav>
      </div>
    </header>
  );
}