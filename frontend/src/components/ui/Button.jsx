export default function Button({ children, variant="primary", className="", ...props }) {
  const base = "inline-flex items-center justify-center px-4 py-2 rounded text-sm font-medium transition"
  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    outline: "border border-gray-300 hover:bg-gray-50",
    ghost:  "hover:bg-gray-100"
  }
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  )
}
