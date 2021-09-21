import Link from 'next/link';
import commonStyles from '../../styles/common.module.scss';

export default function Preview(): JSX.Element {
  return (
    <aside className={commonStyles.sairModoPreview}>
      <Link href="/api/exit-preview">
        <a>Sair do modo Preview</a>
      </Link>
    </aside>
  );
}
