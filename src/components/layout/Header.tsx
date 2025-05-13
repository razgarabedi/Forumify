
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getCurrentUser, logout } from '@/lib/actions/auth';
import { getUnreadNotificationCountAction } from '@/lib/actions/notifications';
import { LogIn, LogOut, UserPlus, Home, ShieldCheck, Settings, User as UserIcon, Settings2 } from 'lucide-react'; // Added Settings2
import { HeaderNotificationDropdown } from './HeaderNotificationDropdown'; 

export async function Header() {
  const user = await getCurrentUser();
  let initialUnreadCount = 0;
  if (user) {
    initialUnreadCount = await getUnreadNotificationCountAction();
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-5xl items-center px-4 sm:px-6 lg:px-8">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-primary">
             <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
          <span className="font-bold hidden sm:inline-block">ForumLite</span>
        </Link>
        <nav className="flex flex-1 items-center space-x-4 sm:space-x-6 text-sm font-medium">
          <Link
            href="/"
            className="transition-colors hover:text-primary text-foreground/80 flex items-center gap-1"
          >
            <Home className="h-4 w-4" />
            <span className="hidden sm:inline">Home</span>
          </Link>
           {user?.isAdmin && (
              <Link
                href="/admin"
                 className="transition-colors hover:text-primary text-foreground/80 flex items-center gap-1"
              >
                 <Settings className="h-4 w-4" />
                <span className="hidden sm:inline">Admin</span>
              </Link>
           )}
           {user && (
             <>
               <Link
                  href={`/users/${user.username}`}
                  className="transition-colors hover:text-primary text-foreground/80 flex items-center gap-1"
               >
                  <UserIcon className="h-4 w-4" />
                  <span className="hidden sm:inline">My Profile</span>
               </Link>
               <Link
                  href="/settings"
                  className="transition-colors hover:text-primary text-foreground/80 flex items-center gap-1"
               >
                  <Settings2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Settings</span>
               </Link>
             </>
           )}
        </nav>

        <div className="flex flex-shrink-0 items-center justify-end space-x-2">
          {user ? (
            <>
             {user.isAdmin && (
                 <span className="text-xs font-semibold text-destructive hidden sm:flex items-center mr-2 border border-destructive/50 rounded px-1.5 py-0.5 bg-destructive/10">
                    <ShieldCheck className="h-3.5 w-3.5 mr-1" /> Admin
                 </span>
             )}
             
             <HeaderNotificationDropdown user={user} initialUnreadCount={initialUnreadCount} />

              <span className="text-sm font-medium mr-2 hidden md:inline">
                Welcome, {user.username}
              </span>
              <form action={logout}>
                <Button variant="outline" size="sm" type="submit">
                   <LogOut className="h-4 w-4 sm:mr-1" /> <span className="hidden sm:inline">Logout</span>
                </Button>
              </form>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" asChild>
                <Link href="/login">
                  <LogIn className="h-4 w-4 sm:mr-1" /> <span className="hidden sm:inline">Login</span>
                </Link>
              </Button>
              <Button variant="default" size="sm" asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Link href="/register">
                   <UserPlus className="h-4 w-4 sm:mr-1" /> <span className="hidden sm:inline">Register</span>
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

