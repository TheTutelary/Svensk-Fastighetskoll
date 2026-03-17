import Link from 'next/link';
import { Home, Info } from 'lucide-react';

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <Home className="h-6 w-6" />
            <span className="hidden font-bold sm:inline-block">
              Svensk Fastighetskoll
            </span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link
              href="/"
              className="transition-colors hover:text-foreground/80 text-foreground"
            >
              Analyze
            </Link>
            <Link
              href="/about"
              className="transition-colors hover:text-foreground/80 text-foreground/60"
            >
              How it Works
            </Link>
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            {/* Search or nav items here */}
          </div>
          <nav className="flex items-center">
             <Link href="https://github.com" target="_blank" rel="noreferrer">
                <div className="bg-primary text-primary-foreground px-4 py-2 rounded-full text-xs font-semibold">
                  Beta v2.0
                </div>
             </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
