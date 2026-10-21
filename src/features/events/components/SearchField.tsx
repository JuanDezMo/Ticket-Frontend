import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { useDebouncedValue } from '@/shared/lib/use-debounced-value';
import { Input } from '@/shared/ui/input';
import { SEARCH_DEBOUNCE_MS } from '../constants';

interface SearchFieldProps {
  id: string;
  value: string;
  onSearch: (value: string) => void;
}

/** Guarda lo escrito y avisa cuando el usuario deja de escribir. */
export function SearchField({ id, value, onSearch }: SearchFieldProps) {
  const [draft, setDraft] = useState(value);
  const debounced = useDebouncedValue(draft.trim(), SEARCH_DEBOUNCE_MS);
  // Último valor que coincide con la URL; evita reenviar lo que ya está aplicado
  const applied = useRef(value);
  // Lee siempre el onSearch actual sin que el efecto dependa de él
  const emitSearch = useEffectEvent((next: string) => onSearch(next));

  // Solo reacciona cuando cambia el valor con debounce, no en cada render
  useEffect(() => {
    if (debounced === applied.current) return;
    applied.current = debounced;
    emitSearch(debounced);
  }, [debounced]);

  // Si la URL cambia desde afuera (atrás, "Clear filters"), el campo se sincroniza
  useEffect(() => {
    if (value === applied.current) return;
    applied.current = value;
    setDraft(value);
  }, [value]);

  return (
    <Input
      id={id}
      type="search"
      placeholder="Search by name"
      value={draft}
      onChange={(event) => setDraft(event.target.value)}
    />
  );
}
