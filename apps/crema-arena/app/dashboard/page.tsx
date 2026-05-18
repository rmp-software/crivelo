import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import Link from 'next/link';
import { Users, Calendar, Building2, TrendingUp } from 'lucide-react';
import PageHeader from '@/app/components/PageHeader';
import Card from '@/app/components/Card';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  const isAdmin = session?.user?.role === 'admin';

  const quickLinks = [
    {
      href: '/dashboard/competitors',
      label: 'Competitors',
      description: 'Manage competitor registrations',
      icon: Users,
      color: 'var(--cinnamon-500)',
    },
    {
      href: '/dashboard/events',
      label: 'Events',
      description: 'View and manage events',
      icon: Calendar,
      color: 'var(--mint-500)',
    },
    ...(isAdmin
      ? [
          {
            href: '/dashboard/organizers',
            label: 'Organizers',
            description: 'Manage organizer accounts',
            icon: Building2,
            color: 'var(--gold)',
          },
        ]
      : []),
  ];

  return (
    <div>
      <PageHeader
        title={`Welcome back, ${session?.user?.name || 'Admin'}!`}
        description="Manage your coffee competition platform from here"
      />

      {/* Quick Stats - Placeholder for future implementation */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
        <Card padding="md" shadow="sm">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-[var(--radius-md)] bg-[var(--brand-soft)]">
              <TrendingUp size={24} style={{ color: 'var(--brand)' }} />
            </div>
            <div>
              <p className="text-sm text-[var(--fg-3)]">Total Events</p>
              <p className="text-2xl font-display font-bold text-[var(--fg)]">-</p>
            </div>
          </div>
        </Card>

        <Card padding="md" shadow="sm">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-[var(--radius-md)] bg-[var(--live-soft)]">
              <Users size={24} style={{ color: 'var(--live)' }} />
            </div>
            <div>
              <p className="text-sm text-[var(--fg-3)]">Total Competitors</p>
              <p className="text-2xl font-display font-bold text-[var(--fg)]">-</p>
            </div>
          </div>
        </Card>

        <Card padding="md" shadow="sm">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-[var(--radius-md)] bg-[var(--gold-soft)]">
              <Calendar size={24} style={{ color: 'var(--gold)' }} />
            </div>
            <div>
              <p className="text-sm text-[var(--fg-3)]">Active Events</p>
              <p className="text-2xl font-display font-bold text-[var(--fg)]">-</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Links */}
      <div>
        <h2 className="text-xl font-display font-bold text-[var(--fg)] mb-4">
          Quick Access
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link key={link.href} href={link.href}>
                <Card
                  padding="lg"
                  shadow="sm"
                  className="hover:shadow-[var(--shadow-2)] transition-all cursor-pointer group"
                  style={{
                    transitionDuration: 'var(--dur-base)',
                    transitionTimingFunction: 'var(--ease-standard)',
                  }}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className="p-3 rounded-[var(--radius-md)] transition-transform group-hover:scale-110"
                      style={{
                        backgroundColor: `${link.color}15`,
                        transitionDuration: 'var(--dur-base)',
                      }}
                    >
                      <Icon size={28} style={{ color: link.color }} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-display font-bold text-[var(--fg)] mb-1">
                        {link.label}
                      </h3>
                      <p className="text-sm text-[var(--fg-3)]">{link.description}</p>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
