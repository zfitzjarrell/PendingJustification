import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useExperience, Experience } from "utils/experience-context";
import { Monitor } from "lucide-react";

export function ExperienceSelector() {
  const { experience, setExperience } = useExperience();

  return (
    <div className="flex items-center gap-2">
      <Monitor className="h-4 w-4 text-muted-foreground hidden sm:block" />
      <Select value={experience} onValueChange={(val) => setExperience(val as Experience)}>
        <SelectTrigger className="w-[200px] h-8 text-xs bg-transparent border-slate-200 dark:border-slate-800">
          <SelectValue placeholder="Select Experience" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="modern">Modern ITSM (Recommended)</SelectItem>
          <SelectItem value="legacy">Legacy Ticketing System</SelectItem>
          <SelectItem value="classic">Enterprise Management Console</SelectItem>
          <SelectItem value="amateur">Internal Tool (Do Not Share)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
