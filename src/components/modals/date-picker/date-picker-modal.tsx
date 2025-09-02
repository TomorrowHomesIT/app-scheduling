"use client";

import { useState } from "react";
import { format, addDays } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar } from "../../ui/calendar";

interface DatePickerModalProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  open: boolean;
  onOpenChange: (date: boolean) => void;
}

export function DatePickerModal({ value, onChange, open, onOpenChange }: DatePickerModalProps) {
  const [date, setDate] = useState<Date | undefined>(value);
  const [month, setMonth] = useState<Date | undefined>(value);

  const handleSelect = (date: Date | undefined) => {
    setDate(date);
    onChange(date);
    onOpenChange(false);
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = addDays(today, 1);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[360px]">
        <DialogHeader>
          <DialogTitle>Select Due Date</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => handleSelect(today)}>
              Today
              <span className="ml-auto text-xs text-muted-foreground">{format(today, "MMM d")}</span>
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => handleSelect(tomorrow)}>
              Tomorrow
              <span className="ml-auto text-xs text-muted-foreground">{format(tomorrow, "MMM d")}</span>
            </Button>
          </div>
          <Calendar
            mode="single"
            month={month}
            onMonthChange={setMonth}
            selected={date}
            onSelect={handleSelect}
            className="bg-transparent p-0 w-full"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface DatePickerTriggerProps {
  value?: Date | null;
  onChange: (date: Date | undefined) => void;
  className?: string;
}

export function DatePickerTrigger({ value, onChange, className }: DatePickerTriggerProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        className={className || "h-auto p-1 hover:bg-accent font-normal justify-start"}
        onClick={() => setOpen(true)}
      >
        <CalendarIcon className="h-3 w-3 text-muted-foreground mr-1" />
        <span className="text-sm">{value ? format(value, "MMM d") : "Set date"}</span>
      </Button>
      <DatePickerModal value={value ?? undefined} onChange={onChange} open={open} onOpenChange={setOpen} />
    </>
  );
}
