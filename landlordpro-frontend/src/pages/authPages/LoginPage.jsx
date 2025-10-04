import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Input } from '../../components';
import { loginUser, storeToken, saveLoggedInUser } from '../../services/AuthService';

// Zod schema
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters long'),
  rememberMe: z.boolean().default(false),
});

const Login = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', rememberMe: false },
  });

  const onSubmit = async (data) => {
    try {
      const res = await loginUser(data.email, data.password);
  
      // Save token & user
      storeToken(res.token);
      saveLoggedInUser(res.user);
  
      toast.success('Login successful!');
  
      // Role-based redirect (single role from backend)
      const role = res.user.role.toLowerCase(); // "admin" or "manager" etc.
      if (role === 'admin') navigate('/admin');
      else if (role === 'manager') navigate('/manager');
      else navigate('/');
    } catch (error) {
      console.error(error);
      toast.error(
        error.response?.data?.message || 'Login failed. Please check your credentials.'
      );
    }
  };
  

  return (
    <div className="min-h-screen flex items-center justify-center ">
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-6 px-4 sm:px-0">
          <h1 className="text-3xl font-bold text-teal-700 dark:text-teal-300 mb-2">LandlordPro</h1>
          <p className="text-gray-600 dark:text-gray-400 text-xs">Property Management Simplified</p>
        </div>

        <Card className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-teal-100 dark:border-gray-700 w-full">
          <div className="text-center mb-4">
            <h2 className="text-xl font-medium text-gray-800 dark:text-gray-200">Sign In</h2>
            <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">Access your account securely</p>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
            role="form"
            aria-label="Login form"
          >
            <Input
              label="Email"
              type="email"
              placeholder="your.email@example.com"
              {...register('email')}
              error={errors.email?.message}
              aria-invalid={!!errors.email}
              className="w-full"
            />
            <div className="relative w-full">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                {...register('password')}
                error={errors.password?.message}
                aria-invalid={!!errors.password}
                className="w-full"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-9 text-gray-500 dark:text-gray-400 text-sm"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center text-xs gap-2">
              <a
                href="/forgot-password"
                className="text-teal-600 hover:text-teal-500 dark:text-teal-400 dark:hover:text-teal-300"
              >
                Forgot Password?
              </a>
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              aria-label="Sign in"
              className="w-full"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Login;
