'use client';

import dynamic from 'next/dynamic';

const Sparkles = dynamic(() => import('./Sparkles'), { ssr: false });

export default function SparklesClient() {
  return <Sparkles />;
}