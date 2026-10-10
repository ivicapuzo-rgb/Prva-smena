export const Field = ({ label, children }) => (
  <label className="block">
    <span className="mb-1.5 block font-cond text-sm font-semibold text-neutral-700">{label}</span>
    {children}
  </label>
);

export const inputCls =
  "w-full rounded-2xl border-2 border-black bg-white px-4 py-3 font-cond text-2xl font-semibold outline-none transition-[border-color,box-shadow] placeholder:text-neutral-300 focus:border-[var(--ps-amber)] focus:shadow-[0_0_0_4px_rgba(245,166,35,0.2)]";

export const Card = ({ children, tone = "red", className = "", testId }) => (
  <section data-testid={testId}
    className={`rounded-[26px] border bg-white p-5 ${tone === "amber" ? "border-2 border-[var(--ps-amber)]" : "border-[var(--ps-red)]"} ${className}`}>
    {children}
  </section>
);

export const CardTitle = ({ children, icon }) => (
  <h2 className="mb-3 flex items-center gap-3 font-cond text-2xl font-semibold leading-tight">
    {icon}
    {children}
  </h2>
);

export const Bars = ({ size = 22 }) => (
  <span className="flex items-end gap-[3px]" style={{ height: size }} aria-hidden>
    <span className="w-[6px] bg-[var(--ps-red)]" style={{ height: "35%" }} />
    <span className="w-[6px] bg-[var(--ps-red)]" style={{ height: "60%" }} />
    <span className="w-[6px] bg-[var(--ps-red)]" style={{ height: "100%" }} />
  </span>
);

export const BlueBtn = ({ children, testId, onClick, disabled, variant = "solid" }) => (
  <button onClick={onClick} disabled={disabled} data-testid={testId}
    className={`press flex h-12 items-center justify-center gap-2 rounded-xl px-4 font-cond text-lg font-semibold disabled:opacity-50 ${variant === "solid" ? "bg-[var(--ps-blue)] text-white hover:bg-[#005fa3]" : "border border-black bg-white text-black hover:bg-neutral-50"}`}>
    {children}
  </button>
);
