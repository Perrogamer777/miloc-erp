'use client'

import { useState } from 'react'
import Sidebar from "./components/layout/Sidebar"
import Dashboard from "./components/Dashboard"
import OrdenesCompraTable from "./components/tables/OrdenesCompraTable"
import OrdenCompraForm from "./components/forms/OrdenCompraForm"
import { Card, CardHeader, CardTitle, CardContent } from "./components/ui/Card"
import PDFUpload from "./components/upload/PDFUpload"
export default function Home() {
  const [activeSection, setActiveSection] = useState('dashboard')
  const [refreshTable, setRefreshTable] = useState(0)
  const [archivoSubido, setArchivoSubido] = useState<{url: string, nombre: string} | null>(null)

  const handleArchivoSubido = (archivoUrl: string, nombreArchivo: string) => {
    console.log('Archivo subido:', archivoUrl)
    setArchivoSubido({ url: archivoUrl, nombre: nombreArchivo })
  }

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return <Dashboard />
      
      case 'ordenes':
        return (
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Órdenes de Compra</h1>
              <p className="text-gray-600">Gestiona todas las órdenes de compra</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <PDFUpload 
                  tipo="ordenes_compra" 
                  onArchivoSubido={handleArchivoSubido}
                />
                
                <OrdenCompraForm 
                  onSuccess={() => setRefreshTable(prev => prev + 1)}
                  archivoUrl={archivoSubido?.url}
                  nombreArchivo={archivoSubido?.nombre}
                />
              </div>
              
              <Card>
                <CardHeader>
                  <CardTitle>Órdenes Registradas</CardTitle>
                </CardHeader>
                <CardContent>
                  <OrdenesCompraTable refreshTrigger={refreshTable} />
                </CardContent>
              </Card>
            </div>
          </div>
        )
      
      case 'facturas':
        return (
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Facturas</h1>
              <p className="text-gray-600">Gestiona todas las facturas</p>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Lista de Facturas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-500">
                  <p>Funcionalidad de facturas próximamente</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )
      
      case 'reportes':
        return (
          <div className="space-y-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Reportes</h1>
              <p className="text-gray-600">Análisis y reportes del sistema</p>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Reportes Disponibles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-500">
                  <p>Reportes próximamente</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )
      
      default:
        return <Dashboard />
    }
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar 
        activeSection={activeSection} 
        onSectionChange={setActiveSection} 
      />
      
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          {renderContent()}
        </div>
      </main>
    </div>
  )
}