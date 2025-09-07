import { z } from 'zod'

// ===== ESQUEMAS BASE =====

export const EstadoOrdenCompraSchema = z.enum(['pendiente', 'enviada', 'cancelada'])
export const EstadoFacturaSchema = z.enum(['pendiente', 'enviada', 'pagada'])
export const MonedaSchema = z.enum(['USD', 'COP', 'CLP', 'EUR'])

// ===== ESQUEMAS DE ÓRDENES DE COMPRA =====

export const CrearOrdenCompraSchema = z.object({
  numero_orden: z.string()
    .max(50, 'El número de orden no puede exceder 50 caracteres')
    .default(''),
  
  nombre_proveedor: z.string()
    .min(1, 'El nombre del proveedor es requerido')
    .max(200, 'El nombre no puede exceder 200 caracteres'),
  
  email_proveedor: z.string()
    .email('Email inválido')
    .optional()
    .or(z.literal('')),
  
  telefono_proveedor: z.string()
    .max(20, 'El teléfono no puede exceder 20 caracteres')
    .optional()
    .or(z.literal('')),
  
  monto_total: z.number()
    .positive('El monto debe ser positivo')
    .max(999999999.99, 'El monto excede el límite permitido'),
  
  moneda: MonedaSchema.default('CLP'),
  
  estado: EstadoOrdenCompraSchema.default('pendiente'),
  
  fecha_orden: z.string()
    .refine((date) => !isNaN(Date.parse(date)), 'Fecha inválida'),
  
  fecha_entrega_esperada: z.string()
    .refine((date) => !isNaN(Date.parse(date)), 'Fecha inválida')
    .optional()
    .or(z.literal('')),
  
  notas: z.string()
    .max(1000, 'Las notas no pueden exceder 1000 caracteres')
    .optional()
    .or(z.literal(''))
})

export const ActualizarOrdenCompraSchema = CrearOrdenCompraSchema.partial()

// ===== ESQUEMAS DE FACTURAS =====

export const CrearFacturaSchema = z.object({
  numero_factura: z.string()
    .max(50, 'El número de factura no puede exceder 50 caracteres')
    .default(''),
  
  orden_compra_id: z.string()
    .uuid('ID de orden de compra inválido'),
  
  nombre_vendedor: z.string()
    .min(1, 'El nombre del vendedor es requerido')
    .max(200, 'El nombre no puede exceder 200 caracteres'),
  
  email_vendedor: z.string()
    .email('Email inválido')
    .optional()
    .or(z.literal('')),
  
  telefono_vendedor: z.string()
    .max(20, 'El teléfono no puede exceder 20 caracteres')
    .optional()
    .or(z.literal('')),
  
  monto_total: z.number()
    .positive('El monto debe ser positivo')
    .max(999999999.99, 'El monto excede el límite permitido'),
  
  moneda: MonedaSchema.default('CLP'),
  
  estado: EstadoFacturaSchema.default('pendiente'),
  
  fecha_factura: z.string()
    .refine((date) => !isNaN(Date.parse(date)), 'Fecha inválida'),
  
  fecha_vencimiento: z.string()
    .refine((date) => !isNaN(Date.parse(date)), 'Fecha inválida'),
  
  fecha_pago: z.string()
    .refine((date) => !isNaN(Date.parse(date)), 'Fecha inválida')
    .optional()
    .or(z.literal('')),
  
  notas: z.string()
    .max(1000, 'Las notas no pueden exceder 1000 caracteres')
    .optional()
    .or(z.literal(''))
}).refine(
  (data) => {
    if (data.fecha_vencimiento && data.fecha_factura) {
      return new Date(data.fecha_vencimiento) >= new Date(data.fecha_factura)
    }
    return true
  },
  {
    message: 'La fecha de vencimiento debe ser posterior o igual a la fecha de factura',
    path: ['fecha_vencimiento']
  }
)

export const ActualizarFacturaSchema = CrearFacturaSchema.partial()

// ===== TIPOS DERIVADOS =====

export type CrearOrdenCompraInput = z.infer<typeof CrearOrdenCompraSchema>
export type ActualizarOrdenCompraInput = z.infer<typeof ActualizarOrdenCompraSchema>
export type CrearFacturaInput = z.infer<typeof CrearFacturaSchema>
export type ActualizarFacturaInput = z.infer<typeof ActualizarFacturaSchema>

// ===== ESQUEMAS DE FILTROS =====

export const FiltroOrdenesSchema = z.object({
  estado: EstadoOrdenCompraSchema.optional(),
  proveedor: z.string().optional(),
  fecha_desde: z.string().optional(),
  fecha_hasta: z.string().optional(),
  limite: z.number().min(1).max(100).default(20),
  pagina: z.number().min(1).default(1)
})

export const FiltroFacturasSchema = z.object({
  estado: EstadoFacturaSchema.optional(),
  vendedor: z.string().optional(),
  fecha_desde: z.string().optional(),
  fecha_hasta: z.string().optional(),
  solo_vencidas: z.boolean().default(false),
  limite: z.number().min(1).max(100).default(20),
  pagina: z.number().min(1).default(1)
})

export type FiltroOrdenesInput = z.infer<typeof FiltroOrdenesSchema>
export type FiltroFacturasInput = z.infer<typeof FiltroFacturasSchema>