// ============================================
// components/Spinner.jsx
// ============================================
import React from 'react';

/**
 * Spinner - Loading indicator component
 * @param {string} size - Size variant: 'xs', 'sm', 'md', 'lg', 'xl'
 * @param {string} color - Color variant: 'blue', 'green', 'red', 'gray', 'white'
 * @param {string} className - Additional CSS classes
 * @param {string} text - Optional loading text
 */
export const Spinner = ({ 
  size = 'md', 
  color = 'blue',
  className = '',
  text = '',
}) => {
  const sizes = {
    xs: 'w-3 h-3 border-2',
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-4',
    lg: 'w-12 h-12 border-4',
    xl: 'w-16 h-16 border-4',
  };

  const colors = {
    blue: 'border-gray-200 border-t-blue-500',
    green: 'border-gray-200 border-t-green-500',
    red: 'border-gray-200 border-t-red-500',
    purple: 'border-gray-200 border-t-purple-500',
    orange: 'border-gray-200 border-t-orange-500',
    gray: 'border-gray-200 border-t-gray-500',
    white: 'border-gray-400 border-t-white',
  };

  const textSizes = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
  };

  return (
    <div className={`flex flex-col items-center justify-center gap-2 ${className}`}>
      <div 
        className={`animate-spin rounded-full ${sizes[size]} ${colors[color]}`}
        role="status"
        aria-label="Loading"
      />
      {text && (
        <p className={`text-gray-600 ${textSizes[size]}`}>
          {text}
        </p>
      )}
    </div>
  );
};

// ============================================
// Usage Examples
// ============================================

/*
// 1. Basic Spinner
<Spinner />

// 2. Small spinner
<Spinner size="sm" />

// 3. Large spinner with text
<Spinner size="lg" text="Loading..." />

// 4. Colored spinners
<Spinner color="green" />
<Spinner color="red" />
<Spinner color="purple" />

// 5. Full page loading
<div className="flex items-center justify-center h-screen">
  <Spinner size="xl" text="Loading dashboard..." />
</div>

// 6. Inline loading (in button)
<button disabled>
  <Spinner size="xs" color="white" className="inline-block mr-2" />
  Loading...
</button>

// 7. Card loading
<Card className="p-8">
  <Spinner size="lg" text="Fetching data..." />
</Card>

// 8. Custom color with Tailwind
<Spinner className="border-t-pink-500" />
*/

// ============================================
// Advanced Spinner Variants
// ============================================

/**
 * Dots Spinner - Three bouncing dots
 */
export const DotsSpinner = ({ 
  size = 'md',
  color = 'blue',
  className = '' 
}) => {
  const dotSizes = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  const dotColors = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    purple: 'bg-purple-500',
    gray: 'bg-gray-500',
  };

  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      <div 
        className={`${dotSizes[size]} ${dotColors[color]} rounded-full animate-bounce`}
        style={{ animationDelay: '0ms' }}
      />
      <div 
        className={`${dotSizes[size]} ${dotColors[color]} rounded-full animate-bounce`}
        style={{ animationDelay: '150ms' }}
      />
      <div 
        className={`${dotSizes[size]} ${dotColors[color]} rounded-full animate-bounce`}
        style={{ animationDelay: '300ms' }}
      />
    </div>
  );
};

/**
 * Pulse Spinner - Pulsing circle
 */
export const PulseSpinner = ({ 
  size = 'md',
  color = 'blue',
  className = '' 
}) => {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  const colors = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    purple: 'bg-purple-500',
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={`${sizes[size]} ${colors[color]} rounded-full animate-ping opacity-75`} />
    </div>
  );
};

/**
 * Bar Spinner - Three vertical bars
 */
export const BarSpinner = ({ 
  color = 'blue',
  className = '' 
}) => {
  const colors = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    red: 'bg-red-500',
    purple: 'bg-purple-500',
  };

  return (
    <div className={`flex items-end justify-center gap-1 h-8 ${className}`}>
      <div 
        className={`w-1.5 ${colors[color]} rounded-full animate-pulse`}
        style={{ 
          animationDuration: '0.6s',
          height: '40%'
        }}
      />
      <div 
        className={`w-1.5 ${colors[color]} rounded-full animate-pulse`}
        style={{ 
          animationDuration: '0.6s',
          animationDelay: '0.2s',
          height: '60%'
        }}
      />
      <div 
        className={`w-1.5 ${colors[color]} rounded-full animate-pulse`}
        style={{ 
          animationDuration: '0.6s',
          animationDelay: '0.4s',
          height: '80%'
        }}
      />
    </div>
  );
};

/**
 * Loading Overlay - Full screen loading
 */
export const LoadingOverlay = ({ 
  text = 'Loading...',
  blur = true,
}) => {
  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 ${
        blur ? 'backdrop-blur-sm' : ''
      }`}
    >
      <div className="bg-white rounded-xl shadow-2xl p-8">
        <Spinner size="xl" color="blue" text={text} />
      </div>
    </div>
  );
};

/**
 * Skeleton Loader - Content placeholder
 */
export const SkeletonLoader = ({ 
  lines = 3,
  className = '' 
}) => {
  return (
    <div className={`space-y-3 ${className}`}>
      {[...Array(lines)].map((_, i) => (
        <div 
          key={i}
          className="h-4 bg-gray-200 rounded animate-pulse"
          style={{ width: `${100 - (i * 10)}%` }}
        />
      ))}
    </div>
  );
};

// ============================================
// Export all variants
// ============================================
export default Spinner;