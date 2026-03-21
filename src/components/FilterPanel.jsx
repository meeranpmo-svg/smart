const PRESETS = [
  { name: 'Normal', filters: { brightness: 100, contrast: 100, saturation: 100, hue: 0, blur: 0, sepia: 0 } },
  { name: 'Vivid', filters: { brightness: 105, contrast: 120, saturation: 140, hue: 0, blur: 0, sepia: 0 } },
  { name: 'Matte', filters: { brightness: 95, contrast: 85, saturation: 70, hue: 0, blur: 0, sepia: 10 } },
  { name: 'B&W', filters: { brightness: 100, contrast: 110, saturation: 0, hue: 0, blur: 0, sepia: 0 } },
  { name: 'Warm', filters: { brightness: 105, contrast: 100, saturation: 110, hue: 20, blur: 0, sepia: 20 } },
  { name: 'Cool', filters: { brightness: 100, contrast: 105, saturation: 90, hue: -20, blur: 0, sepia: 0 } },
  { name: 'Vintage', filters: { brightness: 95, contrast: 90, saturation: 80, hue: 10, blur: 0, sepia: 40 } },
  { name: 'Fade', filters: { brightness: 110, contrast: 80, saturation: 75, hue: 0, blur: 0, sepia: 5 } },
]

const SLIDERS = [
  { key: 'brightness', label: 'Brightness', min: 0, max: 200, unit: '%' },
  { key: 'contrast', label: 'Contrast', min: 0, max: 200, unit: '%' },
  { key: 'saturation', label: 'Saturation', min: 0, max: 200, unit: '%' },
  { key: 'hue', label: 'Hue Rotate', min: -180, max: 180, unit: '°' },
  { key: 'blur', label: 'Blur', min: 0, max: 20, unit: 'px' },
  { key: 'sepia', label: 'Sepia', min: 0, max: 100, unit: '%' },
]

export default function FilterPanel({ filters, onChange, rotation, onRotate }) {
  const activePreset = PRESETS.find(p =>
    Object.entries(p.filters).every(([k, v]) => filters[k] === v)
  )

  const applyPreset = (preset) => {
    onChange({ ...preset.filters })
  }

  const updateFilter = (key, value) => {
    onChange({ ...filters, [key]: Number(value) })
  }

  const reset = () => {
    onChange(PRESETS[0].filters)
    onRotate(0)
  }

  return (
    <div className="panel-body">
      <div className="section-title">Presets</div>
      <div className="filter-presets">
        {PRESETS.map(p => (
          <button
            key={p.name}
            className={`filter-preset ${activePreset?.name === p.name ? 'active' : ''}`}
            onClick={() => applyPreset(p)}
          >
            {p.name}
          </button>
        ))}
      </div>

      <div className="divider" />
      <div className="section-title">Adjustments</div>

      {SLIDERS.map(s => (
        <div className="slider-group" key={s.key}>
          <div className="slider-label">
            <span>{s.label}</span>
            <span>{filters[s.key]}{s.unit}</span>
          </div>
          <input
            type="range"
            min={s.min}
            max={s.max}
            value={filters[s.key]}
            onChange={e => updateFilter(s.key, e.target.value)}
          />
        </div>
      ))}

      <div className="divider" />
      <div className="section-title">Transform</div>

      <div className="slider-group">
        <div className="slider-label">
          <span>Rotation</span>
          <span>{rotation}°</span>
        </div>
        <input
          type="range"
          min={-180}
          max={180}
          value={rotation}
          onChange={e => onRotate(Number(e.target.value))}
        />
      </div>

      <div className="rotate-row" style={{ marginBottom: 16 }}>
        <button className="btn btn-secondary" onClick={() => onRotate(r => r - 90)}>↺ -90°</button>
        <button className="btn btn-secondary" onClick={() => onRotate(r => r + 90)}>↻ +90°</button>
        <button className="btn btn-secondary" onClick={() => onRotate(r => -r)}>⟳ Flip</button>
      </div>

      <button className="btn btn-secondary btn-full" onClick={reset}>Reset All</button>
    </div>
  )
}
