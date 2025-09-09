'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card'
import AdminOrdenesTable from './AdminOrdenesTable'
import AdminFacturasTable from './AdminFacturasTable'

type AdminSection = 'ordenes' | 'facturas'

export default function AdminPanel() {
  const [activeSection, setActiveSection] = useState<AdminSection>('ordenes')

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-black mb-2">Panel de Administración</h1>
        <p className="text-black font-medium">Gestiona y administra todos los datos del sistema</p>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveSection('ordenes')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeSection === 'ordenes'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Órdenes de Compra
          </button>
          <button
            onClick={() => setActiveSection('facturas')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeSection === 'facturas'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Facturas
          </button>
        </nav>
      </div>

      {/* Content */}
      <div>
        {activeSection === 'ordenes' && <AdminOrdenesTable />}
        {activeSection === 'facturas' && <AdminFacturasTable />}
      </div>
    </div>
  )
}