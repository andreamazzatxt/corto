"use client";
import { useRef, useState } from "react";

interface Props {
  value: string;
  onChange: (v: string) => void;
  groups: string[];
  id?: string;
  placeholder?: string;
}

export function GroupCombobox({ value, onChange, groups, id, placeholder = "es. Marketing" }: Props) {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const filtered = groups.filter((g) => g.toLowerCase().includes(value.toLowerCase()));
  const suggestions = value ? filtered : groups;

  function handleBlur() {
    closeTimer.current = setTimeout(() => setOpen(false), 150);
  }

  function handleFocus() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  }

  function select(g: string) {
    onChange(g);
    setOpen(false);
  }

  return (
    <div className="relative">
      <input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        autoComplete="off"
        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      />
      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 top-full mt-1 w-full rounded-md border border-input bg-popover shadow-md overflow-hidden">
          {suggestions.map((g) => (
            <li
              key={g}
              onMouseDown={() => select(g)}
              className="px-3 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground"
            >
              {g}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
