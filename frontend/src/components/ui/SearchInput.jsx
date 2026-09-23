import { forwardRef } from 'react';
import { Search, X } from 'lucide-react';

/**
 * SearchInput - search box with icon, clear button and an accessible label.
 * Controlled component: value + onChange. Forwards its ref so a global
 * keyboard shortcut can focus it. `shortcutHint` renders the key hint when the
 * field is empty and unfocused.
 */
const SearchInput = forwardRef(function SearchInput(
  { value, onChange, placeholder = 'Search…', label = 'Search', shortcutHint },
  ref,
) {
  return (
    <div className="search">
      <span className="search__icon" aria-hidden="true">
        <Search size={17} />
      </span>
      <input
        ref={ref}
        className="input"
        type="search"
        value={value}
        placeholder={placeholder}
        aria-label={label}
        onChange={(e) => onChange(e.target.value)}
      />
      {value.length > 0 ? (
        <button className="search__clear" onClick={() => onChange('')} aria-label="Clear search">
          <X size={15} aria-hidden="true" />
        </button>
      ) : (
        shortcutHint && (
          <kbd className="search__kbd" aria-hidden="true">
            {shortcutHint}
          </kbd>
        )
      )}
    </div>
  );
});

export default SearchInput;
