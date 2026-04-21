import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts'
import PageHeader from '../components/PageHeader'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass rounded-lg px-3 py-2 text-xs space-y-1">
      <p className="text-[#00D4FF] font-semibold">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: <span className="font-bold">{p.value?.toLocaleString()}</span></p>
      ))}
    </div>
  )
}

export default function Trends() {
  const [data, setData] = useState([])

  useEffect(() => {
    fetch('/data/trends.json').then(r => r.json()).then(setData)
  }, [])

  return (
    <div>
      <PageHeader badge="Time Series" title="Engagement Trends" subtitle="Weekly interaction patterns across the academic calendar" />

      <div className="space-y-4">
        {/* Clicks + Active students */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="glass rounded-xl p-5">
          <p className="text-xs text-[#4A6A8A] font-medium tracking-wider uppercase mb-1">VLE Interactions & Active Students</p>
          <p className="text-[11px] text-[#2A4A6A] mb-4">Total clicks on Virtual Learning Environment per week</p>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="clickGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#7B4FFF" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#7B4FFF" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="activeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00D4FF" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="#00D4FF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#4A6A8A' }} tickLine={false} axisLine={false} interval={3} />
              <YAxis yAxisId="left" tick={{ fontSize: 10, fill: '#4A6A8A' }} tickLine={false} axisLine={false} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: '#4A6A8A' }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, color: '#4A6A8A' }} />
              <Area yAxisId="left" type="monotone" dataKey="total_clicks" name="Total Clicks" stroke="#7B4FFF" strokeWidth={2} fill="url(#clickGrad)" dot={false} />
              <Area yAxisId="right" type="monotone" dataKey="active_students" name="Active Students" stroke="#00D4FF" strokeWidth={2} fill="url(#activeGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <div className="grid grid-cols-2 gap-4">
          {/* Avg engagement */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="glass rounded-xl p-5">
            <p className="text-xs text-[#4A6A8A] font-medium tracking-wider uppercase mb-4">Avg Engagement Score</p>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={data}>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#4A6A8A' }} tickLine={false} axisLine={false} interval={5} />
                <YAxis domain={[30, 90]} tick={{ fontSize: 10, fill: '#4A6A8A' }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey="avg_engagement" name="Engagement" stroke="#00FF94" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Avg score */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="glass rounded-xl p-5">
            <p className="text-xs text-[#4A6A8A] font-medium tracking-wider uppercase mb-4">Avg Assessment Score</p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={data.filter((_, i) => i % 3 === 0)} barSize={14}>
                <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#4A6A8A' }} tickLine={false} axisLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#4A6A8A' }} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="avg_score" name="Avg Score" fill="#00D4FF" fillOpacity={0.75} radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
