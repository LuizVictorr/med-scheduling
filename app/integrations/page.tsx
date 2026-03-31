"use client"

import * as React from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Check, Calendar as CalendarIcon, ExternalLink, Share2 } from "lucide-react"
import Image from "next/image"

const integrations = [
  {
    id: "google",
    name: "Google Calendar",
    description: "Sincronize seus agendamentos automaticamente com o Google Agenda.",
    icon: "/google-calendar.svg",
    connected: true,
    color: "bg-blue-600",
  },
  {
    id: "apple",
    name: "Apple Calendar",
    description: "Integração via iCal para visualizar seus eventos em dispositivos Apple.",
    icon: "/apple-logo.svg",
    connected: false,
    color: "bg-zinc-950",
  },
]

export default function IntegrationsPage() {
  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Integrações</h1>
        <p className="text-muted-foreground">Conecte sua agenda com calendários externos.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {integrations.map((item) => (
          <Card key={item.id} className="shadow-sm overflow-hidden flex flex-col h-full border-t-4 data-[id=google]:border-t-blue-500 data-[id=apple]:border-t-zinc-400 bg-white dark:bg-zinc-950/50" data-id={item.id}>
            <CardHeader className="flex flex-row items-center gap-4">
              <div className={`h-12 w-12 rounded-lg bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-2 flex items-center justify-center`}>
                <Share2 className="h-6 w-6 text-zinc-600 dark:text-zinc-400" />
              </div>
              <div>
                <CardTitle>{item.name}</CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <div className={`h-2 w-2 rounded-full ${item.connected ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-300'}`} />
                  <span className="text-xs font-medium text-muted-foreground">
                    {item.connected ? "Conectado" : "Desconectado"}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1">
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {item.description}
              </p>
              {item.connected && (
                <div className="mt-6 p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-100 dark:border-emerald-900/50 flex items-center gap-3">
                  <Check className="h-5 w-5 text-emerald-600" />
                  <span className="text-sm font-medium text-emerald-900 dark:text-emerald-400">Tudo funcionando corretamente</span>
                </div>
              )}
            </CardContent>
            <CardFooter className="bg-zinc-50/50 dark:bg-zinc-900/50 p-6 border-t">
              <Button 
                variant={item.connected ? "outline" : "default"} 
                className={`w-full ${!item.connected && 'bg-blue-600 hover:bg-blue-700'}`}
              >
                {item.connected ? "Gerenciar Conexão" : "Conectar Agora"}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <Card className="shadow-sm border-dashed bg-white dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800">
        <CardHeader>
          <div className="flex items-center gap-2">
             <CalendarIcon className="h-5 w-5 text-blue-600" />
             <CardTitle>Sincronização Bidirecional</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Nossa integração permite que qualquer alteração feita no <strong>CardioDash</strong> seja refletida no seu calendário pessoal e vice-versa. 
            Dessa forma, você nunca terá conflitos de horários em congressos ou compromissos externos.
          </p>
          <ul className="mt-4 flex flex-col gap-3">
             <li className="flex items-center gap-3 text-sm">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                <span>Bloqueio automático de horários para eventos externos</span>
             </li>
             <li className="flex items-center gap-3 text-sm">
                <div className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                <span>Notificações push em tempo real em todos os dispositivos</span>
             </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
