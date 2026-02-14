import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useStore } from '@/store/useStore'

export function useReceipts() {
  const { user } = useStore()
  const [uploading, setUploading] = useState(false)

  async function uploadReceipt(file: File): Promise<string | null> {
    if (!user?.household_id) return null
    setUploading(true)

    try {
      const ext = file.name.split('.').pop() || 'jpg'
      const fileName = `${user.household_id}/${crypto.randomUUID()}.${ext}`

      const { error } = await supabase.storage
        .from('receipts')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (error) throw error

      const { data } = supabase.storage.from('receipts').getPublicUrl(fileName)
      return data.publicUrl
    } catch (err) {
      console.error('Upload error:', err)
      return null
    } finally {
      setUploading(false)
    }
  }

  async function deleteReceipt(url: string) {
    // Extract path from URL
    const parts = url.split('/receipts/')
    if (parts.length < 2) return
    const path = parts[1]

    await supabase.storage.from('receipts').remove([path])
  }

  return { uploadReceipt, deleteReceipt, uploading }
}
