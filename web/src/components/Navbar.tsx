import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Just a simple trigger instead of setting up a ref to Hero for now
      if (window.scrollY > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav 
      className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] px-6 py-3.5 rounded-full flex items-center justify-between w-[92%] max-w-5xl ${
        scrolled 
          ? 'bg-cream/60 backdrop-blur-xl border border-moss/10 text-moss shadow-sm translate-y-0' 
          : 'bg-transparent text-cream border border-transparent translate-y-2'
      }`}
    >
      <div className="font-outfit font-bold text-xl tracking-tight">
        Yogifi AI
      </div>

      <div className="hidden md:flex items-center gap-8 text-sm font-sans font-semibold">
        <a href="#features" className={`link-lift-color ${scrolled ? 'hover:text-clay' : 'hover:text-clay text-cream'}`}>Features</a>
        <a href="#philosophy" className={`link-lift-color ${scrolled ? 'hover:text-clay' : 'hover:text-clay text-cream'}`}>Philosophy</a>
        <a href="#protocol" className={`link-lift-color ${scrolled ? 'hover:text-clay' : 'hover:text-clay text-cream'}`}>Method</a>
      </div>

      <div className="hidden sm:flex items-center gap-4">
        <Link to="/login" className={`text-sm font-sans font-semibold transition-colors ${scrolled ? 'text-moss hover:text-clay' : 'text-cream hover:text-clay'}`}>
          Log In
        </Link>
        <button className="magnetic-btn btn-clay bg-clay text-cream px-6 py-2.5 rounded-full text-sm font-sans font-bold shadow-md hidden lg:block">
          <span>Join Waitlist</span>
        </button>
        <Link to="/signup" className="magnetic-btn bg-charcoal text-cream px-6 py-2.5 rounded-full text-sm font-sans font-bold shadow-md hidden sm:block lg:hidden">
          <span>Sign Up</span>
        </Link>
        <Link to="/signup" className="magnetic-btn border border-clay text-clay px-6 py-2.5 rounded-full text-sm font-sans font-bold shadow-md hidden lg:block hover:bg-clay hover:text-cream transition-colors">
          <span>Sign Up</span>
        </Link>
      </div>
      
      {/* Mobile CTA only */}
      <div className="flex sm:hidden items-center gap-3">
        <Link to="/login" className={`text-xs font-sans font-bold ${scrolled ? 'text-moss' : 'text-cream'}`}>
          Log In
        </Link>
        <button className="magnetic-btn btn-clay bg-clay text-cream px-5 py-2 rounded-full text-xs font-sans font-bold shadow-md">
          <span>Join</span>
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
