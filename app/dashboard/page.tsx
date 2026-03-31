"use client"

import * as React from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  CalendarIcon,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Activity,
  UserCheck,
  Ban,
  Clock,
  Loader2,
} from "lucide-react"
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts"
import { getAppointments } from "@/app/calendar/actions"
import {
  format,
  startOfWeek,
  addDays,
  isSameDay,
  subDays,
  startOfDay,
  endOfDay,
  startOfMonth,
  addMonths,
  subMonths,
  endOfMonth,
  isWithinInterval,
  eachDayOfInterval,
  isSameMonth
} from "date-fns"
import { ptBR } from "date-fns/locale"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { DateRange } from "react-day-picker"
import { cn } from "@/lib/utils"

export default function DashboardPage() {
  const [data, setData] = React.useState<any[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [date, setDate] = React.useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date(),
  })

  // Filtros rápidos
  const setQuickFilter = (type: 'today' | 'past_7' | 'future_7' | 'last_month' | 'this_month' | 'next_month' | 'year') => {
    const today = new Date()
    switch (type) {
      case 'today':
        setDate({ from: startOfDay(today), to: endOfDay(today) })
        break
      case 'past_7':
        setDate({ from: subDays(today, 7), to: today })
        break
      case 'future_7':
        setDate({ from: today, to: addDays(today, 7) })
        break
      case 'last_month':
        const lm = subMonths(today, 1)
        setDate({ from: startOfMonth(lm), to: endOfMonth(lm) })
        break
      case 'this_month':
        setDate({ from: startOfMonth(today), to: endOfMonth(today) })
        break
      case 'next_month':
        const nm = addMonths(today, 1)
        setDate({ from: startOfMonth(nm), to: endOfMonth(nm) })
        break
      case 'year':
        setDate({ from: new Date(today.getFullYear(), 0, 1), to: today })
        break
    }
  }

  const loadData = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const appointments = await getAppointments()
      setData(appointments || [])
    } catch (error) {
      console.error("Erro ao carregar dados do painel:", error)
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    loadData()
  }, [loadData])

  // Filtro de dados baseado no intervalo
  const filteredData = React.useMemo(() => {
    if (!date?.from) return data
    const end = date.to || date.from
    return data.filter(app => {
      const appDate = new Date(app.date)
      return isWithinInterval(appDate, {
        start: startOfDay(date.from!),
        end: endOfDay(end)
      })
    })
  }, [data, date])

  // Cálculos dinâmicos baseados no filtro
  const totalBookings = filteredData.length
  const upcomingCount = filteredData.filter(a => a.status === "PENDING").length
  const completedCount = filteredData.filter(a => a.status === "COMPLETED").length
  const cancelledCount = filteredData.filter(a => a.status === "CANCELLED").length
  const noShowCount = filteredData.filter(a => a.status === "NO_SHOW").length

  const totalRevenue = filteredData
    .filter(a => a.status === "COMPLETED")
    .reduce((sum, a) => sum + (Number(a.revenue) || 0), 0)

  // Dados para o gráfico (Ajusta conforme o intervalo)
  const chartData = React.useMemo(() => {
    if (!date?.from) return []
    const end = date.to || date.from

    // Se o intervalo for curto (até 14 dias), mostra por dia
    const diffDays = Math.ceil((end.getTime() - date.from.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays <= 31) {
      const days = eachDayOfInterval({ start: date.from, end: end })
      return days.map(d => {
        const count = filteredData.filter(app => isSameDay(new Date(app.date), d)).length
        return {
          day: format(d, "dd/MM"),
          bookings: count,
          fullDate: format(d, "EEEE, d 'de' MMMM", { locale: ptBR })
        }
      })
    }

    // Se for longo, agrupa (ex: mensal ou semanal - simplificando para manter por dia mas limitado)
    return []
  }, [filteredData, date])

  if (isLoading) {
    return (
      <div className="flex h-[80vh] w-full items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
          <p className="text-sm font-black uppercase tracking-widest text-zinc-500 animate-pulse">Carregando Painel...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 pb-10">
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tighter uppercase text-zinc-900 dark:text-zinc-50">
            Painel de Controle
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base font-medium tracking-tight">
            Visão geral da clínica alimentada por dados em tempo real.
          </p>
        </div>

        <div className="flex flex-col gap-3 w-full sm:w-[480px]">
          <div className="grid grid-cols-4 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuickFilter('today')}
              className="rounded-xl font-black text-[10px] uppercase tracking-widest h-9 px-0 border-zinc-200 dark:border-zinc-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 shadow-sm w-full"
            >
              Hoje
            </Button>

            <Select onValueChange={(v) => setQuickFilter(v as any)}>
              <SelectTrigger size="default" className="rounded-xl font-black text-[10px] uppercase tracking-widest !h-9 px-0 border-zinc-200 dark:border-zinc-800 hover:bg-amber-50 dark:hover:bg-amber-900/20 hover:text-amber-600 dark:hover:text-amber-400 shadow-sm flex items-center justify-center gap-1 w-full">
                7 Dias
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="past_7">7 Dias Passados</SelectItem>
                <SelectItem value="future_7">7 Dias Futuros</SelectItem>
              </SelectContent>
            </Select>

            <Select onValueChange={(v) => setQuickFilter(v as any)}>
              <SelectTrigger size="default" className="rounded-xl font-black text-[10px] uppercase tracking-widest !h-9 px-0 border-zinc-200 dark:border-zinc-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-sm flex items-center justify-center gap-1 w-full">
                Mês
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last_month">Mês Passado</SelectItem>
                <SelectItem value="this_month">Mês Atual</SelectItem>
                <SelectItem value="next_month">Próximo Mês</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setQuickFilter('year')}
              className="rounded-xl font-black text-[10px] uppercase tracking-widest h-9 px-0 border-zinc-200 dark:border-zinc-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 hover:text-emerald-600 dark:hover:text-emerald-400 shadow-sm w-full"
            >
              Ano
            </Button>
          </div>

          <Popover>
            <PopoverTrigger
              className={cn(
                "w-full inline-flex items-center justify-start text-left font-black uppercase tracking-widest text-[10px] h-11 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-background shadow-sm transition-all hover:border-blue-300 dark:hover:border-blue-700 px-4",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4 text-blue-600" />
              {date?.from ? (
                date.to ? (
                  <>
                    {format(date.from, "dd LLL, y", { locale: ptBR })} -{" "}
                    {format(date.to, "dd LLL, y", { locale: ptBR })}
                  </>
                ) : (
                  format(date.from, "dd LLL, y", { locale: ptBR })
                )
              ) : (
                <span>Selecionar Período</span>
              )}
            </PopoverTrigger>
            <PopoverContent className="w-(--anchor-width) p-4 rounded-2xl border-zinc-200 dark:border-zinc-800 shadow-2xl" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={setDate}
                numberOfMonths={2}
                locale={ptBR}
                className="w-full h-full flex justify-center"
                classNames={{
                  months: "flex flex-col sm:flex-row gap-4 justify-center items-start w-full",
                }}
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total de Reservas */}
        <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Total de Reservas</CardTitle>
            <CalendarIcon className="h-4 w-4 text-zinc-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black tracking-tighter text-zinc-900 dark:text-zinc-50">{totalBookings}</div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">Histórico completo</p>
          </CardContent>
        </Card>

        {/* Por Vir */}
        <Card className="border-l-4 border-l-amber-500 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Reservas por vir</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black tracking-tighter text-zinc-900 dark:text-zinc-50">{upcomingCount}</div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">Aguardando atendimento</p>
          </CardContent>
        </Card>

        {/* Concluídas */}
        <Card className="border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Concluídas</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black tracking-tighter text-zinc-900 dark:text-zinc-50">{completedCount}</div>
            <p className="text-[10px] font-bold text-emerald-600/80 uppercase mt-1">Procedimentos realizados</p>
          </CardContent>
        </Card>

        {/* Canceladas */}
        <Card className="border-l-4 border-l-rose-500 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Canceladas</CardTitle>
            <XCircle className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black tracking-tighter text-zinc-900 dark:text-zinc-50">{cancelledCount}</div>
            <p className="text-[10px] font-bold text-rose-600/80 uppercase mt-1">Taxa de cancelamento: {totalBookings > 0 ? ((cancelledCount / totalBookings) * 100).toFixed(1) : 0}%</p>
          </CardContent>
        </Card>

        {/* Não Comparecimento */}
        <Card className="border-l-4 border-l-zinc-500 shadow-sm hover:shadow-md transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-zinc-500">No-show</CardTitle>
            <Ban className="h-4 w-4 text-zinc-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black tracking-tighter text-zinc-900 dark:text-zinc-50">{noShowCount}</div>
            <p className="text-[10px] font-bold text-zinc-500 uppercase mt-1">Pacientes ausentes</p>
          </CardContent>
        </Card>

        {/* Receita Total */}
        <Card className="border-l-4 border-l-indigo-600 shadow-sm bg-indigo-50/30 dark:bg-indigo-950/20 lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-indigo-700 dark:text-indigo-400">Receita Realizada</CardTitle>
            <TrendingUp className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black tracking-tighter text-indigo-900 dark:text-indigo-100">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalRevenue)}
            </div>
            <p className="text-[10px] font-bold text-indigo-600/80 uppercase mt-1">Faturamento consolidado</p>
          </CardContent>
        </Card>

        {/* Média */}
        <Card className="border-l-4 border-l-red-500 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Média Diária</CardTitle>
            <Activity className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black tracking-tighter text-zinc-900 dark:text-zinc-50">
              {(completedCount / 30).toFixed(1)}
            </div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">Eventos p/ dia (mês)</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-7">
        <Card className="lg:col-span-4 border-zinc-200 dark:border-zinc-800 shadow-sm">
          <CardHeader className="bg-zinc-50/50 dark:bg-zinc-900/50 border-b dark:border-zinc-800 pb-4">
            <CardTitle className="text-lg font-black tracking-tighter uppercase">Volume de Atendimentos</CardTitle>
            <CardDescription className="text-xs font-medium italic">Agendamentos distribuídos na semana atual.</CardDescription>
          </CardHeader>
          <CardContent className="pt-8 pl-0">
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis
                    dataKey="day"
                    stroke="#888888"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    className="font-black uppercase"
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={10}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}`}
                    className="font-black"
                  />
                  <Tooltip
                    cursor={{ fill: 'currentColor', opacity: 0.1 }}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 p-3 rounded-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 mb-1">
                              {payload[0].payload.fullDate || payload[0].payload.day}
                            </p>
                            <p className="text-sm font-black text-blue-600 dark:text-blue-400">
                              {payload[0].value} Reservas
                            </p>
                          </div>
                        )
                      }
                      return null
                    }}
                  />
                  <Bar
                    dataKey="bookings"
                    fill="#2563eb"
                    radius={[6, 6, 0, 0]}
                    className="drop-shadow-xl"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 border-zinc-200 dark:border-zinc-800 shadow-sm">
          <CardHeader className="bg-zinc-50/50 dark:bg-zinc-900/50 border-b dark:border-zinc-800 pb-4">
            <CardTitle className="text-lg font-black tracking-tighter uppercase">Insights Rápidos</CardTitle>
            <CardDescription className="text-xs font-medium italic">Alertas baseados no banco de dados.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 pt-6">
            <div className="flex items-center gap-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-4 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 transition-all border-l-4 border-l-emerald-500">
              <UserCheck className="h-6 w-6 text-emerald-500" />
              <div className="flex flex-col">
                <span className="text-sm font-black uppercase tracking-tight">{upcomingCount} Pacientes</span>
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Aguardando na fila oficial</span>
              </div>
            </div>
            <div className="flex items-center gap-4 rounded-2xl border border-zinc-100 dark:border-zinc-800 p-4 hover:bg-amber-50 dark:hover:bg-amber-950/20 transition-all border-l-4 border-l-amber-500">
              <Clock className="h-6 w-6 text-amber-500" />
              <div className="flex flex-col">
                <span className="text-sm font-black uppercase tracking-tight">Taxa de Conclusão</span>
                <span className="text-[10px] font-bold text-muted-foreground uppercase">
                  {totalBookings > 0 ? ((completedCount / (completedCount + noShowCount)) * 100).toFixed(0) : 0}% de presença confirmada
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
