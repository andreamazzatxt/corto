"use client";
import { useState } from "react";
import { CalendarIcon, X } from "lucide-react";
import { format, parse, isValid } from "date-fns";
import { it } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";


interface DateTimePickerProps {
  value?: string; // "YYYY-MM-DDTHH:mm"
  onChange: (value: string | undefined) => void;
}

export function DateTimePicker({ value, onChange }: DateTimePickerProps) {
  const [open, setOpen] = useState(false);

  const date = value ? parse(value, "yyyy-MM-dd'T'HH:mm", new Date()) : undefined;
  const validDate = date && isValid(date) ? date : undefined;

  const hours = validDate ? validDate.getHours() : 0;
  const minutes = validDate ? validDate.getMinutes() : 0;

  function handleDaySelect(day: Date | undefined) {
    if (!day) {
      onChange(undefined);
      return;
    }
    day.setHours(hours, minutes, 0, 0);
    onChange(format(day, "yyyy-MM-dd'T'HH:mm"));
    setOpen(false);
  }

  function handleHourInput(e: React.ChangeEvent<HTMLInputElement>) {
    const h = Math.min(23, Math.max(0, Number(e.target.value) || 0));
    const base = validDate ? new Date(validDate) : new Date();
    base.setHours(h, minutes, 0, 0);
    onChange(format(base, "yyyy-MM-dd'T'HH:mm"));
  }

  function handleMinuteInput(e: React.ChangeEvent<HTMLInputElement>) {
    const m = Math.min(59, Math.max(0, Number(e.target.value) || 0));
    const base = validDate ? new Date(validDate) : new Date();
    base.setHours(hours, m, 0, 0);
    onChange(format(base, "yyyy-MM-dd'T'HH:mm"));
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange(undefined);
  }

  return (
    <div className="flex gap-2 max-w-sm">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className="flex-1 justify-start text-left font-normal"
          >
            <CalendarIcon size={15} className="mr-2 shrink-0 text-muted-foreground" />
            {validDate ? (
              <span>{format(validDate, "d MMM yyyy", { locale: it })}</span>
            ) : (
              <span className="text-muted-foreground">Seleziona data…</span>
            )}
            {validDate && (
              <span
                role="button"
                onClick={handleClear}
                className="ml-auto text-muted-foreground hover:text-foreground"
              >
                <X size={13} />
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={validDate}
            onSelect={handleDaySelect}
            initialFocus
            locale={it}
          />
        </PopoverContent>
      </Popover>

      <div className={`flex items-center h-9 rounded-md border border-input bg-background px-2 text-sm transition-opacity ${!validDate ? "opacity-50 pointer-events-none" : ""}`}>
        <input
          type="number"
          min={0}
          max={23}
          value={String(hours).padStart(2, "0")}
          onChange={handleHourInput}
          disabled={!validDate}
          inputMode="numeric"
          className="w-7 bg-transparent text-center outline-none tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
        <span className="text-muted-foreground select-none">:</span>
        <input
          type="number"
          min={0}
          max={59}
          value={String(minutes).padStart(2, "0")}
          onChange={handleMinuteInput}
          disabled={!validDate}
          inputMode="numeric"
          className="w-7 bg-transparent text-center outline-none tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
      </div>
    </div>
  );
}
