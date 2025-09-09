'use client'

import { useState, useEffect } from 'react'
import { FacturasService } from '../../services/facturas.service'
import { OrdenesCompraService } from '../../services/ordenes-compra.service'
import Button from '../ui/Button'
import Input from '../ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'

interface FacturaFormProps {
  onSuccess?: (factura: any) => void
  onCancel?: () => void
  archivoUrl?: string
  nombreArchivo?: string
}

interface OrdenCompra {
  id: string
  numero_orden: string
  nombre_proveedor: string
  monto_total: number
  estado: string
}

export default function FacturaForm({ onSuccess, onCancel, archivoUrl, nombreArchivo }: FacturaFormProps) {
  const [loading, setLoading] = useState(false)
  const [loadingOrdenes, setLoadingOrdenes] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [ordenesCompra, setOrdenesCompra] = useState<OrdenCompra[]>([])
  
  const [formData, setFormData] = useState({
    numero_factura: '',
    orden_compra_id: '',
    nombre_vendedor: '',
    monto_total: 0,
    estado: 'pendiente',
    fecha_factura: new Date().toISOString().split('T')[0],
    fecha_pago: '',
    url_pdf: archivoUrl || '',
    notas: archivoUrl ? `📄 Archivo adjunto: ${nombreArchivo || 'factura.pdf'}` : ''
  })

  // Cargar órdenes de compra disponibles
  useEffect(() => {
    cargarOrdenesCompra()
  }, [])

  const cargarOrdenesCompra = async () => {
    setLoadingOrdenes(true)
    try {
      // Importar el repositorio directamente para obtener las órdenes
      const { OrdenesCompraRepository } = await import('../../repositories/ordenes-compra')
      const ordenes = await OrdenesCompraRepository.obtenerTodas()
      
      // Todas las órdenes pueden ser facturadas
      setOrdenesCompra(ordenes)
    } catch (error) {
      console.error('Error cargando órdenes de compra:', error)
    } finally {
      setLoadingOrdenes(false)
    }
  }

  // Actualizar URL del archivo cuando cambie
  useEffect(() => {
    if (archivoUrl) {
      setFormData(prev => ({
        ...prev,
        url_pdf: archivoUrl,
        notas: `📄 Archivo adjunto: ${nombreArchivo || 'factura.pdf'}`
      }))
    }
  }, [archivoUrl, nombreArchivo])

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Limpiar error cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleOrdenChange = (ordenId: string) => {
    const ordenSeleccionada = ordenesCompra.find(orden => orden.id === ordenId)
    
    setFormData(prev => ({
      ...prev,
      orden_compra_id: ordenId,
      nombre_vendedor: ordenSeleccionada?.nombre_proveedor || ''
    }))
    
    // Limpiar error si existía
    if (errors.orden_compra_id) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors.orden_compra_id
        return newErrors
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})
    
    try {
      // Validaciones básicas
      if (!formData.orden_compra_id) {
        setErrors({ orden_compra_id: 'Debe seleccionar una orden de compra' })
        return
      }
      
      if (!formData.numero_factura.trim()) {
        setErrors({ numero_factura: 'El número de factura es requerido' })
        return
      }
      
      if (!formData.nombre_vendedor.trim()) {
        setErrors({ nombre_vendedor: 'El nombre del vendedor es requerido' })
        return
      }
      
      if (formData.monto_total <= 0) {
        setErrors({ monto_total: 'El monto total debe ser mayor a 0' })
        return
      }
      
      // Preparar datos para envío
      const datosFactura = {
        numero_factura: formData.numero_factura,
        orden_compra_id: formData.orden_compra_id,
        nombre_vendedor: formData.nombre_vendedor,
        monto_total: formData.monto_total,
        estado: formData.estado,
        fecha_factura: formData.fecha_factura,
        fecha_pago: formData.fecha_pago || '',
        url_pdf: formData.url_pdf || '',
        notas: formData.notas || ''
      }

      console.log('Enviando datos de factura:', datosFactura)
      console.log('Schema esperado: orden_compra_id, numero_factura, nombre_item, monto_neto, iva, monto_total')
      const resultado = await FacturasService.crear(datosFactura)
      console.log('Resultado del servicio:', resultado)
      
      if (resultado.exito) {
        onSuccess?.(resultado.datos)
        // Limpiar formulario
        setFormData({
          numero_factura: '',
          orden_compra_id: '',
          nombre_vendedor: '',
          monto_total: 0,
          estado: 'pendiente',
          fecha_factura: new Date().toISOString().split('T')[0],
          fecha_pago: '',
          url_pdf: '',
          notas: ''
        })
      } else {
        console.error('Error en el servicio:', resultado.errores)
        const erroresTexto = resultado.errores ? resultado.errores.join(', ') : 'Error desconocido'
        setErrors({ general: `Error al crear la factura: ${erroresTexto}` })
      }
    } catch (error) {
      console.error('Error inesperado:', error)
      setErrors({ general: `Error inesperado: ${error instanceof Error ? error.message : 'Error desconocido'}` })
    } finally {
      setLoading(false)
    }
  }
  
  return (
    <Card variant="outlined">
      <CardHeader>
        <CardTitle>Nueva Factura</CardTitle>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {errors.general && (
            <div className="rounded-md bg-red-50 border border-red-200 p-3">
              <p className="text-sm text-red-600">{errors.general}</p>
            </div>
          )}
          
          {/* Número de Factura */}
          <Input
            label="Número de Factura *"
            placeholder="Ej: 001-0000001"
            value={formData.numero_factura}
            onChange={(e) => handleInputChange('numero_factura', e.target.value)}
            error={errors.numero_factura}
            required
          />

          {/* Selector de Orden de Compra */}
          <div className="space-y-1">
            <label className="block text-sm font-bold text-black">
              Orden de Compra Asociada *
            </label>
            {loadingOrdenes ? (
              <p className="text-sm text-gray-500">Cargando órdenes de compra...</p>
            ) : (
              <select
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-black font-medium focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                value={formData.orden_compra_id}
                onChange={(e) => handleOrdenChange(e.target.value)}
                required
              >
                <option value="">Selecciona una orden de compra...</option>
                {ordenesCompra.map((orden) => (
                  <option key={orden.id} value={orden.id}>
                    {orden.numero_orden} - {orden.nombre_proveedor} - ${orden.monto_total.toLocaleString('es-CL')}
                  </option>
                ))}
              </select>
            )}
            {errors.orden_compra_id && (
              <p className="text-sm text-red-600">{errors.orden_compra_id}</p>
            )}
          </div>

          {/* Nombre del Vendedor */}
          <Input
            label="Nombre del Vendedor *"
            placeholder="Nombre del vendedor"
            value={formData.nombre_vendedor}
            onChange={(e) => handleInputChange('nombre_vendedor', e.target.value)}
            error={errors.nombre_vendedor}
            required
          />

          {/* Fecha de Factura */}
          <Input
            label="Fecha de Factura *"
            type="date"
            value={formData.fecha_factura}
            onChange={(e) => handleInputChange('fecha_factura', e.target.value)}
            error={errors.fecha_factura}
            required
          />

          {/* Monto Total */}
          <Input
            label="Monto Total *"
            type="number"
            min="0"
            step="1"
            placeholder="0"
            value={formData.monto_total || ''}
            onChange={(e) => handleInputChange('monto_total', parseFloat(e.target.value) || 0)}
            error={errors.monto_total}
            required
          />

          {/* Estado */}
          <div className="space-y-1">
            <label className="block text-sm font-bold text-black">
              Estado de la Factura
            </label>
            <select
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-black font-medium focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
              value={formData.estado}
              onChange={(e) => handleInputChange('estado', e.target.value)}
            >
              <option value="pendiente">Pendiente</option>
              <option value="pagada">Pagada</option>
              <option value="anulada">Anulada</option>
            </select>
          </div>

          {/* Fecha de Pago */}
          <Input
            label="Fecha de Pago (opcional)"
            type="date"
            value={formData.fecha_pago}
            onChange={(e) => handleInputChange('fecha_pago', e.target.value)}
            error={errors.fecha_pago}
          />

          {/* Archivo adjunto */}
          {archivoUrl && (
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center space-x-2">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span className="text-green-800 font-medium">
                  PDF de factura adjuntado: {nombreArchivo || 'factura.pdf'}
                </span>
              </div>
            </div>
          )}

          {/* Notas */}
          <div className="space-y-1">
            <label className="block text-sm font-bold text-black">
              Notas Adicionales
            </label>
            <textarea
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-black placeholder:text-gray-500 font-medium focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
              rows={3}
              placeholder="Observaciones o información adicional sobre la factura..."
              value={formData.notas || ''}
              onChange={(e) => handleInputChange('notas', e.target.value)}
            />
          </div>

          
          <div className="flex justify-end space-x-3 pt-4">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={loading}
              >
                Cancelar
              </Button>
            )}
            
            <Button
              type="submit"
              loading={loading}
              disabled={loading}
            >
              Crear Factura
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}