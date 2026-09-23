import { Loader2 } from 'lucide-react';

/**
 * Button - the single button primitive for the whole app.
 *
 * variants: primary | secondary (default) | ghost | danger | subtle-danger
 * Pass `loading` to show a spinner and block interaction.
 * Icons are passed as children (e.g. <Plus size={16} />) and size themselves.
 */
export default function Button({
  children,
  variant = 'secondary',
  size = 'md',
  type = 'button',
  loading = false,
  disabled = false,
  className = '',
  ...rest
}) {
  const classes = [
    'btn',
    variant !== 'secondary' && `btn--${variant}`,
    size === 'sm' && 'btn--sm',
    size === 'icon' && 'btn--icon',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <Loader2 className="spinner" size={16} aria-hidden="true" />}
      {children}
    </button>
  );
}
