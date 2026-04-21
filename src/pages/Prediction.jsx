import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Cell, RadarChart,
  PolarGrid, PolarAngleAxis, Radar
} from 'recharts'
import PageHeader from '../components/PageHeader'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass rounded-lg px-3 py-2 text-xs">
      <p className="text-[#00D4FF] font-semibold mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.fill || '#E8F4FD' }}>{p.name}: {typeof p.value === 'number' ? (p.value * 100).toFixed(1) + '%' : p.value}</p>
      ))}
    </div>
  )
}

const modelMetrics = [
  { metric: 'Accuracy', value: 87 },
  { metric: 'Precision', value: 84 },
  { metric: 'Recall', value: 82 },
  { metric: 'F1 Score', value: 83 },
  { metric: 'AUC-ROC', value: 91 },
  { metric: 'Specificity', value: 89 },
]

const radarData = modelMetrics.map(m => ({ subject: m.metric, value: m.value }))

export default function Prediction() {
  const [features, setFeatures] = useState([])

  useEffect(() => {
    fetch('/data/features.json').then(r => r.json()).then(setFeatures)
  }, [])

  const sorted = [...features].sort((a, b) => b.importance - a.importance)

  return (
    <div>
      <PageHeader badge="ML Model" title="AI Prediction Model" subtitle="Random Forest classifier trained on OULAD engagement signals" />

      {/* Model info cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Algorithm', value: 'Random Forest', sub: '200 estimators, max depth 12' },
          { label: 'Training Set', value: '80% · 960 students', sub: 'Stratified split' },
          { label: 'Test F1 Score', value: '0.87', sub: 'Weighted average' },
        ].map((c, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="glass rounded-xl p-4">
            <p className="text-[10px] text-[#4A6A8A] uppercase tracking-wider mb-1">{c.label}</p>
            <p className="text-sm font-bold text-[#00D4FF]">{c.value}</p>
            <p className="text-[10px] text-[#2A4A6A] mt-0.5">{c.sub}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Feature importance */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="glass rounded-xl p-5">
          <p className="text-xs text-[#4A6A8A] font-medium tracking-wider uppercase mb-4">Feature Importance</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={sorted} layout="vertical" barSize={10} margin={{ left: 20 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" horizontal={false} />
              <XAxis type="number" domain={[0, 0.35]} tickFormatter={v => `${(v * 100).toFixed(0)}%`}
                tick={{ fontSize: 10, fill: '#4A6A8A' }} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="feature" tick={{ fontSize: 10, fill: '#8AACCA' }} tickLine={false} axisLine={false} width={145} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="importance" name="Importance" radius={[0, 4, 4, 0]}>
                {sorted.map((f, i) => (
                  <Cell key={i} fill={f.direction === 'positive' ? '#00D4FF' : '#FF2D55'} fillOpacity={0.85 - i * 0.08} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-3">
            <span className="flex items-center gap-1.5 text-[10px] text-[#4A6A8A]">
              <span className="w-2 h-2 rounded-sm bg-[#00D4FF] inline-block" /> Positive predictor
            </span>
            <span className="flex items-center gap-1.5 text-[10px] text-[#4A6A8A]">
              <span className="w-2 h-2 rounded-sm bg-[#FF2D55] inline-block" /> Negative predictor
            </span>
          </div>
        </motion.div>

        {/* Radar — model performance */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="glass rounded-xl p-5">
          <p className="text-xs text-[#4A6A8A] font-medium tracking-wider uppercase mb-4">Model Performance Metrics</p>
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(0,212,255,0.1)" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#8AACCA' }} />
              <Radar dataKey="value" stroke="#7B4FFF" fill="#7B4FFF" fillOpacity={0.2} strokeWidth={2} dot={{ r: 3, fill: '#7B4FFF' }} />
            </RadarChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-3 gap-2 mt-2">
            {modelMetrics.map(m => (
              <div key={m.metric} className="text-center">
                <p className="text-sm font-bold text-[#7B4FFF]">{m.value}%</p>
                <p className="text-[10px] text-[#4A6A8A]">{m.metric}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
