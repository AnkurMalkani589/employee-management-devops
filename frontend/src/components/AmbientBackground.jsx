/**
 * AmbientBackground - the cinematic backdrop for the whole application.
 *
 * Renders the Section 7 ambient primitives (grid, glows, grain) as one fixed,
 * non-interactive layer. App content is rendered inside `.ambient-content`
 * (see AppShell) so it always paints above this layer.
 *
 * Purely decorative: aria-hidden and pointer-events:none (via CSS), so it
 * never interferes with interaction or the accessibility tree.
 */
export default function AmbientBackground() {
  return (
    <div className="ambient" aria-hidden="true">
      <div className="ambient__grid" />
      <div className="ambient__glow ambient__glow--a" />
      <div className="ambient__glow ambient__glow--b" />
      <div className="ambient__noise" />
    </div>
  );
}
