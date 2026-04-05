export function Panel({ title, subtitle, accent = "default", children }) {
  return (
    <section className={`panel panel-${accent}`}>
      <header className="panel-header">
        <div>
          <h2>{title}</h2>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
      </header>
      <div className="panel-body">{children}</div>
    </section>
  );
}
