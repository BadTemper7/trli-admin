import { Pencil, RotateCcw, Save, X } from "lucide-react"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button.jsx"
import { Input } from "@/components/ui/input.jsx"

function YardBlockEditor({ open, block, onClose, onSave, onReset }) {
  const [name, setName] = useState("")
  const [capacity, setCapacity] = useState("")

  useEffect(() => {
    setName(block?.name || "")
    setCapacity(block?.capacity ?? "")
  }, [block])

  if (!open || !block) return null

  const submit = (event) => {
    event.preventDefault()
    const parsed = Number(capacity)
    if (!name.trim() || !Number.isFinite(parsed) || parsed < 1) return
    onSave({ ...block, name: name.trim().toUpperCase(), capacity: Math.round(parsed) })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4 backdrop-blur-[2px]">
      <form onSubmit={submit} className="w-full max-w-md rounded-2xl border bg-white p-5 shadow-2xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-lg font-semibold"><Pencil className="h-4 w-4 text-primary" /> Edit Yard Block</div>
            <p className="mt-1 text-sm text-muted-foreground">Change the block display name and configured capacity.</p>
          </div>
          <button type="button" onClick={onClose} className="rounded-md p-1 text-muted-foreground hover:bg-muted"><X className="h-5 w-5" /></button>
        </div>

        <label className="mb-4 block text-sm font-medium">
          Block Name
          <Input className="mt-2" value={name} onChange={(e) => setName(e.target.value)} maxLength={24} />
        </label>
        <label className="mb-5 block text-sm font-medium">
          Capacity
          <Input className="mt-2" type="number" min="1" step="1" value={capacity} onChange={(e) => setCapacity(e.target.value)} />
        </label>

        <div className="flex flex-wrap justify-between gap-2 border-t pt-4">
          <Button type="button" variant="outline" onClick={() => onReset(block.id)}><RotateCcw className="h-4 w-4" /> Reset Default</Button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit"><Save className="h-4 w-4" /> Save Changes</Button>
          </div>
        </div>
      </form>
    </div>
  )
}

export default YardBlockEditor
