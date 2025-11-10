import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-toastify';
import { Button, Card, Input } from '../../components';

// Zod schema for email
const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address'),
});

const ForgotPassword = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      toast.success(`Password reset link sent to ${data.email}`);
    } catch (error) {
      toast.error('Failed to send reset link');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-tl from-green-50 to-teal-50 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md mx-auto animate-fade-in">
        {/* Header */}
        <div className="text-center mb-6 px-4 sm:px-0">
          <h1 className="text-3xl font-bold text-teal-700 dark:text-teal-300 mb-2">
            Forgot Password
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-xs">
            Enter your email to receive a password reset link
          </p>
        </div>

        {/* Card */}
        <Card className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-teal-100 dark:border-gray-700 w-full animate-slide-up">
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
            role="form"
            aria-label="Forgot Password form"
          >
            <Input
              label="Email"
              type="email"
              placeholder="your.email@example.com"
              {...register('email')}
              error={errors.email?.message}
              aria-invalid={!!errors.email}
              className="w-full text-white"
            />

            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              className="w-full h-12 font-semibold rounded-lg shadow hover:shadow-md transition-all duration-200 disabled:opacity-50"
            >
              {isSubmitting ? 'Sending...' : 'Send Reset Link'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default ForgotPassword;
