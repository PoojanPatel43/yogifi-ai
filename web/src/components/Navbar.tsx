import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { hasAccessToken } from '../lib/api';
import { Sun, Moon, Menu, X } from 'lucide-react';

const Navbar = () => {
  const [scrolled, setScrolled]    = useState(false);
  const [isLoggedIn]               = useState(() => hasAccessToken());
  const [dark, setDark]            = useState(() =>
    document.documentElement.classList.contains('dark')
  );
  const [menuOpen, setMenuOpen]    = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
  };

  const navLinks = [
    { href: '#features',   label: 'Features'   },
    { href: '#philosophy', label: 'Philosophy' },
    { href: '#protocol',   label: 'Method'     },
    { href: '#pricing',    label: 'Pricing'    },
  ];

  return (
    <>
      <nav
        className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-5xl
          px-5 py-3 rounded-full flex items-center justify-between
          transition-all duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]
          ${scrolled
            ? 'bg-warmwhite/85 dark:bg-forest-dark/90 backdrop-blur-xl border border-sage/20 shadow-md'
            : 'bg-transparent border border-transparent'
          }`}
      >
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 select-none">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
            ${scrolled ? 'bg-forest text-warmwhite' : 'bg-warmwhite/15 text-warmwhite border border-warmwhite/30'}`}>
            Y
          </div>
          <span className={`font-outfit font-bold text-lg tracking-tight
            ${scrolled ? 'text-forest dark:text-warmwhite' : 'text-warmwhite'}`}>
            Yogifi AI
          </span>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-7 text-sm font-sans font-semibold">
          {navLinks.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              className={`link-lift transition-colors duration-200
                ${scrolled ? 'text-forest/70 hover:text-forest dark:text-warmwhite/70 dark:hover:text-gold' : 'text-warmwhite/75 hover:text-warmwhite'}`}
            >
              {label}
            </a>
          ))}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          {/* Dark mode toggle */}
          <button
            onClick={toggleDark}
            aria-label="Toggle dark mode"
            className={`p-2 rounded-full transition-colors duration-200
              ${scrolled ? 'text-forest/60 hover:bg-forest/8 dark:text-warmwhite/60' : 'text-warmwhite/60 hover:bg-warmwhite/10'}`}
          >
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {isLoggedIn ? (
            <Link
              to="/dashboard"
              className="btn-primary !px-5 !py-2.5 text-sm"
            >
              <span>Dashboard →</span>
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className={`hidden sm:block text-sm font-semibold transition-colors duration-200
                  ${scrolled ? 'text-forest/70 hover:text-forest dark:text-warmwhite/70' : 'text-warmwhite/75 hover:text-warmwhite'}`}
              >
                Log In
              </Link>
              <a
                href="#pricing"
                className="btn-primary !px-5 !py-2.5 text-sm"
              >
                <span>Join Waitlist</span>
              </a>
            </>
          )}

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMenuOpen(v => !v)}
            className={`md:hidden p-2 rounded-full transition-colors
              ${scrolled ? 'text-forest hover:bg-forest/8' : 'text-warmwhite hover:bg-warmwhite/10'}`}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </nav>

      {/* Mobile slide-down menu */}
      <div
        className={`fixed top-[72px] left-1/2 -translate-x-1/2 w-[94%] max-w-5xl z-40
          bg-warmwhite/95 dark:bg-forest-dark/95 backdrop-blur-xl rounded-[1.5rem]
          border border-sage/20 shadow-xl overflow-hidden
          transition-all duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]
          ${menuOpen ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}`}
      >
        <div className="flex flex-col p-5 gap-1">
          {navLinks.map(({ href, label }) => (
            <a
              key={href}
              href={href}
              onClick={() => setMenuOpen(false)}
              className="text-forest dark:text-warmwhite font-semibold text-base
                px-4 py-3 rounded-xl hover:bg-forest/6 dark:hover:bg-warmwhite/6
                transition-colors duration-150"
            >
              {label}
            </a>
          ))}
          <div className="border-t border-sage/20 mt-2 pt-3 flex gap-3">
            <Link
              to="/login"
              onClick={() => setMenuOpen(false)}
              className="flex-1 text-center text-forest dark:text-warmwhite font-semibold
                px-4 py-3 rounded-xl border border-forest/20 dark:border-warmwhite/20
                hover:bg-forest/6 transition-colors text-sm"
            >
              Log In
            </Link>
            <a
              href="#pricing"
              onClick={() => setMenuOpen(false)}
              className="flex-1 text-center btn-primary !py-3 text-sm"
            >
              Join Waitlist
            </a>
          </div>
        </div>
      </div>
    </>
  );
};

export default Navbar;
