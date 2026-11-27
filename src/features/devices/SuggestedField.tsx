import { useId, useState, type KeyboardEvent } from 'react'
import { ChevronDown } from 'lucide-react'

interface SuggestedFieldProps {
  label: string
  value: string
  suggestions: readonly string[]
  onChange: (value: string) => void
}

export function SuggestedField({ label, value, suggestions, onChange }: SuggestedFieldProps) {
  const id = useId()
  const listId = `${id}-suggestions`
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const query = value.trim().toLowerCase()
  const matches = suggestions.filter(option => option.toLowerCase().includes(query))
  const expanded = open && matches.length > 0

  function close() {
    setOpen(false)
    setActive(-1)
  }

  function select(option: string) {
    onChange(option)
    close()
  }

  function handleKey(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape' && expanded) {
      event.preventDefault()
      close()
    }
    if (event.key === 'Enter' && expanded && matches[active]) {
      event.preventDefault()
      select(matches[active])
    }
    if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && matches.length > 0) {
      event.preventDefault()
      const next = event.key === 'ArrowDown'
        ? Math.min(active + 1, matches.length - 1)
        : active < 0 ? matches.length - 1 : Math.max(active - 1, 0)
      setOpen(true)
      setActive(next)
    }
  }

  return (
    <div className="suggested-field">
      <label htmlFor={id}>{label} *</label>
      <div className="suggested-field-input">
        <input
          id={id}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={expanded}
          aria-controls={expanded ? listId : undefined}
          aria-activedescendant={expanded && active >= 0 ? `${listId}-${active}` : undefined}
          autoComplete="off"
          required
          maxLength={120}
          value={value}
          onFocus={() => setOpen(true)}
          onClick={() => setOpen(true)}
          onBlur={close}
          onKeyDown={handleKey}
          onChange={event => {
            onChange(event.target.value)
            setActive(-1)
            setOpen(true)
          }}
        />
        <ChevronDown aria-hidden="true" size={16} />
      </div>
      {expanded && (
        <ul className="suggested-field-options" id={listId} role="listbox" aria-label={label}>
          {matches.map((option, index) => (
            <li
              key={option}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={active === index}
              ref={element => {
                if (active === index) element?.scrollIntoView({ block: 'nearest' })
              }}
              onMouseDown={event => event.preventDefault()}
              onClick={() => select(option)}
            >
              {option}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
