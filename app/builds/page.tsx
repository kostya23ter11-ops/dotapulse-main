import PageLayout from '@/app/components/PageLayout/PageLayout';
import { getAllBuildHeroes } from '@/lib/builds';
import { t } from '@/lib/i18n';
import BuildHeroList from './BuildHeroList';
import styles from './Builds.module.css';

export const revalidate = 600;

export default async function BuildsPage() {
  const heroes = await getAllBuildHeroes();

  return (
    <PageLayout>
      <div className={styles.buildsContainer}>
        <div className={styles.header}>
          <h1 className={styles.title}>{t('nav.builds')}</h1>
          <p className={styles.subtitle}>
            {t('features.buildsDesc')}
          </p>
        </div>
        <BuildHeroList heroes={heroes} />
      </div>
    </PageLayout>
  );
}
