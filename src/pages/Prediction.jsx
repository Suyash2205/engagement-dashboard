import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Cell, RadarChart,
  PolarGrid, PolarAngleAxis, Radar
} from 'recharts'
import PageHeader from '../components/PageHeader'

const FeatureTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass rounded-lg px-3 py-2 text-xs">
      <p className="text-[#00D4FF] font-semibold mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.fill || '#E8F4FD' }}>
          {p.name}: {(p.value * 100).toFixed(1)}%
        </p>
      ))}
    </div>
  )
}

const MetricTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass rounded-lg px-3 py-2 text-xs">
      <p className="text-[#00D4FF] font-semibold mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.fill || p.color || '#E8F4FD' }}>
          {p.name}: {p.value}%
        </p>
      ))}
    </div>
  )
}

export default function Prediction() {
  const [features, setFeatures] = useState([])
  const [metrics, setMetrics] = useState(null)

  useEffect(() => {
    fetch('/data/features.json').then(r => r.json()).then(setFeatures)
    fetch('/data/model_metrics.json')
      .then(r => r.ok ? r.json() : null)
      .then(setMetrics)
      .catch(() => setMetrics(null))
  }, [])

  const sorted = [...features].sort((a, b) => b.importance - a.importance)

  const modelMetrics = metrics ? [
    { metric: 'Accuracy',    value: metrics.accuracy },
    { metric: 'Precision',   value: metrics.precision },
    { metric: 'Recall',      value: metrics.recall },
    { metric: 'F1 Score',    value: metrics.f1_score },
    { metric: 'AUC-ROC',     value: metrics.auc_roc },
    { metric: 'Specificity', value: metrics.specificity },
  ] : []

  const infoCards = metrics ? [
    {
      label: 'Algorithm',
      value: metrics.algorithm,
      sub: `${metrics.n_estimators} estimators · depth ${metrics.max_depth}`,
    },
    {
      label: 'Training Set',
      value: `80% · ${metrics.train_size.toLocaleString()} students`,
      sub: `Stratified split · ${metrics.test_size.toLocaleString()} held out`,
    },
    {
      label: 'Test F1 Score',
      value: `${(metrics.f1_score / 100).toFixed(2)}`,
      sub: `AUC-ROC ${(metrics.auc_roc / 100).toFixed(2)} · trained ${metrics.trained_on}`,
    },
  ] : []

  return (
    <div>
      <PageHeader
        badge="ML Model"
        title="AI Prediction Model"
        subtitle="Random Forest classifier trained on OULAD engagement signals"
      />

      {!metrics && (
        <div className="glass rounded-xl p-4 mb-6 text-xs text-[#FFD700] border border-[rgba(255,215,0,0.2)]">
          model_metrics.json not found — run <code className="text-[#00D4FF]">python train_model.py</code> to populate real metrics.
        </div>
      )}

      {/* Model info cards */}
      {metrics && (
        <div className="grid grid-cols-3 gap-3 mb-6">
          {infoCards.map((c, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="glass rounded-xl p-4">
              <p className="text-[10px] text-[#4A6A8A] uppercase tracking-wider mb-1">{c.label}</p>
              <p className="text-sm font-bold text-[#00D4FF]">{c.value}</p>
              <p className="text-[10px] text-[#2A4A6A] mt-0.5">{c.sub}</p>
            </motion.div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        {/* Feature importance */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="glass rounded-xl p-5">
          <p className="text-xs text-[#4A6A8A] font-medium tracking-wider uppercase mb-4">Feature Importance</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={sorted} layout="vertical" barSize={10} margin={{ left: 20 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" horizontal={false} />
              <XAxis type="number" domain={[0, 'dataMax']} tickFormatter={v => `${(v * 100).toFixed(0)}%`}
                tick={{ fontSize: 10, fill: '#4A6A8A' }} tickLine={false} axisLine={false} />
              <YAxis type="category" dataKey="feature" tick={{ fontSize: 10, fill: '#8AACCA' }} tickLine={false} axisLine={false} width={145} />
              <Tooltip content={<FeatureTooltip />} />
              <Bar dataKey="importance" name="Importance" radius={[0, 4, 4, 0]}>
                {sorted.map((f, i) => (
                  <Cell key={i} fill={f.direction === 'positive' ? '#00D4FF' : '#FF2D55'} fillOpacity={0.85 - i * 0.05} />
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
          {modelMetrics.length ? (
            <>
              <ResponsiveContainer width="100%" height={240}>
                <RadarChart data={modelMetrics.map(m => ({ subject: m.metric, value: m.value }))}>
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
            </>
          ) : (
            <div className="h-[240px] flex items-center justify-center text-[#4A6A8A] text-xs">
              No metrics available yet.
            </div>
          )}
        </motion.div>
      </div>

      {/* Baseline comparison */}
      {metrics?.baselines?.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
          className="glass rounded-xl p-5 mt-4">
          <p className="text-xs text-[#4A6A8A] font-medium tracking-wider uppercase mb-1">
            Algorithm Comparison (held-out test set)
          </p>
          <p className="text-[10px] text-[#2A4A6A] mb-4">
            Random Forest was selected after benchmarking against standard baselines on the same 80/20 stratified split.
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={metrics.baselines} barSize={14} margin={{ top: 8, right: 8, bottom: 8, left: 0 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#8AACCA' }} tickLine={false} axisLine={false} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#4A6A8A' }} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} />
              <Tooltip content={<MetricTooltip />} cursor={{ fill: 'rgba(0,212,255,0.04)' }} />
              <Bar dataKey="accuracy"  name="Accuracy"  fill="#00D4FF" radius={[3, 3, 0, 0]} />
              <Bar dataKey="f1_score"  name="F1"        fill="#7B4FFF" radius={[3, 3, 0, 0]} />
              <Bar dataKey="auc_roc"   name="AUC-ROC"   fill="#00FF94" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-3 gap-4 mt-3">
            {metrics.baselines.map(b => (
              <div
                key={b.name}
                className={`text-center p-2 rounded-lg border ${
                  b.name.includes('selected')
                    ? 'border-[rgba(0,212,255,0.3)] bg-[rgba(0,212,255,0.05)]'
                    : 'border-transparent'
                }`}
              >
                <p className="text-[11px] font-semibold text-[#E8F4FD]">{b.name}</p>
                <p className="text-[10px] text-[#4A6A8A] mt-1">
                  Acc {b.accuracy}% · F1 {b.f1_score}% · AUC {b.auc_roc}%
                </p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
}
