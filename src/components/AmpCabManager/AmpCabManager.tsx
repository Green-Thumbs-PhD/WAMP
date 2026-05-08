import { AmpChannelSelector } from '../AmpChannelSelector/AmpChannelSelector';
import { IRLoader } from '../IRLoader/IRLoader';
import styles from './AmpCabManager.module.css';

export function AmpCabManager() {
  return (
    <section className={styles.panel} aria-label="Amp channel and cabinet impulse response manager">
      <div className={styles.column}>
        <AmpChannelSelector />
      </div>
      <div className={styles.column}>
        <IRLoader />
      </div>
    </section>
  );
}
