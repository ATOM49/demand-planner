import type { PropsWithChildren, ReactNode } from "react";

export function LegacySurfaceCard({ title, children }: PropsWithChildren<{ title: string }>) {
  return (
    <section className="surface-card">
      <h2 className="surface-card__title">{title}</h2>
      <div className="section-card__body">{children}</div>
    </section>
  );
}

export function LegacyCard({ title, description, children }: PropsWithChildren<{ title?: string; description?: ReactNode }>) {
  return (
    <section className="card">
      {title ? (
        <header className="card__header">
          <h3>{title}</h3>
          {description ? <p>{description}</p> : null}
        </header>
      ) : null}
      <div className="card__body">{children}</div>
    </section>
  );
}