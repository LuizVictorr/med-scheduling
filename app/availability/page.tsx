"use client"

import * as React from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Plus, Trash2, Save, Clock, CalendarIcon, Loader2, Info, Pencil, ShieldAlert } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { getAvailabilityOverrides, createAvailabilityOverride, deleteAvailabilityOverride, updateAvailabilityOverride, getLunchBreak, saveLunchBreak } from "./actions"
import { format, parseISO, isAfter, startOfDay } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"

const dayNames = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado"
]

interface AvailabilityItem {
  id: string
  dayOfWeek: number
  startTime: string
  endTime: string
  isActive: boolean
}

interface AvailabilityOverride {
  id: string
  date: string
  startTime: string
  endTime: string
  isActive: boolean
  label?: string
}

export default function AvailabilityPage() {
  const [availability, setAvailability] = React.useState<AvailabilityItem[]>([])
  const [overrides, setOverrides] = React.useState<AvailabilityOverride[]>([])
  const [lunchBreak, setLunchBreak] = React.useState<{ id: string, startTime: string, endTime: string, isActive: boolean } | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSaving, setIsSaving] = React.useState(false)
  
  // Dialog State
  const [isOverrideDialogOpen, setIsOverrideDialogOpen] = React.useState(false)
  const [isConflictAlertOpen, setIsConflictAlertOpen] = React.useState(false)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [newOverride, setNewOverride] = React.useState({
    date: format(new Date(), "yyyy-MM-dd"),
    startTime: "08:00",
    endTime: "18:00",
    isActive: true,
    label: ""
  })

  // Fetch initial data
  React.useEffect(() => {
    async function load() {
      setIsLoading(true)
      try {
        const { data: availData, error: availError } = await supabase
          .from('Availability')
          .select('*')
          .order('dayOfWeek', { ascending: true })

        if (availError) throw availError
        setAvailability(availData || [])

        const overrideData = await getAvailabilityOverrides()
        setOverrides(overrideData || [])

        const lunchData = await getLunchBreak()
        setLunchBreak(lunchData)
      } catch (err) {
        console.error("Erro ao carregar dados:", err)
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [])

  const handleToggle = (id: string, checked: boolean) => {
    setAvailability(prev => prev.map(item => 
      item.id === id ? { ...item, isActive: checked } : item
    ))
  }

  const handleTimeChange = (id: string, field: 'startTime' | 'endTime', value: string) => {
    setAvailability(prev => prev.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    ))
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('Availability')
        .upsert(availability.map(item => ({
          ...item,
          updatedAt: new Date().toISOString()
        })))

      if (error) throw error
      toast.success("Configurações semanais salvas com sucesso!")
    } catch (error) {
      console.error("Erro ao salvar:", error)
      toast.error("Erro ao salvar as alterações semanais.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdateLunchBreak = (updates: Partial<{ startTime: string, endTime: string, isActive: boolean }>) => {
    if (!lunchBreak) return
    setLunchBreak({ ...lunchBreak, ...updates })
  }

  const handleSaveLunchBreak = async () => {
    if (!lunchBreak) return
    setIsSaving(true)
    try {
      const saved = await saveLunchBreak({
        startTime: lunchBreak.startTime,
        endTime: lunchBreak.endTime,
        isActive: lunchBreak.isActive
      })
      setLunchBreak(saved)
      toast.success("Intervalo de almoço atualizado com sucesso!")
    } catch (err) {
      console.error("Erro ao salvar almoço:", err)
      toast.error("Erro ao salvar o intervalo de almoço.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveOverride = async () => {
    // Check for duplicate date (ignoring current if editing)
    const hasConflict = overrides.some(o => o.date === newOverride.date && o.id !== editingId)
    
    if (hasConflict) {
      setIsConflictAlertOpen(true)
      return
    }

    setIsSaving(true)
    try {
      if (editingId) {
        const updated = await updateAvailabilityOverride(editingId, newOverride)
        setOverrides(prev => prev.map(o => o.id === editingId ? updated : o))
      } else {
        const created = await createAvailabilityOverride(newOverride)
        setOverrides(prev => [...prev, created])
        toast.success("Exceção criada com sucesso!")
      }
      closeOverrideDialog()
    } catch (err) {
      console.error("Erro ao salvar exceção:", err)
      toast.error("Erro ao salvar a exceção de horário.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleEditOverride = (override: AvailabilityOverride) => {
    setEditingId(override.id)
    setNewOverride({
      date: override.date,
      startTime: override.startTime,
      endTime: override.endTime,
      isActive: override.isActive,
      label: override.label || ""
    })
    setIsOverrideDialogOpen(true)
  }

  const closeOverrideDialog = () => {
    setIsOverrideDialogOpen(false)
    setEditingId(null)
    setNewOverride({
      date: format(new Date(), "yyyy-MM-dd"),
      startTime: "08:00",
      endTime: "18:00",
      isActive: true,
      label: ""
    })
  }

  const handleDeleteOverride = async (id: string) => {
    try {
      await deleteAvailabilityOverride(id)
      setOverrides(prev => prev.filter(o => o.id !== id))
      toast.success("Exceção removida com sucesso!")
    } catch (err) {
      console.error("Erro ao deletar exceção:", err)
      toast.error("Erro ao remover a exceção.")
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
    <div className="flex flex-col gap-5 transition-all duration-500 animate-in fade-in slide-in-from-top-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-4xl font-black tracking-tighter uppercase text-zinc-900 dark:text-zinc-100">Disponibilidade</h1>
        <p className="text-muted-foreground text-sm sm:text-base font-medium leading-relaxed max-w-2xl">Configure seus horários de atendimento recorrentes e exceções para manter sua agenda organizada.</p>
      </div>
      <Button 
        className="bg-emerald-600 hover:bg-emerald-700 h-14 px-8 font-black uppercase tracking-widest text-[11px] shadow-xl shadow-emerald-200/40 dark:shadow-none rounded-2xl transition-all hover:scale-[1.02] active:scale-95 text-white w-fit flex items-center justify-center gap-3"
        onClick={handleSave}
        disabled={isSaving}
      >
        {isSaving ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Save className="h-5 w-5" />
        )}
        {isSaving ? "Salvando..." : "Salvar Alterações"}
      </Button>
    </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Horários da Semana</CardTitle>
              <CardDescription>Defina sua rotina semanal de atendimento.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              {availability.map((day) => (
                <div key={day.id} className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b last:border-0 border-zinc-100 dark:border-zinc-800 pb-4 gap-4">
                  <div className="flex items-center gap-4 w-full sm:w-[200px]">
                    <Switch 
                      id={`active-${day.id}`} 
                      checked={day.isActive} 
                      onCheckedChange={(checked) => handleToggle(day.id, checked)}
                    />
                    <Label htmlFor={`active-${day.id}`} className="font-semibold cursor-pointer">{dayNames[day.dayOfWeek]}</Label>
                  </div>
                  
                  <div className={`flex items-center gap-4 transition-opacity duration-300 ${day.isActive ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}>
                    <div className="flex flex-col gap-1">
                      <Label className="text-[10px] uppercase text-zinc-500 font-extrabold tracking-widest">Início</Label>
                      <Input 
                        type="time" 
                        value={day.startTime} 
                        onChange={(e) => handleTimeChange(day.id, 'startTime', e.target.value)}
                        className="w-[120px] h-10 font-bold bg-zinc-50/20 dark:bg-zinc-900/50" 
                      />
                    </div>
                    <span className="text-zinc-400 mt-4 font-bold text-xs">até</span>
                    <div className="flex flex-col gap-1">
                      <Label className="text-[10px] uppercase text-zinc-500 font-extrabold tracking-widest">Término</Label>
                      <Input 
                        type="time" 
                        value={day.endTime} 
                        onChange={(e) => handleTimeChange(day.id, 'endTime', e.target.value)}
                        className="w-[120px] h-10 font-bold bg-zinc-50/20 dark:bg-zinc-900/50" 
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card className="shadow-sm border-l-4 border-l-amber-500">
            <CardHeader>
              <CardTitle className="text-lg">Eventos Específicos</CardTitle>
              <CardDescription>Dias em que você atenderá em horários diferenciados.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {overrides.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 text-center bg-zinc-50 dark:bg-zinc-900/30 rounded-2xl border-2 border-dashed border-zinc-100 dark:border-zinc-800">
                  <CalendarIcon className="size-8 text-zinc-300 dark:text-zinc-700 mb-3" />
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Nenhuma exceção cadastrada.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {overrides.map(o => (
                    <div key={o.id} className="flex flex-col gap-3 p-4 bg-white dark:bg-zinc-900 shadow-sm rounded-2xl border border-zinc-100 dark:border-zinc-800 transition-all hover:border-amber-200 dark:hover:border-amber-900/50 group">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm font-black uppercase tracking-tighter text-zinc-900 dark:text-zinc-100">
                          <Clock className="h-4 w-4 text-amber-600" /> 
                          <span>{format(parseISO(o.date), "dd 'de' MMMM", { locale: ptBR })}</span>
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-zinc-300 hover:text-blue-500"
                            onClick={() => handleEditOverride(o)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-zinc-300 hover:text-rose-500"
                            onClick={() => handleDeleteOverride(o.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="pl-6 flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          {!o.isActive ? (
                            <span className="text-[10px] font-black uppercase tracking-widest text-rose-500 bg-rose-50 dark:bg-rose-950/30 px-2 py-0.5 rounded">Folga / Sem Atendimento</span>
                          ) : (
                            <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">
                             {o.startTime} — {o.endTime} {o.label && <span className="text-[10px] opacity-60 ml-1">({o.label})</span>}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <Button 
                variant="outline" 
                className="w-full border-dashed h-12 rounded-2xl font-bold border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all"
                onClick={() => setIsOverrideDialogOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" /> Adicionar Exceção
              </Button>
            </CardContent>
          </Card>

          <Card className="shadow-sm bg-blue-50/50 dark:bg-blue-950/10 border-blue-100 dark:border-blue-900/30">
            <CardHeader>
              <CardTitle className="text-sm">Intervalos de Almoço</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Configure um intervalo de almoço global que será bloqueado automaticamente em todos os dias de atendimento.
              </p>
              
              {lunchBreak ? (
                <div className="flex flex-col gap-4 mt-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Status do Almoço</Label>
                    <Switch 
                      checked={lunchBreak.isActive} 
                      onCheckedChange={(checked) => handleUpdateLunchBreak({ isActive: checked })} 
                    />
                  </div>
                  
                  <div className={cn("grid grid-cols-2 gap-3 transition-opacity", !lunchBreak.isActive && "opacity-50 pointer-events-none")}>
                    <div className="flex flex-col gap-1">
                      <Label className="text-[10px] uppercase text-zinc-500 font-extrabold tracking-widest">Início</Label>
                      <Input 
                        type="time" 
                        value={lunchBreak.startTime} 
                        onChange={(e) => handleUpdateLunchBreak({ startTime: e.target.value })}
                        className="h-10 font-bold bg-white dark:bg-zinc-900" 
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Label className="text-[10px] uppercase text-zinc-500 font-extrabold tracking-widest">Término</Label>
                      <Input 
                        type="time" 
                        value={lunchBreak.endTime} 
                        onChange={(e) => handleUpdateLunchBreak({ endTime: e.target.value })}
                        className="h-10 font-bold bg-white dark:bg-zinc-900" 
                      />
                    </div>
                  </div>
                  <Button 
                    className="w-full mt-4 bg-blue-600 hover:bg-blue-700 h-12 font-black uppercase tracking-widest text-[11px] shadow-lg shadow-blue-200/50 dark:shadow-none rounded-xl transition-all hover:scale-[1.02] active:scale-95"
                    onClick={handleSaveLunchBreak}
                    disabled={isSaving}
                  >
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Salvar Almoço
                      </>
                    )}
                  </Button>
                </div>
              ) : (
                <div className="py-2">
                  <Button 
                    variant="outline" 
                    className="w-full h-10 text-xs font-bold"
                    onClick={async () => {
                      const initial = { startTime: '12:00', endTime: '13:30', isActive: true };
                      const saved = await saveLunchBreak(initial);
                      setLunchBreak(saved);
                    }}
                  >
                    Ativar Configuração de Almoço
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isOverrideDialogOpen} onOpenChange={(open) => !open && closeOverrideDialog()}>
        <DialogContent className="sm:max-w-[480px] rounded-3xl p-0 overflow-hidden border-none shadow-2xl bg-white dark:bg-zinc-950 mx-4 sm:mx-0">
          <DialogHeader className="p-8 pb-0">
            <DialogTitle className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
              {editingId ? "Editar Exceção" : "Adicionar Exceção"}
            </DialogTitle>
            <DialogDescription className="text-zinc-500 dark:text-zinc-400 font-medium">
              Defina um horário diferenciado para uma data específica.
            </DialogDescription>
          </DialogHeader>

          <div className="p-8 flex flex-col gap-6">
            <div className="grid gap-3">
              <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Data da Exceção</Label>
              <Input 
                type="date"
                value={newOverride.date}
                onChange={(e) => setNewOverride({...newOverride, date: e.target.value})}
                className="h-14 bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 rounded-2xl px-6 font-bold dark:text-zinc-100"
              />
            </div>

            <div className="grid gap-3">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Tipo de Exceção</Label>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-zinc-400">{newOverride.isActive ? 'Trabalhar' : 'Dia de Folga'}</span>
                  <Switch 
                    checked={newOverride.isActive}
                    onCheckedChange={(checked) => setNewOverride({...newOverride, isActive: checked})}
                  />
                </div>
              </div>
            </div>

            {newOverride.isActive && (
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 text-center">Início</Label>
                  <Input 
                    type="time"
                    value={newOverride.startTime}
                    onChange={(e) => setNewOverride({...newOverride, startTime: e.target.value})}
                    className="h-14 text-center bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 rounded-2xl font-bold dark:text-zinc-100"
                  />
                </div>
                <div className="grid gap-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 text-center">Término</Label>
                  <Input 
                    type="time"
                    value={newOverride.endTime}
                    onChange={(e) => setNewOverride({...newOverride, endTime: e.target.value})}
                    className="h-14 text-center bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 rounded-2xl font-bold dark:text-zinc-100"
                  />
                </div>
              </div>
            )}

            <div className="grid gap-3">
              <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Rótulo (Opcional)</Label>
              <Input 
                placeholder="Ex: Plantão Estendido"
                value={newOverride.label}
                onChange={(e) => setNewOverride({...newOverride, label: e.target.value})}
                className="h-14 bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 rounded-2xl px-6 font-bold dark:text-zinc-100"
              />
            </div>
          </div>

          <DialogFooter className="p-8 pt-0 bg-white dark:bg-zinc-950 flex flex-col sm:flex-row gap-4">
             <Button 
                variant="ghost" 
                onClick={closeOverrideDialog}
                className="flex-1 h-14 font-black uppercase tracking-widest text-[11px] rounded-2xl"
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleSaveOverride}
                disabled={isSaving}
                className="flex-1 h-14 bg-blue-600 hover:bg-blue-700 font-black uppercase tracking-widest text-[11px] rounded-2xl shadow-xl shadow-blue-200/50 dark:shadow-none transition-all hover:scale-[1.02] active:scale-95"
              >
                {isSaving ? <Loader2 className="animate-spin text-white" /> : (editingId ? "Atualizar" : "Salvar Exceção")}
              </Button>
          </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isConflictAlertOpen} onOpenChange={setIsConflictAlertOpen}>
          <DialogContent className="sm:max-w-[400px] rounded-3xl p-6 border-none shadow-2xl bg-white dark:bg-zinc-950">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2 text-amber-600">
                <ShieldAlert className="h-5 w-5" />
                Atenção
              </DialogTitle>
              <DialogDescription className="py-4 text-base leading-relaxed text-zinc-700 dark:text-zinc-300">
                Não é possível criar 2 eventos específicos no mesmo dia. Se realmente precisar fazer isso, use a opção <strong>Novo evento</strong> da aba <strong>Calendário</strong> e adicione um evento de bloqueio para bloquear sua agenda.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button 
                onClick={() => setIsConflictAlertOpen(false)}
                className="w-full h-12 bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 rounded-xl font-bold"
              >
                Entendi
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    )
  }
