
const Footer = () => {
  return (
    <footer className="w-full bg-[#1A1A1A] rounded-[4rem_4rem_0_0] pt-24 pb-8 px-6 md:px-12 lg:px-20 -mt-10 relative z-40">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between lg:grid lg:grid-cols-4 gap-12 lg:gap-8 mb-20 text-cream">
        
        {/* Col 1 */}
        <div className="lg:col-span-2 flex flex-col items-start pr-12">
          <div className="font-outfit font-bold text-3xl tracking-tight mb-4">
            Yogifi AI
          </div>
          <p className="font-outfit text-cream/50 text-sm max-w-sm mb-8 leading-relaxed">
            Personalized wellness coaching powered by computer vision. Your body, understood in real time.
          </p>
          <div className="flex items-center gap-2 mt-auto">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="font-mono text-[10px] text-cream/40 tracking-widest">
              SYSTEM OPERATIONAL · v0.9.1-beta
            </span>
          </div>
        </div>

        {/* Col 2 */}
        <div className="flex flex-col">
          <h4 className="font-mono text-[11px] text-cream/40 tracking-widest mb-6 uppercase">Product</h4>
          <div className="flex flex-col gap-4 font-sans text-sm font-semibold">
            <a href="#features" className="link-lift-color hover:text-clay text-cream/80 w-fit link-lift hover:translate-x-1">Features</a>
            <a href="#philosophy" className="link-lift-color hover:text-clay text-cream/80 w-fit link-lift hover:translate-x-1">Philosophy</a>
            <a href="#protocol" className="link-lift-color hover:text-clay text-cream/80 w-fit link-lift hover:translate-x-1">Method</a>
            <a href="#pricing" className="link-lift-color hover:text-clay text-cream/80 w-fit link-lift hover:translate-x-1">Pricing</a>
          </div>
        </div>

        {/* Col 3 */}
        <div className="flex flex-col">
          <h4 className="font-mono text-[11px] text-cream/40 tracking-widest mb-6 uppercase">Company</h4>
          <div className="flex flex-col gap-4 font-sans text-sm font-semibold">
            <a href="#" className="link-lift-color hover:text-clay text-cream/80 w-fit link-lift hover:translate-x-1">About</a>
            <a href="#" className="link-lift-color hover:text-clay text-cream/80 w-fit link-lift hover:translate-x-1">Blog</a>
            <a href="#" className="link-lift-color hover:text-clay text-cream/80 w-fit link-lift hover:translate-x-1">Privacy</a>
            <a href="#" className="link-lift-color hover:text-clay text-cream/80 w-fit link-lift hover:translate-x-1">Terms</a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-8 border-t border-cream/[0.07] flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="font-mono text-xs text-cream/40">
          © 2025 Yogifi AI. All rights reserved.
        </p>
        <div className="flex gap-4">
           {/* Social icons could go here */}
        </div>
      </div>
    </footer>
  );
};

export default Footer;
