import { useState } from 'react'

const PRESETS = [
  { id: 'ig_square', label: 'Instagram Post', icon: '📷', width: 1080, height: 1080, desc: '1:1 Square' },
  { id: 'ig_portrait', label: 'Instagram Portrait', icon: '📷', width: 1080, height: 1350, desc: '4:5 Portrait' },
  { id: 'ig_story', label: 'Instagram Story', icon: '📱', width: 1080, height: 1920, desc: '9:16 Vertical' },
  { id: 'fb_post', label: 'Facebook Post', icon: '📘', width: 1200, height: 630, desc: '1.91:1 Landscape' },
  { id: 'fb_story', label: 'Facebook Story', icon: '📘', width: 1080, height: 1920, desc: '9:16 Vertical' },
  { id: 'yt_thumb', label: 'YouTube Thumbnail', icon: '▶️', width: 1280, height: 720, desc: '16:9 Landscape' },
  { id: 'yt_shorts', label: 'YouTube Shorts', icon: '▶️', width: 1080, height: 1920, desc: '9:16 Vertical' },
  { id: 'original', label: 'Original Size', icon: '🖼️', width: null, height: null, desc: 'Keep original' },
]

const FORMATS = ['PNG', 'JPG', 'WEBP']

export default function ExportPanel({ onExport, hasImage, canvasRef, isVideo }) {
  const [selected, setSelected] = useState('ig_square')
  const [format, setFormat] = useState('JPG')

  const preset = PRESETS.find(p => p.id === selected)

  const handleExport = () => {
    if (!hasImage) return
    onExport(preset, format.toLowerCase())
  }

  return (
    <div className="panel-body">
      <div className="section-title">Platform Preset</div>
      <div className="preset-grid">
        {PRESETS.map(p => (
          <div
            key={p.id}
            className={`preset-card ${selected === p.id ? 'active' : ''}`}
            onClick={() => setSelected(p.id)}
          >
            <div className="plat-icon">{p.icon}</div>
            <div className="plat-name">{p.label}</div>
            <div className="plat-size">{p.desc}</div>
            {p.width && <div className="plat-size">{p.width}×{p.height}</div>}
          </div>
        ))}
      </div>

      {!isVideo && (
        <>
          <div className="section-title" style={{ marginBottom: 8 }}>Format</div>
          <div className="format-row">
            {FORMATS.map(f => (
              <button
                key={f}
                className={`format-btn ${format === f ? 'active' : ''}`}
                onClick={() => setFormat(f)}
              >
                {f}
              </button>
            ))}
          </div>
        </>
      )}

      {preset.width && (
        <div className="tip" style={{ marginBottom: 14 }}>
          Output will be resized to {preset.width}×{preset.height}px ({preset.desc})
        </div>
      )}

      <button
        className="btn btn-primary btn-full"
        disabled={!hasImage}
        onClick={handleExport}
        style={{ fontSize: 14, padding: '10px 16px' }}
      >
        ↓ Download {isVideo ? 'Video' : format}
      </button>

      {!hasImage && (
        <div className="empty-state" style={{ marginTop: 16 }}>
          <div className="es-icon">⬆️</div>
          <p>Upload a file first to export</p>
        </div>
      )}
    </div>
  )
}
