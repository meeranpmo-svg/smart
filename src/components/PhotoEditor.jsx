import { useRef, useState, useEffect, useCallback } from 'react'
import FilterPanel from './FilterPanel'
import TextPanel from './TextPanel'
import ExportPanel from './ExportPanel'

const DEFAULT_FILTERS = { brightness: 100, contrast: 100, saturation: 100, hue: 0, blur: 0, sepia: 0 }

export default function PhotoEditor() {
  const canvasRef = useRef(null)
  const imageRef = useRef(null)
  const [image, setImage] = useState(null)
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [texts, setTexts] = useState([])
  const [rotation, setRotation] = useState(0)
  const [activeTab, setActiveTab] = useState('filters')

  const render = useCallback(() => {
    const canvas = canvasRef.current
    const img = imageRef.current
    if (!canvas || !img) return
    const ctx = canvas.getContext('2d')

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    ctx.save()
    ctx.translate(canvas.width / 2, canvas.height / 2)
    ctx.rotate((rotation * Math.PI) / 180)
    ctx.translate(-canvas.width / 2, -canvas.height / 2)

    ctx.filter = [
      `brightness(${filters.brightness}%)`,
      `contrast(${filters.contrast}%)`,
      `saturate(${filters.saturation}%)`,
      `hue-rotate(${filters.hue}deg)`,
      `blur(${filters.blur}px)`,
      `sepia(${filters.sepia}%)`,
    ].join(' ')

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
    ctx.restore()

    // Draw text on top (no rotation applied to text)
    texts.forEach(t => {
      ctx.save()
      ctx.font = `${t.bold ? 'bold ' : ''}${t.size}px "${t.font}", sans-serif`
      ctx.fillStyle = t.color
      ctx.globalAlpha = t.opacity
      if (t.shadow) {
        ctx.shadowColor = 'rgba(0,0,0,0.7)'
        ctx.shadowBlur = 6
        ctx.shadowOffsetX = 2
        ctx.shadowOffsetY = 2
      }
      ctx.fillText(t.text, t.x, t.y)
      ctx.restore()
    })
  }, [filters, texts, rotation])

  useEffect(() => {
    render()
  }, [render])

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      imageRef.current = img
      const canvas = canvasRef.current
      // Cap canvas display size, keep aspect ratio
      const maxW = 1200
      const maxH = 1200
      let w = img.naturalWidth
      let h = img.naturalHeight
      if (w > maxW) { h = Math.round(h * maxW / w); w = maxW }
      if (h > maxH) { w = Math.round(w * maxH / h); h = maxH }
      canvas.width = w
      canvas.height = h
      setImage(img)
    }
    img.src = url
  }

  const handleExport = (preset, format) => {
    const canvas = canvasRef.current
    if (!canvas) return

    let exportCanvas = canvas
    if (preset.width && preset.height) {
      exportCanvas = document.createElement('canvas')
      exportCanvas.width = preset.width
      exportCanvas.height = preset.height
      const ctx = exportCanvas.getContext('2d')
      ctx.drawImage(canvas, 0, 0, preset.width, preset.height)
    }

    const mime = format === 'png' ? 'image/png' : format === 'webp' ? 'image/webp' : 'image/jpeg'
    const quality = format === 'png' ? undefined : 0.92
    const link = document.createElement('a')
    link.download = `editpro_export.${format}`
    link.href = exportCanvas.toDataURL(mime, quality)
    link.click()
  }

  const TABS = [
    { id: 'filters', icon: '🎨', label: 'Filters' },
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

        {activeTab === 'filters' && (
          <FilterPanel
            filters={filters}
            onChange={setFilters}
            rotation={rotation}
            onRotate={setRotation}
          />
        )}
        {activeTab === 'text' && (
          <TextPanel texts={texts} onChange={setTexts} canvasRef={canvasRef} />
        )}
        {activeTab === 'export' && (
          <ExportPanel hasImage={!!image} onExport={handleExport} />
        )}
      </div>

      <div className="canvas-area">
        <div className="canvas-checkerboard" />
        {!image ? (
          <label className="upload-zone">
            <input type="file" accept="image/*" onChange={handleFile} hidden />
            <div className="upload-icon">🖼️</div>
            <p>Drop an image or click to upload</p>
            <span>Supports JPG, PNG, WebP, GIF</span>
          </label>
        ) : (
          <div className="canvas-wrapper">
            <canvas ref={canvasRef} className="edit-canvas" />
            <div className="canvas-toolbar">
              <label className="change-btn" style={{ cursor: 'pointer' }}>
                <input type="file" accept="image/*" onChange={handleFile} hidden />
                📂 Change Photo
              </label>
              <button
                className="change-btn"
                onClick={() => { setImage(null); setFilters(DEFAULT_FILTERS); setTexts([]); setRotation(0) }}
              >
                ✕ Clear
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
