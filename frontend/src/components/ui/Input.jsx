export default function Input({ className="", ...props }) {
  const base = "w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
  return <input className={`${base} ${className}`} {...props} />
}
