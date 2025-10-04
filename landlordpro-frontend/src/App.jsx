import React from 'react';
import { RouterProvider } from 'react-router-dom';
import './App.css';
import { store } from './store/index';
import { Provider } from 'react-redux';
import { router } from './routes/index';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <Provider store={store}>
      <ErrorBoundary>
        <RouterProvider
          router={router}
          fallbackElement={
            <div className="text-center p-4" role="alert" aria-live="polite">
              Loading...
            </div>
          }
        />
        {/* ToastContainer should be at the root of your app */}
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />
      </ErrorBoundary>
    </Provider>
  );
}

export default App;
