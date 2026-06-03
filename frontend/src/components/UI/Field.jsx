export default function Field({
  label,
  value,
  onChange,
  error,
  type = "text",
  ...rest
}) {
  return (
    <div className="mb-4">
      <label className="label">{label}</label>
      <input
        type={type}
        value={value}
        step={type === "number" ? "any" : undefined}
        onChange={(e) => onChange(e.target.value)}
        className="input"
        {...rest}
      />
      {error && <div className="mt-1.5 text-xs text-red-600">{error}</div>}
    </div>
  );
}
