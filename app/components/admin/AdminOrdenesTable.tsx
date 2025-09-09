'use client'

import { useEffect, useState } from 'react'
import { OrdenesCompraRepository } from '../../repositories/ordenes-compra'
import { Database } from '../../lib/types/database'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/Table'
import Badge, { getEstadoBadgeProps } from '../ui/Badge'
import Button from '../ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'

type OrdenCompra = Database['public']['Tables']['ordenes_compra']['Row']

export default function AdminOrdenesTable() {
  const [ordenes, setOrdenes] = useState<OrdenCompra[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingOrden, setEditingOrden] = useState<OrdenCompra | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const loadOrdenes = async () => {
    try {
      setLoading(true)
      const data = await OrdenesCompraRepository.obtenerTodas()
      setOrdenes(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar órdenes')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrdenes()
  }, [])

  const handleEdit = (orden: OrdenCompra) => {
    setEditingOrden(orden)
  }

  const handleSaveEdit = async (updatedOrden: Partial<OrdenCompra>) => {
    if (!editingOrden) return

    try {
      await OrdenesCompraRepository.actualizar(editingOrden.id, updatedOrden)
      await loadOrdenes()
      setEditingOrden(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar orden')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await OrdenesCompraRepository.eliminar(id)
      await loadOrdenes()
      setDeleteConfirm(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar orden')
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

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-black">Cargando órdenes...</span>
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
            <Button onClick={loadOrdenes} variant="outline">
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
            <CardTitle>Gestión de Órdenes de Compra</CardTitle>
            <div className="text-sm text-black font-medium">
              {ordenes.length} {ordenes.length === 1 ? 'orden' : 'órdenes'}
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {ordenes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-black mb-4">No hay órdenes de compra registradas</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-black">Número</TableHead>
                  <TableHead className="text-black">Proveedor</TableHead>
                  <TableHead className="text-black">Monto</TableHead>
                  <TableHead className="text-black">Estado</TableHead>
                  <TableHead className="text-black">Fecha Orden</TableHead>
                  <TableHead className="text-black">Entrega Esperada</TableHead>
                  <TableHead className="text-black">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              
              <TableBody>
                {ordenes.map((orden) => {
                  const estadoBadge = getEstadoBadgeProps(orden.estado)
                  
                  return (
                    <TableRow key={orden.id}>
                      <TableCell className="font-medium text-black">
                        {orden.numero_orden}
                      </TableCell>
                      
                      <TableCell className="text-black">
                        <div>
                          <p className="font-medium">{orden.nombre_proveedor}</p>
                          {orden.email_proveedor && (
                            <p className="text-sm">{orden.email_proveedor}</p>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell className="text-black">
                        {formatearMonto(Number(orden.monto_total), orden.moneda)}
                      </TableCell>
                      
                      <TableCell>
                        <Badge variant={estadoBadge.variant} size="sm">
                          {estadoBadge.children}
                        </Badge>
                      </TableCell>
                      
                      <TableCell className="text-black">
                        {formatearFecha(orden.fecha_orden)}
                      </TableCell>
                      
                      <TableCell className="text-black">
                        {orden.fecha_entrega_esperada 
                          ? formatearFecha(orden.fecha_entrega_esperada)
                          : '-'
                        }
                      </TableCell>
                      
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(orden)}
                          >
                            Editar
                          </Button>
                          
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => setDeleteConfirm(orden.id)}
                          >
                            Eliminar
                          </Button>
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
      {editingOrden && (
        <EditOrdenModal
          orden={editingOrden}
          onSave={handleSaveEdit}
          onCancel={() => setEditingOrden(null)}
        />
      )}

      {/* Confirmación de Eliminación */}
      {deleteConfirm && (
        <DeleteConfirmModal
          onConfirm={() => handleDelete(deleteConfirm)}
          onCancel={() => setDeleteConfirm(null)}
          title="Eliminar Orden de Compra"
          message="¿Estás seguro de que deseas eliminar esta orden de compra? Esta acción no se puede deshacer."
        />
      )}
    </div>
  )
}

// Modal de Edición
interface EditOrdenModalProps {
  orden: OrdenCompra
  onSave: (updatedOrden: Partial<OrdenCompra>) => void
  onCancel: () => void
}

function EditOrdenModal({ orden, onSave, onCancel }: EditOrdenModalProps) {
  const [formData, setFormData] = useState({
    nombre_proveedor: orden.nombre_proveedor,
    email_proveedor: orden.email_proveedor || '',
    estado: orden.estado,
    monto_total: orden.monto_total.toString(),
    moneda: orden.moneda,
    fecha_entrega_esperada: orden.fecha_entrega_esperada || '',
    observaciones: orden.observaciones || ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave({
      ...formData,
      monto_total: parseFloat(formData.monto_total),
      fecha_entrega_esperada: formData.fecha_entrega_esperada || null,
      email_proveedor: formData.email_proveedor || null,
      observaciones: formData.observaciones || null
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-bold text-black mb-4">Editar Orden de Compra</h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
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
              <option value="recibida">Recibida</option>
              <option value="cancelada">Cancelada</option>
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
              Fecha Entrega Esperada
            </label>
            <input
              type="date"
              value={formData.fecha_entrega_esperada}
              onChange={(e) => setFormData({...formData, fecha_entrega_esperada: e.target.value})}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-black"
            />
          </div>

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