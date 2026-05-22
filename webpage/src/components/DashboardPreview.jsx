const statColors = {
  warning: 'border-amber-500',
  blue: 'border-brand-700',
  success: 'border-emerald-500',
  danger: 'border-red-500',
}

const badgeStyles = {
  ok: 'bg-emerald-500/20 text-emerald-400',
  warning: 'bg-amber-500/20 text-amber-400',
  danger: 'bg-red-500/20 text-red-400',
}

export default function DashboardPreview() {
  return (
    <div
      className="overflow-hidden rounded-2xl border border-white/10 bg-brand-950 shadow-[0_20px_50px_rgba(8,60,146,0.25)] animate-[float_5s_ease-in-out_infinite] lg:rounded-xl"
      aria-hidden="true"
    >
      <div className="flex items-center gap-1.5 border-b border-slate-200 bg-slate-100 px-3 py-2">
        <span className="h-2 w-2 rounded-full bg-red-500" />
        <span className="h-2 w-2 rounded-full bg-amber-500" />
        <span className="h-2 w-2 rounded-full bg-emerald-500" />
        <span className="ml-auto font-mono text-[0.6rem] text-slate-500 sm:text-[0.625rem]">
          app.rtosarthi.com/dashboard
        </span>
      </div>
      <div className="flex min-h-[220px] lg:min-h-[240px]">
        <aside className="hidden w-28 shrink-0 border-r border-brand-800 bg-brand-950 p-2 min-[480px]:block lg:w-32 lg:p-2.5">
          <div className="mx-auto mb-2 h-5 w-[80%] rounded-md bg-brand-800" />
          {['Dashboard', 'Vehicles', 'Tax', 'PUC', 'Insurance', 'Clients'].map((item, i) => (
            <div
              key={item}
              className={`mb-0.5 flex items-center gap-1 rounded-md px-1.5 py-1 text-[0.6rem] lg:text-[0.625rem] ${
                i === 0 ? 'bg-accent-600 text-white' : 'text-slate-400'
              }`}
            >
              <span className="h-1 w-1 shrink-0 rounded-full bg-current opacity-50" />
              {item}
            </div>
          ))}
        </aside>
        <main className="flex-1 bg-brand-900/90 p-2 lg:p-2.5">
          <div className="mb-2 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
            {[
              { label: 'Expiring This Week', value: '24', color: 'warning' },
              { label: 'Active Vehicles', value: '1,842', color: 'blue' },
              { label: 'Alerts Sent Today', value: '156', color: 'success' },
              { label: 'Pending Renewals', value: '38', color: 'danger' },
            ].map((stat) => (
              <div
                key={stat.label}
                className={`rounded-md border-l-2 bg-brand-950 px-2 py-1.5 ${statColors[stat.color]}`}
              >
                <span className="block text-xs font-bold text-white lg:text-sm">{stat.value}</span>
                <span className="text-[0.55rem] leading-tight text-slate-400 lg:text-[0.6rem]">{stat.label}</span>
              </div>
            ))}
          </div>
          <div className="overflow-hidden rounded-md bg-brand-950 text-[0.55rem] lg:text-[0.6rem]">
            <div className="grid grid-cols-[1.2fr_1fr_0.7fr_0.7fr_0.8fr] gap-0.5 bg-brand-950 px-2 py-1.5 font-semibold text-slate-500">
              <span>Vehicle No.</span>
              <span>Owner</span>
              <span>Tax</span>
              <span>PUC</span>
              <span>Status</span>
            </div>
            {[
              { v: 'CG04-AB-1234', o: 'Rajesh Kumar', tax: '12 Jun', puc: '28 May', s: 'warning' },
              { v: 'CG07-CD-5678', o: 'Priya Sharma', tax: '15 Aug', puc: '02 Jul', s: 'ok' },
              { v: 'CG10-EF-9012', o: 'Amit Verma', tax: '03 May', puc: '18 Apr', s: 'danger' },
              { v: 'CG12-GH-3456', o: 'Sunita Patel', tax: '22 Nov', puc: '10 Oct', s: 'ok' },
            ].map((row) => (
              <div
                key={row.v}
                className="grid grid-cols-[1.2fr_1fr_0.7fr_0.7fr_0.8fr] gap-0.5 border-t border-brand-800 px-2 py-1.5 text-slate-300"
              >
                <span>{row.v}</span>
                <span>{row.o}</span>
                <span>{row.tax}</span>
                <span>{row.puc}</span>
                <span className={`inline-block rounded px-1 py-0.5 text-[0.5rem] font-semibold lg:text-[0.55rem] ${badgeStyles[row.s]}`}>
                  {row.s === 'ok' ? 'Active' : row.s === 'warning' ? 'Due Soon' : 'Expired'}
                </span>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  )
}
