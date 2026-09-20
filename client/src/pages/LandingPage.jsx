import { useState, useEffect, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Search,
  ShoppingBag,
  ArrowRight,
  Leaf,
  FlaskConical,
  ShieldCheck,
  Trash2
} from 'lucide-react';
import HeroBottle3D from '../components/HeroBottle3D';
import LiveSkincareBackground from '../components/LiveSkincareBackground';
import productsData from '../data/products.json';

/**
 * Joyory Aura — Scroll-Linked 3D Product Journey
 * 
 * Direct implementation of the user's hand-drawn sketch:
 * 1. Fixed/Sticky 3D Canvas in the center.
 * 2. As the user scrolls, the 3D model glides and rotates along a smooth S-curve trajectory.
 * 3. Left and Right columns present synchronized information at each scroll stop:
 *    - Stop 1 (Hero): Headline, Brand badges (Left) | Live Bio-Compatibility Widget (Right)
 *    - Stop 2 (Diagnostic): 60-Sec Skin Quiz (Left) | Transparent Reason Scoring Tags (Right)
 *    - Stop 3 (Dupe Finder): Premium vs Smart Dupe (Left) | Clinical Formulation Trade-offs (Right)
 *    - Stop 4 (Catalog & Bag): Search & Category filters (Left) | Interactive Cart & Checkout (Right)
 */
