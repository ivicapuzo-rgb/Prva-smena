export const PumpPicker = ({ value, onChange, prefix = "pump" }) => (
  <div className="grid grid-cols-4 gap-3" data-testid={`${prefix}-picker`}>
    {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
      <button key={n} type="button" onClick={() => onChange(n)} data-testid={`${prefix}-button-${n}`}
        className={`press h-14 rounded-2xl border-2 font-digits text-xl ${value === n ? "border-[var(--ps-amber)] bg-[var(--ps-amber)] text-black shadow-[0_6px_16px_rgba(245,166,35,0.35)]" : "border-[var(--ps-amber)] bg-white text-black hover:bg-amber-50"}`}>
        {n}
      </button>
    ))}
  </div>
);
