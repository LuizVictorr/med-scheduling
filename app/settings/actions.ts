"use server"

import { supabase } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

// Service Actions
export async function addService(nome: string) {
  const { data, error } = await supabase
    .from('servicos')
    .insert([{ nome }])
    .select()

  if (error) {
    console.error('Error adding service:', error)
    throw new Error('Failed to add service')
  }

  revalidatePath('/settings')
  revalidatePath('/calendar')
  return data[0]
}

export async function deleteService(id: string) {
  const { error } = await supabase
    .from('servicos')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting service:', error)
    throw new Error('Failed to delete service')
  }

  revalidatePath('/settings')
  revalidatePath('/calendar')
  return { success: true }
}

// Event Type Actions
export async function addEventType(nome: string) {
  const { data, error } = await supabase
    .from('tipos_eventos')
    .insert([{ nome }])
    .select()

  if (error) {
    console.error('Error adding event type:', error)
    throw new Error('Failed to add event type')
  }

  revalidatePath('/settings')
  revalidatePath('/calendar')
  return data[0]
}

export async function deleteEventType(id: string) {
  const { error } = await supabase
    .from('tipos_eventos')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting event type:', error)
    throw new Error('Failed to delete event type')
  }

  revalidatePath('/settings')
  revalidatePath('/calendar')
  return { success: true }
}
