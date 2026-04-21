import { motion } from 'framer-motion'

const colorMap = {
  cyan:   { accent: '#00D4FF', bg: 'rgba(0,212,255,0.06)',   glow: 'rgba(0,212,255,0.15)' },
  purple: { accent: '#7B4FFF', bg: 'rgba(123,79,255,0.06)',  glow: 'rgba(123,79,255,0.15)' },
  green:  { accent: '#00FF94', bg: 'rgba(0,255,148,0.06)',   glow: 'rgba(0,255,148,0.15)' },
  orange: { accent: '#FF6B35', bg: 'rgba(255,107,53,0.06)',  glow: 'rgba(255,107,53,0.15)' },
  red:    { accent: '#FF2D55', bg: 'rgba(255,45,85,0.06)',   glow: 'rgba(255,45,85,0.15)' },
}

export default function MetricCard({ title, value, subtitle, icon: Icon, color = 'cyan', trend, index = 0 }) {
  const c = colorMap[color]
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.4 }}
      className="glass glass-hover rounded-xl p-5 relative overflow-hidden"
    >
      {/* bg glow orb */}
      <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-20 blur-2xl"
           style={{ background: c.glow }} />

      <div className="flex items-start justify-between mb-3">
        <p className="text-xs text-[#4A6A8A] font-medium tracking-wider uppercase">{title}</p>
        {Icon && (
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
               style={{ background: c.bg, border: `1px solid ${c.accent}22` }}>
            <Icon size={14} style={{ color: c.accent }} />
          </div>
        )}
      </div>

      <p className="text-3xl font-bold tracking-tight" style={{ color: c.accent }}>{value}</p>

      {subtitle && <p className="text-xs text-[#4A6A8A] mt-1.5">{subtitle}</p>}

      {trend != null && (
        <div className={`mt-2 text-xs font-medium ${trend >= 0 ? 'text-[#00FF94]' : 'text-[#FF2D55]'}`}>
          {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}% vs last period
        </div>
      )}
    </motion.div>
  )
}
