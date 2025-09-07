'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase/client'

export default function PruebaSupabase() {
  const [conectado, setConectado] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function probarConexion() {
      try {
        const { data, error } = await supabase.from('cotizaciones').select('count').single()
        
        if (error) {
          if (error.code === '42P01' || error.message.includes('could not find the table')) {
            setConectado(true)
            setError('Conexión exitosa - Las tablas se crearán después')
          } else {
            setError(`Error: ${error.message}`)
            setConectado(false)
          }
        } else {
          setConectado(true)
          setError(null)
        }
      } catch (err) {
        setError('Error de conexión')
        setConectado(false)
      }
    }

    probarConexion()
  }, [])

  return (
    <div className="p-4 border rounded-md">
      <h3 className="font-semibold mb-2"> Prueba de Conexión Supabase</h3>
      
      {conectado === null && (
        <p className="text-gray-500">Probando conexión...</p>
      )}
      
      {conectado === true && (
        <div className="text-green-600">
          <p>Conexión exitosa con Supabase</p>
          {error && <p className="text-sm text-gray-600 mt-1">{error}</p>}
        </div>
      )}
      
      {conectado === false && (
        <div className="text-red-600">
          <p>❌ Error de conexión</p>
          {error && <p className="text-sm mt-1">{error}</p>}
        </div>
      )}
    </div>
  )
}