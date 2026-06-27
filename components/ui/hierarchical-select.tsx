"use client"

import { useState, useEffect } from "react"

interface Option {
  value: string
  label: string
}

interface HierarchicalSelectProps {
  polos: Option[]
  locais: Option[]
  turmas?: Option[]
  onPoloChange?: (poloId: string) => void
  onLocalChange?: (localId: string) => void
  onTurmaChange?: (turmaId: string) => void
  selectedPolo?: string
  selectedLocal?: string
  selectedTurma?: string
  showTurmas?: boolean
}

export function HierarchicalSelect({
  polos,
  locais,
  turmas = [],
  onPoloChange,
  onLocalChange,
  onTurmaChange,
  selectedPolo = "",
  selectedLocal = "",
  selectedTurma = "",
  showTurmas = false,
}: HierarchicalSelectProps) {
  const [polo, setPolo] = useState(selectedPolo)
  const [local, setLocal] = useState(selectedLocal)
  const [turma, setTurma] = useState(selectedTurma)

  // Reset dependentes quando polo muda
  useEffect(() => {
    if (polo !== selectedPolo) {
      setLocal("")
      setTurma("")
      onLocalChange?.("")
      onTurmaChange?.("")
    }
  }, [polo])

  // Reset turma quando local muda
  useEffect(() => {
    if (local !== selectedLocal) {
      setTurma("")
      onTurmaChange?.("")
    }
  }, [local])

  const handlePoloChange = (value: string) => {
    setPolo(value)
    onPoloChange?.(value)
  }

  const handleLocalChange = (value: string) => {
    setLocal(value)
    onLocalChange?.(value)
  }

  const handleTurmaChange = (value: string) => {
    setTurma(value)
    onTurmaChange?.(value)
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-foreground mb-1.5">Polo</label>
        <select
          value={polo}
          onChange={(e) => handlePoloChange(e.target.value)}
          className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-card"
        >
          <option value="">Selecione um polo</option>
          {polos.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      {polo && (
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Local</label>
          <select
            value={local}
            onChange={(e) => handleLocalChange(e.target.value)}
            className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-card"
          >
            <option value="">Selecione um local</option>
            {locais.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {showTurmas && local && (
        <div>
          <label className="block text-sm font-medium text-foreground mb-1.5">Turma</label>
          <select
            value={turma}
            onChange={(e) => handleTurmaChange(e.target.value)}
            className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-card"
          >
            <option value="">Selecione uma turma</option>
            {turmas.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  )
}
