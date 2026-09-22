import { TrendingUp, TrendingDown } from 'lucide-react';

function StatsCard({ icon: Icon, label, value, trend, trendLabel, color = 'blue', loading = false }) {
  const bgLight = {
    blue: 'rgba(59, 130, 246, 0.15)',
    green: 'rgba(16, 185, 129, 0.15)',
    purple: 'rgba(139, 92, 246, 0.15)',
    amber: 'rgba(245, 158, 11, 0.15)',
    orange: 'rgba(249, 115, 22, 0.15)',
    emerald: 'rgba(16, 185, 129, 0.15)',
    pink: 'rgba(236, 72, 153, 0.15)',
    indigo: 'rgba(99, 102, 241, 0.15)',
  };

  const textColors = {
    blue: '#3b82f6',
    green: '#10b981',
    purple: '#8b5cf6',
    amber: '#f59e0b',
    orange: '#f97316',
    emerald: '#10b981',
    pink: '#ec4899',
    indigo: '#6366f1',
  };

  if (loading) {
    return (
      <div style={{
        background: 'rgba(255, 255, 255, 0.7)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(148, 163, 184, 0.3)',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(148, 163, 184, 0.2)', animation: 'pulse 2s infinite' }} />
          <div style={{ width: '64px', height: '16px', borderRadius: '4px', background: 'rgba(148, 163, 184, 0.2)', animation: 'pulse 2s infinite' }} />
        </div>
        <div style={{ width: '96px', height: '16px', borderRadius: '4px', background: 'rgba(148, 163, 184, 0.2)', animation: 'pulse 2s infinite', marginBottom: '8px' }} />
        <div style={{ width: '128px', height: '32px', borderRadius: '4px', background: 'rgba(148, 163, 184, 0.2)', animation: 'pulse 2s infinite', marginBottom: '8px' }} />
        <div style={{ width: '80px', height: '12px', borderRadius: '4px', background: 'rgba(148, 163, 184, 0.2)', animation: 'pulse 2s infinite' }} />
      </div>
    );
  }

  const hasTrend = typeof trend === 'number';
  const isPositive = trend >= 0;

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.7)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      border: '1px solid rgba(148, 163, 184, 0.3)',
      borderRadius: '16px',
      padding: '24px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.08)',
      transition: 'all 0.3s ease',
      transform: 'translateY(0)',
    }} onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-4px)';
      e.currentTarget.style.boxShadow = '0 12px 40px rgba(0, 0, 0, 0.12)';
    }} onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.08)';
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{
          width: '48px', height: '48px', borderRadius: '12px',
          background: 'rgba(59, 130, 246, 0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'transform 0.3s ease',
        }}>
          <Icon style={{ width: '24px', height: '24px', color: '#3b82f6' }} />
        </div>
        {typeof trend === 'number' && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            fontSize: '12px', fontWeight: '600',
            padding: '4px 8px', borderRadius: '9999px',
            background: trend >= 0 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            color: trend >= 0 ? '#10b981' : '#ef4444',
          }}>
            {trend >= 0 ? <TrendingUp style={{ width: '12px', height: '12px' }} /> : <TrendingDown style={{ width: '12px', height: '12px' }} />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <p style={{ fontSize: '13px', fontWeight: '500', color: '#64748b', marginBottom: '4px' }}>{label}</p>
      <h3 style={{ fontSize: '28px', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>{value}</h3>
      {trendLabel && (
        <p style={{ fontSize: '11px', color: '#94a3b8' }}>{trendLabel}</p>
      )}
    </div>
  );
}

export default StatsCard;

