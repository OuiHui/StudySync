import { useState, useEffect } from 'react';
import { format, parse, isValid } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface DateTimeInputProps {
  id?: string;
  value: string; // datetime-local format: "YYYY-MM-DDTHH:mm"
  onChange: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  min?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

const HOURS = Array.from({ length: 12 }, (_, i) => String(i === 0 ? 12 : i).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

function parseDatetimeLocal(value: string): { date: Date | undefined; hour: string; minute: string; ampm: 'AM' | 'PM' } {
  if (!value) return { date: undefined, hour: '12', minute: '00', ampm: 'AM' };
  const parsed = parse(value, "yyyy-MM-dd'T'HH:mm", new Date());
  if (!isValid(parsed)) return { date: undefined, hour: '12', minute: '00', ampm: 'AM' };
  const h24 = parsed.getHours();
  const ampm: 'AM' | 'PM' = h24 < 12 ? 'AM' : 'PM';
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return {
    date: parsed,
    hour: String(h12).padStart(2, '0'),
    minute: String(parsed.getMinutes()).padStart(2, '0'),
    ampm,
  };
}

function toDatetimeLocal(date: Date, hour: string, minute: string, ampm: 'AM' | 'PM'): string {
  let h = parseInt(hour, 10);
  if (ampm === 'PM' && h !== 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  const d = new Date(date);
  d.setHours(h, parseInt(minute, 10), 0, 0);
  return format(d, "yyyy-MM-dd'T'HH:mm");
}

export function DateTimeInput({
  id,
  value,
  onChange,
  onFocus,
  onBlur,
  min,
  required,
  disabled,
  className,
}: DateTimeInputProps) {
  const [open, setOpen] = useState(false);
  const { date, hour, minute, ampm } = parseDatetimeLocal(value);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(date);
  const [selectedHour, setSelectedHour] = useState(hour);
  const [selectedMinute, setSelectedMinute] = useState(minute);
  const [selectedAmpm, setSelectedAmpm] = useState<'AM' | 'PM'>(ampm);

  useEffect(() => {
    const { date: d, hour: h, minute: m, ampm: ap } = parseDatetimeLocal(value);
    setSelectedDate(d);
    setSelectedHour(h);
    setSelectedMinute(m);
    setSelectedAmpm(ap);
  }, [value]);

  const commit = (d: Date | undefined, h: string, m: string, ap: 'AM' | 'PM') => {
    if (!d) return;
    onChange(toDatetimeLocal(d, h, m, ap));
  };

  const handleDateSelect = (d: Date | undefined) => {
    setSelectedDate(d);
    commit(d, selectedHour, selectedMinute, selectedAmpm);
  };

  const handleHour = (h: string) => {
    setSelectedHour(h);
    commit(selectedDate, h, selectedMinute, selectedAmpm);
  };

  const handleMinute = (m: string) => {
    setSelectedMinute(m);
    commit(selectedDate, selectedHour, m, selectedAmpm);
  };

  const handleAmpm = (ap: 'AM' | 'PM') => {
    setSelectedAmpm(ap);
    commit(selectedDate, selectedHour, selectedMinute, ap);
  };

  const displayValue = selectedDate
    ? `${format(selectedDate, 'MMM d, yyyy')}  ${selectedHour}:${selectedMinute} ${selectedAmpm}`
    : 'Pick date & time';

  const minDate = min ? parse(min, "yyyy-MM-dd'T'HH:mm", new Date()) : undefined;

  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if (!o) onBlur?.(); }}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          disabled={disabled}
          onFocus={onFocus}
          aria-required={required}
          className={cn(
            'flex h-10 w-full items-center rounded-lg border border-border bg-muted/40 px-3',
            'text-sm font-semibold text-left',
            'ring-offset-background transition-all duration-150',
            'focus:outline-none focus:ring-2 focus:ring-brand focus:border-brand',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            !selectedDate && 'text-muted-foreground',
            className
          )}
        >
          <span className="flex-1 truncate">{displayValue}</span>
          <CalendarIcon size={14} className="shrink-0 ml-2 text-muted-foreground" />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-auto p-0 border-border bg-card shadow-xl rounded-xl overflow-hidden"
        onInteractOutside={() => setOpen(false)}
      >
        <div className="flex divide-x divide-border">
          {/* Date picker */}
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={handleDateSelect}
            disabled={minDate ? { before: minDate } : undefined}
            initialFocus
            classNames={{
              day_selected: 'bg-brand text-white hover:bg-brand hover:text-white focus:bg-brand focus:text-white',
              day_today: 'bg-accent text-accent-foreground font-semibold',
            }}
          />

          {/* Time picker */}
          <div className="flex divide-x divide-border text-sm">
            <TimeColumn items={HOURS} selected={selectedHour} onSelect={handleHour} />
            <TimeColumn items={MINUTES} selected={selectedMinute} onSelect={handleMinute} />
            <TimeColumn items={['AM', 'PM']} selected={selectedAmpm} onSelect={handleAmpm as (v: string) => void} />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function TimeColumn({ items, selected, onSelect }: { items: string[]; selected: string; onSelect: (v: string) => void }) {
  return (
    <ScrollArea className="h-[280px] w-14">
      <div className="flex flex-col py-2">
        {items.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onSelect(item)}
            className={cn(
              'mx-1 my-0.5 rounded-md px-2 py-1.5 text-center text-sm transition-colors duration-100',
              item === selected
                ? 'bg-brand text-white font-semibold'
                : 'text-foreground hover:bg-muted'
            )}
          >
            {item}
          </button>
        ))}
      </div>
    </ScrollArea>
  );
}

