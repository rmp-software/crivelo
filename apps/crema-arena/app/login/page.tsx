'use client';

import { useState, FormEvent } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Input from '@/app/components/Input';
import Wordmark from '@/app/components/Wordmark';
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
        <div className="flex flex-col items-center mb-8">
          <Wordmark size="lg" className="mb-2" />
          <p className="text-sm font-mono uppercase tracking-wider text-[var(--fg-3)]">
            Painel administrativo
          </p>
        </div>

        {/* Login Card */}
        <Card shadow="md">
          <form onSubmit={handleSubmit} className="space-y-5" aria-label="Formulário de login">
            <h2 className="text-2xl font-display font-bold text-[var(--fg)] mb-6">
              Entrar
            </h2>

            {/* Error Message */}
            {error && (
              <div
                className="p-3 rounded-[var(--radius-sm)] bg-[var(--danger-soft)] border border-[var(--danger)] text-[var(--danger)] text-sm"
                role="alert"
                aria-live="assertive"
              >
                {error}
              </div>
            )}

            {/* Email Input */}
            <Input
              type="email"
              label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              fullWidth
              autoComplete="email"
              disabled={isLoading}
              aria-label="Email"
            />

            {/* Password Input */}
            <Input
              type="password"
              label="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite sua senha"
              required
              fullWidth
              autoComplete="current-password"
              disabled={isLoading}
              aria-label="Senha"
            />

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              disabled={isLoading}
              aria-label={isLoading ? 'Entrando...' : 'Entrar no sistema'}
            >
              {isLoading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </Card>

        {/* Back to Home Link */}
        <div className="text-center mt-6">
          <Link
            href="/"
            className="text-sm text-[var(--fg-3)] hover:text-[var(--brand)] transition-colors"
            style={{ transitionDuration: 'var(--dur-base)' }}
            aria-label="Voltar para a página inicial"
          >
            Voltar para home
          </Link>
        </div>
      </div>
    </main>
  );
}
