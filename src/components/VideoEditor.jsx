import { useRef, useState, useEffect, useCallback } from 'react'
import TextPanel from './TextPanel'
import ExportPanel from './ExportPanel'

function fmt(s) {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export default function VideoEditor() {
  const videoRef = useRef(null)
  const [video, setVideo] = useState(null)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [trimStart, setTrimStart] = useState(0)
  const [trimEnd, setTrimEnd] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [texts, setTexts] = useState([])
  const [activeTab, setActiveTab] = useState('trim')
  const [exporting, setExporting] = useState(false)
  const [exportingSegment, setExportingSegment] = useState(null)
  const [splitPoints, setSplitPoints] = useState([])
  const rafRef = useRef(null)

  const updateTime = useCallback(() => {
    const v = videoRef.current
    if (!v) return
    setCurrentTime(v.currentTime)
    if (v.currentTime >= trimEnd) {
      v.pause()
      v.currentTime = trimStart
      setPlaying(false)
      return
    }
    rafRef.current = requestAnimationFrame(updateTime)
  }, [trimEnd, trimStart])

  useEffect(() => {
    if (playing) {
      rafRef.current = requestAnimationFrame(updateTime)
    }
    return () => cancelAnimationFrame(rafRef.current)
  }, [playing, updateTime])

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    setVideo(url)
    setTexts([])
    setTrimStart(0)
    setCurrentTime(0)
    setPlaying(false)
  }

  const onLoadedMetadata = () => {
    const v = videoRef.current
    if (!v) return
    setDuration(v.duration)
    setTrimEnd(v.duration)
  }

  const togglePlay = () => {
    const v = videoRef.current
    if (!v) return
    if (playing) {
      v.pause()
      setPlaying(false)
    } else {
      if (v.currentTime >= trimEnd || v.currentTime < trimStart) {
        v.currentTime = trimStart
      }
      v.play()
      setPlaying(true)
    }
  }

  const handleProgressClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = (e.clientX - rect.left) / rect.width
    const t = trimStart + ratio * (trimEnd - trimStart)
    if (videoRef.current) videoRef.current.currentTime = t
    setCurrentTime(t)
  }

  const handleExport = async (preset, format) => {
    const v = videoRef.current
    if (!v) return
    setExporting(true)

    const canvas = document.createElement('canvas')
    canvas.width = preset.width || v.videoWidth || 1280
    canvas.height = preset.height || v.videoHeight || 720
    const ctx = canvas.getContext('2d')

    const stream = canvas.captureStream(30)
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' })
    const chunks = []
    recorder.ondataavailable = e => chunks.push(e.data)
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `editpro_video.webm`
      link.click()
      URL.revokeObjectURL(url)
      setExporting(false)
    }

    v.currentTime = trimStart
    await new Promise(r => { v.onseeked = r })
    v.play()
    recorder.start()

    const drawFrame = () => {
      if (v.currentTime >= trimEnd) {
        v.pause()
        recorder.stop()
        return
      }
      ctx.drawImage(v, 0, 0, canvas.width, canvas.height)
      texts.forEach(t => {
        ctx.save()
        ctx.font = `${t.bold ? 'bold ' : ''}${Math.round(t.size * canvas.width / 640)}px "${t.font}", sans-serif`
        ctx.fillStyle = t.color
        ctx.globalAlpha = t.opacity
        if (t.shadow) {
          ctx.shadowColor = 'rgba(0,0,0,0.7)'
          ctx.shadowBlur = 6
          ctx.shadowOffsetX = 2
          ctx.shadowOffsetY = 2
        }
        ctx.fillText(t.text, Math.round(t.x * canvas.width / 640), Math.round(t.y * canvas.height / 360))
        ctx.restore()
      })
      requestAnimationFrame(drawFrame)
    }
    drawFrame()
  }

  const trimPct = duration > 0 ? {
    left: (trimStart / duration) * 100,
    width: ((trimEnd - trimStart) / duration) * 100,
  } : { left: 0, width: 100 }

  const progressPct = trimEnd > trimStart
    ? ((currentTime - trimStart) / (trimEnd - trimStart)) * 100
    : 0

  // Split: sorted cut points → segments
  const sortedSplits = [...splitPoints].sort((a, b) => a - b)
  const segments = duration > 0
    ? (() => {
        const pts = [0, ...sortedSplits, duration]
        return pts.slice(0, -1).map((s, i) => ({ start: s, end: pts[i + 1], index: i + 1 }))
      })()
    : []

  const addSplitAtCurrent = () => {
    if (!video || currentTime <= 0 || currentTime >= duration) return
    if (splitPoints.some(p => Math.abs(p - currentTime) < 0.2)) return
    setSplitPoints(prev => [...prev, currentTime])
  }

  const removeSplit = (pt) => setSplitPoints(prev => prev.filter(p => p !== pt))

  const exportSegment = async (seg) => {
    const v = videoRef.current
    if (!v) return
    setExportingSegment(seg.index)

    const canvas = document.createElement('canvas')
    canvas.width = v.videoWidth || 1280
    canvas.height = v.videoHeight || 720
    const ctx = canvas.getContext('2d')

    const stream = canvas.captureStream(30)
    const recorder = new MediaRecorder(stream, { mimeType: 'video/webm;codecs=vp9' })
    const chunks = []
    recorder.ondataavailable = e => chunks.push(e.data)
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `clip_${seg.index}.webm`
      link.click()
      URL.revokeObjectURL(url)
      setExportingSegment(null)
    }

    v.currentTime = seg.start
    await new Promise(r => { v.onseeked = r })
    v.play()
    recorder.start()

    const drawFrame = () => {
      if (v.currentTime >= seg.end) {
        v.pause()
        recorder.stop()
        return
      }
      ctx.drawImage(v, 0, 0, canvas.width, canvas.height)
      requestAnimationFrame(drawFrame)
    }
    drawFrame()
  }

  const TABS = [
    { id: 'trim', icon: '✂️', label: 'Trim' },
    { id: 'split', icon: '🔪', label: 'Split' },
    { id: 'text', icon: 'T', label: 'Text' },
    { id: 'export', icon: '↓', label: 'Export' },
  ]

  return (
    <>
      <div className="left-panel">
        <div className="tool-tabs">
          {TABS.map(t => (
            <button
              key={t.id}
              className={`tool-tab ${activeTab === t.id ? 'active' : ''}`}
              onClick={() => setActiveTab(t.id)}
            >
              <span className="icon">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === 'trim' && (
          <div className="panel-body">
            <div className="section-title">Trim Settings</div>
            <div className="slider-group">
              <div className="slider-label">
                <span>Start Time</span>
                <span>{fmt(trimStart)}</span>
              </div>
              <input
                type="range" min={0} max={duration} step={0.01}
                value={trimStart}
                onChange={e => {
                  const v = Math.min(Number(e.target.value), trimEnd - 0.5)
                  setTrimStart(v)
                  if (videoRef.current) videoRef.current.currentTime = v
                  setCurrentTime(v)
                }}
              />
            </div>
            <div className="slider-group">
              <div className="slider-label">
                <span>End Time</span>
                <span>{fmt(trimEnd)}</span>
              </div>
              <input
                type="range" min={0} max={duration} step={0.01}
                value={trimEnd}
                onChange={e => {
                  const v = Math.max(Number(e.target.value), trimStart + 0.5)
                  setTrimEnd(v)
                }}
              />
            </div>

            {duration > 0 && (
              <>
                <div className="divider" />
                <div className="tip">
                  Clip duration: <strong>{fmt(trimEnd - trimStart)}</strong>
                  {' '}of {fmt(duration)} total
                </div>
                <button
                  className="btn btn-secondary btn-full"
                  onClick={() => { setTrimStart(0); setTrimEnd(duration) }}
                >
                  Reset Trim
                </button>
              </>
            )}

            {!video && (
              <div className="empty-state" style={{ marginTop: 24 }}>
                <div className="es-icon">🎬</div>
                <p>Upload a video to start trimming</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'split' && (
          <div className="panel-body">
            <div className="section-title">Split Video into Clips</div>
            {!video ? (
              <div className="empty-state" style={{ marginTop: 24 }}>
                <div className="es-icon">🔪</div>
                <p>Upload a video to split it</p>
              </div>
            ) : (
              <>
                <div className="tip" style={{ marginBottom: 10 }}>
                  Play the video and click <strong>Add Cut</strong> at the point you want to split.
                </div>
                <button
                  className="btn btn-primary btn-full"
                  onClick={addSplitAtCurrent}
                  disabled={!video}
                >
                  ✂️ Add Cut at {fmt(currentTime)}
                </button>

                {splitPoints.length > 0 && (
                  <>
                    <div className="divider" />
                    <div className="section-title">Cut Points</div>
                    {sortedSplits.map(pt => (
                      <div key={pt} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0' }}>
                        <span style={{ fontSize: 13 }}>✂️ {fmt(pt)}</span>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '2px 8px', fontSize: 11 }}
                          onClick={() => removeSplit(pt)}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button
                      className="btn btn-secondary btn-full"
                      style={{ marginTop: 6 }}
                      onClick={() => setSplitPoints([])}
                    >
                      Clear All Cuts
                    </button>
                  </>
                )}

                {segments.length > 1 && (
                  <>
                    <div className="divider" />
                    <div className="section-title">Segments ({segments.length})</div>
                    {segments.map(seg => (
                      <div key={seg.index} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '6px 8px', background: 'var(--panel2)', borderRadius: 6, marginBottom: 6
                      }}>
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 600 }}>Clip {seg.index}</div>
                          <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                            {fmt(seg.start)} → {fmt(seg.end)} ({fmt(seg.end - seg.start)})
                          </div>
                        </div>
                        <button
                          className="btn btn-primary"
                          style={{ padding: '4px 10px', fontSize: 11 }}
                          onClick={() => exportSegment(seg)}
                          disabled={exportingSegment !== null}
                        >
                          {exportingSegment === seg.index ? '⏳' : '↓'}
                        </button>
                      </div>
                    ))}
                    <button
                      className="btn btn-primary btn-full"
                      onClick={() => segments.forEach(seg => exportSegment(seg))}
                      disabled={exportingSegment !== null}
                      style={{ marginTop: 4 }}
                    >
                      {exportingSegment !== null ? `⏳ Exporting Clip ${exportingSegment}...` : '↓ Export All Clips'}
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        )}

        {activeTab === 'text' && (
          <TextPanel texts={texts} onChange={setTexts} canvasRef={{ current: videoRef.current }} />
        )}

        {activeTab === 'export' && (
          <ExportPanel
            hasImage={!!video}
            onExport={handleExport}
            isVideo
          />
        )}
      </div>

      <div className="video-area">
        <div className="canvas-checkerboard" />
        {!video ? (
          <label className="upload-zone" style={{ zIndex: 1 }}>
            <input type="file" accept="video/*" onChange={handleFile} hidden />
            <div className="upload-icon">🎬</div>
            <p>Drop a video or click to upload</p>
            <span>Supports MP4, WebM, MOV, AVI</span>
          </label>
        ) : (
          <>
            <div className="video-container" style={{ zIndex: 1 }}>
              <video
                ref={videoRef}
                src={video}
                className="edit-video"
                onLoadedMetadata={onLoadedMetadata}
                onTimeUpdate={() => setCurrentTime(videoRef.current?.currentTime || 0)}
                onEnded={() => setPlaying(false)}
                playsInline
              />
              {texts.length > 0 && (
                <div className="video-text-overlay">
                  {texts.map(t => (
                    <span
                      key={t.id}
                      className="video-text-item"
                      style={{
                        left: `${(t.x / 640) * 100}%`,
                        top: `${(t.y / 360) * 100}%`,
                        fontSize: t.size,
                        fontFamily: t.font,
                        color: t.color,
                        opacity: t.opacity,
                        fontWeight: t.bold ? 700 : 400,
                      }}
                    >
                      {t.text}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="video-controls" style={{ zIndex: 1 }}>
              {/* Trim bar */}
              <div className="trim-bar">
                <div className="trim-track">
                  <div
                    className="trim-fill"
                    style={{ left: `${trimPct.left}%`, width: `${trimPct.width}%` }}
                  />
                  <div className="trim-handle left" style={{ left: `${trimPct.left}%` }} />
                  <div className="trim-handle right" style={{ left: `${trimPct.left + trimPct.width}%` }} />
                  {duration > 0 && sortedSplits.map(pt => (
                    <div
                      key={pt}
                      style={{
                        position: 'absolute',
                        left: `${(pt / duration) * 100}%`,
                        top: 0, bottom: 0,
                        width: 2,
                        background: '#f59e0b',
                        zIndex: 3,
                        transform: 'translateX(-1px)',
                        pointerEvents: 'none',
                      }}
                    />
                  ))}
                </div>
                <div className="trim-labels">
                  <span>{fmt(trimStart)}</span>
                  <span>Duration: {fmt(trimEnd - trimStart)}</span>
                  <span>{fmt(trimEnd)}</span>
                </div>
              </div>

              {/* Playback row */}
              <div className="playback-row">
                <button className="play-btn" onClick={togglePlay}>
                  {playing ? '⏸' : '▶'}
                </button>
                <span className="time-display">{fmt(currentTime)} / {fmt(trimEnd)}</span>
                <div className="progress-bar-wrap" onClick={handleProgressClick}>
                  <div className="progress-bar-fill" style={{ width: `${Math.max(0, Math.min(100, progressPct))}%` }} />
                </div>
                <label className="change-btn" style={{ cursor: 'pointer', flexShrink: 0 }}>
                  <input type="file" accept="video/*" onChange={handleFile} hidden />
                  📂 Change
                </label>
              </div>
            </div>

            {exporting && (
              <div style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                zIndex: 100, flexDirection: 'column', gap: 12
              }}>
                <div style={{ fontSize: 40 }}>⏳</div>
                <p style={{ color: '#fff', fontSize: 16, fontWeight: 600 }}>Exporting video...</p>
                <p style={{ color: '#888', fontSize: 13 }}>This may take a moment</p>
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}
