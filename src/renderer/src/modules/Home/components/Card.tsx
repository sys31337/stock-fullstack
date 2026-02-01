import React from 'react'
import { ReactElement } from 'react'

interface CardProps {
  label: string;
  keyBind: string;
  icon: ReactElement;
  href: string;
  bg: string;
}

const Card: React.FC<CardProps> = ({
  label, keyBind, icon, href, bg,
}) => (
  <a
    href={href}
    className={`block w-full border rounded-3xl relative mx-5 p-5 ${bg || 'bg-gray-400'}`}
  >
    <div
      className="flex items-center justify-center text-sm absolute bg-gray-800 -top-2 -right-2 p-5 rounded-2xl h-8 w-8 text-white"
    >
      {keyBind}
    </div>
    <div className="flex items-center gap-4">
      <div
        className="min-w-20 min-h-20 flex items-center justify-center text-white rounded-2xl bg-white"
      >
        {icon}
      </div>
      <h2 className="text-xl font-bold">{label}</h2>
    </div>
  </a>
)

export default Card
