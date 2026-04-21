import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Papa from 'papaparse'
import { Upload, FileText, Search, ChevronLeft, ChevronRight, X, Info } from 'lucide-react'
import PageHeader from '../components/PageHeader'

const OULAD_FILES = [
  { name: 'studentInfo.csv',         label: 'Student Info',         desc: '32,593 students — demographics & final results', color: '#00D4FF' },
  { name: 'studentAssessment.csv',   label: 'Student Assessments',  desc: '173,912 assessment submissions with scores',      color: '#7B4FFF' },
  { name: 'studentVle.csv',          label: 'Student VLE',          desc: '10.6M click interactions (large file)',           color: '#FF6B35' },
  { name: 'assessments.csv',         label: 'Assessments',          desc: 'Assessment metadata — type, due date, weight',    color: '#00FF94' },
  { name: 'courses.csv',             label: 'Courses',              desc: 'Module info — length in days',                   color: '#FFD700' },
  { name: 'studentRegistration.csv', label: 'Registrations',        desc: 'Enrollment & withdrawal dates',                  color: '#FF2D55' },
  { name: 'vle.csv',                 label: 'VLE Resources',        desc: 'Virtual learning environment resource metadata',  color: '#00D4FF' },
]

const PAGE_SIZE = 50

function StatBadge({ label, value, color }) {
  return (
    <div className="glass rounded-lg px-3 py-2 text-center">
      <p className="text-lg font-bold" style={{ color }}>{value}</p>
      <p className="text-[10px] text-[#4A6A8A] mt-0.5">{label}</p>
    </div>
  )
}

