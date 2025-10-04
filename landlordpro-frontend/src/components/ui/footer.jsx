import React from 'react';

const Footer = () => {
  return (
    <footer className="w-full bg-white dark:bg-gray-900 shadow-inner mt-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-center text-xs text-gray-500 dark:text-gray-400">
        &copy; {new Date().getFullYear()} LandlordPro. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
