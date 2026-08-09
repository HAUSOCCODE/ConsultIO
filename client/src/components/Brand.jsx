export default function Brand({ light = false }) {
  return (
    <div className="flex items-center">
      <span
        className={`text-xl font-extrabold tracking-[-.03em] ${light ? "text-white" : "text-maroon-900"}`}
      >
        Consult<span className="text-gold-500">IO</span>
      </span>
    </div>
  );
}
