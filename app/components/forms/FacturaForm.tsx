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
    descripcion_items: '',
    monto_neto: 0,
    iva: 0,
    monto_total: 0,
    fecha_emision: new Date().toISOString().split('T')[0],
    estado_pago: 'pendiente' as 'pendiente' | 'pagado' | 'vencido',
    notas: archivoUrl ? `📄 Archivo adjunto: ${nombreArchivo || 'factura.pdf'}` : ''
  })

  // Cargar órdenes de compra disponibles
  useEffect(() => {
    cargarOrdenesCompra()
  }, [])

  const cargarOrdenesCompra = async () => {
    setLoadingOrdenes(true)
    try {
      const resultado = await OrdenesCompraService.obtenerTodas()
      if (resultado.exito && resultado.datos) {
        // Filtrar solo órdenes pendientes o aprobadas
        const ordenesFiltradas = resultado.datos.filter((orden: any) => 
          orden.estado === 'pendiente' || orden.estado === 'aprobada'
        )
        setOrdenesCompra(ordenesFiltradas)
      }
    } catch (error) {
      console.error('Error cargando órdenes de compra:', error)
    } finally {
      setLoadingOrdenes(false)
    }
  }

  // Calcular IVA automáticamente cuando cambia el monto neto
  useEffect(() => {
    const iva = formData.monto_neto * 0.19
    const total = formData.monto_neto + iva
    setFormData(prev => ({
      ...prev,
      iva: Math.round(iva),
      monto_total: Math.round(total)
    }))
  }, [formData.monto_neto])

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
    if (ordenSeleccionada) {
      // Auto-completar algunos campos basados en la orden de compra
      const montoNeto = Math.round(ordenSeleccionada.monto_total / 1.19)
      setFormData(prev => ({
        ...prev,
        orden_compra_id: ordenId,
        monto_neto: montoNeto
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})
    
    try {
      // Validaciones básicas
      if (!formData.numero_factura.trim()) {
        setErrors({ numero_factura: 'El número de factura es requerido' })
        return
      }
      
      if (!formData.orden_compra_id) {
        setErrors({ orden_compra_id: 'Debe seleccionar una orden de compra' })
        return
      }
      
      if (!formData.descripcion_items.trim()) {
        setErrors({ descripcion_items: 'La descripción de items es requerida' })
        return
      }
      
      if (formData.monto_neto <= 0) {
        setErrors({ monto_neto: 'El monto neto debe ser mayor a 0' })
        return
      }

      // Preparar datos para envío
      const datosFactura = {
        numero_factura: formData.numero_factura,
        orden_compra_id: formData.orden_compra_id,
        tipo_documento: 'factura_electronica',
        timbre_electronico: 'pendiente',
        fecha_emision: formData.fecha_emision,
        descripcion_trabajo: formData.descripcion_items,
        monto_neto: formData.monto_neto,
        iva: formData.iva,
        monto_total: formData.monto_total,
        estado_pago: formData.estado_pago,
        archivo_pdf_url: archivoUrl || null,
        notas: formData.notas
      }

      const resultado = await FacturasService.crear(datosFactura)
      
      if (resultado.exito) {
        onSuccess?.(resultado.datos)
        // Limpiar formulario
        setFormData({
          numero_factura: '',
          orden_compra_id: '',
          descripcion_items: '',
          monto_neto: 0,
          iva: 0,
          monto_total: 0,
          fecha_emision: new Date().toISOString().split('T')[0],
          estado_pago: 'pendiente',
          notas: ''
        })
      } else {
        setErrors({ general: resultado.mensaje || 'Error al crear la factura' })
      }
    } catch (error) {
      setErrors({ general: 'Error inesperado al crear la factura' })
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
          
          {/* Campos básicos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Número de Factura *"
              placeholder="Ej: 001-0000001"
              value={formData.numero_factura}
              onChange={(e) => handleInputChange('numero_factura', e.target.value)}
              error={errors.numero_factura}
              required
            />
            
            <Input
              label="Fecha de Emisión *"
              type="date"
              value={formData.fecha_emision}
              onChange={(e) => handleInputChange('fecha_emision', e.target.value)}
              error={errors.fecha_emision}
              required
            />
          </div>

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

          {/* Descripción de items */}
          <div className="space-y-1">
            <label className="block text-sm font-bold text-black">
              Descripción de Items/Servicios *
            </label>
            <textarea
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-black placeholder:text-gray-500 font-medium focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
              rows={4}
              placeholder="Describe los productos o servicios facturados..."
              value={formData.descripcion_items}
              onChange={(e) => handleInputChange('descripcion_items', e.target.value)}
              required
            />
            {errors.descripcion_items && (
              <p className="text-sm text-red-600">{errors.descripcion_items}</p>
            )}
          </div>

          {/* Montos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input
              label="Monto Neto *"
              type="number"
              min="0"
              step="1"
              placeholder="0"
              value={formData.monto_neto || ''}
              onChange={(e) => handleInputChange('monto_neto', parseFloat(e.target.value) || 0)}
              error={errors.monto_neto}
              required
            />
            
            <Input
              label="IVA (19%)"
              type="number"
              value={formData.iva}
              disabled
              className="bg-gray-50"
            />
            
            <Input
              label="Monto Total"
              type="number"
              value={formData.monto_total}
              disabled
              className="bg-gray-50"
            />
          </div>

          {/* Estado de pago */}
          <div className="space-y-1">
            <label className="block text-sm font-bold text-black">
              Estado de Pago
            </label>
            <select
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-black font-medium focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
              value={formData.estado_pago}
              onChange={(e) => handleInputChange('estado_pago', e.target.value)}
            >
              <option value="pendiente">Pendiente</option>
              <option value="pagado">Pagado</option>
              <option value="vencido">Vencido</option>
            </select>
          </div>
          
          {/* Notas */}
          <div className="space-y-1">
            <label className="block text-sm font-bold text-black">
              Notas
            </label>
            <textarea
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-black placeholder:text-gray-500 font-medium focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
              rows={3}
              placeholder="Información adicional sobre la factura..."
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