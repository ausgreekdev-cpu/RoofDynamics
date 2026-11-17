'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { SignaturePad } from '../../components/SignaturePad'
import { useToast } from '../../components/Toast'
import type { Deal } from './types'

interface OfferSignerProps {
  deal: Deal
  onSigned: () => void
  onCancel: () => void
}

export function OfferSigner({ deal, onSigned, onCancel }: OfferSignerProps) {
  const toast = useToast()
  const [name, setName] = useState('')
  const [signature, setSignature] = useState<string | null>(null)

  const handleSign = () => {
    if (!name.trim()) {
      toast.showToast('warning', 'Enter the signer name')
      return
    }
    if (!signature) {
      toast.showToast('warning', 'Draw your signature first')
      return
    }
    // In a production system, persist signature via the API. Here the signed
    // state is recorded in component state and reported to the parent pipeline.
    toast.showToast('success', `Offer signed by ${name}`)
    onSigned()
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onCancel() }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sign Offer — {deal.name}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-[var(--muted-foreground)]">
          Offer value: ${deal.estimatedValue.toLocaleString()} · {deal.suburb}
        </p>
        <div className="space-y-2">
          <Label htmlFor="signer">Signer name</Label>
          <Input id="signer" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" />
        </div>
        <SignaturePad onChange={setSignature} />
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={handleSign}>Sign & Mark Won</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
