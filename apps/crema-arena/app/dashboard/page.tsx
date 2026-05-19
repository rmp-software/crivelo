import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Users, Calendar, Building2, TrendingUp } from 'lucide-react';
import PageHeader from '@/app/components/PageHeader';
import Card from '@/app/components/Card';

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  const isAdmin = session?.user?.role === 'admin';

  const [totalEvents, totalCompetitors, activeEvents] = await Promise.all([
    prisma.event.count(),
    prisma.competitor.count(),
    prisma.event.count({ where: { status: 'running' } }),
  ]);

  const quickLinks = [
    {
      href: '/dashboard/competitors',
      label: 'Competidores',
      description: 'Gerencie os competidores cadastrados',
      icon: Users,
      color: 'var(--cinnamon-500)',
    },
    {
      href: '/dashboard/events',
      label: 'Eventos',
      description: 'Visualize e gerencie eventos',
      icon: Calendar,
      color: 'var(--mint-500)',
    },
    ...(isAdmin
      ? [
          {
            href: '/dashboard/organizers',
            label: 'Organizadores',
            description: 'Gerencie contas de organizadores',
            icon: Building2,
            color: 'var(--gold)',
          },
        ]
      : []),
  ];

  return (
    <div>
      <PageHeader
        title={`Bem-vindo, ${session?.user?.name || 'Admin'}!`}
        description="Gerencie sua plataforma de competições de café especial"
      />

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
        <Card padding="md" shadow="sm">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-[var(--radius-md)] bg-[var(--brand-soft)]">
              <TrendingUp size={24} style={{ color: 'var(--brand)' }} />
            </div>
            <div>
              <p className="text-sm text-[var(--fg-3)]">Total de Eventos</p>
              <p className="text-2xl font-display font-bold text-[var(--fg)]">{totalEvents}</p>
            </div>
          </div>
        </Card>

        <Card padding="md" shadow="sm">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-[var(--radius-md)] bg-[var(--live-soft)]">
              <Users size={24} style={{ color: 'var(--live)' }} />
            </div>
            <div>
              <p className="text-sm text-[var(--fg-3)]">Total de Competidores</p>
              <p className="text-2xl font-display font-bold text-[var(--fg)]">{totalCompetitors}</p>
            </div>
          </div>
        </Card>

        <Card padding="md" shadow="sm">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-[var(--radius-md)] bg-[var(--gold-soft)]">
              <Calendar size={24} style={{ color: 'var(--gold)' }} />
            </div>
            <div>
              <p className="text-sm text-[var(--fg-3)]">Eventos ao Vivo</p>
              <p className="text-2xl font-display font-bold text-[var(--fg)]">{activeEvents}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Links */}
      <div>
        <h2 className="text-xl font-display font-bold text-[var(--fg)] mb-4">
          Acesso Rápido
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
