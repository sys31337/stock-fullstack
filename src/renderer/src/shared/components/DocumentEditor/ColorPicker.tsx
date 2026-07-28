import React from 'react'

interface ColorPickerProps {
  colors: string[]
  onSelect: (color: string) => void
  title?: string
}

const ColorPicker: React.FC<ColorPickerProps> = ({ colors, onSelect, title }) => (
  <div
    className="hidden group-hover:flex absolute top-full left-0 z-50 bg-white border border-gray-200 shadow-lg rounded p-1.5 gap-1 flex-wrap max-w-[140px]"
    role="dialog"
    aria-label={title}
  >
    {colors.map(c => (
      <button
        key={c}
        type="button"
        className="w-5 h-5 rounded border border-gray-300 cursor-pointer hover:scale-110 transition-transform"
        style={{ backgroundColor: c === 'transparent' ? 'white' : c }}
        onClick={() => onSelect(c)}
        title={c}
      />
    ))}
  </div>
)

export default ColorPicker
