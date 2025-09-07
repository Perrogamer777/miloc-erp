import { OrdenesCompraRepository } from '../repositories/ordenes-compra'
import { 
  CrearOrdenCompraSchema, 
  ActualizarOrdenCompraSchema,
  type CrearOrdenCompraInput,
  type ActualizarOrdenCompraInput
} from '../lib/validations/schemas'
import { Database } from '../lib/types/database'

type OrdenCompra = Database['public']['Tables']['ordenes_compra']['Row']

/**
 * Servicio de Órdenes de Compra
 * Contiene la lógica de negocio y validaciones
 */
export class OrdenesCompraService {
  
  /**
   * Crear nueva orden de compra con validaciones
   */
  static async crear(datos: CrearOrdenCompraInput): Promise<{
    exito: boolean
    datos?: OrdenCompra
    errores?: string[]
  }> {
    try {
      // 1. Generar número de orden automático si no se proporciona
      if (!datos.numero_orden || datos.numero_orden.trim() === '') {
        datos.numero_orden = await this.generarNumeroOrden()
      }
      
      // 2. Validar datos de entrada
      const datosValidados = CrearOrdenCompraSchema.parse(datos)
      
      // 3. Validar reglas de negocio
      const erroresNegocio = await this.validarReglasNegocio(datosValidados)
      if (erroresNegocio.length > 0) {
        return {
          exito: false,
          errores: erroresNegocio
        }
      }
      
      // 4. Crear en la base de datos
      const ordenCreada = await OrdenesCompraRepository.crear(datosValidados)
      
      return {
        exito: true,
        datos: ordenCreada
      }
      
    } catch (error) {
      console.error('Error al crear orden de compra:', error)
      
      if (error instanceof Error) {
        return {
          exito: false,
          errores: [error.message]
        }
      }
      
      return {
        exito: false,
        errores: ['Error desconocido al crear orden de compra']
      }
    }
  }
  
  /**
   * Actualizar orden de compra existente
   */
  static async actualizar(id: string, cambios: ActualizarOrdenCompraInput): Promise<{
    exito: boolean
    datos?: OrdenCompra
    errores?: string[]
  }> {
    try {
      // 1. Validar que la orden existe
      const ordenExistente = await OrdenesCompraRepository.obtenerTodas()
      const orden = ordenExistente.find(o => o.id === id)
      
      if (!orden) {
        return {
          exito: false,
          errores: ['Orden de compra no encontrada']
        }
      }
      
      // 2. Validar datos de entrada
      const cambiosValidados = ActualizarOrdenCompraSchema.parse(cambios)
      
      // 3. Validar transiciones de estado
      if (cambiosValidados.estado && cambiosValidados.estado !== orden.estado) {
        const transicionValida = this.validarTransicionEstado(orden.estado, cambiosValidados.estado)
        if (!transicionValida) {
          return {
            exito: false,
            errores: [`No se puede cambiar el estado de '${orden.estado}' a '${cambiosValidados.estado}'`]
          }
        }
      }
      
      // 4. Actualizar en la base de datos
      const ordenActualizada = await OrdenesCompraRepository.actualizar(id, cambiosValidados)
      
      return {
        exito: true,
        datos: ordenActualizada
      }
      
    } catch (error) {
      console.error('Error al actualizar orden de compra:', error)
      
      return {
        exito: false,
        errores: [error instanceof Error ? error.message : 'Error desconocido']
      }
    }
  }
  
  /**
   * Obtener todas las órdenes con filtros
   */
  static async obtenerTodas(): Promise<OrdenCompra[]> {
    return OrdenesCompraRepository.obtenerTodas()
  }
  
  /**
   * Eliminar orden de compra (solo si está en estado pendiente)
   */
  static async eliminar(id: string): Promise<{
    exito: boolean
    errores?: string[]
  }> {
    try {
      // Validar que existe y se puede eliminar
      const ordenes = await OrdenesCompraRepository.obtenerTodas()
      const orden = ordenes.find(o => o.id === id)
      
      if (!orden) {
        return {
          exito: false,
          errores: ['Orden de compra no encontrada']
        }
      }
      
      if (orden.estado !== 'pendiente') {
        return {
          exito: false,
          errores: ['Solo se pueden eliminar órdenes en estado pendiente']
        }
      }
      
      await OrdenesCompraRepository.eliminar(id)
      
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
  
  private static async validarReglasNegocio(datos: CrearOrdenCompraInput): Promise<string[]> {
    const errores: string[] = []
    
    // Validar que el número de orden sea único
    if (datos.numero_orden) {
      const ordenesExistentes = await OrdenesCompraRepository.obtenerTodas()
      const numeroExiste = ordenesExistentes.some(o => o.numero_orden === datos.numero_orden)
      if (numeroExiste) {
        errores.push('Ya existe una orden con este número')
      }
    }
    
    // Validar fechas
    if (datos.fecha_entrega_esperada && datos.fecha_orden) {
      const fechaOrden = new Date(datos.fecha_orden)
      const fechaEntrega = new Date(datos.fecha_entrega_esperada)
      
      if (fechaEntrega <= fechaOrden) {
        errores.push('La fecha de entrega esperada debe ser posterior a la fecha de orden')
      }
    }
    
    // Validar monto mínimo
    if (datos.monto_total < 0.01) {
      errores.push('El monto total debe ser mayor a 0')
    }
    
    return errores
  }
  
  private static validarTransicionEstado(
    estadoActual: string, 
    nuevoEstado: string
  ): boolean {
    const transicionesValidas: Record<string, string[]> = {
      'pendiente': ['enviada', 'cancelada'],
      'enviada': [], // Estado final
      'cancelada': [] // Estado final
    }
    
    return transicionesValidas[estadoActual]?.includes(nuevoEstado) ?? false
  }
  
  private static async generarNumeroOrden(): Promise<string> {
    const año = new Date().getFullYear()
    const mes = String(new Date().getMonth() + 1).padStart(2, '0')
    
    // Buscar el último número de orden del mes
    const ordenes = await OrdenesCompraRepository.obtenerTodas()
    const ordenesDelMes = ordenes.filter(o => 
      o.numero_orden.startsWith(`OC-${año}${mes}`)
    )
    
    const siguienteNumero = ordenesDelMes.length + 1
    
    return `OC-${año}${mes}-${String(siguienteNumero).padStart(3, '0')}`
  }
}