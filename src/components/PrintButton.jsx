import { ModuleIcon } from './ModuleSidebar';

export default function PrintButton({ onClick, label }) {
  return (
    <button className="btn btn-outline-primary hop-print-button" type="button" onClick={onClick} title={label} aria-label={label}>
      <ModuleIcon name="printer" size={19} />
    </button>
  );
}
