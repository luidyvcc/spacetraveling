import Link from 'next/link';
import styles from './header.module.scss';

export default function Header(): JSX.Element {
  return (
    <main className={styles.container}>
      <Link href="/">
        <div className={styles.header}>
          <img src="/images/logo.svg" alt="logo" />
        </div>
      </Link>
    </main>
  );
}
