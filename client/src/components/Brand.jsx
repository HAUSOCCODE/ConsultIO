import { CalendarCheck2 } from "lucide-react";
export default function Brand({ light = false }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={`relative grid h-11 w-11 place-items-center rounded-2xl shadow-lg ${light ? "bg-gold-400 text-maroon-900" : "bg-maroon-800 text-gold-300"}`}
      >
        <CalendarCheck2 size={23} strokeWidth={2.2} />
        <span className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-current bg-gold-400" />
      </span>
      <span
        className={`text-xl font-extrabold tracking-[-.03em] ${light ? "text-white" : "text-maroon-900"}`}
      >
        Consult<span className="text-gold-500">IO</span>
      </span>
    </div>
  );
}