export default function LandingPage() {
  // Chapter-aware scroll progress (0.0 to 1.0) drives the 3D bottle S-curve.
  const [scrollProgress, setScrollProgress] = useState(0);
  const sectionRefs = useRef({});
  const heroIsActive = scrollProgress <= 0.17;
  const diagnosticIsActive = scrollProgress > 0.17 && scrollProgress <= 0.5;
  const dupesIsActive = scrollProgress > 0.5 && scrollProgress <= 0.84;

  // Diagnostic Quiz State
  const [skinType, setSkinType] = useState('Combination');
  const [skinTone, setSkinTone] = useState('Medium');
  const [primaryConcern, setPrimaryConcern] = useState('Oiliness|Dullness');

  // Search & Filters for Catalog
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedTier, setSelectedTier] = useState('All');

  // Cart state
  const [cartItems, setCartItems] = useState([
    {
      ...productsData.find((p) => p.id === 'P012'), // Vitamin C 15% Serum
      quantity: 1,
      variant: '30ml'
    },
    {
      ...productsData.find((p) => p.id === 'P018'), // Ceramide Barrier Cream
      quantity: 1,
      variant: '50ml'
    }
  ]);
  const [promoApplied, setPromoApplied] = useState(true);

  // Align every bottle stop to the center of its matching content chapter.
  // The old whole-document calculation made the model arrive before or after
  // its related information card, especially on tall screens.
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['hero', 'diagnostic', 'dupes', 'catalog']
        .map((name) => sectionRefs.current[name])
        .filter(Boolean);

      if (sections.length < 2) return;

      const viewportCenter = window.scrollY + window.innerHeight / 2;
      const firstCenter = sections[0].offsetTop + sections[0].offsetHeight / 2;
      const lastSection = sections[sections.length - 1];
      const lastCenter = lastSection.offsetTop + lastSection.offsetHeight / 2;
      const travel = lastCenter - firstCenter;
      if (travel <= 0) return;
      const progress = (viewportCenter - firstCenter) / travel;
      setScrollProgress(Math.min(1, Math.max(0, progress)));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    handleScroll();
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  // Add a very small parallax response to the studio light on pointer devices.
  // It updates CSS variables directly so it does not trigger React re-renders.
  useEffect(() => {
    if (!window.matchMedia || !window.matchMedia('(pointer: fine)').matches) return undefined;

    let frameId;
    const handlePointerMove = (event) => {
      const offsetX = (event.clientX / window.innerWidth - 0.5) * 64;
      const offsetY = (event.clientY / window.innerHeight - 0.5) * 42;

      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(() => {
        document.documentElement.style.setProperty('--ambient-shift-x', `${offsetX}px`);
        document.documentElement.style.setProperty('--ambient-shift-y', `${offsetY}px`);
      });
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener('pointermove', handlePointerMove);
      document.documentElement.style.removeProperty('--ambient-shift-x');
      document.documentElement.style.removeProperty('--ambient-shift-y');
    };
  }, []);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return productsData.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.key_ingredients.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory =
        selectedCategory === 'All' || p.category === selectedCategory;
      const matchTier =
        selectedTier === 'All' || p.budget_tier === selectedTier;
      return matchSearch && matchCategory && matchTier;
    });
  }, [searchQuery, selectedCategory, selectedTier]);

  // Unique categories
  const categories = useMemo(() => {
    const list = Array.from(new Set(productsData.map((p) => p.category)));
    return ['All', ...list];
  }, []);

  // Cart total calculations
  const subTotal = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + item.price_inr * item.quantity, 0);
  }, [cartItems]);

  const discountAmount = useMemo(() => {
    return promoApplied ? Math.round(subTotal * 0.4) : 0;
  }, [subTotal, promoApplied]);

  const totalAmount = useMemo(() => {
    return Math.max(0, subTotal - discountAmount);
  }, [subTotal, discountAmount]);

  // Cart modifiers
  const updateQuantity = (id, delta) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const next = item.quantity + delta;
            return next > 0 ? { ...item, quantity: next } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const removeItem = (id) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const addToCart = (product) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { ...product, quantity: 1, variant: '30ml' }];
    });
  };

  return (
    <div className="relative min-h-screen bg-[#F6EFE9] text-[#231E1B] font-sans selection:bg-[#E8633A] selection:text-white">
      {/* Live Interactive Skincare Canvas Background (Fluid Aura, Bio-Lipid Waves & Cursor Lighting) */}
      <LiveSkincareBackground scrollProgress={scrollProgress} />
      
      {/* ====================================================================
          STICKY 3D BACKGROUND CANVAS (Moves along S-curve on scroll)
          ==================================================================== */}
      <div className="fixed inset-0 pointer-events-none z-0 hidden items-center justify-center overflow-hidden lg:flex">
        {/* 3D Bottle Canvas */}
        <div className="w-full h-full max-w-7xl mx-auto">
          <HeroBottle3D scrollProgress={scrollProgress} />
        </div>
      </div>

      {/* ====================================================================
          TOP FIXED NAVIGATION BAR
          ==================================================================== */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-[#F6EFE9]/80 border-b border-[#E8DFD4]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Brand Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-[#E8633A] flex items-center justify-center text-white shadow-md shadow-[#E8633A]/20">
              <Leaf className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-bold font-brand tracking-tight text-[#231E1B]">
                Joyory Aura
              </span>
              <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-[#EDE2D7] text-[#231E1B] rounded-full">
                Explainable Beauty AI
              </span>
            </div>
          </div>

          {/* Navigation Anchors */}
          <nav className="hidden md:flex items-center space-x-8 text-xs font-bold text-[#665D57]">
            <a href="#hero" className="hover:text-[#E8633A] transition-colors">01. Experience</a>
            <a href="#diagnostic" className="hover:text-[#E8633A] transition-colors">02. Diagnostic</a>
            <a href="#dupes" className="hover:text-[#E8633A] transition-colors">03. Smart Dupes</a>
            <a href="#catalog" className="hover:text-[#E8633A] transition-colors">04. Catalog ({productsData.length})</a>
          </nav>

          {/* Quick CTAs */}
          <div className="flex items-center space-x-3">
            <a
              href="#cart-section"
              className="w-10 h-10 rounded-full bg-white border border-[#EADFD4] flex items-center justify-center text-[#231E1B] shadow-sm relative hover:scale-105 transition-all"
            >
              <ShoppingBag className="w-4 h-4" />
              {cartItems.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#E8633A] text-white text-[9px] font-bold flex items-center justify-center">
                  {cartItems.reduce((acc, i) => acc + i.quantity, 0)}
                </span>
              )}
            </a>

            <Link
              to="/login"
              className="text-xs font-bold text-[#665D57] hover:text-[#231E1B] px-3 py-2"
            >
              Sign In
            </Link>

            <a
              href="#diagnostic"
              className="px-5 py-2.5 rounded-full bg-[#E8633A] text-white text-xs font-bold hover:bg-[#D4552E] transition-all shadow-md shadow-[#E8633A]/20"
            >
              Take Quiz
            </a>
          </div>
        </div>
      </header>

      {/* ====================================================================
          SCROLL TRAJECTORY VISUAL INDICATOR (Shows S-Curve Progress)
          ==================================================================== */}
      <div className="fixed right-4 top-1/2 -translate-y-1/2 z-30 hidden lg:flex flex-col items-center space-y-3 bg-white/70 backdrop-blur-md py-4 px-2 rounded-full border border-[#E8DFD4] shadow-sm">
        {[
          { label: 'Debut', step: 0 },
          { label: 'Diagnostic', step: 0.33 },
          { label: 'Dupe Engine', step: 0.66 },
          { label: 'Catalog', step: 1.0 }
        ].map((item, idx) => {
          const isActive =
            Math.abs(scrollProgress - item.step) < 0.22 ||
            (item.step === 1 && scrollProgress > 0.85);

          return (
            <div
              key={idx}
              title={item.label}
              className={`w-2.5 rounded-full transition-all duration-300 ${
                isActive ? 'h-7 bg-[#E8633A]' : 'h-2.5 bg-[#D9C8BA]'
              }`}
            />
          );
        })}
      </div>

      {/* ====================================================================
          FOREGROUND CONTENT LAYOUT (Left and Right columns flanking 3D model)
          ==================================================================== */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-40 sm:space-y-56 pt-12 pb-32">
        
        {/* ------------------------------------------------------------------
            CHAPTER 1: THE BIO-MATCH DEBUT (Top section in user sketch)
            Left: Headline, badging, description
            Center: 3D Bottle in Initial Beauty Angle
            Right: Live Bio-Compatibility Widget & Actives
            ------------------------------------------------------------------ */}
        <section ref={(node) => { sectionRefs.current.hero = node; }} id="hero" className="min-h-[80vh] flex items-center">
          <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Column (Information Block) */}
            <motion.div
              initial={{ opacity: 0, x: -36, y: 18 }}
              animate={heroIsActive ? { opacity: 1, x: 0, y: 0 } : { opacity: 0, x: -36, y: 18 }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="lg:col-span-4 min-w-0 max-w-md space-y-6 border-l-2 border-[#E8633A] py-4 pl-6"
            >
              <span className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-[#EADFD4] text-[#E8633A] text-[11px] font-bold tracking-wider uppercase">
                <Leaf className="w-3.5 h-3.5" />
                <span>Explainable Beauty Engine</span>
              </span>

              <h2 className="text-3xl sm:text-5xl font-extrabold font-brand text-[#231E1B] leading-tight">
                Beauty That <br />
                <span className="text-[#E8633A]">Fits Your Skin</span>
              </h2>

              <p className="text-xs sm:text-sm text-[#7A706A] leading-relaxed">
                Discover personalized active product matching calibrated to your lipid barrier,
                concerns, and budget with 100% transparent algorithmic reasoning.
              </p>

              {/* 3 Circular Badge Pills */}
              <div className="space-y-2.5 pt-2">
                <div className="flex items-center space-x-3 border-b border-[#EADFD4] px-1 py-3">
                  <div className="w-8 h-8 rounded-full bg-[#FAF6F2] flex items-center justify-center text-[#E8633A] shrink-0">
                    <Leaf className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#231E1B]">AI-Matched Bio-Compatibility</div>
                    <div className="text-[10px] text-[#8A7D75]">Tuned directly to your skin barrier lipids</div>
                  </div>
                </div>

                <div className="flex items-center space-x-3 border-b border-[#EADFD4] px-1 py-3">
                  <div className="w-8 h-8 rounded-full bg-[#FAF6F2] flex items-center justify-center text-[#E8633A] shrink-0">
                    <FlaskConical className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#231E1B]">Explainable Reason Tags</div>
                    <div className="text-[10px] text-[#8A7D75]">Zero black-box guesses: view exact score breakdown</div>
                  </div>
                </div>

                <div className="flex items-center space-x-3 border-b border-[#EADFD4] px-1 py-3">
                  <div className="w-8 h-8 rounded-full bg-[#FAF6F2] flex items-center justify-center text-[#E8633A] shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#231E1B]">Verified Clinical Dupes</div>
                    <div className="text-[10px] text-[#8A7D75]">Save up to 70% on equivalent active ingredients</div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center space-x-3">
                <a
                  href="#diagnostic"
                  className="px-7 py-3 rounded-full bg-[#E8633A] text-white text-xs font-bold hover:bg-[#D4552E] transition-all shadow-md hover:scale-102 flex items-center space-x-2"
                >
                  <span>Explore Your Match</span>
                  <ArrowRight className="w-4 h-4" />
                </a>
                <a
                  href="#catalog"
                  className="px-5 py-3 rounded-full bg-white border border-[#EDE2D7] text-xs font-bold text-[#231E1B] hover:bg-[#FAF6F2]"
                >
                  Catalog (66)
                </a>
              </div>
            </motion.div>

            {/* Middle Empty Spacer for the 3D Model */}
            <div className="hidden lg:block lg:col-span-4 pointer-events-none" />

            {/* Right Column (Information Block) */}
            <motion.div
              initial={{ opacity: 0, x: 36, y: 18 }}
              animate={heroIsActive ? { opacity: 1, x: 0, y: 0 } : { opacity: 0, x: 36, y: 18 }}
              transition={{ duration: 0.7, delay: 0.12, ease: 'easeOut' }}
              className="lg:col-span-4 min-w-0 space-y-4 border-l border-[#D9C8BA] py-4 pl-6"
            >
              <div className="flex justify-between items-center pb-2 border-b border-[#EDE2D7]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#E8633A]">Live Telemetry</span>
                <span className="flex items-center space-x-1 text-[11px] font-bold text-[#231E1B]">
                  <span className="w-2 h-2 rounded-full bg-[#2CE080] animate-pulse" />
                  <span>Bio-Active Active</span>
                </span>
              </div>

              {/* Big Score Card */}
              <div className="space-y-2 border-b border-[#EADFD4] pb-4">
                <div className="text-xs font-bold text-[#7A706A]">Formulation Match Rating</div>
                <div className="flex items-baseline space-x-2">
                  <span className="text-4xl font-extrabold text-[#E8633A] font-brand">98.4%</span>
                  <span className="text-xs text-[#231E1B] font-semibold">Affinity Score</span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#F5EFE9] overflow-hidden">
                  <div className="w-[98.4%] h-full bg-[#E8633A] rounded-full" />
                </div>
              </div>

              {/* Ingredients Pill Tags */}
              <div className="space-y-1.5 text-xs">
                <span className="font-bold text-[#231E1B]">Clinical Actives Core:</span>
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-[10px] font-bold text-[#231E1B]">
                    15% Ethyl Ascorbic •
                  </span>
                  <span className="text-[10px] font-bold text-[#231E1B]">
                    Ferulic Acid •
                  </span>
                  <span className="text-[10px] font-bold text-[#231E1B]">
                    Multi-Weight HA
                  </span>
                </div>
              </div>

              <div className="border-l-2 border-[#E8633A] py-1 pl-3 text-[11px] text-[#554942] leading-relaxed">
                💡 <em>Scroll down to watch the active core rotate along the formulation path.</em>
              </div>
            </motion.div>

          </div>
        </section>

        {/* ------------------------------------------------------------------
            CHAPTER 2: THE DIAGNOSTIC (Middle section in user sketch)
            3D Model Curves over to the LEFT side!
            Left: Interactive 60-Sec Skin Quiz
            Center: 3D Bottle Angle showing side & internal liquid
            Right: Explainable Reason Tags Breakdown
            ------------------------------------------------------------------ */}
        <section ref={(node) => { sectionRefs.current.diagnostic = node; }} id="diagnostic" className="min-h-[80vh] flex items-center">
          <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* The bottle travels left in this chapter, so the explanation lives on its right. */}
            <motion.div
              initial={{ opacity: 0, x: 40, y: 20 }}
              animate={diagnosticIsActive ? { opacity: 1, x: 0, y: 0 } : { opacity: 0, x: 40, y: 20 }}
              transition={{ duration: 0.65, ease: 'easeOut' }}
              className="lg:col-span-4 lg:col-start-9 min-w-0 space-y-5 border-l-2 border-[#E8633A] py-5 pl-6"
            >
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#E8633A] bg-[#EDE2D7] px-3 py-1 rounded-full">
                  Step 01 • Diagnostic
                </span>
                <h3 className="text-2xl font-bold font-brand text-[#231E1B] mt-2">
                  Interactive Skin Diagnostic
                </h3>
                <p className="text-xs text-[#7A706A]">
                  Select your skin biomarkers to recalculate active compatibility live.
                </p>
              </div>

              {/* Skin Type Pills */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#231E1B]">Skin Barrier Type:</label>
                <div className="flex flex-wrap gap-2">
                  {['Oily', 'Dry', 'Combination', 'Sensitive'].map((type) => (
                    <button
                      key={type}
                      onClick={() => setSkinType(type)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                        skinType === type
                          ? 'bg-[#E8633A] text-white shadow-sm'
                          : 'bg-white text-[#665D57] border border-[#EDE2D7] hover:bg-[#F2E8DE]'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Skin Tone Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#231E1B]">Fitzpatrick Skin Tone:</label>
                <div className="flex flex-wrap gap-2">
                  {['Fair', 'Medium', 'Tan', 'Deep'].map((tone) => (
                    <button
                      key={tone}
                      onClick={() => setSkinTone(tone)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                        skinTone === tone
                          ? 'bg-[#231E1B] text-white shadow-sm'
                          : 'bg-white text-[#665D57] border border-[#EDE2D7] hover:bg-[#F2E8DE]'
                      }`}
                    >
                      {tone}
                    </button>
                  ))}
                </div>
              </div>

              {/* Primary Concern */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#231E1B]">Primary Focus Concern:</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: 'Oiliness & Acne', val: 'Oiliness|Acne' },
                    { label: 'Dullness & Glow', val: 'Oiliness|Dullness' },
                    { label: 'Fine Lines & Aging', val: 'Aging|Uneven Tone' },
                    { label: 'Sensitivity & Redness', val: 'Sensitivity|Dryness' }
                  ].map((c) => (
                    <button
                      key={c.val}
                      onClick={() => setPrimaryConcern(c.val)}
                      className={`p-2 rounded-2xl text-left text-xs font-bold transition-all border ${
                        primaryConcern === c.val
                          ? 'bg-[#E8633A]/15 border-[#E8633A] text-[#E8633A]'
                          : 'bg-white border-[#EDE2D7] text-[#665D57] hover:bg-[#FAF6F2]'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
              <p className="border-t border-[#EADFD4] pt-4 text-[11px] leading-relaxed text-[#7A706A]">
                <span className="font-bold text-[#E8633A]">98.4% affinity.</span> Ceramide repair, non-comedogenic safety, and your selected concern shape every recommendation.
              </p>
            </motion.div>

            {/* Middle Empty Spacer for the 3D Model S-curve */}
            <div className="hidden lg:block lg:col-span-4 pointer-events-none" />

            {/* Right Column (Explainable Reason Scoring) */}
            <div className="lg:hidden min-w-0 bg-[#FAF6F2]/95 backdrop-blur-md p-6 sm:p-8 rounded-[36px] border border-[#EADFD4] shadow-lg space-y-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#E8633A] bg-[#EDE2D7] px-3 py-1 rounded-full">
                  Step 02 • Scoring Transparency
                </span>
                <h3 className="text-2xl font-bold font-brand text-[#231E1B] mt-2">
                  Visible Algorithmic Reasons
                </h3>
                <p className="text-xs text-[#7A706A]">
                  Every point awarded is backed by clinical ingredient synergy.
                </p>
              </div>

              {/* Reason Breakdown Chips */}
              <div className="space-y-2.5 pt-2">
                <div className="p-3 bg-white rounded-2xl border border-[#EDE2D7] space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-[#231E1B]">
                    <span>1. Lipid Barrier Repair (Ceramides)</span>
                    <span className="text-[#E8633A]">+35%</span>
                  </div>
                  <p className="text-[11px] text-[#7A706A]">
                    Replaces lost intercellular lipids tailored to <strong>{skinType}</strong> barrier porosity.
                  </p>
                </div>

                <div className="p-3 bg-white rounded-2xl border border-[#EDE2D7] space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-[#231E1B]">
                    <span>2. Non-Comedogenic Safety Index</span>
                    <span className="text-[#E8633A]">+25%</span>
                  </div>
                  <p className="text-[11px] text-[#7A706A]">
                    Zero pore-clogging waxes; certified 0/5 on comedogenic scale.
                  </p>
                </div>

                <div className="p-3 bg-white rounded-2xl border border-[#EDE2D7] space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-[#231E1B]">
                    <span>3. Target Concern Match ({primaryConcern.split('|')[0]})</span>
                    <span className="text-[#E8633A]">+20%</span>
                  </div>
                  <p className="text-[11px] text-[#7A706A]">
                    Active concentration directly inhibits melanin transfer and excess sebum.
                  </p>
                </div>

                <div className="p-3 bg-white rounded-2xl border border-[#EDE2D7] space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-[#231E1B]">
                    <span>4. Acid Mantle pH Balance</span>
                    <span className="text-[#E8633A]">+18%</span>
                  </div>
                  <p className="text-[11px] text-[#7A706A]">
                    Stabilized at pH 5.2 to preserve healthy skin microflora.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ------------------------------------------------------------------
            CHAPTER 3: SMART DUPE & SAVINGS (Lower section in user sketch)
            3D Model Curves over to the RIGHT side!
            Left: Luxury Original vs Smart Dupe Comparison
            Center: 3D Bottle showing back formulation label & dropper
            Right: Clinical Trade-off & Bio-Equivalence Analysis
            ------------------------------------------------------------------ */}
        <section ref={(node) => { sectionRefs.current.dupes = node; }} id="dupes" className="min-h-[80vh] flex items-center">
          <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* The bottle crosses to the right here, leaving the copy cleanly on the left. */}
            <motion.div
              initial={{ opacity: 0, x: -40, y: 20 }}
              animate={dupesIsActive ? { opacity: 1, x: 0, y: 0 } : { opacity: 0, x: -40, y: 20 }}
              transition={{ duration: 0.65, ease: 'easeOut' }}
              className="lg:col-span-4 min-w-0 space-y-5 border-l-2 border-[#E8633A] py-5 pl-6"
            >
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#E8633A] bg-[#EDE2D7] px-3 py-1 rounded-full">
                  Step 03 • Smart Dupe Finder
                </span>
                <h3 className="text-2xl font-bold font-brand text-[#231E1B] mt-2">
                  Save 68% On Equivalent Actives
                </h3>
                <p className="text-xs text-[#7A706A]">
                  Joyory matches luxury designer formulas with verified budget alternatives.
                </p>
              </div>

              {/* Side-by-side comparison */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                {/* Original Item */}
                <div className="space-y-2 border-t border-[#EADFD4] px-1 py-3.5">
                  <span className="text-[9px] font-bold uppercase text-[#A0938A]">Luxury Formula</span>
                  <h4 className="font-bold text-xs text-[#231E1B]">Luminate Vitamin C 15%</h4>
                  <div className="text-sm font-extrabold text-[#231E1B]">₹1,899</div>
                  <div className="text-[10px] text-[#7A706A]">Vitamin C | Ferulic Acid</div>
                </div>

                {/* Dupe Item */}
                <div className="space-y-2 border-t-2 border-[#E8633A] px-1 py-3.5">
                  <span className="text-[9px] font-bold uppercase text-[#E8633A]">Verified Dupe</span>
                  <h4 className="font-bold text-xs text-[#231E1B]">PureBloom Glow Booster</h4>
                  <div className="text-sm font-extrabold text-[#E8633A]">₹599</div>
                  <div className="text-[10px] text-[#7A706A]">Vitamin C | Turmeric</div>
                </div>
              </div>

              {/* Savings Ribbon */}
              <div className="p-3 rounded-2xl bg-[#E8633A] text-white flex items-center justify-between text-xs font-bold">
                <span>🎉 Instant Customer Savings:</span>
                <span className="bg-white text-[#E8633A] px-3 py-1 rounded-full text-xs font-black">
                  Save ₹1,300
                </span>
              </div>

              <button
                onClick={() => {
                  const dupe = productsData.find((p) => p.id === 'P013');
                  if (dupe) addToCart(dupe);
                }}
                className="w-full py-3 rounded-full bg-[#231E1B] text-white text-xs font-bold hover:bg-[#382F2A] transition-all"
              >
                Add PureBloom Dupe to Bag (₹599)
              </button>
              <p className="border-t border-[#EADFD4] pt-4 text-[11px] leading-relaxed text-[#7A706A]">
                <span className="font-bold text-[#E8633A]">94% active match.</span> The only trade-off is the stabilizer: Ferulic Acid in the luxury formula and botanical Turmeric in the dupe.
              </p>
            </motion.div>

            {/* Middle Empty Spacer for 3D model */}
            <div className="hidden lg:block lg:col-span-4 pointer-events-none" />

            {/* Right Column (Clinical Trade-off Analysis) */}
            <div className="lg:hidden min-w-0 bg-[#FAF6F2]/95 backdrop-blur-md p-6 sm:p-8 rounded-[36px] border border-[#EADFD4] shadow-lg space-y-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#E8633A] bg-[#EDE2D7] px-3 py-1 rounded-full">
                  Clinical Parity
                </span>
                <h3 className="text-2xl font-bold font-brand text-[#231E1B] mt-2">
                  Transparent Trade-Off Breakdown
                </h3>
                <p className="text-xs text-[#7A706A]">
                  We explain exactly what changes between the luxury bottle and the affordable dupe.
                </p>
              </div>

              <div className="space-y-3 pt-2 text-xs">
                <div className="p-3 bg-white rounded-2xl border border-[#EDE2D7]">
                  <div className="font-bold text-[#231E1B] mb-1">Active Ingredient Match: 94%</div>
                  <p className="text-[11px] text-[#7A706A]">
                    Both products deliver 15% bio-available Ethyl Ascorbic Acid for antioxidant defense.
                  </p>
                </div>

                <div className="p-3 bg-white rounded-2xl border border-[#EDE2D7]">
                  <div className="font-bold text-[#231E1B] mb-1">Stabilizer Trade-off:</div>
                  <p className="text-[11px] text-[#7A706A]">
                    <strong>Luminate</strong> utilizes synthetic Ferulic Acid. <strong>PureBloom</strong> utilizes botanical Turmeric extract to stabilize the active, slightly lighter in consistency.
                  </p>
                </div>

                <div className="p-3 bg-white rounded-2xl border border-[#EDE2D7]">
                  <div className="font-bold text-[#231E1B] mb-1">Texture & Absorption:</div>
                  <p className="text-[11px] text-[#7A706A]">
                    Both absorb in under 20 seconds with non-sticky, dewy finishes.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ------------------------------------------------------------------
            CHAPTER 4: 66-PRODUCT CATALOG & QUICK CART (Bottom in sketch)
            3D Model Curves back to CENTER on its pedestal!
            Left: Active Catalog Search & Filter
            Right: Shopping Basket & Checkout with Dupe Discount
            ------------------------------------------------------------------ */}
        <section ref={(node) => { sectionRefs.current.catalog = node; }} id="catalog" className="min-h-[80vh] flex items-center">
          <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column (Full Catalog & Search) */}
            <div className="lg:col-span-5 min-w-0 bg-[#FAF6F2]/95 backdrop-blur-md p-6 sm:p-8 rounded-[36px] border border-[#EADFD4] shadow-lg space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#E8633A] bg-[#EDE2D7] px-3 py-1 rounded-full">
                    Catalog Database ({filteredProducts.length} items)
                  </span>
                  <h3 className="text-2xl font-bold font-brand text-[#231E1B] mt-2">
                    Browse Active Formulations
                  </h3>
                </div>

                {/* Search Bar */}
                <div className="relative w-full sm:w-60">
                  <Search className="w-4 h-4 text-[#A0938A] absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Search actives..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 rounded-full bg-white border border-[#EDE2D7] text-xs focus:outline-none focus:ring-2 focus:ring-[#E8633A]"
                  />
                </div>
              </div>

              {/* Category & Tier Filters */}
              <div className="space-y-2">
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                        selectedCategory === cat
                          ? 'bg-[#E8633A] text-white shadow-sm'
                          : 'bg-white text-[#665D57] border border-[#EDE2D7] hover:bg-[#F2E8DE]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                
                {/* Budget Tier Filter Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[10px]">
                  <span className="font-bold text-[#A0938A] uppercase mr-1">Tier:</span>
                  {['All', 'budget', 'mid', 'luxury'].map((tier) => (
                    <button
                      key={tier}
                      onClick={() => setSelectedTier(tier)}
                      className={`px-2.5 py-1 rounded-full font-bold uppercase transition-all ${
                        selectedTier === tier
                          ? 'bg-[#231E1B] text-white'
                          : 'bg-[#F0E6DC] text-[#7A706A] hover:bg-[#E4D8CE]'
                      }`}
                    >
                      {tier}
                    </button>
                  ))}
                </div>
              </div>

              {/* Products List (Scrollable) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-[460px] overflow-y-auto pr-1">
                {filteredProducts.slice(0, 8).map((p) => (
                  <div
                    key={p.id}
                    className="bg-white rounded-2xl p-3 border border-[#EDE2D7] shadow-xs flex flex-col justify-between hover:shadow-md transition-all"
                  >
                    <div>
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="font-bold text-[#E8633A] uppercase">{p.brand}</span>
                        <span className="text-amber-500 font-bold">★ {p.rating}</span>
                      </div>
                      <h5 className="font-bold text-xs text-[#231E1B] truncate mt-0.5">{p.name}</h5>
                      <p className="text-[10px] text-[#7A706A] truncate">{p.key_ingredients}</p>
                    </div>

                    <div className="pt-2 mt-2 border-t border-[#F5EFE9] flex items-center justify-between">
                      <span className="text-xs font-black text-[#231E1B]">₹{p.price_inr}</span>
                      <button
                        onClick={() => addToCart(p)}
                        className="px-3 py-1 rounded-full bg-[#E8633A] text-white text-[10px] font-bold hover:bg-[#D4552E]"
                      >
                        + Add
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Center lane keeps the final, smaller bottle clear of both cards. */}
            <div className="hidden lg:block lg:col-span-2 pointer-events-none" />

            {/* Right Column (Cart & Quick Checkout) */}
            <div id="cart-section" className="lg:col-span-5 min-w-0 bg-[#FAF6F2]/95 backdrop-blur-md p-6 sm:p-8 rounded-[36px] border border-[#EADFD4] shadow-lg space-y-5">
              <div className="flex justify-between items-center pb-2 border-b border-[#EDE2D7]">
                <div>
                  <h4 className="font-bold text-base font-brand text-[#231E1B]">Your Routine Basket</h4>
                  <span className="text-[10px] text-[#7A706A]">{cartItems.length} active formulations</span>
                </div>
                <span className="w-8 h-8 rounded-full bg-[#E8633A] text-white flex items-center justify-center text-xs font-bold">
                  {cartItems.reduce((acc, i) => acc + i.quantity, 0)}
                </span>
              </div>

              {/* Cart List */}
              <div className="space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
                {cartItems.length === 0 ? (
                  <p className="text-xs text-center py-6 text-[#7A706A]">Your basket is empty.</p>
                ) : (
                  cartItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 bg-white rounded-2xl border border-[#EDE2D7] flex items-center justify-between text-xs"
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="font-bold text-[#231E1B] truncate">{item.name}</div>
                        <div className="text-[10px] text-[#7A706A]">₹{item.price_inr} each</div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateQuantity(item.id, -1)}
                          className="w-5 h-5 rounded-full bg-[#F5EFE9] text-[#231E1B] flex items-center justify-center font-bold"
                        >
                          -
                        </button>
                        <span className="font-bold">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, 1)}
                          className="w-5 h-5 rounded-full bg-[#E8633A] text-white flex items-center justify-center font-bold"
                        >
                          +
                        </button>
                        <button
                          onClick={() => removeItem(item.id)}
                          className="text-[#A0938A] hover:text-red-500 ml-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Price Summary */}
              <div className="pt-3 border-t border-[#EDE2D7] space-y-1.5 text-xs">
                <div className="flex justify-between text-[#7A706A]">
                  <span>Sub Total</span>
                  <span className="font-bold text-[#231E1B]">₹{subTotal}</span>
                </div>
                <div className="flex justify-between items-center text-[#E8633A] font-bold">
                  <button
                    onClick={() => setPromoApplied(!promoApplied)}
                    className="flex items-center gap-1.5 hover:underline text-left cursor-pointer"
                  >
                    <span>Joyory Aura Dupe Savings (40%)</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#E8633A]/10 border border-[#E8633A]/20">
                      {promoApplied ? 'Active' : 'Apply'}
                    </span>
                  </button>
                  <span>{promoApplied ? `-₹${discountAmount}` : '₹0'}</span>
                </div>
                <div className="flex justify-between text-base font-black text-[#231E1B] pt-1 border-t border-[#EDE2D7]">
                  <span>Final Total</span>
                  <span>₹{totalAmount}</span>
                </div>
              </div>

              {/* CTA Button */}
              <button
                onClick={() => alert(`Order placed successfully! Total: ₹${totalAmount}`)}
                className="w-full py-3.5 rounded-full bg-[#E8633A] text-white text-xs font-bold tracking-wider uppercase hover:bg-[#D4552E] shadow-md shadow-[#E8633A]/20 transition-all hover:scale-102 active:scale-98"
              >
                Checkout Routine
              </button>
            </div>

          </div>
        </section>

      </main>

      {/* ====================================================================
          FOOTER
          ==================================================================== */}
      <footer className="relative z-10 border-t border-[#E8DFD4] bg-[#FAF6F2] py-8 text-center text-xs text-[#7A706A]">
        <p>© {new Date().getFullYear()} Joyory Aura — Smart Beauty AI Shopping Experience. All rights reserved.</p>
      </footer>

    </div>
  );
}
