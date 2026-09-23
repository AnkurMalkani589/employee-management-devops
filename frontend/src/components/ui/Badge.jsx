/** Badge - small status/label pill. tone: neutral | accent | success | warning */
export default function Badge({ children, tone = 'neutral', dot = false }) {
  return (
    <span className={`badge badge--${tone}`}>
      {dot && <span className="badge__dot" aria-hidden="true" />}
      {children}
    </span>
  );
}
