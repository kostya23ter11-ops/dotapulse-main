import PageLayout from './components/PageLayout/PageLayout';
import Hero from './components/Hero/Hero';
import NewsSection from './components/NewsSection/NewsSection';
import PopularHeroes from './components/PopularHeroes/PopularHeroes';
import SparklesClient from './components/Sparkles/SparklesClient';
import { getHeroStatsByRank } from '../lib/api';

export const revalidate = 300;

export default async function Page() {
  const heroStats = await getHeroStatsByRank();

  return (
    <PageLayout>
      <SparklesClient />
      <Hero />
      <NewsSection />
      <PopularHeroes heroStats={heroStats} />
    </PageLayout>
  );
}
