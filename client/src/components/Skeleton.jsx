const shimmerStyle = {
  background: 'linear-gradient(90deg,#f0f0f0 25%,#e0e0e0 50%,#f0f0f0 75%)',
  backgroundSize: '200% 100%',
  animation: 'skeletonShimmer 1.4s ease-in-out infinite',
  borderRadius: 6,
};

export default function Skeleton({ width = '100%', height = 16, style = {}, borderRadius = 6 }) {
  return (
    <div className="client-component-skeleton" id="client-component-skeleton" style={{ display: 'contents' }}>
      <div style={{ ...shimmerStyle, width, height, borderRadius, ...style }} />
      <style>{`@keyframes skeletonShimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}`}</style>
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="client-component-product-card-skeleton" id="client-component-product-card-skeleton" style={{ border: '1px solid #eee', borderRadius: 12, overflow: 'hidden' }}>
      <Skeleton height={200} borderRadius={0} />
      <div style={{ padding: 14 }}>
        <Skeleton height={14} width="60%" style={{ marginBottom: 8 }} />
        <Skeleton height={18} style={{ marginBottom: 8 }} />
        <Skeleton height={14} width="40%" style={{ marginBottom: 12 }} />
        <Skeleton height={36} />
      </div>
    </div>
  );
}

export function OrderRowSkeleton() {
  return Array.from({ length: 5 }, (_, i) => (
    <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
      {Array.from({ length: 9 }, (_, j) => (
        <td key={j} style={{ padding: '14px 12px' }}>
          <Skeleton height={14} width={j === 0 ? 80 : j === 5 ? 60 : '80%'} />
        </td>
      ))}
    </tr>
  ));
}

export function PageSkeleton() {
  return (
    <div className="client-component-page-skeleton" id="client-component-page-skeleton" style={{ padding: '32px 20px', maxWidth: 900, margin: '0 auto' }}>
      <Skeleton height={32} width="50%" style={{ marginBottom: 24 }} />
      <Skeleton height={16} style={{ marginBottom: 10 }} />
      <Skeleton height={16} width="80%" style={{ marginBottom: 10 }} />
      <Skeleton height={16} width="60%" style={{ marginBottom: 32 }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
        {[1,2,3].map(n => <Skeleton key={n} height={120} />)}
      </div>
    </div>
  );
}