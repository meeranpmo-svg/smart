import { useState } from 'react'

const COLORS = ['#ffffff', '#000000', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7']
const FONTS = ['Inter', 'Arial', 'Georgia', 'Courier New', 'Impact', 'Trebuchet MS', 'Verdana']

const defaultText = {
  text: '',
  size: 48,
  font: 'Inter',
  color: '#ffffff',
  bold: true,
  shadow: true,
  opacity: 1,
  x: 100,
  y: 100,
}

export default function TextPanel({ texts, onChange, canvasRef }) {
  const [form, setForm] = useState(defaultText)

  const update = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const addText = () => {
    if (!form.text.trim()) return
    const canvas = canvasRef?.current
    const cx = canvas ? Math.floor(canvas.width / 2) : 200
    const cy = canvas ? Math.floor(canvas.height / 2) : 200
    onChange([...texts, { ...form, x: cx, y: cy, id: Date.now() }])
    setForm({ ...defaultText })
  }

  const remove = (id) => onChange(texts.filter(t => t.id !== id))

  return (
    <div className="panel-body">
      <div className="tip">Text is placed at the center of the image. After adding, use the sliders to reposition.</div>

      <div className="text-input-group">
        <label>Text Content</label>
        <input
          className="text-input"
          placeholder="Enter your text..."
          value={form.text}
          onChange={e => update('text', e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addText()}
        />
      </div>

      <div className="row-2">
        <div className="text-input-group">
          <label>Font</label>
          <select className="text-input" value={form.font} onChange={e => update('font', e.target.value)}>
            {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
        <div className="text-input-group">
          <label>Size (px)</label>
          <input
            className="text-input"
            type="number"
            min={8}
            max={300}
            value={form.size}
            onChange={e => update('size', Number(e.target.value))}
          />
        </div>
      </div>

      <div className="text-input-group">
        <label>Color</label>
        <div className="color-row">
          {COLORS.map(c => (
            <div
              key={c}
              className={`color-swatch ${form.color === c ? 'active' : ''}`}
              style={{ background: c, border: c === '#ffffff' ? '2px solid #444' : undefined }}
              onClick={() => update('color', c)}
            />
          ))}
          <label className="color-custom" title="Custom color">
            <input type="color" value={form.color} onChange={e => update('color', e.target.value)} />
          </label>
        </div>
      </div>

      <div className="slider-group">
        <div className="slider-label">
          <span>Opacity</span>
          <span>{Math.round(form.opacity * 100)}%</span>
        </div>
        <input
          type="range" min={0.1} max={1} step={0.05}
          value={form.opacity}
          onChange={e => update('opacity', Number(e.target.value))}
        />
      </div>

      <div className="row-2" style={{ marginBottom: 12 }}>
        <div className="toggle-row">
          <span className="toggle-label">Bold</span>
          <label className="toggle">
            <input type="checkbox" checked={form.bold} onChange={e => update('bold', e.target.checked)} />
            <span className="toggle-slider" />
          </label>
        </div>
        <div className="toggle-row">
          <span className="toggle-label">Shadow</span>
          <label className="toggle">
            <input type="checkbox" checked={form.shadow} onChange={e => update('shadow', e.target.checked)} />
            <span className="toggle-slider" />
          </label>
        </div>
      </div>

      <button className="btn btn-primary btn-full" onClick={addText} disabled={!form.text.trim()}>
        + Add Text
      </button>

      {texts.length > 0 && (
        <>
          <div className="divider" />
          <div className="section-title">Added Texts ({texts.length})</div>
          <div className="texts-list">
            {texts.map(t => (
              <div key={t.id} className="text-item">
                <span className="text-item-label" style={{ fontFamily: t.font, color: t.color }}>
                  {t.text}
                </span>
                <button className="text-item-del" onClick={() => remove(t.id)}>✕</button>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 12 }}>
            <button className="btn btn-danger btn-full" onClick={() => onChange([])}>Clear All</button>
          </div>
        </>
      )}

      {texts.length === 0 && (
        <div className="empty-state" style={{ marginTop: 16 }}>
          <div className="es-icon">T</div>
          <p>No text overlays added yet</p>
        </div>
      )}
    </div>
  )
}
