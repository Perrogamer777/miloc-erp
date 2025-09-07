import { FacturasRepository } from '../repositories/facturas'
import { OrdenesCompraRepository } from '../repositories/ordenes-compra'
import { 
  CrearFacturaSchema, 
  ActualizarFacturaSchema,
  type CrearFacturaInput,
  type ActualizarFacturaInput
} from '../lib/validations/schemas'
import { Database } from '../lib/types/database'

type Factura = Database['public']['Tables']['facturas']['Row']

/**
 * Servicio de Facturas
 * Contiene la lógica de negocio y validaciones
 */
export class FacturasService {
  
  /**
   * Crear nueva factura con validaciones
   */
  static async crear(datos: CrearFacturaInput): Promise<{
    exito: boolean
    datos?: Factura
    errores?: string[]
  }> {
    try {
      // 1. Generar número de factura automático si no se proporciona
      if (!datos.numero_factura || datos.numero_factura.trim() === '') {
        datos.numero_factura = await this.generarNumeroFactura()
      }
      
      // 2. Validar datos de entrada
      const datosValidados = CrearFacturaSchema.parse(datos)
      
      // 3. Validar que la orden de compra existe y está entregada
      const erroresNegocio = await this.validarReglasNegocio(datosValidados)
      if (erroresNegocio.length > 0) {
        return {
          exito: false,
          errores: erroresNegocio
        }
      }
      
      // 4. Crear en la base de datos
      const facturaCreada = await FacturasRepository.crear(datosValidados)
      
      return {
        exito: true,
        datos: facturaCreada
      }
      
    } catch (error) {
      console.error('Error al crear factura:', error)
      
      if (error instanceof Error) {
        return {
          exito: false,
          errores: [error.message]
        }
      }
      
      return {
        exito: false,
        errores: ['Error desconocido al crear factura']
      }
    }
  }
  
  /**
   * Actualizar factura existente
   */
  static async actualizar(id: string, cambios: ActualizarFacturaInput): Promise<{
    exito: boolean
    datos?: Factura
    errores?: string[]
  }> {
    try {
      // 1. Validar que la factura existe
      const facturasExistentes = await FacturasRepository.obtenerTodas()
      const factura = facturasExistentes.find(f => f.id === id)
      
      if (!factura) {
        return {
          exito: false,
          errores: ['Factura no encontrada']
        }
      }
      
      // 2. Validar datos de entrada
      const cambiosValidados = ActualizarFacturaSchema.parse(cambios)
      
      // 3. Validar transiciones de estado
      if (cambiosValidados.estado && cambiosValidados.estado !== factura.estado) {
        const transicionValida = this.validarTransicionEstado(factura.estado, cambiosValidados.estado)
        if (!transicionValida) {
          return {
            exito: false,
            errores: [`No se puede cambiar el estado de '${factura.estado}' a '${cambiosValidados.estado}'`]
          }
        }
      }
      
      // 4. Si se marca como pagada, agregar fecha de pago automáticamente
      if (cambiosValidados.estado === 'pagada' && !cambiosValidados.fecha_pago) {
        cambiosValidados.fecha_pago = new Date().toISOString().split('T')[0]
      }
      
      // 5. Actualizar en la base de datos
      const facturaActualizada = await FacturasRepository.actualizar(id, cambiosValidados)
      
      return {
        exito: true,
        datos: facturaActualizada
      }
      
    } catch (error) {
      console.error('Error al actualizar factura:', error)
      
      return {
        exito: false,
        errores: [error instanceof Error ? error.message : 'Error desconocido']
      }
    }
  }
  
  /**
   * Marcar factura como pagada
   */
  static async marcarComoPagada(id: string, fechaPago?: string): Promise<{
    exito: boolean
    datos?: Factura
    errores?: string[]
  }> {
    return this.actualizar(id, {
      estado: 'pagada',
      fecha_pago: fechaPago || new Date().toISOString().split('T')[0]
    })
  }
  
  /**
   * Obtener facturas vencidas
   */
  static async obtenerVencidas(): Promise<Factura[]> {
    return FacturasRepository.obtenerVencidas()
  }
  
  /**
   * Obtener facturas por orden de compra
   */
  static async obtenerPorOrdenCompra(ordenCompraId: string): Promise<Factura[]> {
    return FacturasRepository.obtenerPorOrdenCompra(ordenCompraId)
  }
  
