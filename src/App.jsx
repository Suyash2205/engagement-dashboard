import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Sidebar from './components/Sidebar'
import Overview from './pages/Overview'
import Trends from './pages/Trends'
import Prediction from './pages/Prediction'
import Segmentation from './pages/Segmentation'
import AtRisk from './pages/AtRisk'
import Modules from './pages/Modules'
import Demographics from './pages/Demographics'
import DatasetExplorer from './pages/DatasetExplorer'

const pages = {
  overview: Overview,
  trends: Trends,
  prediction: Prediction,
  segments: Segmentation,
  atrisk: AtRisk,
  modules: Modules,
  demographics: Demographics,
  dataset:      DatasetExplorer,
}

export default function App() {
  const [active, setActive] = useState('overview')
  const Page = pages[active]

  return (
    <div className="flex min-h-screen dot-grid">
      <Sidebar active={active} onSelect={setActive} />

      <main className="ml-60 flex-1 min-h-screen">
        {/* Top bar */}
        <div className="sticky top-0 z-40 glass border-b border-[rgba(0,212,255,0.08)] px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#00FF94] animate-pulse" style={{ boxShadow: '0 0 6px #00FF94' }} />
            <span className="text-[11px] text-[#4A6A8A]">Live · Updated just now</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[11px] text-[#4A6A8A]">Academic Year 2024–25</span>
            <span className="text-[11px] px-2.5 py-1 rounded-full bg-[rgba(0,212,255,0.08)] text-[#00D4FF] border border-[rgba(0,212,255,0.15)]">
              OULAD Dataset
            </span>
          </div>
        </div>

        {/* Page content */}
        <div className="px-8 py-8 max-w-6xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              <Page />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}
