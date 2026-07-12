'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import AIAssistant from '../AIAssistant/AIAssistant';
import { useLocale } from '@/app/context/LocaleContext';
import type { AuthUser, Locale } from '@/lib/types';
import styles from './Navbar.module.css';

const NAV_LINKS = [
  { href: '/updates', key: 'nav.updates' },
  { href: '/builds', key: 'nav.builds' },
  { href: '/meta', key: 'nav.meta' },
  { href: '/leaderboard', key: 'nav.leaderboard' },
] as const;

const Navbar = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { locale, setLocale, t } = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/auth/me');
        const data = await res.json();
        if (data.user) {
          setUser(data.user);
        }
      } catch {
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileOpen) closeMobile();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [mobileOpen, closeMobile]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    closeMobile();
    router.push('/');
  };

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/');

  const renderAuthSection = () => {
    if (loading) {
      return (
        <div className={styles.authSkeleton}>
          <div className={styles.authSkeletonCircle} />
          <div className={styles.authSkeletonLine} />
        </div>
      );
    }
    if (user) {
      return (
        <div className={styles.userProfile}>
          <Image src={user.avatar} alt={user.name} width={30} height={30} className={styles.userAvatar} />
          <span className={styles.userName}>{user.name}</span>
          <button onClick={handleLogout} className={styles.logoutBtn} aria-label="Logout">
            <i className="bx bx-log-out" />
          </button>
        </div>
      );
    }
    return (
      <a href="/api/auth/login" className={styles.profileBtn}>
        {t('auth.login')}
      </a>
    );
  };

  const renderMobileAuthSection = () => {
    if (loading) {
      return (
        <div className={styles.mobileSkeleton}>
          <div className={styles.authSkeletonCircle} />
          <div className={styles.authSkeletonLine} />
        </div>
      );
    }
    if (user) {
      return (
        <div className={styles.mobileUserProfile}>
          <Image src={user.avatar} alt={user.name} width={36} height={36} className={styles.mobileUserProfileImage} />
          <div className={styles.mobileUserProfileInfo}>
            <div className={styles.mobileUserProfileName}>{user.name}</div>
          </div>
          <button onClick={handleLogout} className={styles.mobileLogoutBtn} aria-label="Logout">
            <i className="bx bx-log-out" />
          </button>
        </div>
      );
    }
    return (
      <a href="/api/auth/login" className={styles.mobileProfileBtn} onClick={closeMobile}>
        {t('auth.login')}
      </a>
    );
  };

  return (
    <>
      <header className={`${styles.dotaHeader} ${scrolled ? styles.scrolled : ''}`}>
        <Link href="/" className={styles.logoWrapper} onClick={closeMobile}>
          <div className={styles.dotaShield} />
          <div className={styles.logoText}>
            DOTA<span>PULSE</span>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className={styles.mainMenu}>
          {NAV_LINKS.map(({ href, key }) => (
            <Link
              key={href}
              href={href}
              className={`${styles.menuLink} ${isActive(href) ? styles.menuLinkActive : ''}`}
              aria-current={isActive(href) ? 'page' : undefined}
            >
              {t(key)}
            </Link>
          ))}
          {!loading && user?.role === 'admin' && (
            <Link
              href="/admin"
              className={`${styles.menuLink} ${isActive('/admin') ? styles.menuLinkActive : ''}`}
              aria-current={isActive('/admin') ? 'page' : undefined}
            >
              {t('admin.admin')}
            </Link>
          )}
        </nav>

        {/* Desktop actions */}
        <div className={styles.headerActions}>
          <AIAssistant />

          <div className={styles.langSwitcher}>
            <button
              className={`${styles.langBtn} ${locale === 'ru' ? styles.langBtnActive : ''}`}
              onClick={() => setLocale('ru')}
              aria-label="Русский"
            >
              RU
            </button>
            <button
              className={`${styles.langBtn} ${locale === 'en' ? styles.langBtnActive : ''}`}
              onClick={() => setLocale('en')}
              aria-label="English"
            >
              EN
            </button>
          </div>

          {renderAuthSection()}
        </div>

        {/* CSS hamburger */}
        <button
          className={`${styles.hamburger} ${mobileOpen ? styles.hamburgerOpen : ''}`}
          onClick={() => setMobileOpen(prev => !prev)}
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        >
          <span className={styles.hamburgerBar} />
          <span className={styles.hamburgerBar} />
          <span className={styles.hamburgerBar} />
        </button>
      </header>

      {/* Mobile slide-in panel */}
      <div
        className={`${styles.mobilePanel} ${mobileOpen ? styles.mobilePanelOpen : ''}`}
        role="dialog"
        aria-label="Navigation"
      >
        <nav className={styles.mobileNav}>
          {NAV_LINKS.map(({ href, key }) => (
            <Link
              key={href}
              href={href}
              className={`${styles.mobileMenuLink} ${isActive(href) ? styles.mobileMenuLinkActive : ''}`}
              onClick={closeMobile}
            >
              {t(key)}
            </Link>
          ))}
          {!loading && user?.role === 'admin' && (
            <Link
              href="/admin"
              className={`${styles.mobileMenuLink} ${isActive('/admin') ? styles.mobileMenuLinkActive : ''}`}
              onClick={closeMobile}
            >
              {t('admin.admin')}
            </Link>
          )}
        </nav>

        <div className={styles.mobileDivider} />

        <div className={styles.mobileActions}>
          <div className={styles.mobileLangRow}>
            <button
              className={`${styles.langBtn} ${locale === 'ru' ? styles.langBtnActive : ''}`}
              onClick={() => setLocale('ru')}
            >
              RU
            </button>
            <button
              className={`${styles.langBtn} ${locale === 'en' ? styles.langBtnActive : ''}`}
              onClick={() => setLocale('en')}
            >
              EN
            </button>
          </div>

          {renderMobileAuthSection()}
        </div>
      </div>

      {/* Mobile overlay */}
      <div
        className={`${styles.mobileOverlay} ${mobileOpen ? styles.mobileOverlayVisible : ''}`}
        onClick={closeMobile}
        aria-hidden="true"
      />
    </>
  );
};

export default Navbar;
