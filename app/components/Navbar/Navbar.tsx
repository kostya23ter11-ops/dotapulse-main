'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import AIAssistant from '../AIAssistant/AIAssistant';
import { useLocale } from '@/app/context/LocaleContext';
import type { AuthUser, Locale } from '@/lib/types';
import styles from './Navbar.module.css';

const Navbar = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
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

  const toggleMobile = () => setMobileOpen(prev => !prev);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    router.push('/');
  };

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/');

  return (
    <header className={styles.dotaHeader}>
      <Link href="/" className={styles.logoWrapper}>
        <div className={styles.dotaShield}></div>
        <div className={styles.logoText}>
          DOTA<span>PULSE</span>
        </div>
      </Link>

      <nav className={`${styles.mainMenu} ${mobileOpen ? styles.open : ''}`}>
        <Link href="/updates" className={`${styles.menuLink} ${isActive('/updates') ? styles.menuLinkActive : ''}`} aria-current={isActive('/updates') ? 'page' : undefined} onClick={() => setMobileOpen(false)}>
          {t('nav.updates')}
        </Link>
        <Link href="/builds" className={`${styles.menuLink} ${isActive('/builds') ? styles.menuLinkActive : ''}`} aria-current={isActive('/builds') ? 'page' : undefined} onClick={() => setMobileOpen(false)}>
          {t('nav.builds')}
        </Link>
        <Link href="/meta" className={`${styles.menuLink} ${isActive('/meta') ? styles.menuLinkActive : ''}`} aria-current={isActive('/meta') ? 'page' : undefined} onClick={() => setMobileOpen(false)}>
          {t('nav.meta')}
        </Link>
        <Link href="/leaderboard" className={`${styles.menuLink} ${isActive('/leaderboard') ? styles.menuLinkActive : ''}`} aria-current={isActive('/leaderboard') ? 'page' : undefined} onClick={() => setMobileOpen(false)}>
          {t('nav.leaderboard')}
        </Link>
        {!loading && user?.role === 'admin' && (
          <Link href="/admin" className={`${styles.menuLink} ${isActive('/admin') ? styles.menuLinkActive : ''}`} aria-current={isActive('/admin') ? 'page' : undefined} onClick={() => setMobileOpen(false)}>
            {t('admin.admin')}
          </Link>
        )}
      </nav>

      <div className={`${styles.headerActions} ${mobileOpen ? styles.open : ''}`}>
        <AIAssistant />

        <div className={styles.langSwitcher}>
          <i className='bx bx-globe'></i>
          <select
            value={locale}
            onChange={(e) => setLocale(e.target.value as Locale)}
            aria-label="Language"
          >
            <option value="ru">RU</option>
            <option value="en">EN</option>
          </select>
        </div>

        {!loading && (
          user ? (
            <div className={styles.userProfile}>
              <Image src={user.avatar} alt={user.name} width={32} height={32} className={styles.userAvatar} />
              <span className={styles.userName}>{user.name}</span>
              <button onClick={handleLogout} className={styles.logoutBtn} aria-label="Logout">
                <i className='bx bx-log-out'></i>
              </button>
            </div>
          ) : (
            <a href="/api/auth/login" className={styles.profileBtn}>
              {t('auth.login')}
            </a>
          )
        )}
      </div>

      <button className={styles.hamburger} onClick={toggleMobile} aria-label="Menu">
        <i className={`bx ${mobileOpen ? 'bx-x' : 'bx-menu'}`}></i>
      </button>
    </header>
  );
};

export default Navbar;
