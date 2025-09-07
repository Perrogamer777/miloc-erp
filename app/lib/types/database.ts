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
      empresas: {
        Row: {
          id: string
          rut: string
          nombre: string
          contacto_principal: string | null
          email: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          rut: string
          nombre: string
          contacto_principal?: string | null
          email?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          rut?: string
          nombre?: string
          contacto_principal?: string | null
          email?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      cotizaciones: {
        Row: {
          id: string
          numero_cotizacion: string
          empresa_id: string | null
          descripcion: string
          monto_total: number
          fecha_envio: string
          estado: 'enviada' | 'aceptada' | 'rechazada'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          numero_cotizacion: string
          empresa_id?: string | null
          descripcion: string
          monto_total: number
          fecha_envio?: string
          estado?: 'enviada' | 'aceptada' | 'rechazada'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          numero_cotizacion?: string
          empresa_id?: string | null
          descripcion?: string
          monto_total?: number
          fecha_envio?: string
          estado?: 'enviada' | 'aceptada' | 'rechazada'
          created_at?: string
          updated_at?: string
        }
      }
      ordenes_compra: {
        Row: {
          id: string
          numero_orden: string
          cotizacion_id: string | null
          empresa_rut: string
          empresa_nombre: string
          fecha_recepcion: string
          fecha_entrega: string | null
          descripcion_trabajo: string
          monto_neto: number
          iva: number
          monto_total: number
          estado: 'recibida' | 'en_proceso' | 'completada' | 'facturada'
          archivo_pdf_url: string | null
          observaciones: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          numero_orden: string
          cotizacion_id?: string | null
          empresa_rut: string
          empresa_nombre: string
          fecha_recepcion?: string
          fecha_entrega?: string | null
          descripcion_trabajo: string
          monto_neto: number
          iva?: number
          monto_total: number
          estado?: 'recibida' | 'en_proceso' | 'completada' | 'facturada'
          archivo_pdf_url?: string | null
          observaciones?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          numero_orden?: string
          cotizacion_id?: string | null
          empresa_rut?: string
          empresa_nombre?: string
          fecha_recepcion?: string
          fecha_entrega?: string | null
          descripcion_trabajo?: string
          monto_neto?: number
          iva?: number
          monto_total?: number
          estado?: 'recibida' | 'en_proceso' | 'completada' | 'facturada'
          archivo_pdf_url?: string | null
          observaciones?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      facturas: {
        Row: {
          id: string
          numero_factura: string
          orden_compra_id: string | null
          tipo_documento: 'factura_electronica' | 'boleta' | 'nota_credito' | 'nota_debito'
          timbre_electronico: string | null
          folio_sii: string | null
          empresa_rut: string
          empresa_nombre: string
          fecha_emision: string
          fecha_pago: string | null
          descripcion_trabajo: string
          monto_neto: number
          iva: number
          monto_total: number
          estado_pago: 'pendiente' | 'pagada' | 'anulada'
          archivo_pdf_url: string | null
          observaciones: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          numero_factura: string
          orden_compra_id?: string | null
          tipo_documento?: 'factura_electronica' | 'boleta' | 'nota_credito' | 'nota_debito'
          timbre_electronico?: string | null
          folio_sii?: string | null
          empresa_rut: string
          empresa_nombre: string
          fecha_emision?: string
          fecha_pago?: string | null
          descripcion_trabajo: string
          monto_neto: number
          iva?: number
          monto_total: number
          estado_pago?: 'pendiente' | 'pagada' | 'anulada'
          archivo_pdf_url?: string | null
          observaciones?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          numero_factura?: string
          orden_compra_id?: string | null
          tipo_documento?: 'factura_electronica' | 'boleta' | 'nota_credito' | 'nota_debito'
          timbre_electronico?: string | null
          folio_sii?: string | null
          empresa_rut?: string
          empresa_nombre?: string
          fecha_emision?: string
          fecha_pago?: string | null
          descripcion_trabajo?: string
          monto_neto?: number
          iva?: number
          monto_total?: number
          estado_pago?: 'pendiente' | 'pagada' | 'anulada'
          archivo_pdf_url?: string | null
          observaciones?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      dashboard_metricas: {
        Row: {
          facturas_pendientes: number
          monto_pendiente_pago: number
          cotizaciones_enviadas: number
          ordenes_compra_recibidas: number
        }
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}