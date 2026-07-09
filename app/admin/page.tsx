import PageLayout from '@/app/components/PageLayout/PageLayout';
import AdminClient from './AdminClient';
import styles from './Admin.module.css';

export const metadata = {
  title: 'Admin Panel - DotaPulse',
  description: 'Панель администратора DotaPulse',
};

export default function AdminPage() {
  return (
    <PageLayout>
      <div className={styles.adminContainer}>
        <div className={styles.header}>
          <h1 className={styles.title}>Панель администратора</h1>
          <p className={styles.subtitle}>Управление и мониторинг системы</p>
        </div>
        <AdminClient />
      </div>
    </PageLayout>
  );
}
