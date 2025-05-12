import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { getCurrentUser, logout } from '@/lib/actions/auth';
import { LogIn, LogOut, UserPlus, Home, ShieldCheck, Settings } from 'lucide-react'; // Added Settings for Admin

export async function Header() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-screen-2xl items-center">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-primary">
            <path d="M12 22V8a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12Z" />
            <path d="M12 14v8" />
            <path d="M18 14v8" />
            <path d="M22 14v8" />
            <path d="M18 6a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v2h6Z" />
          </svg>
          <span className="font-bold">ForumLite</span>
        </Link>
        <nav className="flex flex-1 items-center space-x-6 text-sm font-medium">
          <Link
            href="/"
            className="transition-colors hover:text-foreground/80 text-foreground/60"
          >
            <Home className="inline-block h-4 w-4 mr-1" />
            Home
          </Link>
           {user?.isAdmin && (
              <Link
                href="/admin"
                 className="transition-colors hover:text-foreground/80 text-foreground/60"
              >
                 <Settings className="inline-block h-4 w-4 mr-1" />
                Admin
              </Link>
           )}
           {/* Add more nav links here if needed */}
        </nav>

        <div className="flex items-center justify-end space-x-2">
          {user ? (
            <>
             {user.isAdmin && (
                 <span className="text-xs font-semibold text-destructive flex items-center mr-2 border border-destructive/50 rounded px-1.5 py-0.5 bg-destructive/10">
                    <ShieldCheck className="h-3.5 w-3.5 mr-1" /> Admin
                 </span>
             )}
              <span className="text-sm font-medium mr-2 hidden sm:inline">
                Welcome, {user.username}
              </span>
              <form action={logout}>
                <Button variant="outline" size="sm" type="submit">
                   <LogOut className="h-4 w-4 mr-1" /> Logout
                </Button>
              </form>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" asChild>
                <Link href="/login">
                  <LogIn className="h-4 w-4 mr-1" /> Login
                </Link>
              </Button>
              <Button variant="default" size="sm" asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Link href="/register">
                   <UserPlus className="h-4 w-4 mr-1" /> Register
                </Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}