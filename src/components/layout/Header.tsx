
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getCurrentUser, logout } from '@/lib/actions/auth';
import { getUnreadNotificationCountAction } from '@/lib/actions/notifications';
import { getUnreadPrivateMessageCountAction } from '@/lib/actions/privateMessages'; // Import PM count action
import { LogIn, LogOut, UserPlus, Home, ShieldCheck, Settings, User as UserIcon, Settings2, MessageSquare } from 'lucide-react'; // Added MessageSquare
import { HeaderNotificationDropdown } from './HeaderNotificationDropdown'; 
import { getAllSiteSettings } from '@/lib/db';
import { Logo } from './Logo';

export async function Header() {
  const user = await getCurrentUser();
  let initialUnreadNotifCount = 0;
  let initialUnreadPMCount = 0;
  const siteSettings = await getAllSiteSettings();

  if (user) {
    initialUnreadNotifCount = await getUnreadNotificationCountAction();
    initialUnreadPMCount = await getUnreadPrivateMessageCountAction();
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 relative">
      <div className="container flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6 lg:px-8 relative">
        <Link href="/" className="flex items-center space-x-2 flex-shrink-0">
          <Logo customLogoUrl={siteSettings.appearance_logo_url} />
          <span className="font-bold hidden sm:inline-block">Rexerium Forum</span>
        </Link>
        <nav className="hidden md:flex items-center justify-center space-x-4 sm:space-x-6 text-sm font-medium mx-6 absolute left-1/2 transform -translate-x-1/2">
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
                href="/messages"
                className="transition-colors hover:text-primary text-foreground/80 flex items-center gap-1 relative"
               >
                <MessageSquare className="h-4 w-4" />
                <span className="hidden sm:inline">Messages</span>
                {initialUnreadPMCount > 0 && (
                    <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-2 w-2 items-center justify-center rounded-full bg-accent text-xs">
                         <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75"></span>
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent"></span>
                    </span>
                )}
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

        <div className="flex md:hidden flex-shrink-0 items-center space-x-2">
        {user ? (
          <>
           {user.isAdmin && (
               <span className="text-xs font-semibold text-destructive hidden sm:flex items-center border border-destructive/50 rounded px-1.5 py-0.5 bg-destructive/10">
                  <ShieldCheck className="h-3.5 w-3.5 mr-1" /> Admin
               </span>
           )}
           
           <HeaderNotificationDropdown user={user} initialUnreadCount={initialUnreadNotifCount} useFriendlyUrls={siteSettings.seo_friendly_urls_enabled} />

            <span className="text-sm font-medium hidden md:inline">
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
      
      <div className="hidden md:flex flex-shrink-0 items-center space-x-2 absolute right-0 top-0 h-14 px-4 sm:px-6 lg:px-8">
        {user ? (
          <>
           {user.isAdmin && (
               <span className="text-xs font-semibold text-destructive hidden sm:flex items-center border border-destructive/50 rounded px-1.5 py-0.5 bg-destructive/10">
                  <ShieldCheck className="h-3.5 w-3.5 mr-1" /> Admin
               </span>
           )}
           
           <HeaderNotificationDropdown user={user} initialUnreadCount={initialUnreadNotifCount} useFriendlyUrls={siteSettings.seo_friendly_urls_enabled} />

            <span className="text-sm font-medium hidden md:inline">
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
    </header>
  );
}
