import type { ReactNode } from 'react';

const pulse = {
  animation: 'pulse 1.5s infinite ease-in-out',
};

const styles = {
  container: { padding: '120px 20px 60px', maxWidth: 1200, margin: '0 auto' },
  title: { fontSize: '2.2rem', color: '#eee', marginBottom: 8, ...pulse },
  subtitle: { color: '#888', marginBottom: 40, ...pulse },
  grid: { display: 'flex', flexDirection: 'column' as const, gap: 12 },
  row: { display: 'flex', alignItems: 'center', gap: 20, padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' },
  icon: { width: 45, height: 25, background: 'rgba(255,255,255,0.05)', borderRadius: 4, ...pulse },
  text: { height: 20, width: 150, background: 'rgba(255,255,255,0.05)', borderRadius: 4, ...pulse },
  textSm: { height: 20, width: 80, background: 'rgba(255,255,255,0.05)', borderRadius: 4, marginLeft: 'auto', ...pulse },
};

export default function SkeletonLoader({ title, subtitle, rows = 10 }: { title: ReactNode; subtitle: ReactNode; rows?: number }) {
  return (
    <div style={styles.container}>
      <style>{`@keyframes pulse { 0%{opacity:.5} 50%{opacity:1} 100%{opacity:.5} }`}</style>
      <h1 style={styles.title}>{title}</h1>
      <p style={styles.subtitle}>{subtitle}</p>
      <div style={styles.grid}>
        {[...Array(rows)].map((_, i) => (
          <div key={i} style={styles.row}>
            <div style={styles.icon} />
            <div style={styles.text} />
            <div style={styles.textSm} />
          </div>
        ))}
      </div>
    </div>
  );
}
