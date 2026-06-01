import Link from 'next/link';
import { useRouter } from 'next/router';

export default function Nav() {
  const router = useRouter();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-obsidian-800 bg-obsidian-950/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-6 h-6 bg-sand-500 flex items-center justify-center">
            <span className="text-obsidian-950 text-xs font-bold">S</span>
          </div>
          <span className="font-display text-lg text-sand-100 tracking-wide">
            Studio<span className="text-sand-400">Book</span>
          </span>
          <span className="hidden sm:block text-obsidian-500 text-xs font-mono tracking-widest uppercase ml-2">
            Dubai
          </span>
        </Link>

        <div className="flex items-center gap-6">
          <Link 
            href="/" 
            className={`text-sm transition-colors ${router.pathname === '/' ? 'text-sand-300' : 'text-obsidian-400 hover:text-sand-300'}`}
          >
            Find Studios
          </Link>
          <div className="h-4 w-px bg-obsidian-700" />
          <a 
            href="mailto:hello@studiobook.ae" 
            className="text-sm text-obsidian-400 hover:text-sand-300 transition-colors"
          >
            For Studios
          </a>
          <div className="hidden sm:block h-4 w-px bg-obsidian-700" />
          <a 
            href="tel:+97143000000" 
            className="hidden sm:flex items-center gap-2 text-xs font-mono text-obsidian-400 hover:text-sand-300 transition-colors"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Available 24/7
          </a>
        </div>
      </div>
    </nav>
  );
}
