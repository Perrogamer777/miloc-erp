import { z } from 'zod'

// ===== ESQUEMAS BASE =====

export const EstadoOrdenCompraSchema = z.enum(['pendiente', 'enviada', 'cancelada'])
export const EstadoFacturaSchema = z.enum(['pendiente', 'pagada', 'anulada'])
export const MonedaSchema = z.enum(['USD', 'COP', 'CLP', 'EUR'])

// ===== ESQUEMAS DE ÓRDENES DE COMPRA =====

export const CrearOrdenCompraSchema = z.object({
  numero_orden: z.string()
    .max(50, 'El número de orden no puede exceder 50 caracteres')
    .default(''),
  
  nombre_proveedor: z.string()
    .min(1, 'El nombre del proveedor es requerido')
    .max(200, 'El nombre no puede exceder 200 caracteres'),
  
  monto_total: z.number()
    .positive('El monto debe ser positivo')
    .max(999999999.99, 'El monto excede el límite permitido'),
  
  estado: z.string()
    .min(1, 'El estado es requerido')
    .default('pendiente'),
  
  fecha_orden: z.string()
    .refine((date) => !isNaN(Date.parse(date)), 'Fecha inválida')
    .default(() => new Date().toISOString().split('T')[0]),
  
  fecha_entrega_esperada: z.string()
    .refine((date) => !isNaN(Date.parse(date)), 'Fecha inválida')
    .optional()
    .or(z.literal('')),
  
  url_pdf: z.string()
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
    .min(1, 'El número de factura es requerido')
    .max(50, 'El número de factura no puede exceder 50 caracteres'),
  
  orden_compra_id: z.string()
    .min(1, 'Debe seleccionar una orden de compra'),
  
  nombre_vendedor: z.string()
    .min(1, 'El nombre del vendedor es requerido')
    .max(200, 'El nombre no puede exceder 200 caracteres'),
  
  monto_total: z.number()
    .positive('El monto total debe ser positivo')
    .max(999999999.99, 'El monto excede el límite permitido'),
  
  estado: z.string()
    .min(1, 'El estado es requerido')
    .default('pendiente'),
  
  fecha_factura: z.string()
    .refine((date) => !isNaN(Date.parse(date)), 'Fecha inválida')
    .default(() => new Date().toISOString().split('T')[0]),
  
  fecha_pago: z.string()
    .refine((date) => !isNaN(Date.parse(date)), 'Fecha inválida')
    .optional()
    .or(z.literal('')),
  
  url_pdf: z.string()
    .optional()
    .or(z.literal('')),
  
  notas: z.string()
    .max(1000, 'Las notas no pueden exceder 1000 caracteres')
    .optional()
    .or(z.literal(''))
})

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