export default function DatasetExplorer() {
  const [data, setData]           = useState([])
  const [columns, setColumns]     = useState([])
  const [fileName, setFileName]   = useState('')
  const [loading, setLoading]     = useState(false)
  const [page, setPage]           = useState(1)
  const [search, setSearch]       = useState('')
  const [colFilter, setColFilter] = useState('all')
  const [error, setError]         = useState('')
  const [stats, setStats]         = useState(null)
  const fileRef = useRef()

  const computeStats = (rows, cols) => {
    const s = {}
    cols.forEach(col => {
      const vals = rows.map(r => r[col]).filter(v => v !== '' && v != null)
      const nums = vals.map(Number).filter(v => !isNaN(v))
      s[col] = {
        unique: new Set(vals).size,
        missing: rows.length - vals.length,
        isNumeric: nums.length > vals.length * 0.7,
        min: nums.length ? Math.min(...nums).toFixed(1) : '—',
        max: nums.length ? Math.max(...nums).toFixed(1) : '—',
        avg: nums.length ? (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(1) : '—',
      }
    })
    return s
  }

  const parseFile = useCallback((file) => {
    if (!file) return
    setLoading(true)
    setError('')
    setData([])
    setColumns([])
    setStats(null)
    setPage(1)
    setSearch('')
    setColFilter('all')
    setFileName(file.name)

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      worker: false,
      complete: (result) => {
        if (result.errors.length && !result.data.length) {
          setError('Failed to parse file. Make sure it is a valid CSV.')
          setLoading(false)
          return
        }
        const cols = result.meta.fields || []
        const rows = result.data
        setColumns(cols)
        setData(rows)
        setStats(computeStats(rows, cols))
        setLoading(false)
      },
      error: (err) => {
        setError(err.message)
        setLoading(false)
      }
    })
  }, [])

  const onFileChange = (e) => parseFile(e.target.files[0])

  const onDrop = useCallback((e) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.name.endsWith('.csv')) parseFile(file)
  }, [parseFile])

  // filter rows
  const filtered = data.filter(row => {
    if (!search) return true
    const haystack = colFilter === 'all'
      ? Object.values(row).join(' ')
      : (row[colFilter] ?? '')
    return String(haystack).toLowerCase().includes(search.toLowerCase())
  })

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const pageRows   = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const handleSearchChange = (v) => { setSearch(v); setPage(1) }

  return (
    <div>
      <PageHeader badge="OULAD Dataset" title="Dataset Explorer" subtitle="Load any OULAD CSV file and browse, search, and inspect the real data" />

      {/* Quick-load buttons */}
      <div className="mb-6">
        <p className="text-[10px] text-[#4A6A8A] uppercase tracking-wider mb-3 font-semibold">Quick Load — select a file from your oulad_raw folder</p>
        <div className="grid grid-cols-4 gap-2">
          {OULAD_FILES.map(f => (
            <motion.button key={f.name} whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
              onClick={() => fileRef.current.click()}
              className="glass glass-hover rounded-xl p-3 text-left"
              style={fileName === f.name ? { borderColor: f.color + '55', boxShadow: `0 0 14px ${f.color}18` } : {}}>
              <div className="flex items-center gap-2 mb-1.5">
                <FileText size={12} style={{ color: f.color }} />
                <p className="text-[11px] font-semibold" style={{ color: f.color }}>{f.label}</p>
              </div>
              <p className="text-[10px] text-[#2A4A6A] leading-relaxed">{f.desc}</p>
            </motion.button>
          ))}
          {/* Custom file */}
          <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
            onClick={() => fileRef.current.click()}
            className="glass glass-hover rounded-xl p-3 text-left border-dashed">
            <div className="flex items-center gap-2 mb-1.5">
              <Upload size={12} className="text-[#4A6A8A]" />
              <p className="text-[11px] font-semibold text-[#4A6A8A]">Custom File</p>
            </div>
            <p className="text-[10px] text-[#2A4A6A]">Load any CSV file</p>
          </motion.button>
        </div>
      </div>

      {/* Drop zone */}
      <motion.div
        onDrop={onDrop}
        onDragOver={e => e.preventDefault()}
        onClick={() => fileRef.current.click()}
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="glass rounded-xl border-dashed border-[rgba(0,212,255,0.2)] p-8 text-center cursor-pointer mb-6 hover:border-[rgba(0,212,255,0.4)] transition-colors"
        style={data.length ? { display: 'none' } : {}}>
        <Upload size={24} className="text-[#1E3A5F] mx-auto mb-3" />
        <p className="text-sm text-[#4A6A8A]">Drag & drop a CSV file here, or click to browse</p>
        <p className="text-[11px] text-[#2A4A6A] mt-1">Navigate to <span className="text-[#00D4FF] font-mono">C:\Users\Suyash\ruflo-test\engagement-dashboard\oulad_raw\</span></p>
      </motion.div>

      <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={onFileChange} />

      {/* Loading */}
      {loading && (
        <div className="glass rounded-xl p-10 text-center">
          <div className="w-8 h-8 border-2 border-[#00D4FF] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-[#4A6A8A]">Parsing {fileName}...</p>
          <p className="text-[11px] text-[#2A4A6A] mt-1">Large files may take a few seconds</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="glass rounded-xl p-4 border border-[rgba(255,45,85,0.3)] text-[#FF2D55] text-sm mb-4">
          {error}
        </div>
      )}

      {/* Data loaded */}
      <AnimatePresence>
        {data.length > 0 && !loading && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>

            {/* File header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <FileText size={16} className="text-[#00D4FF]" />
                <div>
                  <p className="text-sm font-bold text-[#E8F4FD]">{fileName}</p>
                  <p className="text-[11px] text-[#4A6A8A]">{data.length.toLocaleString()} rows · {columns.length} columns</p>
                </div>
              </div>
              <button onClick={() => { setData([]); setFileName(''); setStats(null) }}
                className="flex items-center gap-1.5 text-[11px] text-[#4A6A8A] hover:text-[#FF2D55] transition-colors">
                <X size={12} /> Close
              </button>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-4 gap-3 mb-5">
              <StatBadge label="Total Rows"   value={data.length.toLocaleString()} color="#00D4FF" />
              <StatBadge label="Columns"      value={columns.length}               color="#7B4FFF" />
              <StatBadge label="Showing"      value={filtered.length.toLocaleString()} color="#00FF94" />
              <StatBadge label="Page"         value={`${page} / ${totalPages || 1}`} color="#FF6B35" />
            </div>

            {/* Column stats */}
            {stats && (
              <div className="glass rounded-xl p-4 mb-4 overflow-x-auto">
                <p className="text-[10px] text-[#4A6A8A] uppercase tracking-wider font-semibold mb-3 flex items-center gap-1.5">
                  <Info size={11} /> Column Statistics
                </p>
                <div className="flex gap-3 min-w-max">
                  {columns.map(col => (
                    <div key={col} className="min-w-[110px] bg-[rgba(255,255,255,0.02)] rounded-lg p-2.5 border border-[rgba(255,255,255,0.05)]">
                      <p className="text-[10px] font-semibold text-[#00D4FF] truncate mb-1.5" title={col}>{col}</p>
                      <p className="text-[10px] text-[#4A6A8A]">Unique: <span className="text-[#E8F4FD]">{stats[col].unique.toLocaleString()}</span></p>
                      <p className="text-[10px] text-[#4A6A8A]">Missing: <span className="text-[#E8F4FD]">{stats[col].missing}</span></p>
                      {stats[col].isNumeric && <>
                        <p className="text-[10px] text-[#4A6A8A]">Min: <span className="text-[#E8F4FD]">{stats[col].min}</span></p>
                        <p className="text-[10px] text-[#4A6A8A]">Max: <span className="text-[#E8F4FD]">{stats[col].max}</span></p>
                        <p className="text-[10px] text-[#4A6A8A]">Avg: <span className="text-[#E8F4FD]">{stats[col].avg}</span></p>
                      </>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Search + column filter */}
            <div className="flex gap-3 mb-4">
              <div className="relative flex-1 max-w-sm">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#4A6A8A]" />
                <input
                  value={search}
                  onChange={e => handleSearchChange(e.target.value)}
                  placeholder="Search across all columns..."
                  className="w-full glass rounded-lg pl-8 pr-3 py-2 text-xs text-[#E8F4FD] placeholder-[#2A4A6A] outline-none focus:border-[rgba(0,212,255,0.3)]"
                />
              </div>
              <select
                value={colFilter}
                onChange={e => { setColFilter(e.target.value); setPage(1) }}
                className="glass rounded-lg px-3 py-2 text-xs text-[#8AACCA] outline-none cursor-pointer">
                <option value="all">Search all columns</option>
                {columns.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              {search && (
                <button onClick={() => handleSearchChange('')}
                  className="text-[11px] text-[#4A6A8A] hover:text-[#FF2D55] flex items-center gap-1 transition-colors">
                  <X size={12} /> Clear
                </button>
              )}
            </div>

            {/* Table */}
            <div className="glass rounded-xl overflow-hidden">
              <div className="overflow-x-auto max-h-[440px] overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-[rgba(5,10,20,0.95)] border-b border-[rgba(0,212,255,0.1)]">
                      <th className="px-4 py-3 text-left text-[10px] text-[#2A4A6A] font-semibold uppercase tracking-wider w-10">#</th>
                      {columns.map(col => (
                        <th key={col} className="px-4 py-3 text-left text-[10px] text-[#4A6A8A] font-semibold uppercase tracking-wider whitespace-nowrap">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[rgba(255,255,255,0.03)]">
                    {pageRows.map((row, i) => (
                      <tr key={i} className="hover:bg-[rgba(0,212,255,0.03)] transition-colors">
                        <td className="px-4 py-2.5 text-[#2A4A6A] font-mono">{(page - 1) * PAGE_SIZE + i + 1}</td>
                        {columns.map(col => {
                          const val = row[col]
                          const isNum = !isNaN(Number(val)) && val !== ''
                          return (
                            <td key={col} className="px-4 py-2.5 whitespace-nowrap max-w-[180px] truncate"
                              style={{ color: isNum ? '#00D4FF' : '#8AACCA' }}
                              title={val}>
                              {val === '' || val == null ? <span className="text-[#2A4A6A] italic">—</span> : val}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="flex items-center justify-between px-5 py-3 border-t border-[rgba(255,255,255,0.05)]">
                <p className="text-[11px] text-[#2A4A6A]">
                  Rows {((page-1)*PAGE_SIZE)+1}–{Math.min(page*PAGE_SIZE, filtered.length)} of {filtered.length.toLocaleString()}
                </p>
                <div className="flex items-center gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
                    className="p-1.5 rounded-lg glass disabled:opacity-30 hover:border-[rgba(0,212,255,0.3)] transition-all">
                    <ChevronLeft size={13} className="text-[#4A6A8A]" />
                  </button>
                  {/* Page numbers */}
                  {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                    let p
                    if (totalPages <= 7) p = i + 1
                    else if (page <= 4) p = i + 1
                    else if (page >= totalPages - 3) p = totalPages - 6 + i
                    else p = page - 3 + i
                    return (
                      <button key={p} onClick={() => setPage(p)}
                        className="w-7 h-7 rounded-lg text-[11px] font-medium transition-all"
                        style={page === p
                          ? { background: 'rgba(0,212,255,0.15)', color: '#00D4FF', border: '1px solid rgba(0,212,255,0.3)' }
                          : { color: '#4A6A8A' }}>
                        {p}
                      </button>
                    )
                  })}
                  <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page === totalPages}
                    className="p-1.5 rounded-lg glass disabled:opacity-30 hover:border-[rgba(0,212,255,0.3)] transition-all">
                    <ChevronRight size={13} className="text-[#4A6A8A]" />
                  </button>
                </div>
              </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
