"use server"

import { supabase } from "@/lib/supabase"
import { revalidatePath } from "next/cache"

export async function getAvailabilityOverrides() {
  const { data, error } = await supabase
    .from('AvailabilityOverride')
    .select('*')
    .gte('date', new Date().toISOString().split('T')[0]) // Only future or today
    .order('date', { ascending: true })

  if (error) {
    console.error('Error fetching overrides:', error)
    return []
  }

  return data
}

export async function createAvailabilityOverride(override: {
  date: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
  label?: string;
}) {
  const { data, error } = await supabase
    .from('AvailabilityOverride')
    .insert([override])
    .select()

  if (error) {
    console.error('Error creating override:', error)
    throw new Error('Failed to create override')
  }

  revalidatePath('/availability')
  revalidatePath('/calendar')
  return data[0]
}

export async function updateAvailabilityOverride(id: string, override: Partial<{
  date: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
  label?: string;
}>) {
  const { data, error } = await supabase
    .from('AvailabilityOverride')
    .update(override)
    .eq('id', id)
    .select()

  if (error) {
    console.error('Error updating override:', error)
    throw new Error('Failed to update override')
  }

  revalidatePath('/availability')
  revalidatePath('/calendar')
  return data[0]
}

export async function deleteAvailabilityOverride(id: string) {
  const { error } = await supabase
    .from('AvailabilityOverride')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting override:', error)
    throw new Error('Failed to delete override')
  }

  revalidatePath('/availability')
  revalidatePath('/calendar')
  return { success: true }
}

export async function getLunchBreak() {
  const { data, error } = await supabase
    .from('LunchBreak')
    .select('*')
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('Error fetching lunch break:', error)
    return null
  }

  return data
}

export async function saveLunchBreak(lunchBreak: {
  startTime: string;
  endTime: string;
  isActive: boolean;
}) {
  // Try to find the first record
  const { data: existing } = await supabase
    .from('LunchBreak')
    .select('id')
    .limit(1)
    .maybeSingle()

  let result;
  if (existing) {
    const { data, error } = await supabase
      .from('LunchBreak')
      .update(lunchBreak)
      .eq('id', existing.id)
      .select()
      .single()
    if (error) throw error
    result = data
  } else {
    const { data, error } = await supabase
      .from('LunchBreak')
      .insert([lunchBreak])
      .select()
      .single()
    if (error) throw error
    result = data
  }

  revalidatePath('/availability')
  revalidatePath('/calendar')
  return result
}
