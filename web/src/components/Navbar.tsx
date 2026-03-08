import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { hasAccessToken } from '../lib/api';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const isLoggedIn = hasAccessToken();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        backgroundColor: 'var(--bg)',
        borderBottom: `1px solid ${scrolled ? 'var(--line)' : 'transparent'}`,
        transition: 'border-color 0.3s ease',
      }}
    >
      <div
        style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 2rem' }}
        className="flex items-center justify-between h-14"
      >
        <Link
          to="/"
          style={{
            fontFamily: '"Playfair Display", serif', fontStyle: 'italic', fontWeight: 700,
            fontSize: '1.4rem', color: 'var(--ink)', textDecoration: 'none', letterSpacing: '-0.02em',
          }}
        >
          Yogifi
        </Link>

        <div className="hidden md:flex items-center gap-10">
          {[
            { label: 'Practice', href: '/session' },
            { label: 'How it works', href: '/#how-it-works' },
            { label: 'Pricing', href: '/#pricing' },
          ].map(link => (
            <Link
              key={link.label} to={link.href}
              className="ck-label transition-colors duration-200"
              style={{ textDecoration: 'none' }}
              onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'var(--accent)')}
              onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--muted)')}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-4">
          {isLoggedIn ? (
            <Link to="/dashboard" className="btn-ink" style={{ padding: '0.5rem 1.2rem' }}>Dashboard</Link>
          ) : (
            <>
              <Link
                to="/login"
                className="ck-label hidden sm:block transition-colors duration-200"
                style={{ textDecoration: 'none' }}
                onMouseEnter={e => ((e.currentTarget as HTMLElement).style.color = 'var(--accent)')}
                onMouseLeave={e => ((e.currentTarget as HTMLElement).style.color = 'var(--muted)')}
              >
                Sign in
              </Link>
              <Link to="/signup" className="btn-ink" style={{ padding: '0.5rem 1.2rem' }}>Get started</Link>
            </>
          )}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2"
            aria-label="Menu"
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            {[0, 1, 2].map(i => (
              <span
                key={i}
                style={{
                  display: 'block', width: 22, height: 1,
                  backgroundColor: 'var(--ink)', marginBottom: i < 2 ? 5 : 0,
                  opacity: i === 1 && menuOpen ? 0 : 1,
                  transition: 'opacity 0.2s',
                }}
              />
            ))}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div
          style={{ backgroundColor: 'var(--bg)', borderTop: '1px solid var(--line)', padding: '1.5rem 2rem' }}
          className="md:hidden flex flex-col gap-5"
        >
          {[
            { label: 'Practice', href: '/session' },
            { label: 'How it works', href: '/#how-it-works' },
            { label: 'Pricing', href: '/#pricing' },
            { label: 'Sign in', href: '/login' },
          ].map(link => (
            <Link
              key={link.label} to={link.href}
              onClick={() => setMenuOpen(false)}
              className="ck-label"
              style={{ textDecoration: 'none' }}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
