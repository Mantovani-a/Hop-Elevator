import DemoHomeLink from '../DemoHomeLink';
import OperatorShiftLanding from './OperatorShiftLanding';

export default function OperatorShiftClosed({ onShiftAction, onSaveShiftPlan, shiftEvents = [], shiftPlan, isStarting = false, technician }) {
  return <main className="operator-shift-closed">
    <header className="operator-shift-closed__top-bar"><DemoHomeLink /></header>
    <OperatorShiftLanding technician={technician} shiftEvents={shiftEvents} shiftPlan={shiftPlan} onShiftAction={onShiftAction} onSaveShiftPlan={onSaveShiftPlan} isStarting={isStarting} />
  </main>;
}
