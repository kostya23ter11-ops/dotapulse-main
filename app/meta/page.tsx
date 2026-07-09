import PageLayout from '@/app/components/PageLayout/PageLayout';
import { getAllHeroesStats } from '../../lib/api';
import { t } from '@/lib/i18n';
import MetaClient from './MetaClient';
import styles from './Meta.module.css';

export const revalidate = 600;

export default async function MetaPage() {
  const heroes = await getAllHeroesStats();

  return (
    <PageLayout>
      <div className={styles.metaContainer}>
        <div className={styles.header}>
          <h1 className={styles.title}>{t('meta.title')}</h1>
          <p className={styles.subtitle}>
            {t('meta.subtitle', undefined, { count: heroes.length })}
          </p>
        </div>

        <MetaClient initialHeroes={heroes} />
      </div>
    </PageLayout>
  );
}
