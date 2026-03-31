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
  Monitor
} from "lucide-react"

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  // Prevenir erro de hidratação
  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground">Gerencie as preferências do sistema e usuários.</p>
      </div>

      <Tabs defaultValue="geral" className="w-full">
        <TabsList className="grid w-full grid-cols-3 md:w-[400px] mb-8">
          <TabsTrigger value="geral" className="flex gap-2">
            <Settings2 className="h-4 w-4" /> Geral
          </TabsTrigger>
          <TabsTrigger value="usuarios" className="flex gap-2">
            <Shield className="h-4 w-4" /> Usuários
          </TabsTrigger>
          <TabsTrigger value="notificacoes" className="flex gap-2">
            <Bell className="h-4 w-4" /> Notificações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="geral" className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle>Configurações Administrativas</CardTitle>
              <CardDescription>Defina os parâmetros básicos de funcionamento.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" /> E-mail do Administrador
                </Label>
                <Input id="email" type="email" defaultValue="admin@cardioclinic.com" className="max-w-md" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="start" className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" /> Início do Calendário
                </Label>
                <Input id="start" type="time" defaultValue="08:00" className="w-[150px]" />
                <p className="text-xs text-muted-foreground mt-1">Define o horário de início visual da agenda.</p>
              </div>

              <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                <div className="space-y-1">
                  <Label className="font-semibold flex items-center gap-2">
                    {theme === "dark" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                    Modo Escuro
                  </Label>
                  <p className="text-xs text-muted-foreground">Alternar entre os temas claro e escuro da plataforma.</p>
                </div>
                <Switch 
                  checked={theme === "dark"} 
                  onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")} 
                />
              </div>

              <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                <div className="space-y-1">
                  <Label className="font-semibold">Auto-concluir Reservas</Label>
                  <p className="text-xs text-muted-foreground">Marcar reservas como concluídas automaticamente após o fim do expediente.</p>
                </div>
                <Switch 
                  checked={true}
                  onCheckedChange={() => {}} 
                />
              </div>
            </CardContent>
            <CardFooter className="bg-zinc-50/50 p-6 border-t flex justify-end">
                <Button className="bg-emerald-600 hover:bg-emerald-700">
                   <Save className="mr-2 h-4 w-4" /> Salvar Preferências
                </Button>
            </CardFooter>
          </Card>
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
