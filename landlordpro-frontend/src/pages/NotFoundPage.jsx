import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/index';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-tl from-green-50 to-teal-50 dark:from-gray-900 dark:to-gray-800 p-4 text-center">
      <h1 className="text-6xl font-bold text-teal-700 dark:text-teal-300 mb-4">404</h1>
      <p className="text-gray-700 dark:text-gray-300 mb-6 text-lg">
        Oops! The page you are looking for does not exist.
      </p>
      <Link to="/">
        <Button variant="primary">Go Back Home</Button>
      </Link>
    </div>
  );
};

export default NotFoundPage;
