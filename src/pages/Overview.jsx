import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Cell
} from 'recharts'
import { Users, AlertTriangle, TrendingUp, Award, BookOpen, Target } from 'lucide-react'
import MetricCard from '../components/MetricCard'
import PageHeader from '../components/PageHeader'

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass rounded-lg px-3 py-2 text-xs">
      <p className="text-[#00D4FF] font-semibold mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  )
}

export default function Overview() {
  const [data, setData] = useState(null)
  const [trends, setTrends] = useState([])

  useEffect(() => {
    fetch('/data/overview.json').then(r => r.json()).then(setData)
    fetch('/data/trends.json').then(r => r.json()).then(d => setTrends(d.slice(0, 12)))
  }, [])

  if (!data) return <div className="text-[#4A6A8A] text-sm">Loading...</div>

  const scoreColors = ['#FF2D55', '#FF6B35', '#FFD700', '#00D4FF', '#00FF94']

  return (
    <div>
      <PageHeader
        badge="Live Dashboard"
        title="Engagement Overview"
        subtitle="AI-powered student engagement prediction across all modules"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <MetricCard title="Total Students" value={data.total_students.toLocaleString()} subtitle="Across 7 modules" icon={Users} color="cyan" trend={4.2} index={0} />
        <MetricCard title="At-Risk Students" value={data.at_risk_count} subtitle={`${data.at_risk_pct}% of cohort`} icon={AlertTriangle} color="orange" trend={-2.1} index={1} />
        <MetricCard title="Avg Engagement" value={`${data.avg_engagement}%`} subtitle="Predicted by AI model" icon={TrendingUp} color="purple" trend={1.8} index={2} />
        <MetricCard title="Dropout Risk" value={`${data.dropout_rate}%`} subtitle="Predicted withdrawals" icon={Target} color="red" trend={-0.5} index={3} />
        <MetricCard title="Distinction Rate" value={`${data.distinction_rate}%`} subtitle="High performers" icon={Award} color="green" trend={3.1} index={4} />
        <MetricCard title="Active Modules" value={data.active_modules} subtitle="Across 2 semesters" icon={BookOpen} color="cyan" index={5} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-2 gap-4">
        {/* Weekly trend */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="glass rounded-xl p-5">
          <p className="text-xs text-[#4A6A8A] font-medium tracking-wider uppercase mb-4">Engagement Trend (12 weeks)</p>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={trends}>
              <defs>
                <linearGradient id="engGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00D4FF" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#00D4FF" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#4A6A8A' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#4A6A8A' }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="avg_engagement" name="Engagement" stroke="#00D4FF" strokeWidth={2} fill="url(#engGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Score distribution */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
          className="glass rounded-xl p-5">
          <p className="text-xs text-[#4A6A8A] font-medium tracking-wider uppercase mb-4">Engagement Score Distribution</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data.score_distribution} barSize={36}>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="range" tick={{ fontSize: 10, fill: '#4A6A8A' }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#4A6A8A' }} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="count" name="Students" radius={[4, 4, 0, 0]}>
                {data.score_distribution.map((_, i) => (
                  <Cell key={i} fill={scoreColors[i]} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </div>
  )
}
