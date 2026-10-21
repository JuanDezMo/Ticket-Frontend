import { MonitorIcon, MoonIcon, SunIcon, type LucideIcon } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { THEME_PREFERENCES, useThemeStore, type ThemePreference } from './theme.store';

const OPTIONS: Record<ThemePreference, { label: string; icon: LucideIcon }> = {
  light: { label: 'Light', icon: SunIcon },
  dark: { label: 'Dark', icon: MoonIcon },
  system: { label: 'System', icon: MonitorIcon },
};

const ORDER: ThemePreference[] = [
  THEME_PREFERENCES.LIGHT,
  THEME_PREFERENCES.DARK,
  THEME_PREFERENCES.SYSTEM,
];

function isPreference(value: string): value is ThemePreference {
  return Object.hasOwn(OPTIONS, value);
}

export function ThemeMenu() {
  const preference = useThemeStore((state) => state.preference);
  const setPreference = useThemeStore((state) => state.setPreference);
  const Icon = OPTIONS[preference].icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={`Theme: ${OPTIONS[preference].label}`}
          className="size-11 sm:size-9"
        >
          <Icon aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Theme</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={preference}
          onValueChange={(value) => isPreference(value) && setPreference(value)}
        >
          {ORDER.map((option) => {
            const OptionIcon = OPTIONS[option].icon;
            return (
              <DropdownMenuRadioItem key={option} value={option}>
                <OptionIcon aria-hidden="true" />
                {OPTIONS[option].label}
              </DropdownMenuRadioItem>
            );
          })}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
