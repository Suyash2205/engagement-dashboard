import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Cell, PieChart, Pie, Legend
} from 'recharts'
import PageHeader from '../components/PageHeader'

const PIE_COLORS = ['#00FF94', '#7B4FFF', '#FF6B35', '#FF2D55']

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass rounded-lg px-3 py-2 text-xs">
      <p className="text-[#00D4FF] font-semibold mb-1">{label || payload[0]?.name}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.fill || '#E8F4FD' }}>{p.name}: <span className="font-bold">{p.value}</span></p>
      ))}
    </div>
  )
}

const CustomPieLabel = ({ cx, cy, midAngle, outerRadius, percent, name }) => {
  if (percent < 0.06) return null
  const rad = Math.PI / 180
  const x = cx + (outerRadius + 20) * Math.cos(-midAngle * rad)
  const y = cy + (outerRadius + 20) * Math.sin(-midAngle * rad)
  return (
    <text x={x} y={y} fill="#8AACCA" textAnchor="middle" dominantBaseline="central" fontSize={10}>
      {name} {(percent * 100).toFixed(0)}%
    </text>
  )
}

export default function Demographics() {
  const [data, setData] = useState(null)

  useEffect(() => {
    fetch('/data/demographics.json').then(r => r.json()).then(setData)
  }, [])

  if (!data) return <div className="text-[#4A6A8A] text-sm">Loading...</div>

  return (
    <div>
      <PageHeader badge="Demographic Breakdown" title="Demographics & Outcomes" subtitle="Engagement patterns across age, region, education, and predicted outcomes" />

      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* By age */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="glass rounded-xl p-5">
          <p className="text-xs text-[#4A6A8A] font-medium tracking-wider uppercase mb-4">Avg Engagement by Age Band</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data.by_age} barSize={48}>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#8AACCA' }} tickLine={false} axisLine={false} />
              <YAxis domain={[40, 75]} tick={{ fontSize: 10, fill: '#4A6A8A' }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="avg_engagement" name="Avg Engagement" radius={[4, 4, 0, 0]}>
                {data.by_age.map((_, i) => (
                  <Cell key={i} fill={['#00D4FF', '#7B4FFF', '#00FF94'][i]} fillOpacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Outcomes pie */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="glass rounded-xl p-5">
          <p className="text-xs text-[#4A6A8A] font-medium tracking-wider uppercase mb-4">Predicted Outcome Distribution</p>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={data.by_outcome} dataKey="count" nameKey="label" cx="50%" cy="50%" outerRadius={65}
                labelLine={false} label={CustomPieLabel}>
                {data.by_outcome.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i]} fillOpacity={0.85} />
                ))}
              </Pie>
              <Tooltip formatter={(v, n) => [v, n]} contentStyle={{ background: '#0A1628', border: '1px solid rgba(0,212,255,0.15)', borderRadius: 8, fontSize: 11 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex gap-4 justify-center mt-1">
            {data.by_outcome.map((o, i) => (
              <span key={o.label} className="flex items-center gap-1.5 text-[10px] text-[#4A6A8A]">
                <span className="w-2 h-2 rounded-sm" style={{ background: PIE_COLORS[i] }} /> {o.label}
              </span>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* By region */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="glass rounded-xl p-5">
          <p className="text-xs text-[#4A6A8A] font-medium tracking-wider uppercase mb-4">Avg Engagement by Region</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.by_region} layout="vertical" barSize={10} margin={{ left: 10 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" horizontal={false} />
              <XAxis type="number" domain={[45, 75]} tick={{ fontSize: 10, fill: '#4A6A8A' }} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="label" tick={{ fontSize: 10, fill: '#8AACCA' }} tickLine={false} axisLine={false} width={90} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="avg_engagement" name="Avg Engagement" fill="#00D4FF" fillOpacity={0.75} radius={[0, 4, 4, 0]}>
                {data.by_region.map((_, i) => (
                  <Cell key={i} fill="#00D4FF" fillOpacity={0.4 + i * 0.08} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* By education */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="glass rounded-xl p-5">
          <p className="text-xs text-[#4A6A8A] font-medium tracking-wider uppercase mb-4">Engagement by Prior Education</p>
          <div className="space-y-4 mt-2">
            {data.by_education.map((e, i) => (
              <div key={e.label}>
                <div className="flex justify-between mb-1">
                  <p className="text-xs text-[#8AACCA]">{e.label}</p>
                  <p className="text-xs font-semibold text-[#E8F4FD]">{e.avg_engagement}</p>
                </div>
                <div className="w-full h-1.5 bg-[#0A1628] rounded-full">
                  <motion.div className="h-full rounded-full"
                    style={{ background: ['#7B4FFF', '#00D4FF', '#00FF94', '#FF6B35'][i] }}
                    initial={{ width: 0 }}
                    animate={{ width: `${e.avg_engagement}%` }}
                    transition={{ delay: 0.5 + i * 0.1, duration: 0.7 }} />
                </div>
                <p className="text-[10px] text-[#2A4A6A] mt-0.5">{e.count} students</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
