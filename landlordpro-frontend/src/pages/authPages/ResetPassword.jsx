import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-toastify';
import { Button, Card, Input } from '../../components';

// Zod schema for password reset
const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters long'),
  confirmPassword: z.string().min(6, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const ResetPassword = () => {
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const onSubmit = async (data) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success('Password has been reset successfully!');
    } catch (error) {
      toast.error('Failed to reset password');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-tl from-green-50 to-teal-50 p-4 dark:from-gray-900 dark:to-gray-800">
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-6 px-4 sm:px-0">
          <h1 className="text-3xl font-bold text-teal-700 dark:text-teal-300 mb-2">Reset Password</h1>
          <p className="text-gray-600 dark:text-gray-400 text-xs">
            Enter your new password below
          </p>
        </div>

        <Card className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-teal-100 dark:border-gray-700 w-full">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" role="form" aria-label="Reset Password form">
            <div className="relative w-full">
              <Input
                label="New Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter new password"
                {...register('password')}
                error={errors.password?.message}
                aria-invalid={!!errors.password}
                className="w-full text-white"
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

            <Input
              label="Confirm Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Confirm new password"
              {...register('confirmPassword')}
              error={errors.confirmPassword?.message}
              aria-invalid={!!errors.confirmPassword}
              className="w-full text-white"
            />

            <Button type="submit" variant="primary" disabled={isSubmitting} className="w-full">
              {isSubmitting ? 'Resetting...' : 'Reset Password'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;
