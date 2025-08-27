export default function Select({ className="", children, ...props }) {
  const base = "w-full border rounded px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
  return <select className={`${base} ${className}`} {...props}>{children}</select>
}
