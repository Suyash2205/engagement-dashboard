import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Search } from 'lucide-react'
import PageHeader from '../components/PageHeader'

const riskColors = { Low: '#00FF94', Medium: '#00D4FF', High: '#FF6B35', Critical: '#FF2D55' }
const outcomeBadge = { Pass: '#00FF94', Distinction: '#7B4FFF', Fail: '#FF6B35', Withdrawn: '#FF2D55' }

function RiskBar({ score }) {
  return (
    <div className="w-24 h-1.5 bg-[#0A1628] rounded-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${score}%` }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="h-full rounded-full"
        style={{ background: score >= 70 ? '#00FF94' : score >= 50 ? '#00D4FF' : score >= 30 ? '#FF6B35' : '#FF2D55' }}
      />
    </div>
  )
}

export default function AtRisk() {
  const [data, setData] = useState([])
  const [search, setSearch] = useState('')
  const [riskFilter, setRiskFilter] = useState('All')

  useEffect(() => {
    fetch('/data/at_risk.json').then(r => r.json()).then(setData)
  }, [])

  const filtered = data.filter(s => {
    const matchSearch = s.id.toLowerCase().includes(search.toLowerCase()) || s.module.toLowerCase().includes(search.toLowerCase())
    const matchRisk = riskFilter === 'All' || s.risk_level === riskFilter
    return matchSearch && matchRisk
  })

  const counts = {
    Critical: data.filter(d => d.risk_level === 'Critical').length,
    High: data.filter(d => d.risk_level === 'High').length,
  }

  return (
    <div>
      <PageHeader badge="Intervention Required" title="At-Risk Student Alerts" subtitle="Students flagged by AI model as likely to disengage or withdraw" />

      {/* Alert banner */}
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
        className="flex items-center gap-3 px-4 py-3 rounded-xl mb-6 border border-[rgba(255,45,85,0.2)] bg-[rgba(255,45,85,0.05)]">
        <AlertTriangle size={16} className="text-[#FF2D55]" />
        <p className="text-sm text-[#FF2D55] font-medium">
          {counts.Critical} Critical · {counts.High} High risk students require immediate intervention
        </p>
      </motion.div>

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4A6A8A]" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by ID or module..."
            className="w-full glass rounded-lg pl-8 pr-3 py-2 text-xs text-[#E8F4FD] placeholder-[#2A4A6A] outline-none focus:border-[rgba(0,212,255,0.3)]"
          />
        </div>
        {['All', 'Critical', 'High'].map(f => (
          <button key={f} onClick={() => setRiskFilter(f)}
            className="text-xs px-3 py-1.5 rounded-lg border transition-all"
            style={riskFilter === f
              ? { background: 'rgba(0,212,255,0.1)', borderColor: '#00D4FF', color: '#00D4FF' }
              : { borderColor: 'rgba(255,255,255,0.08)', color: '#4A6A8A' }}>
            {f}
          </button>
        ))}
      </div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="glass rounded-xl overflow-hidden">
        <div className="grid grid-cols-7 px-5 py-3 border-b border-[rgba(255,255,255,0.05)]">
          {['Student ID', 'Module', 'Engagement', 'Days Active', 'Assessments', 'Risk Level', 'Prediction'].map(h => (
            <p key={h} className="text-[10px] text-[#4A6A8A] font-semibold uppercase tracking-wider">{h}</p>
          ))}
        </div>
        <div className="divide-y divide-[rgba(255,255,255,0.03)] max-h-[420px] overflow-y-auto">
          <AnimatePresence>
            {filtered.map((s, i) => (
              <motion.div key={s.id}
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ delay: i * 0.02 }}
                className="grid grid-cols-7 px-5 py-3 hover:bg-[rgba(255,255,255,0.02)] transition-colors items-center">
                <p className="text-xs font-mono text-[#00D4FF]">{s.id}</p>
                <p className="text-xs text-[#8AACCA]">{s.module}</p>
                <div className="flex items-center gap-2">
                  <RiskBar score={s.engagement_score} />
                  <span className="text-xs text-[#E8F4FD]">{s.engagement_score}</span>
                </div>
                <p className="text-xs text-[#8AACCA]">{s.days_active}d</p>
                <p className="text-xs text-[#8AACCA]">{s.assessments_submitted}/7</p>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold" style={{ color: riskColors[s.risk_level] }}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: riskColors[s.risk_level], boxShadow: `0 0 5px ${riskColors[s.risk_level]}` }} />
                  {s.risk_level}
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full inline-block"
                  style={{ background: outcomeBadge[s.predicted_outcome] + '18', color: outcomeBadge[s.predicted_outcome] }}>
                  {s.predicted_outcome}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
        <div className="px-5 py-3 border-t border-[rgba(255,255,255,0.05)]">
          <p className="text-[10px] text-[#2A4A6A]">Showing {filtered.length} of {data.length} at-risk students</p>
        </div>
      </motion.div>
    </div>
  )
}
