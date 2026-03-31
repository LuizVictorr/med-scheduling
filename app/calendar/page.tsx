"use client"

import * as React from "react"
import { Calendar } from "@/components/ui/calendar"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  addDays,
  subDays,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  format,
  parseISO,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  startOfMonth,
  endOfMonth,
  parse,
  addMinutes
} from "date-fns"
import { ptBR } from "date-fns/locale"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { getAppointments, createAppointment, deleteAppointment, updateAppointment, getAvailability, getServices, getEventTypes } from "./actions"
import { getAvailabilityOverrides, getLunchBreak } from "@/app/availability/actions"
import { Loader2, Plus, Calendar as CalendarIcon, Clock, Pencil, Trash2, ChevronLeft, ChevronRight, Eye, User, ShieldAlert, Activity, RotateCcw, EyeOff, ChevronDown, Info } from "lucide-react"

// Define common days of week
const daysOfWeekFull = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"]
const daysOfWeek = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]

const eventTypes = [
  { value: "Consulta", label: "Consulta Particular", icon: User, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/20" },
  { value: "Bloqueio", label: "Bloqueio da Agenda", icon: ShieldAlert, color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-900/20" },
  { value: "Retorno", label: "Retorno de Paciente", icon: RotateCcw, color: "text-amber-500 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/20" },
  { value: "Eletrocardiograma", label: "Eletrocardiograma", icon: Activity, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
  { value: "Doppler Arterial", label: "Doppler Arterial", icon: Activity, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
  { value: "MAPA 24H", label: "MAPA 24H", icon: Activity, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
]

interface Appointment {
  id: string
  date: Date
  endTime: Date
  patientName: string
  type: string
  color?: string
}

const getEventStyles = (typeId: string, services: any[], eventTypes: any[]) => {
  const service = services.find(s => s.id?.toLowerCase() === typeId?.toLowerCase())
  const eventType = eventTypes.find(e => e.id?.toLowerCase() === typeId?.toLowerCase())
  const typeName = service ? service.nome : (eventType ? eventType.nome : typeId)

  switch (typeName) {
    case "Bloqueio":
      return {
        card: "bg-rose-600 text-white border-rose-700 shadow-rose-100 dark:shadow-none",
        dot: "bg-white shadow-[0_0_8px_rgba(255,255,255,0.5)]",
        month: "bg-rose-600/10 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/50 bg-white dark:bg-zinc-900"
      }
    case "Eletrocardiograma":
    case "Doppler Arterial":
    case "MAPA 24H":
      return {
        card: "bg-emerald-600 text-white border-emerald-700 shadow-emerald-100 dark:shadow-none",
        dot: "bg-white shadow-[0_0_8px_rgba(255,255,255,0.5)]",
        month: "bg-emerald-600/10 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/50 bg-white dark:bg-zinc-900"
      }
    case "Retorno":
      return {
        card: "bg-amber-500 text-white border-amber-600 shadow-amber-100 dark:shadow-none",
        dot: "bg-white shadow-[0_0_8px_rgba(255,255,255,0.5)]",
        month: "bg-amber-500/10 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/50 bg-white dark:bg-zinc-900"
      }
    default: // Consulta or unknown
      return {
        card: "bg-blue-600 text-white border-blue-700 shadow-blue-100 dark:shadow-none",
        dot: "bg-white shadow-[0_0_8px_rgba(255,255,255,0.5)]",
        month: "bg-blue-600/10 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900/50 bg-white dark:bg-zinc-900"
      }
  }
}

interface Availability {
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

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = React.useState<Date>(new Date())
  const [showMiniCalendar, setShowMiniCalendar] = React.useState(true)
  const [view, setView] = React.useState<"week" | "month" | "day">("week")
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [editingApp, setEditingApp] = React.useState<Appointment | null>(null)

  // Reactive appointments state
  const [appointments, setAppointments] = React.useState<Appointment[]>([])
  const [availability, setAvailability] = React.useState<Availability[]>([])
  const [overrides, setOverrides] = React.useState<AvailabilityOverride[]>([])
  const [services, setServices] = React.useState<any[]>([])
  const [eventTypesList, setEventTypesList] = React.useState<any[]>([])
  const [lunchBreak, setLunchBreak] = React.useState<{ startTime: string, endTime: string, isActive: boolean } | null>(null)

  // Load initial data from Supabase
  React.useEffect(() => {
    async function load() {
      setIsLoading(true)
      try {
        const [appData, availData, overrideData, lunchData, serviceData, eventTypeData] = await Promise.all([
          getAppointments(),
          getAvailability(),
          getAvailabilityOverrides(),
          getLunchBreak(),
          getServices(),
          getEventTypes()
        ])

        const parsed = (appData || []).map((app: any) => ({
          ...app,
          date: new Date(app.date),
          endTime: app.endTime ? new Date(app.endTime) : addMinutes(new Date(app.date), 30)
        }))
        setAppointments(parsed)
        setAvailability(availData || [])
        setOverrides(overrideData || [])
        setServices(serviceData || [])
        setEventTypesList(eventTypeData || [])
        setLunchBreak(lunchData)
      } catch (err) {
        console.error("Error loading data:", err)
      } finally {
        setIsLoading(false)
      }
    }
    load()
  }, [])

  // Calculate dynamic times based on availability AND overrides in current view
  const dynamicTimes = React.useMemo(() => {
    // Determine the relevant range of dates based on current view
    let relevantDates: string[] = []
    if (view === "day") {
      relevantDates = [format(currentDate, "yyyy-MM-dd")]
    } else if (view === "week") {
      relevantDates = eachDayOfInterval({
        start: startOfWeek(currentDate, { weekStartsOn: 0 }),
        end: endOfWeek(currentDate, { weekStartsOn: 0 })
      }).map(d => format(d, "yyyy-MM-dd"))
    } else {
      // For month view, just use a standard range or expand as needed
      return ["08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00"]
    }

    let minHour = 24
    let maxHour = 0
    let hasWork = false

    relevantDates.forEach(dateStr => {
      // 1. Check for overrides first
      const override = overrides.find(o => o.date === dateStr)
      if (override) {
        if (override.isActive) {
          hasWork = true
          const [sH] = override.startTime.split(":").map(Number)
          const [eH] = override.endTime.split(":").map(Number)
          if (sH < minHour) minHour = sH
          if (eH > maxHour) maxHour = eH
        }
        return // Bypass weekly for this date if override exists
      }

      // 2. Check weekly availability
      const parsedDate = parse(dateStr, "yyyy-MM-dd", new Date())
      const dayAvail = availability.find(a => a.dayOfWeek === parsedDate.getDay())
      if (dayAvail?.isActive) {
        hasWork = true
        const [sH] = dayAvail.startTime.split(":").map(Number)
        const [eH] = dayAvail.endTime.split(":").map(Number)
        if (sH < minHour) minHour = sH
        if (eH > maxHour) maxHour = eH
      }
    })

    if (!hasWork) return ["08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00"]

    const slots: string[] = []
    for (let h = minHour; h <= maxHour; h++) {
      slots.push(`${h.toString().padStart(2, '0')}:00`)
      if (h < maxHour) slots.push(`${h.toString().padStart(2, '0')}:30`)
    }
    return slots
  }, [availability, overrides, currentDate, view])

  const isIntervalBlocked = (date: Date, startTime: string, endTime: string) => {
    const timeToMin = (t: string) => {
      const [h, m] = t.split(":").map(Number);
      return h * 60 + m;
    };

    const s = timeToMin(startTime);
    const e = timeToMin(endTime);
    const dateStr = format(date, "yyyy-MM-dd");
    const override = overrides.find(o => o.date === dateStr);

    // 0. Check Lunch Break (Global)
    if (lunchBreak?.isActive) {
      const ls = timeToMin(lunchBreak.startTime);
      const le = timeToMin(lunchBreak.endTime);
      // If the interval [s, e] overlaps with [ls, le]
      if (s < le && e > ls) return true;
    }

    // 1. Check Working Hours
    let workS = 0;
    let workE = 0;
    let isActive = false;

    if (override) {
      isActive = override.isActive;
      workS = timeToMin(override.startTime);
      workE = timeToMin(override.endTime);
    } else {
      const dayAvail = availability.find(a => a.dayOfWeek === date.getDay());
      if (dayAvail) {
        isActive = dayAvail.isActive;
        workS = timeToMin(dayAvail.startTime);
        workE = timeToMin(dayAvail.endTime);
      }
    }

    if (!isActive) return true;

    // The appointment must start AFTER workS and end BEFORE workE
    return s < workS || e > workE;
  }

  const isConflict = (date: Date, startTime: string, endTime: string, currentId?: string | null) => {
    const [sH, sM] = startTime.split(":").map(Number)
    const [eH, eM] = endTime.split(":").map(Number)

    // Create actual dates for comparison
    const start = new Date(date)
    start.setHours(sH, sM, 0, 0)
    const end = new Date(date)
    end.setHours(eH, eM, 0, 0)

    return appointments.some(app => {
      if (currentId && app.id === currentId) return false
      if (!isSameDay(app.date, date)) return false

      const appStart = app.date
      const appEnd = app.endTime || addMinutes(app.date, 30)

      // Standard overlap check: (StartA < EndB) AND (EndA > StartB)
      return start < appEnd && end > appStart
    })
  }

  const getSlotValidation = (date: Date, startTime: string, endTime: string, type: string, currentId?: string | null) => {
    // "Bloqueio" is exempt as it's used to manually manage schedule
    if (type === "Bloqueio") return { isValid: true }

    // 1. Check general availability for the entire interval
    if (isIntervalBlocked(date, startTime, endTime)) {
      return { isValid: false, message: "A duração do evento excede o expediente ou o horário de almoço." }
    }

    // 2. Check for conflicts
    if (isConflict(date, startTime, endTime, currentId)) {
      return { isValid: false, message: "Conflito de Horário (Já existe um agendamento)" }
    }

    return { isValid: true }
  }

  // New Event Form State
  const [formData, setFormData] = React.useState({
    patientName: "",
    type: "", // Will be set once services are loaded
    date: new Date(),
    startTime: "09:00",
    endTime: "09:30"
  })

  // Set default type when services load
  React.useEffect(() => {
    if (services.length > 0 && !formData.type) {
      const consulta = services.find(s => s.nome === "Consulta")
      if (consulta) setFormData(prev => ({ ...prev, type: consulta.id }))
    }
  }, [services])

  // RULE: Automatically adjust end time if it's before or equal to start time
  const handleStartTimeChange = (newStartTime: string) => {
    const [sH, sM] = newStartTime.split(":").map(Number)
    const [eH, eM] = formData.endTime.split(":").map(Number)

    let updatedEndTime = formData.endTime

    // If start >= end, set end to start + 30 min
    if ((sH > eH) || (sH === eH && sM >= eM)) {
      const baseDate = new Date()
      baseDate.setHours(sH, sM)
      const newEnd = addMinutes(baseDate, 30)
      updatedEndTime = format(newEnd, "HH:mm")
    }

    setFormData({ ...formData, startTime: newStartTime, endTime: updatedEndTime })
  }

  const openReserveDialog = (time: string, date: Date) => {
    const [h, m] = time.split(":").map(Number)
    const baseDate = new Date(date)
    baseDate.setHours(h, m)
    const endTime = format(addMinutes(baseDate, 30), "HH:mm")

    // Additional check for manual clicks
    if (isIntervalBlocked(date, time, endTime)) return;

    setFormData({
      ...formData,
      date: date,
      startTime: time,
      endTime: endTime
    })
    setIsDialogOpen(true)
  }

  const handleNext = () => {
    if (view === "day") setCurrentDate(addDays(currentDate, 1))
    if (view === "week") setCurrentDate(addWeeks(currentDate, 1))
    if (view === "month") setCurrentDate(addMonths(currentDate, 1))
  }

  const handlePrevious = () => {
    if (view === "day") setCurrentDate(subDays(currentDate, 1))
    if (view === "week") setCurrentDate(subWeeks(currentDate, 1))
    if (view === "month") setCurrentDate(subMonths(currentDate, 1))
  }

  const getDateRangeText = () => {
    if (view === "day") return format(currentDate, "d 'de' MMMM", { locale: ptBR })
    if (view === "month") return format(currentDate, "MMMM yyyy", { locale: ptBR })

    const start = startOfWeek(currentDate, { weekStartsOn: 0 })
    const end = endOfWeek(currentDate, { weekStartsOn: 0 })
    return `${format(start, "d")} - ${format(end, "d 'de' MMMM", { locale: ptBR })}`
  }

  const weekDays = eachDayOfInterval({
    start: startOfWeek(currentDate, { weekStartsOn: 0 }),
    end: endOfWeek(currentDate, { weekStartsOn: 0 })
  })

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const [h, m] = formData.startTime.split(":").map(Number)
      const eventDate = new Date(formData.date)
      eventDate.setHours(h, m, 0, 0)

      const [eh, em] = formData.endTime.split(":").map(Number)
      const eventEndTime = new Date(formData.date)
      eventEndTime.setHours(eh, em, 0, 0)

      const color = formData.type === "Cirurgia" ? "bg-rose-500 text-white shadow-rose-200" : undefined

      if (editingApp) {
        await updateAppointment(editingApp.id, {
          patientName: formData.patientName,
          type: formData.type,
          date: eventDate,
          endTime: eventEndTime,
          color
        })
      } else {
        await createAppointment({
          patientName: formData.patientName,
          type: formData.type,
          date: eventDate,
          endTime: eventEndTime,
          color
        })
      }

      const freshData = await getAppointments()
      setAppointments(freshData)

      setIsDialogOpen(false)
      setEditingApp(null)
      setFormData({
        patientName: "",
        type: services.find(s => s.nome === "Consulta")?.id || "",
        date: new Date(),
        startTime: "09:00",
        endTime: "09:30"
      })
    } catch (err) {
      console.error(err)
      alert("Erro ao salvar agendamento.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteEvent = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este agendamento?")) return

    setIsLoading(true)
    try {
      await deleteAppointment(id)
      const freshData = await getAppointments()
      setAppointments(freshData)
    } catch (err) {
      console.error(err)
      alert("Erro ao excluir agendamento.")
    } finally {
      setIsLoading(false)
    }
  }

  const openEditDialog = (app: Appointment) => {
    setEditingApp(app)
    setFormData({
      patientName: app.patientName,
      type: app.type,
      date: app.date,
      startTime: format(app.date, "HH:mm"),
      endTime: format(app.endTime, "HH:mm")
    })
    setIsDialogOpen(true)
  }

  // Indicators for mini-calendar (Split by type)
  const getServiceName = (id: string) => {
    const s = services.find(s => s.id?.toLowerCase() === id?.toLowerCase());
    if (s) return s.nome;
    const e = eventTypesList.find(e => e.id?.toLowerCase() === id?.toLowerCase());
    if (e) return e.nome;
    // Fallback if the id is already a known type name (legacy support)
    if (["Consulta", "Bloqueio", "Retorno", "Eletrocardiograma", "Doppler Arterial", "MAPA 24H"].includes(id)) return id;
    return id;
  }

  const consultaDays = appointments.filter(a => getServiceName(a.type) === "Consulta").map(app => app.date)
  const bloqueioDays = appointments.filter(a => getServiceName(a.type) === "Bloqueio").map(app => app.date)
  const verdeDays = appointments.filter(a => ["Eletrocardiograma", "Doppler Arterial", "MAPA 24H"].includes(getServiceName(a.type) || "")).map(app => app.date)
  const retornoDays = appointments.filter(a => getServiceName(a.type) === "Retorno").map(app => app.date)

  // Legacy arrays for potential fallback usage
  const bookedDays = appointments.filter(a => a.type !== "Bloqueio").map(app => app.date)
  const blockedDays = appointments.filter(a => a.type === "Bloqueio").map(app => app.date)

  const EventTooltip = ({ app }: { app: Appointment }) => {
    const service = services.find(s => s.id?.toLowerCase() === app.type?.toLowerCase())
    const eventType = eventTypesList.find(e => e.id?.toLowerCase() === app.type?.toLowerCase())
    const typeName = service ? service.nome : (eventType ? eventType.nome : app.type)
    const eventTypeTemplate = eventTypes.find(t => t.value === typeName)
    const appEndTime = app.endTime || addMinutes(app.date, 30)
    const durationsMin = Math.round((appEndTime.getTime() - app.date.getTime()) / 60000)

    return (
      <TooltipContent
        align="center"
        side="top"
        sideOffset={5}
        className="p-4 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-2xl animate-in fade-in zoom-in-95 duration-200 z-[1001]"
      >
        <div className="flex flex-col gap-4 min-w-[200px]">
          {/* Cabeçalho com Paciente e Ações */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase text-zinc-400 tracking-wider">Paciente</span>
              <h3 className="text-base font-black text-zinc-900 dark:text-zinc-100 leading-tight truncate max-w-[150px]">{app.patientName}</h3>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={(e) => { e.stopPropagation(); openEditDialog(app); }}
                className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-blue-600 transition-colors"
                title="Editar"
              >
                <Pencil className="size-4" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); handleDeleteEvent(app.id); }}
                className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-rose-500 transition-colors"
                title="Excluir"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </div>

          <div className="space-y-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            {/* Tipo */}
            <div className="flex items-center gap-3">
              <div className={cn("p-1.5 rounded-lg", eventTypeTemplate?.bg || "bg-zinc-100 dark:bg-zinc-800")}>
                {eventTypeTemplate && React.createElement(eventTypeTemplate.icon, { className: cn("size-3.5", eventTypeTemplate.color || "text-zinc-500") })}
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-[9px] font-bold uppercase text-zinc-400 tracking-tighter">Tipo</span>
                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">{typeName}</span>
              </div>
            </div>

            {/* Horário */}
            <div className="flex items-center gap-3">
              <div className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30">
                <Clock className="size-3.5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex flex-col leading-none">
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-bold uppercase text-zinc-400 tracking-tighter text-nowrap">Horário</span>
                  <span className="text-[9px] font-medium text-zinc-400 dark:text-zinc-500 lowercase">{durationsMin} minutos</span>
                </div>
                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  {format(app.date, "HH:mm")} — {format(appEndTime, "HH:mm")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </TooltipContent>
    )
  }

  return (
    <TooltipProvider delay={100}>
      <div className="flex flex-col gap-8 h-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4 shrink-0">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tighter text-zinc-900 dark:text-zinc-50 uppercase">Calendário</h1>
              <p className="text-muted-foreground text-xs sm:text-sm font-medium tracking-tight">Gestão de horários de atendimento e eventos clínicos.</p>
            </div>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger className={cn(buttonVariants({ variant: "default" }), "w-full sm:w-auto bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-200/50 dark:shadow-none h-14 sm:h-11 px-6 font-black uppercase tracking-widest transition-all hover:scale-105 active:scale-95 shrink-0")}>
              <Plus className="mr-2 h-5 w-5" /> Novo Evento
            </DialogTrigger>
            <DialogContent className="w-[95vw] sm:max-w-[700px] p-0 overflow-hidden border-none shadow-2xl rounded-3xl">
              <DialogHeader className="p-6 sm:p-10 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white border-b border-zinc-100 dark:border-zinc-800 relative">
                <div className="absolute top-0 right-0 p-6 sm:p-10 opacity-5 dark:opacity-10 pointer-events-none">
                  <CalendarIcon className="size-16 sm:size-24" />
                </div>
                <DialogTitle className="text-2xl sm:text-3xl font-black uppercase tracking-tighter shrink-0 pr-12">
                  {editingApp ? "Editar Evento" : "Criar Evento"}
                </DialogTitle>
                <DialogDescription className="text-zinc-500 dark:text-zinc-400 font-medium text-sm sm:text-base">
                  {editingApp ? `Ajustando agendamento de ${editingApp.patientName}` : "Configure os detalhes do novo compromisso."}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateEvent} className="p-6 sm:p-10 bg-white dark:bg-zinc-950 grid gap-6 sm:gap-8 max-h-[70vh] overflow-y-auto">
                <div className="space-y-6 sm:space-y-8">
                  <div className="grid gap-3">
                    <Label htmlFor="title" className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Paciente</Label>
                    <Input
                      id="title"
                      placeholder="Digite o nome aqui..."
                      className="h-14 border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 font-bold bg-zinc-50/20 dark:bg-zinc-900/50 rounded-2xl px-6 text-base sm:text-lg dark:text-zinc-100 dark:placeholder:text-zinc-600"
                      value={formData.patientName}
                      onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                      required
                    />
                  </div>

                  <div className="grid gap-3">
                    <Label htmlFor="type" className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Tipo da Ocorrência</Label>
                    <Select value={formData.type} onValueChange={(v) => v && setFormData({ ...formData, type: v })}>
                      <SelectTrigger className="!h-14 w-full font-bold bg-zinc-50/20 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 rounded-2xl px-6 dark:text-zinc-100">
                        {(() => {
                          const service = services.find(s => s.id === formData.type);
                          const eventType = eventTypesList.find(e => e.id === formData.type);
                          const typeName = service ? service.nome : (eventType ? eventType.nome : "");
                          const template = eventTypes.find(t => t.value === typeName);
                          
                          return (
                            <div className="flex items-center gap-3">
                              {template && (
                                <div className={cn("p-1.5 rounded-lg", template.bg)}>
                                  {React.createElement(template.icon, { className: cn("size-3.5", template.color) })}
                                </div>
                              )}
                              <span className="font-bold truncate">
                                {typeName || "Selecione um serviço"}
                              </span>
                            </div>
                          );
                        })()}
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl shadow-2xl p-2 border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900 max-h-[400px]">
                        <div className="px-4 py-2 text-[9px] font-black uppercase tracking-widest text-zinc-400">Serviços Clínicos</div>
                        {services.map((s) => {
                          const template = eventTypes.find(t => t.value === s.nome);
                          if (!template) return null;
                          return (
                            <SelectItem key={s.id} value={s.id} className="rounded-xl px-4 py-3 focus:bg-zinc-50 dark:focus:bg-zinc-800 group/item">
                              <div className="flex items-center gap-4">
                                <div className={cn("p-2 rounded-lg", template.bg)}>
                                  <template.icon className={cn("size-4", template.color)} />
                                </div>
                                <span className="font-bold text-zinc-700 dark:text-zinc-300 group-focus/item:text-zinc-900 dark:group-focus/item:text-zinc-100 tracking-tight">{s.nome}</span>
                              </div>
                            </SelectItem>
                          );
                        })}
                        <div className="px-4 py-2 mt-2 text-[9px] font-black uppercase tracking-widest text-zinc-400">Tipos de Ocorrência</div>
                        {eventTypesList.map((e) => {
                          const template = eventTypes.find(t => t.value === e.nome);
                          if (!template) return null;
                          return (
                            <SelectItem key={e.id} value={e.id} className="rounded-xl px-4 py-3 focus:bg-zinc-50 dark:focus:bg-zinc-800 group/item">
                              <div className="flex items-center gap-4">
                                <div className={cn("p-2 rounded-lg", template.bg)}>
                                  <template.icon className={cn("size-4", template.color)} />
                                </div>
                                <span className="font-bold text-zinc-700 dark:text-zinc-300 group-focus/item:text-zinc-900 dark:group-focus/item:text-zinc-100 tracking-tight">{e.nome}</span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-[1fr_140px_140px] gap-4 items-end">
                    <div className="grid gap-3">
                      <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Data Agendada</Label>
                      <Input
                        type="date"
                        value={format(formData.date, "yyyy-MM-dd")}
                        onChange={(e) => {
                          if (e.target.value) {
                            setFormData({ ...formData, date: parseISO(e.target.value) });
                          }
                        }}
                        className="h-14 w-full border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 bg-zinc-50/20 dark:bg-zinc-900/50 rounded-2xl px-6 text-sm dark:text-zinc-100"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 sm:contents gap-4">
                      <div className="grid gap-3">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 text-center sm:text-center">Início</Label>
                        <Input
                          type="time"
                          className="h-14 w-full border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 bg-zinc-50/20 dark:bg-zinc-900/50 rounded-2xl px-4 text-center text-sm dark:text-zinc-100"
                          value={formData.startTime}
                          onChange={(e) => handleStartTimeChange(e.target.value)}
                          required
                        />
                      </div>

                      <div className="grid gap-3">
                        <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 text-center sm:text-center">Fim</Label>
                        <Input
                          type="time"
                          min={formData.startTime}
                          className="h-14 w-full border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 bg-zinc-50/20 dark:bg-zinc-900/50 rounded-2xl px-4 text-center text-sm dark:text-zinc-100"
                          value={formData.endTime}
                          onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <DialogFooter className="pt-6 sm:pt-8 mt-4 border-t border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row gap-3 sm:gap-4 flex-wrap">
                  {!getSlotValidation(formData.date, formData.startTime, formData.endTime, formData.type, editingApp?.id).isValid && (
                    <div className="w-full mb-2 p-4 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-800 rounded-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                      <ShieldAlert className="size-5 text-rose-600 dark:text-rose-400" />
                      <span className="text-xs font-black text-rose-700 dark:text-rose-300 uppercase tracking-tight">
                        {getSlotValidation(formData.date, formData.startTime, formData.endTime, formData.type, editingApp?.id).message}
                      </span>
                    </div>
                  )}
                  <Button
                    type="submit"
                    disabled={isSubmitting || !getSlotValidation(formData.date, formData.startTime, formData.endTime, formData.type, editingApp?.id).isValid}
                    className="bg-blue-600 hover:bg-blue-700 h-14 w-full sm:flex-1 font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-200 dark:shadow-none rounded-2xl transition-all hover:scale-[1.02] active:scale-95 order-1 sm:order-2 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? <Loader2 className="animate-spin" /> : (editingApp ? "Atualizar Evento" : "Salvar Evento")}
                  </Button>
                  <Button type="button" disabled={isSubmitting} variant="ghost" onClick={() => { setIsDialogOpen(false); setEditingApp(null); }} className="h-14 w-full sm:flex-1 font-black uppercase tracking-widest text-[11px] hover:bg-zinc-50 dark:hover:bg-zinc-800 dark:text-zinc-400 rounded-2xl transition-all active:scale-95 order-2 sm:order-1">Descartar</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className={`grid gap-6 h-full transition-all duration-300 ${showMiniCalendar ? 'lg:grid-cols-[280px_1fr]' : 'grid-cols-1'}`}>
          {showMiniCalendar && (
            <div className="flex flex-col gap-6 animate-in slide-in-from-left-4 fade-in duration-300 sticky top-8 self-start">
              <Card className="shadow-sm border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900/50">
                <CardHeader className="pb-2 flex flex-row items-center justify-between bg-zinc-50/50 dark:bg-transparent border-b dark:border-zinc-800">
                  <CardTitle className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Agenda Geral</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowMiniCalendar(false)}
                    className="h-6 w-6 text-zinc-400 hover:text-rose-500 transition-colors"
                  >
                    <EyeOff className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="p-2">
                  <Calendar
                    mode="single"
                    selected={currentDate}
                    onSelect={(d) => d && setCurrentDate(d)}
                    locale={ptBR}
                    modifiers={{
                      consulta: consultaDays,
                      bloqueio: bloqueioDays,
                      exame: verdeDays,
                      retorno: retornoDays,
                    }}
                    className="w-full p-2"
                  />
                </CardContent>
              </Card>

              <Card className="shadow-sm bg-blue-50/50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/30 p-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <Clock className="size-16 dark:text-blue-400" />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-black uppercase text-blue-800 dark:text-blue-300 tracking-widest">Resumo de Hoje</span>
                  <div className="flex items-center gap-3 mt-3">
                    <div className="h-3 w-3 rounded-full bg-emerald-500 shadow-sm animate-pulse" />
                    <span className="text-xl font-black text-blue-900 dark:text-blue-100">{appointments.filter(a => isSameDay(a.date, new Date())).length} Eventos</span>
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-2 font-medium leading-relaxed">Você tem uma tarde produtiva pela frente. Organize seus materiais.</p>
                </div>
              </Card>
            </div>
          )}

          <Card className="shadow-sm flex flex-col overflow-hidden border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
            <CardHeader className="flex flex-col xl:flex-row items-center justify-between border-b dark:border-zinc-800 py-6 gap-6 px-8 bg-zinc-50/20 dark:bg-zinc-900/30">
              <div className="flex flex-col sm:flex-row sm:items-center gap-6 w-full xl:w-auto">
                <div className="flex items-center gap-4 justify-between sm:justify-start">
                  {!showMiniCalendar && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowMiniCalendar(true)}
                      className="h-10 w-10 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all animate-in zoom-in-95 border border-blue-100 dark:border-blue-900/50 rounded-xl"
                    >
                      <Eye className="h-5 w-5" />
                    </Button>
                  )}
                  <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-100 capitalize tracking-tighter truncate">
                    {getDateRangeText()}
                  </h2>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex flex-1 sm:flex-none border border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900 shadow-sm overflow-hidden h-10 p-0.5">
                    <Button variant="ghost" size="icon" onClick={handlePrevious} className="h-full flex-1 sm:w-9 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400"><ChevronLeft className="h-4 w-4" /></Button>
                    <div className="w-[1px] bg-zinc-100 dark:bg-zinc-800 my-1" />
                    <Button variant="ghost" size="icon" onClick={handleNext} className="h-full flex-1 sm:w-9 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400"><ChevronRight className="h-4 w-4" /></Button>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())} className="h-10 px-5 font-black text-[10px] uppercase tracking-widest border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 dark:text-zinc-400">Hoje</Button>
                </div>
              </div>

              <div className="flex w-full xl:w-auto border border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-100 dark:bg-zinc-900 p-1 shadow-inner h-11">
                {(["day", "week", "month"] as const).map((v) => (
                  <Button
                    key={v}
                    variant={view === v ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setView(v)}
                    className={cn("h-full flex-1 sm:px-6 font-black text-[10px] uppercase tracking-widest transition-all", view === v ? "bg-white dark:bg-zinc-800 shadow-md text-blue-600 dark:text-blue-400" : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200")}
                  >
                    {v === "day" ? "Dia" : v === "week" ? "Semana" : "Mês"}
                  </Button>
                ))}
              </div>
            </CardHeader>

            <CardContent className="p-0 overflow-auto flex-1 bg-white dark:bg-zinc-950 relative">
              {isLoading && (
                <div className="absolute inset-0 bg-white/60 dark:bg-zinc-950/60 backdrop-blur-[1px] z-50 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 className="size-10 text-blue-600 animate-spin" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 animate-pulse">Sincronizando Agenda...</span>
                  </div>
                </div>
              )}
              {view === "week" && (
                <>
                  <div className="grid grid-cols-8 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/80 sticky top-0 z-40 font-bold min-w-[800px] backdrop-blur-md">
                    <div className="p-4 border-r border-zinc-100 dark:border-zinc-800 text-[10px] text-zinc-400 dark:text-zinc-500 text-center uppercase tracking-widest flex items-center justify-center font-black">Horário</div>
                    {weekDays.map((d, i) => (
                      <div key={i} className="p-4 border-r border-zinc-100 dark:border-zinc-800 text-center">
                        <div className="text-[10px] text-zinc-400 dark:text-zinc-500 uppercase tracking-widest font-black leading-none">{daysOfWeek[i]}</div>
                        <div className={`text-2xl font-black h-11 w-11 mx-auto flex items-center justify-center rounded-2xl mt-2 transition-all duration-300 ${isSameDay(d, currentDate) ? 'bg-blue-600 text-white shadow-xl shadow-blue-200/50 dark:shadow-none rotate-3 scale-110' : 'text-zinc-900 dark:text-zinc-400 group-hover:bg-zinc-100 dark:group-hover:bg-zinc-800'}`}>
                          {format(d, "d")}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="relative min-h-[600px] min-w-[800px]">
                    {dynamicTimes.map((time) => (
                      <div key={time} className="grid grid-cols-8 border-b border-zinc-100 dark:border-zinc-800/60 h-24 transition-colors hover:bg-zinc-50/10 dark:hover:bg-zinc-800/10">
                        <div className="p-4 border-r border-zinc-100 dark:border-zinc-800 text-sm text-zinc-400 dark:text-zinc-500 text-center font-black bg-zinc-50/10 dark:bg-zinc-900/20 flex items-start justify-center pt-8 leading-none tracking-tighter">{time}</div>
                        {weekDays.map((d, dayIdx) => {
                          const isWeekend = dayIdx === 0 || dayIdx === 6;
                          const dayApps = appointments.filter(a => isSameDay(a.date, d) && format(a.date, "HH:mm") === time);

                          // Convert time to endTime (start + 30 min) for block check
                          const dateTime = new Date(d);
                          const [h, m] = time.split(":").map(Number);
                          dateTime.setHours(h, m);
                          const endTimeStr = format(addMinutes(dateTime, 30), "HH:mm");

                          const isBlocked = isIntervalBlocked(d, time, endTimeStr);

                          return (
                            <div
                              key={dayIdx}
                              className={cn(
                                "border-r border-zinc-100 dark:border-zinc-800/60 relative group transition-colors",
                                isWeekend ? "bg-zinc-100/30 dark:bg-zinc-900/40" : "",
                                isBlocked ? "bg-zinc-50/50 dark:bg-zinc-900/50 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(0,0,0,0.03)_10px,rgba(0,0,0,0.03)_20px)] dark:bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,255,255,0.02)_10px,rgba(255,255,255,0.02)_20px)] cursor-not-allowed" : "hover:bg-blue-50/40 dark:hover:bg-blue-900/10"
                              )}
                            >
                              {dayApps.map((app, i) => {
                                const appEndTime = app.endTime || addMinutes(app.date, 30);
                                const durationMin = Math.round((appEndTime.getTime() - app.date.getTime()) / 60000);
                                const heightPx = (durationMin / 30) * 96 - 16;
                                const styles = getEventStyles(app.type, services, eventTypesList);

                                return (
                                  <div
                                    key={i}
                                    style={{ height: `${heightPx}px` }}
                                    className={`absolute inset-x-2 top-2 rounded-2xl p-4 text-[11px] font-black border shadow-lg transition-all hover:translate-y-[-4px] hover:shadow-2xl cursor-pointer ${app.color || styles.card} z-20 flex flex-col gap-1 overflow-hidden animate-in fade-in zoom-in-90 duration-500 group/event`}
                                  >
                                    <TooltipProvider>
                                      <Tooltip>
                                        <TooltipTrigger className="absolute inset-0 w-full h-full" />
                                        <EventTooltip app={app} />
                                      </Tooltip>
                                    </TooltipProvider>
                                    <span className="text-xs uppercase tracking-tighter leading-tight truncate w-full">{app.patientName}</span>

                                    <div className="flex items-center gap-2 opacity-80 text-[10px] mt-auto">
                                      <div className={`h-2 w-2 rounded-full border border-white/20 shrink-0 ${styles.dot}`} />
                                      <span className="uppercase tracking-widest truncate flex-1">{getServiceName(app.type)}</span>
                                    </div>
                                  </div>
                                );
                              })}
                              {dayApps.length === 0 && !isBlocked && (
                                <button
                                  onClick={() => openReserveDialog(time, d)}
                                  className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-blue-50/20 dark:bg-blue-900/20 transition-all flex items-center justify-center z-0"
                                  title="Reservar horário"
                                >
                                  <Plus className="size-5 text-blue-300 dark:text-blue-500 pointer-events-none" />
                                </button>
                              )}
                              {dayApps.length === 0 && isBlocked && (
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <ShieldAlert className="size-4 text-zinc-300 dark:text-zinc-700" />
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </>
              )}

              {view === "month" && (
                <div className="grid grid-cols-7 h-full min-h-[800px] min-w-[700px]">
                  {daysOfWeek.map((day) => (
                    <div key={day} className="p-4 border-r border-b border-zinc-100 dark:border-zinc-800 text-[11px] text-zinc-400 dark:text-zinc-500 text-center font-black uppercase tracking-widest bg-zinc-50/50 dark:bg-zinc-900/50">{day}</div>
                  ))}
                  {eachDayOfInterval({
                    start: startOfMonth(currentDate),
                    end: endOfMonth(currentDate)
                  }).map((d, i) => {
                    const dayApps = appointments.filter(a => isSameDay(a.date, d));
                    return (
                      <div
                        key={i}
                        onClick={() => {
                          const validation = getSlotValidation(d, "09:00", "09:30", "Consulta");
                          if (dayApps.length === 0 && validation.isValid) {
                            openReserveDialog("09:00", d);
                          }
                        }}
                        className={cn(
                          "border-r border-b border-zinc-100 dark:border-zinc-800/80 p-3 min-h-[160px] transition-all cursor-pointer group relative overflow-hidden",
                          dayApps.length === 0 && !getSlotValidation(d, "09:00", "09:30", "Consulta").isValid ? "bg-zinc-50/50 dark:bg-zinc-900/50 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(0,0,0,0.03)_10px,rgba(0,0,0,0.03)_20px)] cursor-not-allowed opacity-60" : "hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50"
                        )}
                      >
                        <div className="flex justify-between items-center mb-4">
                          <span className={`text-base font-black h-10 w-10 flex items-center justify-center rounded-2xl transition-all duration-300 ${isSameDay(d, new Date()) ? 'bg-blue-600 text-white shadow-xl dark:shadow-none' : 'text-zinc-900 dark:text-zinc-300 group-hover:bg-zinc-200 dark:group-hover:bg-zinc-800'}`}>
                            {format(d, "d")}
                          </span>
                        </div>
                        <div className="flex flex-col gap-2 relative z-10">
                          {dayApps.map((app, i) => (
                            <div
                              key={i}
                              className={cn("text-[9px] p-2.5 rounded-xl font-black truncate border shadow-md transition-transform hover:scale-105 relative", app.color || getEventStyles(app.type, services, eventTypesList).month)}
                            >
                              <Tooltip>
                                <TooltipTrigger className="absolute inset-0 w-full h-full" />
                                <EventTooltip app={app} />
                              </Tooltip>
                              <span className="opacity-60">{format(app.date, "HH:mm")}</span> • {app.patientName}
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {view === "day" && (
                <div className="flex flex-col h-full bg-transparent animate-in slide-in-from-bottom-4 duration-500">
                  <div className="grid grid-cols-[100px_1fr] border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/80 font-black sticky top-0 z-10 items-center backdrop-blur-md">
                    <div className="p-4 border-r border-zinc-100 dark:border-zinc-800 text-[10px] text-zinc-400 dark:text-zinc-500 text-center uppercase tracking-widest">Hora</div>
                    <div className="p-4 sm:p-6 flex items-center gap-6">
                      <span className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-100 uppercase tracking-tighter truncate max-w-[200px] sm:max-w-none">{format(currentDate, "EEEE, d 'de' MMMM", { locale: ptBR })}</span>
                      <div className="group relative hidden sm:block">
                        <div className="absolute -inset-1 bg-emerald-500 rounded-full blur opacity-20 group-hover:opacity-40 transition animate-pulse" />
                        {overrides.find(o => o.date === format(currentDate, "yyyy-MM-dd")) ? (
                          <div className="relative bg-amber-100 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-amber-200 dark:border-amber-800/50 shadow-sm flex items-center gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                            {overrides.find(o => o.date === format(currentDate, "yyyy-MM-dd"))?.label || "Horário de Exceção"}
                          </div>
                        ) : (
                          <div className="relative bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-emerald-200 dark:border-emerald-800/50 shadow-sm flex items-center gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            Expediente Normal
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  {dynamicTimes.map((time) => {
                    const dayApps = appointments.filter(a => isSameDay(a.date, currentDate) && format(a.date, "HH:mm") === time);
                    // Convert time to endTime (start + 30 min) for block check
                    const dateTime = new Date(currentDate);
                    const [h, m] = time.split(":").map(Number);
                    dateTime.setHours(h, m);
                    const endTimeStr = format(addMinutes(dateTime, 30), "HH:mm");
                    const isBlocked = isIntervalBlocked(currentDate, time, endTimeStr);
                    return (
                      <div key={time} className={cn(
                        "grid grid-cols-[100px_1fr] border-b border-zinc-100 dark:border-zinc-800/60 min-h-[100px] group transition-colors",
                        isBlocked ? "bg-zinc-50/30 dark:bg-zinc-900/30 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(0,0,0,0.02)_10px,rgba(0,0,0,0.02)_20px)] dark:bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,255,255,0.01)_10px,rgba(255,255,255,0.01)_20px)]" : "hover:bg-zinc-50/20 dark:hover:bg-zinc-900/10"
                      )}>
                        <div className="p-4 border-r border-zinc-100 dark:border-zinc-800 text-sm text-zinc-400 dark:text-zinc-500 text-center font-black bg-zinc-50/10 dark:bg-zinc-900/20 flex items-start justify-center pt-8 leading-none tracking-tighter">{time}</div>
                        <div className="p-2 relative flex flex-col items-stretch">
                          {dayApps.map((app, i) => {
                            const typeName = getServiceName(app.type)
                            const eventTypeTemplate = eventTypes.find(t => t.value === typeName)
                            const appEndTime = app.endTime || addMinutes(app.date, 30)
                            const durationMin = Math.round((appEndTime.getTime() - app.date.getTime()) / 60000)
                            const styles = getEventStyles(app.type, services, eventTypesList)

                            return (
                              <div
                                key={i}
                                style={{ height: `${(durationMin / 30) * 100 - 16}px` }}
                                className={`absolute inset-x-2 top-2 p-6 sm:p-8 flex flex-col gap-4 rounded-3xl shadow-xl dark:shadow-none transition-all hover:scale-[1.01] hover:shadow-2xl z-20 ${app.color || styles.card} animate-in slide-in-from-left-4 duration-500 overflow-hidden`}
                              >
                                <div className="flex flex-col justify-start gap-4 h-full">
                                  <div className="flex flex-col gap-1.5 pt-2">
                                    <div className="flex items-start justify-between gap-4">
                                      <span className="text-xl sm:text-4xl font-black leading-tight tracking-tighter uppercase truncate flex-1">{app.patientName}</span>

                                      <div className="flex items-center gap-2 shrink-0">
                                        <Button
                                          variant="secondary"
                                          size="icon"
                                          className="size-10 sm:size-12 rounded-2xl bg-white/20 hover:bg-white/40 border-none text-white backdrop-blur-md transition-all hover:scale-110 active:scale-95 shadow-lg"
                                          onClick={(e) => { e.stopPropagation(); openEditDialog(app); }}
                                        >
                                          <Pencil className="size-5 sm:size-6" />
                                        </Button>
                                        <Button
                                          variant="secondary"
                                          size="icon"
                                          className="size-10 sm:size-12 rounded-2xl bg-white/20 hover:bg-white/40 border-none text-rose-400 backdrop-blur-md transition-all hover:scale-110 active:scale-95 shadow-lg"
                                          onClick={(e) => { e.stopPropagation(); handleDeleteEvent(app.id); }}
                                        >
                                          <Trash2 className="size-5 sm:size-6" />
                                        </Button>
                                      </div>
                                    </div>

                                    {/* Event Type / "Tipo" moved directly below name */}
                                    <div className={`flex items-center gap-2 self-start text-[9px] sm:text-[11px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl shadow-sm max-w-full ${app.color ? 'bg-black/10 text-white' : (eventTypeTemplate?.bg || 'bg-white/30 text-white backdrop-blur-md border border-white/20')}`}>
                                      {eventTypeTemplate && <eventTypeTemplate.icon className="size-3.5 shrink-0" />}
                                      <span className="truncate">{typeName}</span>
                                    </div>
                                  </div>

                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-auto">
                                    <div className="flex items-center gap-3 opacity-90">
                                      <Clock className="size-5" />
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm sm:text-lg font-bold tracking-tight">
                                          {format(app.date, "HH:mm")} — {format(appEndTime, "HH:mm")}
                                        </span>
                                        <span className="text-[10px] sm:text-xs font-black bg-white/20 px-2 py-0.5 rounded-md uppercase tracking-tighter">
                                          {durationMin} min
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                          {dayApps.length === 0 && !isBlocked && (
                            <Button
                              variant="ghost"
                              onClick={() => openReserveDialog(time, currentDate)}
                              className="opacity-0 group-hover:opacity-100 text-zinc-300 dark:text-zinc-600 font-black h-12 border-2 border-dashed border-zinc-100 dark:border-zinc-800/80 w-full rounded-2xl flex gap-2 transition-all hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-200 dark:hover:border-blue-800 dark:hover:text-blue-400"
                            >
                              <Plus className="h-4 w-4" /> Reservar horário
                            </Button>
                          )}
                          {dayApps.length === 0 && isBlocked && (
                            <div className="flex h-12 items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                                <ShieldAlert className="size-3.5" /> Fora do Expediente
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </TooltipProvider>
  )
}
