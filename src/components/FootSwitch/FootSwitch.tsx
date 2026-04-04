import styles from './FootSwitch.module.css';

interface FootSwitchProps {
  active: boolean;
  onClick: () => void;
}

export function FootSwitch({ active, onClick }: FootSwitchProps) {
  return (
    <button
      className={`${styles.switch} ${active ? styles.active : ''}`}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      title={active ? 'Bypass' : 'Activate'}
    >
      <div className={styles.cap} />
    </button>
  );
}
