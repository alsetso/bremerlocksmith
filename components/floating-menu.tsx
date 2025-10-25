"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle, Key } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export function FloatingMenu() {
  const [selectedServices, setSelectedServices] = useState<string[]>([])

  const services = [
    { id: "lockout", label: "Lockout services", price: "$75-150", emergency: true },
    { id: "duplication", label: "Key duplication", price: "$5-25" },
    { id: "programming", label: "Key programming", price: "$100-300" },
    { id: "install", label: "Installing or replacing locks", price: "$150-400" },
    { id: "repair", label: "Lock repair", price: "$80-200" },
    { id: "extraction", label: "Key extraction", price: "$50-120" },
    { id: "key-repair", label: "Key repair", price: "$30-80" },
    { id: "rekeying", label: "Lock rekeying", price: "$75-150" },
  ]

  const toggleService = (serviceId: string) => {
    setSelectedServices((prev) =>
      prev.includes(serviceId) ? prev.filter((id) => id !== serviceId) : [...prev, serviceId],
    )
  }

  const handleRequestService = () => {
    console.log("[v0] Requesting services:", selectedServices)
    // Handle service request logic here
  }

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] animate-slide-up w-full max-w-md px-3">
      <div className="bg-card/95 backdrop-blur-md border border-border rounded-xl shadow-2xl p-3 max-h-[50vh] overflow-y-auto">
        <div className="mb-3 bg-foreground/10 border border-foreground/20 rounded-lg p-2">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="w-4 h-4 text-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Emergency Lockout? 24/7</h3>
          </div>
          <p className="text-xs text-muted-foreground">Select services for immediate dispatch</p>
        </div>

        <Accordion type="single" collapsible className="mb-3">
          <AccordionItem value="services" className="border-border">
            <AccordionTrigger className="text-sm font-medium hover:no-underline py-2">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4" />
                <span>Select Services</span>
                {selectedServices.length > 0 && (
                  <span className="text-xs bg-foreground text-background px-1.5 py-0.5 rounded-full">
                    {selectedServices.length}
                  </span>
                )}
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-0.5 pt-1">
                {services.map((service) => {
                  const isSelected = selectedServices.includes(service.id)
                  const isEmergency = service.emergency

                  return (
                    <button
                      key={service.id}
                      onClick={() => toggleService(service.id)}
                      className={`w-full flex items-center justify-between p-2 rounded-lg transition-all duration-200 hover:bg-accent ${
                        isSelected ? "bg-foreground/10 border border-foreground/20" : "border border-transparent"
                      } ${isEmergency ? "border-foreground/30" : ""}`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-3.5 h-3.5 rounded border-2 flex items-center justify-center transition-all ${
                            isSelected ? "bg-foreground border-foreground" : "border-muted-foreground/30"
                          }`}
                        >
                          {isSelected && <div className="w-1.5 h-1.5 bg-background rounded-sm" />}
                        </div>
                        <div className="text-left">
                          <span className="text-xs font-medium text-foreground">{service.label}</span>
                          {isEmergency && <span className="ml-1 text-[10px] text-foreground/70">• Priority</span>}
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">{service.price}</span>
                    </button>
                  )
                })}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <Button
          size="sm"
          disabled={selectedServices.length === 0}
          onClick={handleRequestService}
          className="w-full bg-foreground text-background hover:bg-foreground/90 transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-xs h-9"
        >
          <Key className="w-3.5 h-3.5 mr-1.5" />
          Request {selectedServices.length > 0 && `(${selectedServices.length})`}
        </Button>

        <div className="mt-2 text-center">
          <p className="text-[10px] text-muted-foreground">Licensed & Insured • Location detected</p>
        </div>
      </div>
    </div>
  )
}
