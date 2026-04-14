import { useNavigationType } from 'react-router-dom';
import { PageSkeleton }      from './Skeleton';

export default function SuspenseFallback() {
  const navType = useNavigationType();
  // On POP (back button), show skeleton instead of blank
  return (
    <div className="client-component-suspense-fallback" id="client-component-suspense-fallback" style={{ display: 'contents' }}>
      <PageSkeleton key={navType} />
    </div>
  );
}