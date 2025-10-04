import React from 'react';
import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <header className="w-full bg-white dark:bg-gray-900 shadow-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
        <Link to="/" className="text-2xl font-bold text-teal-700 dark:text-teal-300">
          LandlordPro
        </Link>

        <nav className="space-x-4">
          <Link
            to="/login"
            className="text-gray-700 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 text-sm"
          >
            Login
          </Link>
          <Link
            to="/forgot-password"
            className="text-gray-700 dark:text-gray-300 hover:text-teal-600 dark:hover:text-teal-400 text-sm"
          >
            Forgot Password
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;
