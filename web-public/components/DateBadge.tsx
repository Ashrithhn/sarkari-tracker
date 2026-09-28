import { DateField } from '@/lib/api';
import { ShieldCheck, Clock, AlertCircle } from 'lucide-react';

interface DateBadgeProps {
  label: string;
  field: DateField;
}

export function formatDateDDMMYYYY(val: string | number | Date | null | undefined): string {
  if (!val) return '';
  const str = String(val).trim();
  const m = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) {
    return `${m[3]}/${m[2]}/${m[1]}`;
  }
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }
  return str;
}

export default function DateBadge({ label, field }: DateBadgeProps) {
  if (!field || field.status === 'not_announced' || !field.value) {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
        <span className="text-slate-600 font-medium">{label}:</span>
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded-md self-start sm:self-auto">
          <Clock className="w-3 h-3 text-slate-400" />
          Will be updated soon (Not announced yet)
        </span>
      </div>
    );
  }

  const formattedDate = formatDateDDMMYYYY(field.value);

  if (field.status === 'confirmed') {
    return (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-xs">
        <span className="text-slate-700 font-medium">{label}:</span>
        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <span className="font-bold text-slate-900">{formattedDate}</span>
          <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
            <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" />
            Confirmed
          </span>
        </div>
      </div>
    );
  }

  // Expected
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/80 text-xs">
      <span className="text-slate-700 font-medium">{label}:</span>
      <div className="flex items-center gap-1.5 self-start sm:self-auto">
        <span className="font-bold text-slate-900">{formattedDate}</span>
        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300">
          <AlertCircle className="w-2.5 h-2.5 text-amber-600" />
          Expected
        </span>
      </div>
    </div>
  );
}
