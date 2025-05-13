
import { ThemeToggler } from './ThemeToggler';

export function Footer() {
  return (
    <footer className="border-t py-6 md:py-8">
      <div className="container max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between">
        <p className="text-sm text-muted-foreground mb-4 sm:mb-0">
          © {new Date().getFullYear()} ForumLite. All rights reserved.
        </p>
        <ThemeToggler />
      </div>
    </footer>
  );
}
