import { motion } from 'framer-motion'
import {
  LayoutDashboard, TrendingUp, Brain, Users,
  AlertTriangle, BarChart2, PieChart, Activity
} from 'lucide-react'

const nav = [
  { id: 'overview',     label: 'Overview',         icon: LayoutDashboard },
  { id: 'trends',       label: 'Engagement Trends', icon: TrendingUp },
  { id: 'prediction',   label: 'AI Prediction',     icon: Brain },
  { id: 'segments',     label: 'Segmentation',      icon: Users },
  { id: 'atrisk',       label: 'At-Risk Alerts',    icon: AlertTriangle },
  { id: 'modules',      label: 'Module Analysis',   icon: BarChart2 },
  { id: 'demographics', label: 'Demographics',       icon: PieChart },
]

export default function Sidebar({ active, onSelect }) {
  return (
    <aside className="fixed left-0 top-0 h-screen w-60 flex flex-col glass border-r border-[rgba(0,212,255,0.1)] z-50">
      {/* Logo */}
      <div className="px-6 pt-8 pb-6 border-b border-[rgba(0,212,255,0.08)]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#00D4FF] flex items-center justify-center glow-cyan">
            <Activity size={16} className="text-[#050A14]" />
          </div>
          <div>
            <p className="text-xs text-[#00D4FF] font-semibold tracking-widest uppercase">EduPredict</p>
            <p className="text-[10px] text-[#4A6A8A] tracking-wide">AI Engagement System</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {nav.map(({ id, label, icon: Icon }) => {
          const isActive = active === id
          return (
            <motion.button
              key={id}
              onClick={() => onSelect(id)}
              whileHover={{ x: 3 }}
              whileTap={{ scale: 0.97 }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                isActive
                  ? 'bg-[rgba(0,212,255,0.1)] text-[#00D4FF] border border-[rgba(0,212,255,0.2)]'
                  : 'text-[#4A6A8A] hover:text-[#8AACCA] hover:bg-[rgba(255,255,255,0.03)]'
              }`}
            >
              <Icon size={15} className={isActive ? 'text-[#00D4FF]' : ''} />
              <span className="font-medium">{label}</span>
              {isActive && (
                <motion.div
                  layoutId="indicator"
                  className="ml-auto w-1.5 h-1.5 rounded-full bg-[#00D4FF]"
                  style={{ boxShadow: '0 0 6px #00D4FF' }}
                />
              )}
            </motion.button>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-5 border-t border-[rgba(0,212,255,0.08)]">
        <p className="text-[10px] text-[#2A4A6A] tracking-wide">OULAD Dataset · 32,593 Students</p>
        <p className="text-[10px] text-[#2A4A6A] mt-0.5">Model: Random Forest · F1 0.87</p>
      </div>
    </aside>
  )
}
