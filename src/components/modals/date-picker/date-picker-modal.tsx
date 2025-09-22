import { useState } from "react";
import { format, addDays } from "date-fns";
import { CalendarPlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Calendar } from "../../ui/calendar";

interface DatePickerModalProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  open: boolean;
  onOpenChange: (date: boolean) => void;
  taskName?: string;
}

export function DatePickerModal({ value, onChange, open, onOpenChange, taskName }: DatePickerModalProps) {
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

  const disabled = (date: Date) => {
    return date < today;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="box-border h-[560px] md:min-w-[700px] max-h-[90vh] overflow-y-auto flex flex-col gap-4">
        <DialogHeader>
          <DialogTitle>Select start date</DialogTitle>
          <DialogDescription>{taskName}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-col sm:flex-row space-y-4 ">
          <div className="flex flex-col gap-4 mt-2 border-r pr-6">
            <Button variant="outline" onClick={() => handleSelect(today)}>
              Today
              <span className="ml-auto text-xs text-muted-foreground">{format(today, "MMM d")}</span>
            </Button>
            <Button variant="outline" onClick={() => handleSelect(tomorrow)}>
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
            disabled={disabled}
            className="bg-transparent w-full py-0 pr-0"
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
  taskName?: string;
}

export function DatePickerTrigger({ value, onChange, className, taskName }: DatePickerTriggerProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        className={className || "h-auto p-2 w-full hover:bg-accent font-normal justify-start"}
        onClick={() => setOpen(true)}
      >
        {!value && (
          <span>
            <CalendarPlusIcon className="h-3 w-3 text-muted-foreground" />
          </span>
        )}
        <span className="text-sm">{value ? format(value, "MMM d") : ""}</span>
      </Button>
      <DatePickerModal
        value={value ?? undefined}
        onChange={onChange}
        open={open}
        onOpenChange={setOpen}
        taskName={taskName}
      />
    </>
  );
}
