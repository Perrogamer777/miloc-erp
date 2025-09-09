'use client'

import { useEffect, useState } from 'react'
import { FacturasRepository } from '../../repositories/facturas'
import { FacturasService } from '../../services/facturas.service'
import { Database } from '../../lib/types/database'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/Table'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'

type Factura = Database['public']['Tables']['facturas']['Row']

export default function AdminFacturasTable() {
  const [facturas, setFacturas] = useState<Factura[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingFactura, setEditingFactura] = useState<Factura | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const loadFacturas = async () => {
    try {
      setLoading(true)
      const data = await FacturasRepository.obtenerTodas()
      setFacturas(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar facturas')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFacturas()
  }, [])

  const handleEdit = (factura: Factura) => {
    setEditingFactura(factura)
  }

  const handleSaveEdit = async (updatedFactura: Partial<Factura>) => {
    if (!editingFactura) return

    try {
      const resultado = await FacturasService.actualizar(editingFactura.id, updatedFactura)
      if (resultado.exito) {
        await loadFacturas()
        setEditingFactura(null)
      } else {
        setError(resultado.errores?.join(', ') || 'Error al actualizar factura')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar factura')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const resultado = await FacturasService.eliminar(id)
      if (resultado.exito) {
        await loadFacturas()
        setDeleteConfirm(null)
      } else {
        setError(resultado.errores?.join(', ') || 'Error al eliminar factura')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar factura')
    }
  }

  const formatearMonto = (monto: number, moneda: string) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: moneda === 'CLP' ? 'CLP' : moneda,
      minimumFractionDigits: 0,
    }).format(monto)
  }

  const formatearFecha = (fecha: string) => {
    return new Date(fecha).toLocaleDateString('es-CL')
  }

  const getEstadoBadgeProps = (estado: string) => {
    switch (estado) {
      case 'pendiente':
        return { variant: 'warning' as const, children: 'Pendiente' }
      case 'enviada':
        return { variant: 'default' as const, children: 'Enviada' }
      case 'pagada':
        return { variant: 'success' as const, children: 'Pagada' }
      default:
        return { variant: 'default' as const, children: estado }
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-black">Cargando facturas...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={loadFacturas} variant="outline">
              Reintentar
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Gestión de Facturas</CardTitle>
            <div className="text-sm text-black font-medium">
              {facturas.length} {facturas.length === 1 ? 'factura' : 'facturas'}
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {facturas.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-black mb-4">No hay facturas registradas</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-black">Número</TableHead>
                  <TableHead className="text-black">Proveedor</TableHead>
                  <TableHead className="text-black">Monto</TableHead>
                  <TableHead className="text-black">Estado</TableHead>
                  <TableHead className="text-black">Fecha Factura</TableHead>
                  <TableHead className="text-black">Fecha Vencimiento</TableHead>
                  <TableHead className="text-black">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              
              <TableBody>
                {facturas.map((factura) => {
                  const estadoBadge = getEstadoBadgeProps(factura.estado)
                  
                  return (
                    <TableRow key={factura.id}>
                      <TableCell className="font-medium text-black">
                        {factura.numero_factura}
                      </TableCell>
                      
                      <TableCell className="text-black">
                        <div>
                          <p className="font-medium">{factura.nombre_proveedor}</p>
                          {factura.email_proveedor && (
                            <p className="text-sm">{factura.email_proveedor}</p>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell className="text-black">
                        {formatearMonto(Number(factura.monto_total), factura.moneda)}
                      </TableCell>
                      
                      <TableCell>
                        <Badge variant={estadoBadge.variant} size="sm">
                          {estadoBadge.children}
                        </Badge>
                      </TableCell>
                      
                      <TableCell className="text-black">
                        {formatearFecha(factura.fecha_factura)}
                      </TableCell>
                      
                      <TableCell className="text-black">
                        {formatearFecha(factura.fecha_vencimiento)}
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(factura)}
                          >
                            Editar
                          </Button>
                          
                          {factura.estado === 'pendiente' && (
                            <Button
                              size="sm"
                              variant="danger"
                              onClick={() => setDeleteConfirm(factura.id)}
                            >
                              Eliminar
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modal de Edición */}
      {editingFactura && (
        <EditFacturaModal
          factura={editingFactura}
          onSave={handleSaveEdit}
          onCancel={() => setEditingFactura(null)}
        />
      )}

      {/* Confirmación de Eliminación */}
      {deleteConfirm && (
        <DeleteConfirmModal
          onConfirm={() => handleDelete(deleteConfirm)}
          onCancel={() => setDeleteConfirm(null)}
          title="Eliminar Factura"
          message="¿Estás seguro de que deseas eliminar esta factura? Esta acción no se puede deshacer."
        />
      )}
    </div>
  )
}

// Modal de Edición
interface EditFacturaModalProps {
  factura: Factura
  onSave: (updatedFactura: Partial<Factura>) => void
  onCancel: () => void
}

function EditFacturaModal({ factura, onSave, onCancel }: EditFacturaModalProps) {
  const [formData, setFormData] = useState({
    numero_factura: factura.numero_factura,
    nombre_proveedor: factura.nombre_proveedor,
    email_proveedor: factura.email_proveedor || '',
    estado: factura.estado,
    monto_total: factura.monto_total.toString(),
    moneda: factura.moneda,
    fecha_factura: factura.fecha_factura,
    fecha_vencimiento: factura.fecha_vencimiento,
    fecha_pago: factura.fecha_pago || '',
    observaciones: factura.observaciones || ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      ...formData,
      monto_total: parseFloat(formData.monto_total),
      email_proveedor: formData.email_proveedor || null,
      fecha_pago: formData.fecha_pago || null,
      observaciones: formData.observaciones || null
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-bold text-black mb-4">Editar Factura</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-black mb-1">
              Número de Factura
            </label>
            <input
              type="text"
              value={formData.numero_factura}
              onChange={(e) => setFormData({...formData, numero_factura: e.target.value})}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-1">
              Proveedor
            </label>
            <input
              type="text"
              value={formData.nombre_proveedor}
              onChange={(e) => setFormData({...formData, nombre_proveedor: e.target.value})}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-1">
              Email Proveedor
            </label>
            <input
              type="email"
              value={formData.email_proveedor}
              onChange={(e) => setFormData({...formData, email_proveedor: e.target.value})}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-1">
              Estado
            </label>
            <select
              value={formData.estado}
              onChange={(e) => setFormData({...formData, estado: e.target.value})}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
            >
              <option value="pendiente">Pendiente</option>
              <option value="enviada">Enviada</option>
              <option value="pagada">Pagada</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-1">
              Monto Total
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.monto_total}
              onChange={(e) => setFormData({...formData, monto_total: e.target.value})}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-1">
              Fecha Factura
            </label>
            <input
              type="date"
              value={formData.fecha_factura}
              onChange={(e) => setFormData({...formData, fecha_factura: e.target.value})}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-black mb-1">
              Fecha Vencimiento
            </label>
            <input
              type="date"
              value={formData.fecha_vencimiento}
              onChange={(e) => setFormData({...formData, fecha_vencimiento: e.target.value})}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
              required
            />
          </div>

          {formData.estado === 'pagada' && (
            <div>
              <label className="block text-sm font-medium text-black mb-1">
                Fecha de Pago
              </label>
              <input
                type="date"
                value={formData.fecha_pago}
                onChange={(e) => setFormData({...formData, fecha_pago: e.target.value})}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-black mb-1">
              Observaciones
            </label>
            <textarea
              value={formData.observaciones}
              onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
              rows={3}
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <Button type="submit" className="flex-1">
              Guardar Cambios
            </Button>
            <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Modal de Confirmación de Eliminación
interface DeleteConfirmModalProps {
  onConfirm: () => void
  onCancel: () => void
  title: string
  message: string
}

function DeleteConfirmModal({ onConfirm, onCancel, title, message }: DeleteConfirmModalProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-bold text-black mb-4">{title}</h3>
        <p className="text-black mb-6">{message}</p>
        
        <div className="flex space-x-3">
          <Button variant="danger" onClick={onConfirm} className="flex-1">
            Eliminar
          </Button>
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  )
}