  /**
   * Obtener resumen de facturas pendientes
   */
  static async obtenerResumenPendientes(): Promise<{
    total_facturas: number
    monto_total: number
    facturas_vencidas: number
    monto_vencido: number
  }> {
    const facturasPendientes = await FacturasRepository.obtenerPorEstado('pendiente')
    const facturasVencidas = await FacturasRepository.obtenerVencidas()
    
    const montoTotal = facturasPendientes.reduce((sum, f) => sum + Number(f.monto_total), 0)
    const montoVencido = facturasVencidas.reduce((sum, f) => sum + Number(f.monto_total), 0)
    
    return {
      total_facturas: facturasPendientes.length,
      monto_total: montoTotal,
      facturas_vencidas: facturasVencidas.length,
      monto_vencido: montoVencido
    }
  }
  
  /**
   * Eliminar factura (solo si está pendiente)
   */
  static async eliminar(id: string): Promise<{
    exito: boolean
    errores?: string[]
  }> {
    try {
      const facturas = await FacturasRepository.obtenerTodas()
      const factura = facturas.find(f => f.id === id)
      
      if (!factura) {
        return {
          exito: false,
          errores: ['Factura no encontrada']
        }
      }
      
      if (factura.estado === 'pagada') {
        return {
          exito: false,
          errores: ['No se pueden eliminar facturas pagadas']
        }
      }
      
      await FacturasRepository.eliminar(id)
      
      return {
        exito: true
      }
      
    } catch (error) {
      return {
        exito: false,
        errores: [error instanceof Error ? error.message : 'Error al eliminar']
      }
    }
  }
  
  // ===== MÉTODOS PRIVADOS DE VALIDACIÓN =====
  
  private static async validarReglasNegocio(datos: CrearFacturaInput): Promise<string[]> {
    const errores: string[] = []
    
    // 1. Validar que el número de factura sea único
    if (datos.numero_factura) {
      const facturasExistentes = await FacturasRepository.obtenerTodas()
      const numeroExiste = facturasExistentes.some(f => f.numero_factura === datos.numero_factura)
      if (numeroExiste) {
        errores.push('Ya existe una factura con este número')
      }
    }
    
    // 2. Validar que la orden de compra existe
    const ordenes = await OrdenesCompraRepository.obtenerTodas()
    const ordenCompra = ordenes.find(o => o.id === datos.orden_compra_id)
    
    if (!ordenCompra) {
      errores.push('La orden de compra especificada no existe')
    } else {
      // 3. Validar que la orden está en estado apropiado para facturación
      if (ordenCompra.estado !== 'enviada') {
        errores.push('Solo se pueden crear facturas para órdenes enviadas')
      }
    }
    
    // 4. Validar fechas
    const fechaFactura = new Date(datos.fecha_factura)
    const fechaVencimiento = new Date(datos.fecha_vencimiento)
    
    if (fechaVencimiento <= fechaFactura) {
      errores.push('La fecha de vencimiento debe ser posterior a la fecha de factura')
    }
    
    // 5. Validar monto
    if (datos.monto_total < 0.01) {
      errores.push('El monto total debe ser mayor a 0')
    }
    
    return errores
  }
  
  private static validarTransicionEstado(estadoActual: string, nuevoEstado: string): boolean {
    const transicionesValidas: Record<string, string[]> = {
      'pendiente': ['enviada', 'pagada'],
      'enviada': ['pagada'],
      'pagada': [] // Estado final
    }
    
    return transicionesValidas[estadoActual]?.includes(nuevoEstado) ?? false
  }
  
  private static async generarNumeroFactura(): Promise<string> {
    const año = new Date().getFullYear()
    const mes = String(new Date().getMonth() + 1).padStart(2, '0')
    
    // Buscar el último número de factura del mes
    const facturas = await FacturasRepository.obtenerTodas()
    const facturasDelMes = facturas.filter(f => 
      f.numero_factura.startsWith(`FAC-${año}${mes}`)
    )
    
    const siguienteNumero = facturasDelMes.length + 1
    
    return `FAC-${año}${mes}-${String(siguienteNumero).padStart(3, '0')}`
  }
}