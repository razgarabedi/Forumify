
import type { ReactNode } from 'react';
import { getCurrentUser } from '@/lib/actions/auth';
import { redirect } from 'next/navigation';
import { MessageSquare } from 'lucide-react';

export const metadata = {
  title: 'Private Messages - ForumLite',
};

interface MessagesLayoutProps {
  children: ReactNode;
}

export default async function MessagesLayout({ children }: MessagesLayoutProps) {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login?redirect=/messages');
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <MessageSquare className="h-7 w-7 text-primary" />
        <h1 className="text-2xl sm:text-3xl font-bold">Private Messages</h1>
      </div>
      {children}
    </div>
  );
}
