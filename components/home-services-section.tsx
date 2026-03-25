const SERVICES = [
  {
    title: "Emergency lockout",
    description: "Car, home, and business lockouts with immediate routing to available responders.",
  },
  {
    title: "Meeting-point accuracy",
    description: "Pin or search an exact location so technicians know exactly where to meet you.",
  },
  {
    title: "Live dispatch contact",
    description: "Call or text dispatch from one place while tracking service context in the map workspace.",
  },
]

export function HomeServicesSection() {
  return (
    <section className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 sm:p-8">
      <h2 className="font-serif text-2xl font-semibold tracking-tight text-zinc-50">Services</h2>
      <p className="mt-2 text-sm text-zinc-400">Focused on urgent local support with clear next steps.</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {SERVICES.map((service) => (
          <article key={service.title} className="rounded-xl border border-zinc-800 bg-zinc-950/70 p-4">
            <h3 className="text-sm font-semibold text-zinc-100">{service.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">{service.description}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
