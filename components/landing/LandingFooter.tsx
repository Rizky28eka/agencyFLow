import React from "react";

export function LandingFooter() {
  return (
    <footer className="bg-[#282828] text-gray-400 py-12 px-4 md:px-8 lg:px-16 border-t border-gray-700">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
        {/* Left Section */}
        <div className="flex flex-col md:flex-row items-center gap-6">
          <span className="text-white font-semibold text-lg">AgencyFlow</span>
          <p className="text-sm">&copy; AgencyFlow 2025</p>
          <nav className="flex gap-4 text-sm">
            <a href="#" className="hover:underline">Privacy policy</a>
            <a href="#" className="hover:underline">Cookies policy</a>
            <a href="#" className="hover:underline">Terms of use</a>
          </nav>
        </div>

        {/* Right Section - Email Subscription */}
        <div className="flex flex-col items-center md:items-end gap-4">
          <p className="text-sm">Updates right to your Inbox</p>
          <div className="flex w-full max-w-sm">
            <input
              type="email"
              placeholder="Email Address"
              className="flex-1 p-3 rounded-l-lg bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8B5CF6]"
            />
            <button className="bg-[#8B5CF6] hover:bg-[#7c3aed] text-white font-semibold py-3 px-6 rounded-r-lg transition duration-300">
              Send
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}