'use client';

import { useState, FormEvent } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Input from '@/app/components/Input';
import Button from '@/app/components/Button';
import Card from '@/app/components/Card';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password');
      } else {
        const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
        router.push(callbackUrl);
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 md:p-24 bg-gradient-to-br from-[var(--bg)] to-[var(--bg-2)]">
      <div className="w-full max-w-md">
        {/* Logo/Branding */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-display font-bold mb-2" style={{ color: 'var(--brand)' }}>
            Crema Arena
          </h1>
          <p className="text-lg font-serif italic text-[var(--fg-2)]">
            Admin Login
          </p>
        </div>

        {/* Login Card */}
        <Card shadow="md">
          <form onSubmit={handleSubmit} className="space-y-5">
            <h2 className="text-2xl font-display font-bold text-[var(--fg)] mb-6">
              Sign In
            </h2>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-[var(--radius-sm)] bg-[var(--danger-soft)] border border-[var(--danger)] text-[var(--danger)] text-sm">
                {error}
              </div>
            )}

            {/* Email Input */}
            <Input
              type="email"
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              fullWidth
              autoComplete="email"
              disabled={isLoading}
            />

            {/* Password Input */}
            <Input
              type="password"
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
              fullWidth
              autoComplete="current-password"
              disabled={isLoading}
            />

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </Card>

        {/* Back to Home Link */}
        <div className="text-center mt-6">
          <Link
            href="/"
            className="text-sm text-[var(--fg-3)] hover:text-[var(--brand)] transition-colors"
            style={{ transitionDuration: 'var(--dur-base)' }}
          >
            Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
