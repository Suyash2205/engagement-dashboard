import { motion } from 'framer-motion'

export default function PageHeader({ title, subtitle, badge }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8"
    >
      {badge && (
        <span className="inline-block text-[10px] font-semibold tracking-widest uppercase text-[#00D4FF] bg-[rgba(0,212,255,0.08)] border border-[rgba(0,212,255,0.2)] px-2.5 py-1 rounded-full mb-3">
          {badge}
        </span>
      )}
      <h1 className="text-2xl font-bold text-[#E8F4FD] tracking-tight">{title}</h1>
      {subtitle && <p className="text-sm text-[#4A6A8A] mt-1">{subtitle}</p>}
    </motion.div>
  )
}
