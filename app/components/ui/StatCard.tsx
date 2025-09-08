import { ReactNode } from 'react'

interface StatCardProps {
  title: string
  value: string | number
  change?: {
    value: string
    positive: boolean
  }
  icon?: ReactNode
  color?: 'blue' | 'green' | 'purple' | 'orange' | 'red'
}

export default function StatCard({ title, value, change, icon, color = 'blue' }: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200',
    red: 'bg-red-50 text-red-600 border-red-200'
  }
  
  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
          {icon}
        </div>
        {change && (
          <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
            change.positive 
              ? 'bg-green-100 text-green-700' 
              : 'bg-red-100 text-red-700'
          }`}>
            <svg 
              className={`w-3 h-3 ${change.positive ? 'rotate-0' : 'rotate-180'}`} 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
            >
              <polyline points="7 14l5-5 5 5"/>
            </svg>
            <span>{change.value}</span>
          </div>
        )}
      </div>
      
      <div>
        <h3 className="text-2xl font-bold text-black mb-1">
          {value}
        </h3>
        <p className="text-sm text-black font-semibold">
          {title}
        </p>
      </div>
    </div>
  )
}