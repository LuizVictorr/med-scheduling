"use client"

import * as React from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Search, Plus, MoreHorizontal, Edit, Trash2, Calendar as CalendarIcon, User, ShieldAlert, RotateCcw, Activity } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { getAppointments, createAppointment, deleteAppointment, updateAppointmentStatus, updateAppointment, getServices, getEventTypes } from "@/app/calendar/actions"
import { format, parseISO, setHours, setMinutes } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription,
  DialogClose
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

const statusLabels: Record<string, string> = {
  "PENDING": "PENDENTE",
  "COMPLETED": "CONCLUÍDO",
  "CANCELLED": "CANCELADO",
  "NO_SHOW": "NÃO COMPARECEU",
}

const statusStyles: Record<string, string> = {
  "PENDING": "bg-amber-100 text-amber-700 hover:bg-amber-100 border-amber-200",
  "COMPLETED": "bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200",
  "CANCELLED": "bg-rose-100 text-rose-700 hover:bg-rose-100 border-rose-200",
  "NO_SHOW": "bg-zinc-100 text-zinc-700 hover:bg-zinc-100 border-zinc-200",
}

const eventTypes = [
  { value: "Consulta", label: "Consulta Particular", icon: User, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/20" },
  { value: "Bloqueio", label: "Bloqueio da Agenda", icon: ShieldAlert, color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-900/20" },
  { value: "Retorno", label: "Retorno de Paciente", icon: RotateCcw, color: "text-amber-500 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/20" },
  { value: "Eletrocardiograma", label: "Eletrocardiograma", icon: Activity, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
  { value: "Doppler Arterial", label: "Doppler Arterial", icon: Activity, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
  { value: "MAPA 24H", label: "MAPA 24H", icon: Activity, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
  { value: "Ultrassom", label: "Ultrassom", icon: Activity, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
  { value: "Cirurgia", label: "Procedimento Cirúrgico", icon: ShieldAlert, color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-900/20" },
]

export default function BookingsPage() {
  const [search, setSearch] = React.useState("")
  const [data, setData] = React.useState<any[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [isConfirmDeleteDialogOpen, setIsConfirmDeleteDialogOpen] = React.useState(false)
  const [appointmentToDelete, setAppointmentToDelete] = React.useState<any | null>(null)
  const [services, setServices] = React.useState<any[]>([])
  const [eventTypesList, setEventTypesList] = React.useState<any[]>([])
  const [currentPage, setCurrentPage] = React.useState(1)
  const [itemsPerPage, setItemsPerPage] = React.useState(10)
  
  const [formData, setFormData] = React.useState({
    patientName: "",
    type: "", // Will be set after services load
    date: new Date(),
    startTime: "09:00",
    endTime: "09:30",
    revenue: 0
  })

  // Set default type when services load
  React.useEffect(() => {
    if (services.length > 0 && !formData.type) {
      const consulta = services.find(s => s.nome === "Consulta")
      if (consulta) setFormData(prev => ({ ...prev, type: consulta.id }))
    }
  }, [services])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [appointments, serviceData, eventTypeData] = await Promise.all([
        getAppointments(),
        getServices(),
        getEventTypes()
      ])
      setServices(serviceData || [])
      setEventTypesList(eventTypeData || [])
      // Fix: Ensure status is never undefined/null to avoid Select warning
      const sanitizedData = (appointments || []).map((app: any) => ({
        ...app,
        status: app.status || "PENDING"
      }))
      setData(sanitizedData)
    } catch (err) {
      console.error("Erro ao carregar reservas:", err)
      toast.error("Erro ao carregar os dados das reservas.")
    } finally {
      setIsLoading(false)
    }
  }

  React.useEffect(() => {
    loadData()
  }, [])

  // Reset page on search
  React.useEffect(() => {
    setCurrentPage(1)
  }, [search])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      const [sh, sm] = formData.startTime.split(":").map(Number)
      const [eh, em] = formData.endTime.split(":").map(Number)
      
      const startDate = setMinutes(setHours(formData.date, sh), sm)
      const endDate = setMinutes(setHours(formData.date, eh), em)

      const payload = {
        patientName: formData.patientName,
        type: formData.type,
        date: startDate,
        endTime: endDate,
        revenue: formData.revenue
      }

      if (editingId) {
        await updateAppointment(editingId, payload as any)
        toast.success("Reserva atualizada com sucesso!")
      } else {
        await createAppointment(payload as any)
        toast.success("Reserva criada com sucesso!")
      }

      setIsDialogOpen(false)
      setEditingId(null)
      loadData()
      
      // Reset form
      setFormData({
        patientName: "",
        type: services.find(s => s.nome === "Consulta")?.id || "",
        date: new Date(),
        startTime: "09:00",
        endTime: "09:30",
        revenue: 0
      })
    } catch (err) {
      console.error("Erro ao salvar reserva:", err)
      toast.error(`Falha ao ${editingId ? 'atualizar' : 'criar'} reserva manual.`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = (appointment: any) => {
    setEditingId(appointment.id)
    setFormData({
      patientName: appointment.patientName,
      type: appointment.type,
      date: new Date(appointment.date),
      startTime: format(new Date(appointment.date), "HH:mm"),
      endTime: appointment.endTime ? format(new Date(appointment.endTime), "HH:mm") : "10:00",
      revenue: appointment.revenue || 0
    })
    setIsDialogOpen(true)
  }

  const handleDeleteClick = (appointment: any) => {
    setAppointmentToDelete(appointment)
    setIsConfirmDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!appointmentToDelete) return
    setIsSubmitting(true)
    try {
      await deleteAppointment(appointmentToDelete.id)
      setData(prev => prev.filter(a => a.id !== appointmentToDelete.id))
      toast.success("Reserva excluída com sucesso!")
      setIsConfirmDeleteDialogOpen(false)
    } catch (err) {
      toast.error("Erro ao excluir reserva.")
    } finally {
      setIsSubmitting(false)
      setAppointmentToDelete(null)
    }
  }

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await updateAppointmentStatus(id, newStatus)
      setData(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item))
      toast.success("Status atualizado!")
    } catch (err) {
      toast.error("Erro ao mudar status.")
    }
  }

  const filteredData = data.filter(b => 
    b.patientName?.toLowerCase().includes(search.toLowerCase())
  )

  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tighter uppercase text-zinc-900 dark:text-zinc-50">Reservas</h1>
          <p className="text-muted-foreground text-sm sm:text-base font-medium tracking-tight">Listagem completa de todos os agendamentos realizados.</p>
        </div>
        <Button 
          onClick={() => {
            setEditingId(null)
            setFormData({
              patientName: "",
              type: "Consulta",
              date: new Date(),
              startTime: "09:00",
              endTime: "09:30",
              revenue: 0
            })
            setIsDialogOpen(true)
          }} 
          className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 h-14 px-8 font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-200 dark:shadow-none rounded-2xl transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center"
        >
          <Plus className="mr-2 h-5 w-5" /> Nova Reserva Manual
        </Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="w-[95vw] sm:max-w-[700px] p-0 overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-3xl">
          <DialogHeader className="p-8 bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-white border-b border-zinc-100 dark:border-zinc-800">
            <DialogTitle className="text-2xl font-black uppercase tracking-tighter">{editingId ? "Editar Reserva" : "Nova Reserva Manual"}</DialogTitle>
            <DialogDescription className="text-zinc-500 dark:text-zinc-400">
              {editingId ? "Atualize as informações do agendamento." : "Insira os detalhes do paciente para criar uma reserva direta."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="p-8 bg-white dark:bg-zinc-950 grid gap-6 max-h-[70vh] sm:max-h-none overflow-y-auto">
            <div className="grid gap-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Nome do Paciente</Label>
              <Input 
                value={formData.patientName}
                onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                placeholder="Ex Nome Completo" 
                className="h-12 border-zinc-200 rounded-xl"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Tipo</Label>
                <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v || "" })}>
                  <SelectTrigger className="!h-12 w-full rounded-xl border-zinc-200 dark:bg-zinc-900/50 dark:border-zinc-800 transition-all focus:ring-blue-600/20 active:scale-[0.98]">
                    {(() => {
                      const service = services.find(s => s.id === formData.type);
                      const typeName = service ? service.nome : (editingId ? "Aguarde..." : "");
                      const template = eventTypes.find(t => t.value === typeName) || {
                        icon: Activity,
                        color: "text-blue-600 dark:text-blue-400",
                        bg: "bg-blue-50 dark:bg-blue-900/20"
                      };

                      return (
                        <div className="flex items-center gap-3">
                          <div className={cn("p-1.5 rounded-lg", template.bg)}>
                            {React.createElement(template.icon, { className: cn("size-3.5", template.color) })}
                          </div>
                          <span className="font-bold truncate">
                            {typeName || "Selecione um serviço"}
                          </span>
                        </div>
                      );
                    })()}
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl shadow-2xl p-2 border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950 max-h-[300px]">
                    {services.map((s) => {
                      const template = eventTypes.find(t => t.value === s.nome) || {
                        icon: Activity,
                        color: "text-blue-600 dark:text-blue-400",
                        bg: "bg-blue-50 dark:bg-blue-900/20"
                      };
                      return (
                        <SelectItem key={s.id} value={s.id} className="rounded-xl px-4 py-3 focus:bg-zinc-50 dark:focus:bg-zinc-900 group/item transition-colors">
                          <div className="flex items-center gap-4">
                            <div className={cn("p-2 rounded-lg transition-transform group-focus/item:scale-110", template.bg)}>
                              <template.icon className={cn("size-4", template.color)} />
                            </div>
                            <span className="font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">{s.nome}</span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Valor (R$)</Label>
                <Input 
                  type="number"
                  value={formData.revenue}
                  onChange={(e) => setFormData({ ...formData, revenue: Number(e.target.value) })}
                  className="h-12 border-zinc-200 rounded-xl"
                />
              </div>
            </div>

            <div className="grid gap-3">
              <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Data e Horários</Label>
              <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px_120px] gap-4 items-end">
                <div className="grid gap-2">
                  <Input 
                    type="date"
                    value={format(formData.date, "yyyy-MM-dd")}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val) {
                        setFormData({ ...formData, date: parseISO(val) });
                      }
                    }}
                    className="h-14 w-full border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 bg-zinc-50/20 dark:bg-zinc-900/50 rounded-2xl px-6 text-sm dark:text-zinc-100"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 sm:contents gap-4">
                  <div className="grid gap-2">
                    <Input
                      type="time"
                      className="h-14 w-full border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 bg-zinc-50/20 dark:bg-zinc-900/50 rounded-2xl px-4 text-center text-sm dark:text-zinc-100"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Input
                      type="time"
                      className="h-14 w-full border-zinc-200 dark:border-zinc-800 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 bg-zinc-50/20 dark:bg-zinc-900/50 rounded-2xl px-4 text-center text-sm dark:text-zinc-100"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-6 sm:pt-8 mt-4 border-t border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Button 
                type="submit" 
                disabled={isSubmitting} 
                className="bg-blue-600 hover:bg-blue-700 h-14 w-full sm:flex-1 font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-200 dark:shadow-none rounded-2xl transition-all hover:scale-[1.02] active:scale-95 order-1 sm:order-2"
              >
                {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : "Criar Reserva"}
              </Button>
              <Button 
                type="button" 
                variant="ghost" 
                disabled={isSubmitting}
                onClick={() => setIsDialogOpen(false)} 
                className="h-14 w-full sm:flex-1 font-black uppercase tracking-widest text-[11px] hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 rounded-2xl transition-all active:scale-95 order-2 sm:order-1"
              >
                Cancelar
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Card className="shadow-sm border-zinc-200 dark:border-zinc-800">
        <CardHeader className="bg-zinc-50/50 dark:bg-zinc-900/50 border-b dark:border-zinc-800">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-sm font-black uppercase tracking-widest text-zinc-500">Histórico de Reservas</CardTitle>
              <CardDescription className="text-xs">Visualize e gerencie todos os agendamentos registrados.</CardDescription>
            </div>
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <Input 
                placeholder="Pesquisar por paciente..." 
                className="pl-9 h-10 border-zinc-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-900" 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-zinc-50/30 dark:bg-zinc-950/30">
              <TableRow className="hover:bg-transparent border-b dark:border-zinc-800">
                <TableHead className="text-[10px] font-black uppercase tracking-widest py-4">Paciente</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest py-4">Serviço</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest py-4">Data/Hora</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest py-4">Status</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest py-4 text-right">Valor</TableHead>
                <TableHead className="text-[10px] font-black uppercase tracking-widest py-4 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-40 text-center"><Loader2 className="animate-spin h-8 w-8 mx-auto opacity-20" /></TableCell>
                </TableRow>
              ) : paginatedData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-40 text-center text-muted-foreground font-medium">Nenhuma reserva encontrada.</TableCell>
                </TableRow>
              ) : (
                paginatedData.map((booking) => (
                  <TableRow key={booking.id} className="group border-b dark:border-zinc-900/50 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-colors">
                    <TableCell className="py-4">
                      <div className="flex flex-col">
                        <span className="font-black text-sm text-zinc-900 dark:text-zinc-100 tracking-tight">{booking.patientName}</span>
                        <span className="text-[10px] text-zinc-400 font-medium">ID: {booking.id.slice(0, 8)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge variant="outline" className="bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 text-[10px] font-bold">
                        {services.find(s => s.id === booking.type)?.nome || 
                         eventTypesList.find(e => e.id === booking.type)?.nome || 
                         booking.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                          {format(new Date(booking.date), "dd/MM/yyyy")}
                        </span>
                        <span className="text-[10px] font-medium text-zinc-400">
                          {format(new Date(booking.date), "HH:mm")} — {booking.endTime ? format(new Date(booking.endTime), "HH:mm") : "..."}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <Select key={booking.id} value={booking.status || "PENDING"} onValueChange={(v) => handleUpdateStatus(booking.id, v || "PENDING")}>
                        <SelectTrigger className={cn("h-7 px-2 text-[10px] font-bold rounded-lg border-none w-32", statusStyles[booking.status as string] || "bg-zinc-100")}>
                          <SelectValue>{statusLabels[booking.status as string] || booking.status}</SelectValue>
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-zinc-200 dark:border-zinc-800 shadow-2xl">
                          {Object.entries(statusLabels).map(([val, label]) => (
                            <SelectItem key={val} value={val} className="text-[10px] font-bold">{label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="py-4 text-right font-black text-sm text-emerald-600 dark:text-emerald-400">
                      {booking.revenue > 0 ? `R$ ${booking.revenue.toLocaleString()}` : "-"}
                    </TableCell>
                    <TableCell className="py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleEdit(booking)}
                          className="h-8 w-8 text-zinc-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDeleteClick(booking)}
                          className="h-8 w-8 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-[10px] font-bold uppercase tracking-widest text-zinc-400 bg-zinc-50/30 dark:bg-zinc-950/30">
            <div className="flex items-center gap-4">
              <span>{filteredData.length} registros</span>
              <div className="flex items-center gap-2 border-l pl-4 dark:border-zinc-800">
                <span className="hidden sm:inline">Exibir</span>
                <Select value={String(itemsPerPage)} onValueChange={(v) => setItemsPerPage(Number(v))}>
                  <SelectTrigger className="h-7 w-16 text-[10px] font-bold border-zinc-200 dark:border-zinc-800 rounded-lg">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {[5, 10, 20, 50].map(size => (
                      <SelectItem key={size} value={String(size)} className="text-[10px] font-bold">{size}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <span className="text-zinc-500">Página {currentPage} de {totalPages || 1}</span>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 px-4 rounded-lg text-[10px] border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all active:scale-95 disabled:opacity-30" 
                  disabled={currentPage === 1 || isLoading}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                >
                  Anterior
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 px-4 rounded-lg text-[10px] border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-all active:scale-95 disabled:opacity-30" 
                  disabled={currentPage === totalPages || totalPages === 0 || isLoading}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                >
                  Próxima
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      <Dialog open={isConfirmDeleteDialogOpen} onOpenChange={setIsConfirmDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden border border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-3xl">
          <DialogHeader className="p-8 bg-rose-50 dark:bg-rose-950/20 border-b border-rose-100 dark:border-rose-900/30">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-xl bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center text-rose-600 dark:text-rose-400">
                <Trash2 className="h-5 w-5" />
              </div>
              <DialogTitle className="text-xl font-black uppercase tracking-tighter text-rose-700 dark:text-rose-400">Excluir Reserva</DialogTitle>
            </div>
            <DialogDescription className="text-rose-600/70 dark:text-rose-400/50 font-medium">
              Tem certeza que deseja excluir a reserva de <span className="font-bold text-rose-700 dark:text-rose-300">{appointmentToDelete?.patientName}</span>? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <div className="p-6 bg-white dark:bg-zinc-950 flex flex-col sm:flex-row gap-3">
            <Button 
              variant="ghost" 
              onClick={() => setIsConfirmDeleteDialogOpen(false)}
              className="flex-1 h-12 rounded-xl font-bold text-zinc-500 hover:text-zinc-900"
            >
              Cancelar
            </Button>
            <Button 
              onClick={confirmDelete}
              disabled={isSubmitting}
              className="flex-1 h-12 rounded-xl bg-rose-600 hover:bg-rose-700 font-black uppercase tracking-widest text-[10px] text-white shadow-lg shadow-rose-200 dark:shadow-none transition-all active:scale-95"
            >
              {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : "Sim, Excluir"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
