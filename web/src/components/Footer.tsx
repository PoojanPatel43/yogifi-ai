const Footer = () => {
  const productLinks = [
    { href: '#features',   label: 'Features'   },
    { href: '#philosophy', label: 'Philosophy' },
    { href: '#protocol',   label: 'Method'     },
    { href: '#pricing',    label: 'Pricing'    },
  ];
  const companyLinks = [
    { href: '#', label: 'About'   },
    { href: '#', label: 'Blog'    },
    { href: '#', label: 'Privacy' },
    { href: '#', label: 'Terms'   },
  ];

  return (
    <footer className="w-full bg-forest-dark rounded-[3.5rem_3.5rem_0_0] pt-20 pb-8 px-6 md:px-12 lg:px-20 -mt-8 relative z-40">

      {/* Top row */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 lg:gap-8 mb-16 text-warmwhite">

        {/* Brand */}
        <div className="lg:col-span-2 flex flex-col items-start pr-8">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-9 h-9 rounded-full bg-gold/15 border border-gold/20 flex items-center justify-center font-bold text-sm text-gold">Y</div>
            <span className="font-outfit font-bold text-xl tracking-tight">Yogifi AI</span>
          </div>
          <p className="font-outfit text-warmwhite/40 text-sm max-w-xs mb-8 leading-relaxed">
            Personalized wellness coaching powered by computer vision. Your body, understood in real time.
          </p>
          {/* Status pill */}
          <div className="flex items-center gap-2 mt-auto bg-warmwhite/5 border border-warmwhite/8 rounded-full px-4 py-2">
            <div className="w-2 h-2 rounded-full bg-sage animate-pulse" />
            <span className="font-mono text-[10px] text-warmwhite/35 tracking-widest">SYSTEM OPERATIONAL · v0.9.2-beta</span>
          </div>
        </div>

        {/* Product links */}
        <div className="flex flex-col">
          <h4 className="font-mono text-[10px] text-warmwhite/30 tracking-widest mb-5 uppercase">Product</h4>
          <div className="flex flex-col gap-3.5">
            {productLinks.map(({ href, label }) => (
              <a key={href} href={href} className="link-lift font-sans text-sm font-medium text-warmwhite/55 hover:text-gold transition-colors duration-200 w-fit">
                {label}
              </a>
            ))}
          </div>
        </div>

        {/* Company links */}
        <div className="flex flex-col">
          <h4 className="font-mono text-[10px] text-warmwhite/30 tracking-widest mb-5 uppercase">Company</h4>
          <div className="flex flex-col gap-3.5">
            {companyLinks.map(({ href, label }) => (
              <a key={label} href={href} className="link-lift font-sans text-sm font-medium text-warmwhite/55 hover:text-gold transition-colors duration-200 w-fit">
                {label}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="max-w-7xl mx-auto pt-7 border-t border-warmwhite/[0.06] flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="font-mono text-xs text-warmwhite/25">© 2025 Yogifi AI. All rights reserved.</p>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] text-warmwhite/20 tracking-widest">BUILT WITH</span>
          <span className="text-gold text-sm">♥</span>
          <span className="font-mono text-[10px] text-warmwhite/20 tracking-widest">& AI</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
