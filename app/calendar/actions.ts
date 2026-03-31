"use server"

import { supabase } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

export async function getAppointments() {
  const { data, error } = await supabase
    .from('Appointment')
    .select('*')
    .order('date', { ascending: true })

  if (error) {
    console.error('Error fetching appointments:', error)
    return []
  }

  // Map dates back to actual Date objects for the UI
  return (data || []).map((app: any) => ({
    ...app,
    date: new Date(app.date),
    endTime: app.endTime ? new Date(app.endTime) : undefined
  }))
}

export async function createAppointment(formData: {
  patientName: string
  type: string
  date: Date
  endTime: Date
  revenue?: number
  color?: string
}) {
  const { data, error } = await supabase
    .from('Appointment')
    .insert([
      {
        patientName: formData.patientName,
        type: formData.type,
        // Use a format that preserves local "Wall Clock" time to avoid 3h shift
        date: new Date(formData.date.getTime() - formData.date.getTimezoneOffset() * 60000).toISOString().slice(0, -1),
        endTime: new Date(formData.endTime.getTime() - formData.endTime.getTimezoneOffset() * 60000).toISOString().slice(0, -1),
        color: formData.color,
        status: 'PENDING',
        revenue: formData.revenue || 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ])
    .select()

  if (error) {
    console.error('Error creating appointment:', error)
    throw new Error('Failed to create appointment')
  }

  revalidatePath('/calendar')
  revalidatePath('/bookings')
  return data[0]
}

export async function updateAppointment(id: string, formData: {
  patientName: string
  type: string
  date: Date
  endTime: Date
  revenue?: number
  color?: string
}) {
  const { data, error } = await supabase
    .from('Appointment')
    .update({
      patientName: formData.patientName,
      type: formData.type,
      date: new Date(formData.date.getTime() - formData.date.getTimezoneOffset() * 60000).toISOString().slice(0, -1),
      endTime: new Date(formData.endTime.getTime() - formData.endTime.getTimezoneOffset() * 60000).toISOString().slice(0, -1),
      color: formData.color,
      revenue: formData.revenue || 0,
      updatedAt: new Date().toISOString()
    })
    .eq('id', id)
    .select()

  if (error) {
    console.error('Error updating appointment:', error)
    throw new Error('Failed to update appointment')
  }

  revalidatePath('/calendar')
  revalidatePath('/bookings')
  return data[0]
}

export async function deleteAppointment(id: string) {
  const { error } = await supabase
    .from('Appointment')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting appointment:', error)
    throw new Error('Failed to delete appointment')
  }

  revalidatePath('/calendar')
  revalidatePath('/bookings')
  return { success: true }
}

export async function updateAppointmentStatus(id: string, status: string) {
  const { data, error } = await supabase
    .from('Appointment')
    .update({ 
      status,
      updatedAt: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('Error updating status:', error)
    throw new Error('Failed to update status')
  }

  revalidatePath('/calendar')
  revalidatePath('/bookings')
  return data
}

export async function getAvailability() {
  const { data, error } = await supabase
    .from('Availability')
    .select('*')
    .order('dayOfWeek', { ascending: true })

  if (error) {
    console.error('Error fetching availability:', error)
    return []
  }

  return data
}

export async function getServices() {
  const { data, error } = await supabase
    .from('servicos')
    .select('*')
    .order('nome', { ascending: true })

  if (error) {
    console.error('Error fetching services:', error)
    return []
  }

  return data
}

export async function getEventTypes() {
  const { data, error } = await supabase
    .from('tipos_eventos')
    .select('*')
    .order('nome', { ascending: true })

  if (error) {
    console.error('Error fetching event types:', error)
    return []
  }

  return data
}
