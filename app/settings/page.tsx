"use client"

import * as React from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTheme } from "next-themes"
import {
  UserPlus,
  Mail,
  Shield,
  Bell,
  UserCircle2,
  Trash2,
  Save,
  ShieldCheck,
  Settings2,
  Moon,
  Sun,
  Monitor,
  Plus,
  Loader2
} from "lucide-react"
import {
  addService,
  deleteService,
  addEventType,
  deleteEventType
} from "./actions"
import { getServices, getEventTypes } from "../calendar/actions"
import { toast } from "sonner"

function ConfigSection({
  title,
  description,
  items,
  onAdd,
  onDelete,
  placeholder
}: {
  title: string,
  description: string,
  items: any[],
  onAdd: (nome: string) => Promise<void>,
  onDelete: (id: string) => Promise<void>,
  placeholder: string
}) {
  const [inputValue, setInputValue] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const handleAdd = async () => {
    if (!inputValue.trim()) return
    setIsSubmitting(true)
    await onAdd(inputValue)
    setInputValue("")
    setIsSubmitting(false)
  }

  return (
    <Card className="shadow-sm flex flex-col h-[500px] border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 flex flex-col flex-1 overflow-hidden pb-6">
        <div className="flex gap-2 shrink-0">
          <Input
            placeholder={placeholder}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            className="bg-transparent"
          />
          <Button onClick={handleAdd} disabled={isSubmitting || !inputValue.trim()} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          </Button>
        </div>

        <div className="flex-1 border rounded-md divide-y overflow-y-auto custom-scrollbar border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/10">
          {items.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground italic">
              Nenhum item cadastrado.
            </div>
          ) : (
            items.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-white dark:bg-transparent hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                <span className="text-sm font-medium">{item.nome}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                  onClick={() => onDelete(item.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default function SettingsPage() {

  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)
  const [services, setServices] = React.useState<any[]>([])
  const [eventTypes, setEventTypes] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)

  // Prevenir erro de hidratação
  React.useEffect(() => {
    setMounted(true)
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [s, e] = await Promise.all([getServices(), getEventTypes()])
      setServices(s)
      setEventTypes(e)
    } catch (error) {
      console.error(error)
      toast.error("Erro ao carregar dados")
    } finally {
      setLoading(false)
    }
  }

  const handleAddService = async (nome: string) => {
    try {
      const newService = await addService(nome)
      setServices([...services, newService])
      toast.success("Serviço adicionado!")
    } catch (err) {
      toast.error("Erro ao adicionar serviço")
    }
  }

  const handleDeleteService = async (id: string) => {
    try {
      await deleteService(id)
      setServices(services.filter(s => s.id !== id))
      toast.success("Serviço removido!")
    } catch (err) {
      toast.error("Erro ao remover serviço")
    }
  }

  const handleAddEventType = async (nome: string) => {
    try {
      const newEvent = await addEventType(nome)
      setEventTypes([...eventTypes, newEvent])
      toast.success("Tipo de evento adicionado!")
    } catch (err) {
      toast.error("Erro ao adicionar tipo de evento")
    }
  }

  const handleDeleteEventType = async (id: string) => {
    try {
      await deleteEventType(id)
      setEventTypes(eventTypes.filter(e => e.id !== id))
      toast.success("Tipo de evento removido!")
    } catch (err) {
      toast.error("Erro ao remover tipo de evento")
    }
  }

  if (!mounted) return null

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">Gerencie as preferências do sistema e usuários.</p>
      </div>

      <Tabs defaultValue="geral" className="w-full">
        <div className="w-full flex justify-center mb-8 sm:mb-12">
          <div className="w-full max-w-2xl overflow-x-auto no-scrollbar py-2 px-4">
            <TabsList className="flex mx-auto w-fit sm:w-full h-20 bg-zinc-100/50 dark:bg-zinc-900/50 p-4 py-6 rounded-lg border border-zinc-200/50 dark:border-zinc-800/50 backdrop-blur-md transition-all">
              <TabsTrigger
                value="geral"
                className="flex-1 p-4 sm:px-8 rounded-md text-[11px] sm:text-xs font-black uppercase tracking-widest transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-md data-[state=inactive]:text-zinc-500 h-full whitespace-nowrap"
              >
                Geral
              </TabsTrigger>
              <TabsTrigger
                value="servicos"
                className="flex-1 p-4 sm:px-8 rounded-md text-[11px] sm:text-xs font-black uppercase tracking-widest transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-md data-[state=inactive]:text-zinc-500 h-full whitespace-nowrap"
              >
                Serviços & Eventos
              </TabsTrigger>
              <TabsTrigger
                value="usuarios"
                className="flex-1 p-4 sm:px-8 rounded-md text-[11px] sm:text-xs font-black uppercase tracking-widest transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-zinc-800 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-md data-[state=inactive]:text-zinc-500 h-full whitespace-nowrap"
              >
                Usuários
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        <TabsContent value="geral" className="space-y-6 pt-6">
          <Card className="bg-white dark:bg-zinc-950/40 backdrop-blur-xl border-zinc-200 dark:border-zinc-800 shadow-2xl rounded-3xl overflow-hidden">
            <CardHeader className="p-8 sm:p-10 border-b border-zinc-100 dark:border-zinc-800/50">
              <CardTitle className="text-2xl font-black uppercase tracking-tighter text-zinc-900 dark:text-zinc-100">
                Configurações Administrativas
              </CardTitle>
              <CardDescription className="text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed">
                Defina os parâmetros básicos de funcionamento para toda a clínica.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 sm:p-10 space-y-8">
              <div className="grid gap-3">
                <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2 px-1">
                  <Mail className="h-4 w-4" /> E-mail do Administrador
                </Label>
                <Input 
                  id="email" 
                  type="email" 
                  defaultValue="admin@cardioclinic.com" 
                  className="h-14 max-w-md bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 rounded-2xl px-6 font-bold text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-600/20" 
                />
              </div>

              <div className="grid gap-3">
                <Label htmlFor="start" className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2 px-1">
                  <Clock className="h-4 w-4" /> Início Visual do Calendário
                </Label>
                <div className="flex flex-col gap-2">
                  <Input 
                    id="start" 
                    type="time" 
                    defaultValue="08:00" 
                    className="h-14 w-full sm:w-[150px] bg-zinc-50/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 rounded-2xl px-6 font-bold text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-blue-600/20" 
                  />
                  <p className="text-[11px] text-zinc-400 dark:text-zinc-500 font-bold px-1 uppercase tracking-tighter">Define a primeira hora exibida na agenda.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                <div className="flex items-center justify-between p-6 bg-zinc-50/50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 rounded-3xl transition-all hover:border-zinc-200 dark:hover:border-zinc-700">
                  <div className="space-y-1">
                    <Label className="text-sm font-black uppercase tracking-tighter text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      {theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                      Modo Escuro
                    </Label>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Trocar tema visual.</p>
                  </div>
                  <Switch
                    checked={theme === "dark"}
                    onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                    className="data-[state=checked]:bg-blue-600"
                  />
                </div>

                <div className="flex items-center justify-between p-6 bg-zinc-50/50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800 rounded-3xl transition-all hover:border-zinc-200 dark:hover:border-zinc-700">
                  <div className="space-y-1">
                    <Label className="text-sm font-black uppercase tracking-tighter text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                      <Save className="h-4 w-4" /> Auto-concluir
                    </Label>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">Marcar fim do expediente.</p>
                  </div>
                  <Switch
                    checked={true}
                    onCheckedChange={() => { }}
                    className="data-[state=checked]:bg-emerald-600"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="p-8 sm:p-10 pt-0 bg-white/50 dark:bg-zinc-950/20 flex justify-end">
              <Button className="h-14 px-10 bg-emerald-600 hover:bg-emerald-700 font-black uppercase tracking-widest text-[11px] rounded-2xl shadow-xl shadow-emerald-200/50 dark:shadow-none transition-all hover:scale-[1.02] active:scale-95 text-white">
                <Save className="mr-3 h-5 w-5" /> Salvar Preferências
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="servicos" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ConfigSection
              title="Tipos de Eventos"
              description="Gerencie as categorias de eventos na agenda."
              items={eventTypes}
              onAdd={handleAddEventType}
              onDelete={handleDeleteEventType}
              placeholder="Ex: Cirurgia, Workshop..."
            />
            <ConfigSection
              title="Serviços"
              description="Gerencie os procedimentos e serviços oferecidos."
              items={services}
              onAdd={handleAddService}
              onDelete={handleDeleteService}
              placeholder="Ex: Consulta, Eletrocardiograma..."
            />
          </div>
        </TabsContent>

        <TabsContent value="usuarios" className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Gerenciamento de Usuários</CardTitle>
                <CardDescription>Controle quem tem acesso e quais as permissões.</CardDescription>
              </div>
              <Button variant="outline" className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" /> Convidar
              </Button>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-zinc-50/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-700 dark:text-blue-400 font-bold">DC</div>
                    <div className="flex flex-col">
                      <span className="font-medium">Dr. Cardiologista (Você)</span>
                      <span className="text-xs text-muted-foreground">admin@cardioclinic.com</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge className="bg-blue-600 hover:bg-blue-600">ADMIN</Badge>
                    <Button variant="ghost" size="icon" disabled><Trash2 className="h-4 w-4 opacity-30" /></Button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-zinc-50/50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-700 dark:text-amber-400 font-bold">S1</div>
                    <div className="flex flex-col">
                      <span className="font-medium">Secretária 01</span>
                      <span className="text-xs text-muted-foreground">reception@cardioclinic.com</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant="secondary">SECRETÁRIA</Badge>
                    <Button variant="ghost" size="icon" className="text-rose-500 hover:text-rose-600"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function Badge({ children, className, variant }: { children: React.ReactNode, className?: string, variant?: string }) {
  const variants: any = {
    default: "bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900",
    secondary: "bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100",
    outline: "text-zinc-950 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-800"
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors ${className} ${variants[variant || 'default']}`}>
      {children}
    </span>
  )
}

function Clock(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}
