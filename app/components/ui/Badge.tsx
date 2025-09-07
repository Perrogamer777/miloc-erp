import { HTMLAttributes, forwardRef } from 'react'
import { cn } from '../../lib/utils/cn'

interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline'
  size?: 'sm' | 'md'
}

const Badge = forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'default', size = 'md', ...props }, ref) => {
    
    const variants = {
      default: 'bg-gray-100 text-gray-800',
      success: 'bg-green-100 text-green-800',
      warning: 'bg-yellow-100 text-yellow-800',
      danger: 'bg-red-100 text-red-800',
      info: 'bg-blue-100 text-blue-800',
      outline: 'border border-gray-300 text-gray-700'
    }
    
    const sizes = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-3 py-1 text-sm'
    }
    
    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center rounded-full font-medium',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    )
  }
)

Badge.displayName = 'Badge'

// Helper function para obtener el variant correcto según el estado
export const getEstadoBadgeProps = (estado: string): { variant: BadgeProps['variant']; children: string } => {
  const estadosMap: Record<string, { variant: BadgeProps['variant']; children: string }> = {
    // Estados de órdenes de compra
    'pendiente': { variant: 'warning', children: 'Pendiente' },
    'enviada': { variant: 'info', children: 'Enviada' },
    'cancelada': { variant: 'danger', children: 'Cancelada' },
    
    // Estados de facturas
    'pagada': { variant: 'success', children: 'Pagada' },
    
    // Default
    'default': { variant: 'default', children: estado }
  }
  
  return estadosMap[estado] || estadosMap['default']
}

export default Badge