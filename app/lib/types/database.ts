export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      // Tabla de cotizaciones
      cotizaciones: {
        Row: {
          id: string
          numero_cotizacion: string
          nombre_cliente: string
          email_cliente: string | null
          telefono_cliente: string | null
          monto_total: number
          moneda: string
          estado: 'borrador' | 'enviada' | 'aceptada' | 'rechazada' | 'vencida'
          fecha_emision: string
          fecha_vencimiento: string | null
          url_pdf: string | null
          notas: string | null
          creado_en: string
          actualizado_en: string
        }
        Insert: {
          id?: string
          numero_cotizacion: string
          nombre_cliente: string
          email_cliente?: string | null
          telefono_cliente?: string | null
          monto_total: number
          moneda?: string
          estado?: 'borrador' | 'enviada' | 'aceptada' | 'rechazada' | 'vencida'
          fecha_emision: string
          fecha_vencimiento?: string | null
          url_pdf?: string | null
          notas?: string | null
          creado_en?: string
          actualizado_en?: string
        }
        Update: {
          id?: string
          numero_cotizacion?: string
          nombre_cliente?: string
          email_cliente?: string | null
          telefono_cliente?: string | null
          monto_total?: number
          moneda?: string
          estado?: 'borrador' | 'enviada' | 'aceptada' | 'rechazada' | 'vencida'
          fecha_emision?: string
          fecha_vencimiento?: string | null
          url_pdf?: string | null
          notas?: string | null
          creado_en?: string
          actualizado_en?: string
        }
      }
      // Tabla de órdenes de compra
      ordenes_compra: {
        Row: {
          id: string
          numero_orden: string
          cotizacion_id: string
          nombre_proveedor: string
          email_proveedor: string | null
          telefono_proveedor: string | null
          monto_total: number
          moneda: string
          estado: 'pendiente' | 'aprobada' | 'enviada' | 'entregada' | 'cancelada'
          fecha_orden: string
          fecha_entrega_esperada: string | null
          url_pdf: string | null
          notas: string | null
          creado_en: string
          actualizado_en: string
        }
        Insert: {
          id?: string
          numero_orden: string
          cotizacion_id: string
          nombre_proveedor: string
          email_proveedor?: string | null
          telefono_proveedor?: string | null
          monto_total: number
          moneda?: string
          estado?: 'pendiente' | 'aprobada' | 'enviada' | 'entregada' | 'cancelada'
          fecha_orden: string
          fecha_entrega_esperada?: string | null
          url_pdf?: string | null
          notas?: string | null
          creado_en?: string
          actualizado_en?: string
        }
        Update: {
          id?: string
          numero_orden?: string
          cotizacion_id?: string
          nombre_proveedor?: string
          email_proveedor?: string | null
          telefono_proveedor?: string | null
          monto_total?: number
          moneda?: string
          estado?: 'pendiente' | 'aprobada' | 'enviada' | 'entregada' | 'cancelada'
          fecha_orden?: string
          fecha_entrega_esperada?: string | null
          url_pdf?: string | null
          notas?: string | null
          creado_en?: string
          actualizado_en?: string
        }
      }
      // Tabla de facturas
      facturas: {
        Row: {
          id: string
          numero_factura: string
          orden_compra_id: string
          nombre_vendedor: string
          email_vendedor: string | null
          telefono_vendedor: string | null
          monto_total: number
          moneda: string
          estado: 'pendiente' | 'pagada' | 'vencida' | 'cancelada'
          fecha_factura: string
          fecha_vencimiento: string
          fecha_pago: string | null
          url_pdf: string | null
          notas: string | null
          creado_en: string
          actualizado_en: string
        }
        Insert: {
          id?: string
          numero_factura: string
          orden_compra_id: string
          nombre_vendedor: string
          email_vendedor?: string | null
          telefono_vendedor?: string | null
          monto_total: number
          moneda?: string
          estado?: 'pendiente' | 'pagada' | 'vencida' | 'cancelada'
          fecha_factura: string
          fecha_vencimiento: string
          fecha_pago?: string | null
          url_pdf?: string | null
          notas?: string | null
          creado_en?: string
          actualizado_en?: string
        }
        Update: {
          id?: string
          numero_factura?: string
          orden_compra_id?: string
          nombre_vendedor?: string
          email_vendedor?: string | null
          telefono_vendedor?: string | null
          monto_total?: number
          moneda?: string
          estado?: 'pendiente' | 'pagada' | 'vencida' | 'cancelada'
          fecha_factura?: string
          fecha_vencimiento?: string
          fecha_pago?: string | null
          url_pdf?: string | null
          notas?: string | null
          creado_en?: string
          actualizado_en?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}