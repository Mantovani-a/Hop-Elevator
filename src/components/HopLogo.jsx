import hopControlLogo from '../assets/logos/hop-control-logo.png';
import hopOperatorLogo from '../assets/logos/hop-operator-logo.png';
import hopOperatorLightLogo from '../assets/logos/hop-operator-logo-2.png';
import hopClientLogo from '../assets/logos/hop-client-logo.png';

const hopLogo = `${import.meta.env.BASE_URL}hop-logo.png`;
const optionalShiftLogos = import.meta.glob('../assets/logos/*-shift-logo.png', { eager: true, import: 'default' });
const hopOperatorShiftLogo = optionalShiftLogos['../assets/logos/hop-operator-shift-logo.png'] || hopOperatorLogo;

const logoByVariant = {
  hop: { source: hopLogo, alt: 'HOP' },
  control: { source: hopControlLogo, alt: 'HOP Control' },
  operator: { source: hopOperatorLogo, alt: 'HOP Operator' },
  operatorShift: { source: hopOperatorLightLogo, darkSource: hopOperatorShiftLogo, alt: 'HOP Operator' },
  client: { source: hopClientLogo, alt: 'HOP Client' },
};

export default function HopLogo({ variant = 'hop', size = 'default', className = '' }) {
  const logo = logoByVariant[variant] || logoByVariant.hop;
  return (
    <span className={`hop-logo hop-logo--${variant} hop-logo--${size}${className ? ` ${className}` : ''}`}>
      <img src={logo.source} alt={logo.alt} className={logo.darkSource ? 'hop-logo__light' : undefined} />
      {logo.darkSource && <img src={logo.darkSource} alt={logo.alt} className="hop-logo__dark" />}
    </span>
  );
}
