import { useState, useEffect, useCallback, useRef } from 'react'
import { Moon, Sun, Monitor } from 'lucide-react'
import { useTheme } from '@web/shared/contexts/ThemeContext'

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { ipcRenderer } = require('electron')

const CustomTitleBar = () => {
  const [isMaximized, setIsMaximized] = useState(true)
  const dragRef = useRef(false)
  const { theme, setTheme, resolvedTheme } = useTheme()

  useEffect(() => {
    ipcRenderer.invoke('isMaximized').then((val: boolean) => setIsMaximized(val))

    const handleMaximizeChange = (_: unknown, maximized: boolean) => {
      setIsMaximized(maximized)
    }
    ipcRenderer.on('maximize-change', handleMaximizeChange)
    return () => {
      ipcRenderer.removeListener('maximize-change', handleMaximizeChange)
    }
  }, [])

  const handleClose = useCallback(() => ipcRenderer.send('close'), [])
  const handleMinimize = useCallback(() => ipcRenderer.send('minimize'), [])
  const handleMaximize = useCallback(() => ipcRenderer.send('maximize'), [])

  const handleDragMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return
    dragRef.current = true
    ipcRenderer.send('drag-start')

    const handleMouseMove = () => {
      if (dragRef.current) ipcRenderer.send('drag-move')
    }
    const handleMouseUp = () => {
      dragRef.current = false
      ipcRenderer.send('drag-end')
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [])

  const cycleTheme = () => {
    const themes: Array<'light' | 'dark' | 'system'> = ['light', 'dark', 'system']
    const currentIndex = themes.indexOf(theme)
    const nextIndex = (currentIndex + 1) % themes.length
    setTheme(themes[nextIndex])
  }

  const getThemeIcon = () => {
    if (theme === 'system') return <Monitor className="h-3.5 w-3.5" />
    return resolvedTheme === 'dark' ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />
  }

  return (
    <div className="custom-titlebar">
      <div className="custom-titlebar-left">
        <div className="custom-titlebar-buttons">
          <button
            className="custom-titlebar-btn custom-titlebar-btn-close"
            onClick={handleClose}
            aria-label="Close"
          />
          <button
            className="custom-titlebar-btn custom-titlebar-btn-minimize"
            onClick={handleMinimize}
            aria-label="Minimize"
          />
          <button
            className="custom-titlebar-btn custom-titlebar-btn-maximize"
            onClick={handleMaximize}
            aria-label={isMaximized ? 'Restore' : 'Maximize'}
          />
        </div>
        <span className="custom-titlebar-title">SoluStock</span>
      </div>
      <div
        className="custom-titlebar-drag"
        onMouseDown={handleDragMouseDown}
        onDoubleClick={handleMaximize}
      />
      <div className="flex items-center gap-2 pr-3">
        <button
          onClick={cycleTheme}
          className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          aria-label={`Theme: ${theme}. Click to cycle.`}
          title={`Theme: ${theme}`}
        >
          {getThemeIcon()}
        </button>
      </div>
    </div>
  )
}

export default CustomTitleBar
