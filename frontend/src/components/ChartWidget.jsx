function ChartWidget({ title, subtitle, children, action, height = '300px' }) {
  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.7)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      border: '1px solid rgba(148, 163, 184, 0.3)',
      borderRadius: '16px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
      transition: 'all 0.3s ease',
    }} className="rounded-2xl animate-fade-in" onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.12)'} onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.08)'}>
      <div style={{
        padding: '20px 24px',
        borderBottom: '1px solid rgba(148, 163, 184, 0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <div>
          <h3 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--color-text-primary, #0f172a)' }}>{title}</h3>
          {subtitle && (
            <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>{subtitle}</p>
          )}
        </div>
        {action && <div style={{ display: 'flex', alignItems: 'center' }}>{action}</div>}
      </div>
      <div style={{ padding: '24px', height }}>
        {children}
      </div>
    </div>
  );
}

export default ChartWidget;

