'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { Menu, X, Users, Calendar, Building2, LogOut } from 'lucide-react';
import Button from './Button';

interface SidebarProps {
  user: {
    name?: string | null;
    email?: string | null;
    role?: string | null;
  };
}

export default function Sidebar({ user }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const isAdmin = user.role === 'admin';

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: Menu, exact: true },
    { href: '/dashboard/competitors', label: 'Competidores', icon: Users },
    { href: '/dashboard/events', label: 'Eventos', icon: Calendar },
    ...(isAdmin ? [{ href: '/dashboard/organizers', label: 'Organizadores', icon: Building2 }] : []),
  ];

  const isActive = (href: string, exact?: boolean) => {
    if (exact) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' });
  };

  const SidebarContent = () => (
    <>
      {/* Logo/Branding */}
      <div className="p-6 border-b border-[var(--espresso-700)]">
        <Link href="/dashboard" className="block">
          <h1 className="text-2xl font-display font-bold text-[var(--crema-50)]">
            Crema Arena
          </h1>
          <p className="text-sm text-[var(--crema-200)] font-serif italic mt-1">
            Admin Panel
          </p>
        </Link>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href, item.exact);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-[var(--radius-sm)] text-sm font-medium transition-all min-h-[44px] touch-manipulation ${
                active
                  ? 'bg-[var(--cinnamon-700)] text-[var(--crema-50)]'
                  : 'text-[var(--crema-100)] hover:bg-[var(--espresso-700)] hover:text-[var(--crema-50)]'
              }`}
              style={{
                transitionDuration: 'var(--dur-base)',
                transitionTimingFunction: 'var(--ease-standard)',
              }}
              aria-current={active ? 'page' : undefined}
            >
              <Icon size={18} aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-[var(--espresso-700)]">
        <div className="mb-3 px-2">
          <p className="text-sm font-medium text-[var(--crema-50)] truncate">
            {user.name || 'User'}
          </p>
          <p className="text-xs text-[var(--crema-200)] truncate">
            {user.email}
          </p>
          {user.role && (
            <p className="text-xs text-[var(--cinnamon-500)] mt-1 capitalize">
              {user.role}
            </p>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          fullWidth
          onClick={handleSignOut}
          className="!text-[var(--crema-100)] hover:!bg-[var(--espresso-700)] hover:!text-[var(--crema-50)]"
        >
          <LogOut size={16} />
          <span>Sair</span>
        </Button>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed top-4 left-4 z-50 md:hidden p-3 rounded-[var(--radius-sm)] bg-[var(--espresso-900)] text-[var(--crema-50)] shadow-[var(--shadow-2)] touch-manipulation min-h-[48px] min-w-[48px] flex items-center justify-center"
        aria-label={isOpen ? 'Fechar menu' : 'Abrir menu'}
        aria-expanded={isOpen}
        style={{
          transitionDuration: 'var(--dur-base)',
          transitionTimingFunction: 'var(--ease-standard)',
        }}
      >
        {isOpen ? <X size={24} aria-hidden="true" /> : <Menu size={24} aria-hidden="true" />}
      </button>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-[var(--espresso-900)]/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsOpen(false)}
          role="button"
          tabIndex={0}
          aria-label="Fechar menu"
          onKeyDown={(e) => {
            if (e.key === 'Escape') setIsOpen(false);
          }}
          style={{
            transitionDuration: 'var(--dur-base)',
            transitionTimingFunction: 'var(--ease-standard)',
          }}
        />
      )}

      {/* Sidebar - Desktop (always visible) */}
      <aside className="hidden md:flex md:flex-col md:w-64 bg-[var(--espresso-900)] min-h-screen" role="navigation" aria-label="Menu principal">
        <SidebarContent />
      </aside>

      {/* Sidebar - Mobile (slide-in) */}
      <aside
        className={`fixed top-0 left-0 z-40 w-64 h-screen bg-[var(--espresso-900)] transform transition-transform md:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{
          transitionDuration: 'var(--dur-stage)',
          transitionTimingFunction: 'var(--ease-standard)',
        }}
        role="navigation"
        aria-label="Menu principal"
      >
        <SidebarContent />
      </aside>
    </>
  );
}
