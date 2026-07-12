'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import styles from './Success.module.css';

export default function PremiumSuccessPage() {
  useEffect(() => {
    // Force reload to refresh JWT with premium status
    const timer = setTimeout(() => {
      window.location.href = '/premium';
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <div className={styles.checkIcon}>
          <i className="bx bx-check-circle" />
        </div>
        <h1 className={styles.title}>Оплата прошла успешно!</h1>
        <p className={styles.desc}>
          Ваша подписка PULSE PRO активирована. Перезагрузите страницу, чтобы обновить статус.
        </p>
        <Link href="/premium" className={styles.link}>
          Вернуться на страницу подписки
        </Link>
      </div>
    </div>
  );
}
