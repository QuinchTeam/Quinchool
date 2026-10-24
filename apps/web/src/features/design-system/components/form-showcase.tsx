import { DatePicker } from "@/components/shared/date-picker";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ShowcaseSection } from "@/features/design-system/components/showcase-section";

export function FormShowcase() {
  return (
    <>
      <ShowcaseSection
        id="form"
        title="Form"
        description="Input, textarea, label, select, checkbox, and radio group"
        className="flex-col items-start gap-6"
      >
        <div className="grid w-full max-w-sm gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" variant="email" placeholder="you@example.com" />
        </div>
        <div className="grid w-full max-w-sm gap-1.5">
          <Label htmlFor="password">Password</Label>
          <Input id="password" variant="password" placeholder="Password" />
        </div>
        <div className="grid w-full max-w-sm gap-1.5">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" variant="phone" placeholder="+63 912 345 6789" />
        </div>
        <div className="grid w-full max-w-sm gap-1.5">
          <Label htmlFor="link">Link</Label>
          <Input id="link" variant="link" placeholder="github.com/you" />
        </div>
        <div className="grid w-full max-w-sm gap-1.5">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            variant="location"
            placeholder="Quezon City, Philippines"
          />
        </div>
        <div className="grid w-full max-w-sm gap-1.5">
          <Label htmlFor="date">Date</Label>
          <Input id="date" variant="date" />
        </div>
        <div className="grid w-full max-w-sm gap-1.5">
          <Label htmlFor="month">Month</Label>
          <Input id="month" variant="date" type="month" />
        </div>
        <div className="grid w-full max-w-sm gap-1.5">
          <Label htmlFor="plain">Plain</Label>
          <Input id="plain" placeholder="No variant" />
        </div>
        <div className="grid w-full max-w-sm gap-1.5">
          <Label htmlFor="message">Message</Label>
          <Textarea id="message" placeholder="Type your message here." />
        </div>
        <div className="grid w-full max-w-sm gap-1.5">
          <Label htmlFor="fruit">Favorite fruit</Label>
          <Select defaultValue="blueberry">
            <SelectTrigger id="fruit" className="w-full">
              <SelectValue placeholder="Select a fruit" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Fruits</SelectLabel>
                <SelectItem value="apple">Apple</SelectItem>
                <SelectItem value="banana">Banana</SelectItem>
                <SelectItem value="blueberry">Blueberry</SelectItem>
                <SelectItem value="grapes">Grapes</SelectItem>
                <SelectItem value="pineapple">Pineapple</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Checkbox id="terms" defaultChecked />
          <Label htmlFor="terms">Accept terms and conditions</Label>
        </div>
        <RadioGroup defaultValue="comfortable" className="gap-2">
          <div className="flex items-center gap-2">
            <RadioGroupItem value="default" id="r1" />
            <Label htmlFor="r1">Default</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="comfortable" id="r2" />
            <Label htmlFor="r2">Comfortable</Label>
          </div>
          <div className="flex items-center gap-2">
            <RadioGroupItem value="compact" id="r3" />
            <Label htmlFor="r3">Compact</Label>
          </div>
        </RadioGroup>
      </ShowcaseSection>

      <Separator />

      <ShowcaseSection
        id="toggles"
        title="Toggle"
        description="Toggle, toggle group, and date picker"
      >
        <Toggle aria-label="Toggle bold">
          <span className="font-bold">B</span>
        </Toggle>
        <Toggle aria-label="Toggle italic" variant="outline">
          <span className="italic">I</span>
        </Toggle>
        <ToggleGroup defaultValue={["center"]}>
          <ToggleGroupItem value="left" aria-label="Align left">
            Left
          </ToggleGroupItem>
          <ToggleGroupItem value="center" aria-label="Align center">
            Center
          </ToggleGroupItem>
          <ToggleGroupItem value="right" aria-label="Align right">
            Right
          </ToggleGroupItem>
        </ToggleGroup>
        <DatePicker />
      </ShowcaseSection>
    </>
  );
}
