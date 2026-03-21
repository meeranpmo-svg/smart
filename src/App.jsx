import { useState } from 'react'
import PhotoEditor from './components/PhotoEditor'
import VideoEditor from './components/VideoEditor'

export default function App() {
  const [mode, setMode] = useState('photo')

  return (
    <div className="app">
      <header className="header">
        <div className="logo">
          <div className="logo-icon">✦</div>
          <div className="logo-text">Edit<span>Pro</span></div>
        </div>

        <div className="mode-tabs">
          <button
            className={`mode-tab ${mode === 'photo' ? 'active' : ''}`}
            onClick={() => setMode('photo')}
          >
            🖼 Photo
          </button>
          <button
            className={`mode-tab ${mode === 'video' ? 'active' : ''}`}
            onClick={() => setMode('video')}
          >
            🎬 Video
          </button>
        </div>

        <div className="header-right">
          <span className="badge">Instagram</span>
          <span className="badge">Facebook</span>
          <span className="badge">YouTube</span>
        </div>
      </header>

      <div className="editor-layout">
        {mode === 'photo' ? <PhotoEditor /> : <VideoEditor />}
      </div>
    </div>
  )
}
