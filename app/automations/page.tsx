"use client"

import * as React from "react"
import { 
  Zap, 
  Mail, 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Send, 
  Loader2,
  Bell,
  Sparkles,
  ArrowRight
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

export default function AutomationsPage() {
  const [isEmailSimulating, setIsEmailSimulating] = React.useState(false)
  const [automations, setAutomations] = React.useState({
    whatsapp: true,
    email: true,
    survey: false,
    followup: true
  })

  const toggleAutomation = (key: keyof typeof automations) => {
    setAutomations(prev => ({ ...prev, [key]: !prev[key] }))
    toast.success(`${key.charAt(0).toUpperCase() + key.slice(1)} ${!automations[key] ? 'ativado' : 'desativado'}!`)
  }

  const simulateEmail = async () => {
    setIsEmailSimulating(true)
    const promise = new Promise((resolve) => setTimeout(resolve, 2000))
    
    toast.promise(promise, {
      loading: 'Processando simulação de e-mail...',
      success: 'E-mail de teste enviado com sucesso para luiz***@gmail.com!',
      error: 'Erro ao simular envio.',
    })

    await promise
    setIsEmailSimulating(false)
  }

  return (
    <div className="flex flex-col gap-8 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tighter uppercase text-zinc-900 dark:text-zinc-50 flex items-center gap-3">
            <Zap className="h-8 w-8 text-blue-600 animate-pulse" />
            Automações
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base font-medium tracking-tight">
            Gerencie fluxos inteligentes de comunicação e engajamento com seus pacientes.
          </p>
        </div>
        <Badge variant="outline" className="w-fit bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 font-black px-4 py-1.5 rounded-xl uppercase tracking-widest text-[10px]">
          Smart Workflows Ativos
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* WhatsApp Reminders */}
        <Card className="overflow-hidden border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all duration-300">
          <CardHeader className="bg-zinc-50/50 dark:bg-zinc-900/50 border-b dark:border-zinc-800 flex flex-row items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-inner">
                <MessageSquare className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-lg font-black tracking-tighter uppercase">Lembretes WhatsApp</CardTitle>
                <CardDescription className="text-xs font-medium">Envio automático 24h antes do agendamento.</CardDescription>
              </div>
            </div>
            <Switch 
              checked={automations.whatsapp} 
              onCheckedChange={() => toggleAutomation('whatsapp')}
              className="data-[state=checked]:bg-emerald-500"
            />
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-start gap-4 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800">
                <Clock className="h-5 w-5 text-zinc-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Status Interno</p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 font-medium">98% de taxa de entrega nos últimos 30 dias.</p>
                </div>
              </div>
              <div className="flex justify-between items-center bg-white dark:bg-zinc-950 p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 shadow-sm">
                <span className="text-xs font-black uppercase text-zinc-400 tracking-wider">Custo por disparo</span>
                <span className="text-sm font-black text-emerald-600">R$ 0,12 / msg</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Email Automation (Simulation) */}
        <Card className="overflow-hidden border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all duration-300">
          <CardHeader className="bg-zinc-50/50 dark:bg-zinc-900/50 border-b dark:border-zinc-800 flex flex-row items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-inner">
                <Mail className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-lg font-black tracking-tighter uppercase">E-mail de Confirmação</CardTitle>
                <CardDescription className="text-xs font-medium">Envio instantâneo após a criação da reserva.</CardDescription>
              </div>
            </div>
            <Switch 
              checked={automations.email} 
              onCheckedChange={() => toggleAutomation('email')}
              className="data-[state=checked]:bg-blue-500"
            />
          </CardHeader>
          <CardContent className="p-6 flex flex-col justify-between h-full min-h-[160px]">
            <div className="grid gap-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Template Ativo</span>
                  <Badge variant="outline" className="text-[9px] uppercase font-bold py-0 h-5">Modern_Med_v2</Badge>
                </div>
                <div className="w-full bg-zinc-100 dark:bg-zinc-900 h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-600 h-full w-3/4" />
                </div>
                <p className="text-[10px] text-zinc-500 font-medium">Otimizado para conversão de presença.</p>
              </div>
            </div>
            <Button 
              size="sm"
              disabled={isEmailSimulating}
              onClick={simulateEmail}
              className="mt-6 w-full h-11 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 font-black uppercase tracking-widest text-[10px] rounded-xl hover:scale-[1.02] transition-transform active:scale-95 flex items-center justify-center gap-2"
            >
              {isEmailSimulating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {isEmailSimulating ? "SIMULANDO..." : "TESTAR ENVIO SIMULADO"}
            </Button>
          </CardContent>
        </Card>

        {/* NPS / Survey */}
        <Card className="overflow-hidden border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all duration-300">
          <CardHeader className="bg-zinc-50/50 dark:bg-zinc-900/50 border-b dark:border-zinc-800 flex flex-row items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-amber-100 dark:bg-amber-950/30 flex items-center justify-center text-amber-600 dark:text-amber-400 shadow-inner">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-lg font-black tracking-tighter uppercase">NPS & Satisfaction</CardTitle>
                <CardDescription className="text-xs font-medium">Enviado 1h após a conclusão do atendimento.</CardDescription>
              </div>
            </div>
            <Switch 
              checked={automations.survey} 
              onCheckedChange={() => toggleAutomation('survey')}
              className="data-[state=checked]:bg-amber-500"
            />
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex items-center justify-around py-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex flex-col items-center gap-2 opacity-50">
                  <div className="h-8 w-8 rounded-lg bg-zinc-100 dark:bg-zinc-900 border dark:border-zinc-800" />
                  <span className="text-[10px] font-bold text-zinc-400">{i}</span>
                </div>
              ))}
              <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200 dark:shadow-none animate-bounce">
                <CheckCircle2 className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Summary */}
        <Card className="overflow-hidden border-zinc-200 dark:border-zinc-800 bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-black uppercase tracking-widest opacity-80 flex items-center gap-2">
              <Bell className="h-4 w-4" /> Resumo do Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-6 py-4">
              <div className="flex items-end gap-2">
                <span className="text-5xl font-black tracking-tighter">1.248</span>
                <span className="text-sm font-bold opacity-70 pb-2 uppercase tracking-widest">Ações Realizadas</span>
              </div>
              <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-4 mt-2">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Economiaestimada</span>
                  <span className="text-lg font-black text-emerald-300">R$ 2.450,00</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-60">No-show evitado</span>
                  <span className="text-lg font-black text-blue-200">-18%</span>
                </div>
              </div>
              <Button variant="outline" className="w-full bg-white/10 border-white/20 text-white hover:bg-white hover:text-blue-700 rounded-xl font-black uppercase tracking-widest text-[10px] h-12 transition-all group">
                Ver Relatório Completo <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-2 p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800">
        <AlertCircle className="h-5 w-5 text-zinc-400" />
        <p className="text-xs font-medium text-zinc-500 italic">
          As automações seguem os padrões de segurança LGPD para proteção de dados sensíveis.
        </p>
      </div>
    </div>
  )
}
