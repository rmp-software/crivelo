import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import Sidebar from '@/app/components/Sidebar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  return (
    <div className="flex min-h-screen bg-[var(--bg)] overflow-x-hidden">
      <Sidebar user={session.user} />

      {/* Main Content Area */}
      <main className="flex-1 w-full md:ml-0 p-4 sm:p-6 md:p-8 lg:p-12 pt-20 md:pt-6">
        <div className="max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
