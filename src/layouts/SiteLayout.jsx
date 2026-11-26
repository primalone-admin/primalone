import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import AnnouncementBar from '../components/AnnouncementBar.jsx';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import CartDrawer from '../components/CartDrawer.jsx';
import StickyBuyBar from '../components/StickyBuyBar.jsx';
import { metaFor } from '../seo/meta.js';
import { applyHead } from '../seo/head.js';

// Pages whose first viewport is night/forest — keep nav logo + icons light like the homepage evening hero.
const nightHeroRoutes = new Set(['/products/restore', '/science']);

function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    // title, description, canonical, robots, social tags and structured data for this route
    applyHead(metaFor(pathname));

    // Home manages its own day/night swap in Hero; other routes set a stable tone.
    if (pathname !== '/') {
      // article pages open on a full-bleed photo with a dark veil
      const night = nightHeroRoutes.has(pathname) || pathname.startsWith('/journal/');
      document.documentElement.dataset.heroTone = night ? 'night' : 'day';
    }

    if (hash) {
      const id = hash.slice(1);
      requestAnimationFrame(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      return;
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });

    return () => {
      if (pathname !== '/') delete document.documentElement.dataset.heroTone;
    };
  }, [pathname, hash]);
  return null;
}

export default function SiteLayout() {
  const { pathname } = useLocation();
  const isHome = pathname === '/';

  return (
    <>
      <ScrollManager />
      <a className="skip-link" href="#main">Skip to content</a>
      <AnnouncementBar />
      <Navbar />
      <main id="main" tabIndex={-1}>
        <Outlet />
      </main>
      <Footer />
      <CartDrawer />
      {isHome && <StickyBuyBar />}
    </>
  );
}
