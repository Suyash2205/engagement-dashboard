import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ZAxis } from 'recharts'
import PageHeader from '../components/PageHeader'

const riskColors = { Low: '#00FF94', Medium: '#00D4FF', High: '#FF6B35', Critical: '#FF2D55' }

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  if (!d) return null
  return (
    <div className="glass rounded-lg px-3 py-2 text-xs space-y-1">
      <p style={{ color: riskColors[d.risk_level] }} className="font-bold">{d.risk_level} Risk</p>
      <p className="text-[#8AACCA]">Module: <span className="text-[#E8F4FD]">{d.module}</span></p>
      <p className="text-[#8AACCA]">Engagement: <span className="text-[#E8F4FD]">{d.engagement_score}</span></p>
      <p className="text-[#8AACCA]">Prediction: <span className="text-[#E8F4FD]">{d.predicted_outcome}</span></p>
    </div>
  )
}

export default function Segmentation() {
  const [data, setData] = useState([])
  const [filter, setFilter] = useState('All')

  useEffect(() => {
    fetch('/data/segments.json').then(r => r.json()).then(setData)
  }, [])

  const levels = ['All', 'Low', 'Medium', 'High', 'Critical']
  const filtered = filter === 'All' ? data : data.filter(d => d.risk_level === filter)

  const counts = levels.slice(1).map(l => ({
    level: l,
    count: data.filter(d => d.risk_level === l).length,
    color: riskColors[l],
    pct: data.length ? ((data.filter(d => d.risk_level === l).length / data.length) * 100).toFixed(1) : 0
  }))

  return (
    <div>
      <PageHeader badge="Clustering" title="Student Segmentation" subtitle="2D projection of engagement clusters — each dot is a student" />

      {/* Segment summary */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {counts.map((c, i) => (
          <motion.div key={c.level} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="glass rounded-xl p-4 cursor-pointer glass-hover"
            onClick={() => setFilter(filter === c.level ? 'All' : c.level)}
            style={filter === c.level ? { borderColor: c.color + '55', boxShadow: `0 0 16px ${c.color}22` } : {}}>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full" style={{ background: c.color, boxShadow: `0 0 6px ${c.color}` }} />
              <p className="text-[10px] text-[#4A6A8A] uppercase tracking-wider">{c.level} Risk</p>
            </div>
            <p className="text-xl font-bold" style={{ color: c.color }}>{c.count}</p>
            <p className="text-[10px] text-[#4A6A8A] mt-0.5">{c.pct}% of cohort</p>
          </motion.div>
        ))}
      </div>

      {/* Scatter plot */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="glass rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-[#4A6A8A] font-medium tracking-wider uppercase">Engagement Cluster Map</p>
            <p className="text-[11px] text-[#2A4A6A] mt-0.5">X: activity level · Y: engagement score</p>
          </div>
          <div className="flex gap-2">
            {levels.map(l => (
              <button key={l} onClick={() => setFilter(l)}
                className="text-[10px] px-2.5 py-1 rounded-full border transition-all"
                style={filter === l
                  ? { background: l === 'All' ? 'rgba(0,212,255,0.15)' : riskColors[l] + '22', borderColor: l === 'All' ? '#00D4FF' : riskColors[l], color: l === 'All' ? '#00D4FF' : riskColors[l] }
                  : { borderColor: 'rgba(255,255,255,0.08)', color: '#4A6A8A' }}>
                {l}
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={320}>
          <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 0 }}>
            <XAxis type="number" dataKey="x" name="Activity" tick={{ fontSize: 10, fill: '#4A6A8A' }} tickLine={false} axisLine={false} />
            <YAxis type="number" dataKey="y" name="Engagement" tick={{ fontSize: 10, fill: '#4A6A8A' }} tickLine={false} axisLine={false} />
            <ZAxis range={[20, 20]} />
            <Tooltip content={<CustomTooltip />} cursor={false} />
            <Scatter data={filtered}>
              {filtered.map((d, i) => (
                <Cell key={i} fill={riskColors[d.risk_level]} fillOpacity={0.65} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
        <div className="flex gap-5 mt-3 justify-center">
          {Object.entries(riskColors).map(([level, color]) => (
            <span key={level} className="flex items-center gap-1.5 text-[10px] text-[#4A6A8A]">
              <span className="w-2 h-2 rounded-full" style={{ background: color }} /> {level}
            </span>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
