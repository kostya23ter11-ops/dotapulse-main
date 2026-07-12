import styles from './PremiumBadge.module.css';

interface PremiumBadgeProps {
  size?: 'sm' | 'md' | 'lg';
}

export default function PremiumBadge({ size = 'sm' }: PremiumBadgeProps) {
  return (
    <span className={`${styles.badge} ${styles[size]}`}>
      <i className="bx bx-crown" />
      PRO
    </span>
  );
}
