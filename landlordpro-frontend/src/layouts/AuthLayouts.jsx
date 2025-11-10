import React from 'react';
import { Outlet } from 'react-router-dom';
import { Footer, Header } from '../components';

const AuthLayouts = () => {
  return (
    <div className="w-full min-h-screen bg-linear-to-tl  to-teal-50 p-4 dark:from-gray-900 dark:to-gray-800">
         <Outlet />
    </div>
  );
};

export default AuthLayouts;
