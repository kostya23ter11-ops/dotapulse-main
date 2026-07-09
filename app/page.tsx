import PageLayout from './components/PageLayout/PageLayout';
import Hero from './components/Hero/Hero';
import NewsSection from './components/NewsSection/NewsSection';
import PopularHeroes from './components/PopularHeroes/PopularHeroes';
import { getHeroStatsByRank } from '../lib/api';

export default async function Page() {
  const heroStats = await getHeroStatsByRank();

  return (
    <PageLayout>
      <Hero />
      <NewsSection />
      <PopularHeroes heroStats={heroStats} />
    </PageLayout>
  );
}
