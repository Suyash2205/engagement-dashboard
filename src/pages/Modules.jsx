import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, Cell, RadarChart, PolarGrid, PolarAngleAxis, Radar, Legend
} from 'recharts'
import PageHeader from '../components/PageHeader'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass rounded-lg px-3 py-2 text-xs space-y-1">
      <p className="text-[#00D4FF] font-semibold">Module {label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.fill || p.color || '#E8F4FD' }}>
          {p.name}: <span className="font-bold">{typeof p.value === 'number' ? p.value.toFixed(1) : p.value}{p.name.includes('Rate') || p.name.includes('%') || p.name.includes('Engagement') ? '' : ''}</span>
        </p>
      ))}
    </div>
  )
}

export default function Modules() {
  const [data, setData] = useState([])
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    fetch('/data/modules.json').then(r => r.json()).then(d => { setData(d); setSelected(d[0]) })
  }, [])

  return (
    <div>
      <PageHeader badge="Module Analysis" title="Module Comparison" subtitle="Engagement, pass rates, and dropout risk across all course modules" />

      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Pass vs dropout */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="glass rounded-xl p-5">
          <p className="text-xs text-[#4A6A8A] font-medium tracking-wider uppercase mb-4">Pass Rate vs Dropout Rate</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} barGap={4} barSize={18}>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="module" tick={{ fontSize: 10, fill: '#4A6A8A' }} tickLine={false} axisLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#4A6A8A' }} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 10, color: '#4A6A8A' }} />
              <Bar dataKey="pass_rate" name="Pass Rate %" fill="#00FF94" fillOpacity={0.8} radius={[3, 3, 0, 0]} />
              <Bar dataKey="dropout_rate" name="Dropout Rate %" fill="#FF2D55" fillOpacity={0.8} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Avg engagement per module */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="glass rounded-xl p-5">
          <p className="text-xs text-[#4A6A8A] font-medium tracking-wider uppercase mb-4">Avg Engagement Score by Module</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data} barSize={28}>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="module" tick={{ fontSize: 10, fill: '#4A6A8A' }} tickLine={false} axisLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#4A6A8A' }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="avg_engagement" name="Avg Engagement" radius={[4, 4, 0, 0]}>
                {data.map((d, i) => (
                  <Cell key={i} fill="#00D4FF" fillOpacity={0.5 + (d.avg_engagement / 100) * 0.5} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Module cards */}
      <div className="grid grid-cols-4 gap-3">
        {data.map((mod, i) => (
          <motion.div key={mod.module}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.07 }}
            onClick={() => setSelected(mod)}
            className="glass glass-hover rounded-xl p-4 cursor-pointer"
            style={selected?.module === mod.module ? { borderColor: 'rgba(0,212,255,0.35)', boxShadow: '0 0 16px rgba(0,212,255,0.08)' } : {}}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-bold text-[#00D4FF]">{mod.module}</span>
              <span className="text-[10px] text-[#4A6A8A]">{mod.students} students</span>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px]">
                <span className="text-[#4A6A8A]">Engagement</span>
                <span className="text-[#E8F4FD] font-semibold">{mod.avg_engagement}</span>
              </div>
              <div className="w-full h-1 bg-[#0A1628] rounded-full">
                <motion.div className="h-full rounded-full bg-[#00D4FF]" initial={{ width: 0 }} animate={{ width: `${mod.avg_engagement}%` }} transition={{ delay: 0.5 + i * 0.07, duration: 0.6 }} />
              </div>
              <div className="flex justify-between text-[11px]">
                <span className="text-[#4A6A8A]">At-risk</span>
                <span style={{ color: mod.at_risk_pct > 30 ? '#FF6B35' : '#00FF94' }} className="font-semibold">{mod.at_risk_pct}%</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
