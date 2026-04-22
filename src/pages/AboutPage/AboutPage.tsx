import './AboutPage.css';

const infoItems = [
  { id: 1, label: 'Versión', val: '1.0' },
  { id: 2, label: 'Fuente de datos', val: 'Open Library API' },
  { id: 3, label: 'Framework', val: 'React 19 + Vite' },
  { id: 4, label: 'Enrutamiento', val: 'React Router v6' },
];

const teamData = [
  { nombre: 'Ariel', rol: 'Desarrollador web' },
];

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function AboutPage() {
  return (
    <main className="about-page" aria-label="Acerca de JU Library">

      {/* ── Hero ── */}
      <section className="about-page__hero" aria-labelledby="about-title">
        <div className="about-page__hero-inner">
          <p className="about-page__eyebrow">Your Best Library </p>
          <h1 id="about-title" className="about-page__title">
            JU <em>Library</em>
          </h1>
          <p className="about-page__desc">
            Aplicación de catálogo de libros que permite buscar, filtrar y explorar
            títulos del catálogo de Open Library. Construida con soporte para modo
            oscuro y navegación fluida entre vistas.
          </p>
        </div>
      </section>

      <div className="about-page__divider" role="presentation" />

      {/* ── Información técnica ── */}
      <section className="about-page__section" aria-labelledby="about-tech">
        <div className="about-page__section-header">
          <span className="about-page__section-number" aria-hidden="true">01</span>
          <h2 id="about-tech" className="about-page__subtitle">Información técnica</h2>
        </div>

        <ul className="about-page__info-grid" aria-label="Detalles técnicos">
          {infoItems.map(item => (
            <li key={item.id} className="about-page__info-item">
              <span className="about-page__info-label">{item.label}</span>
              <span className="about-page__info-val">{item.val}</span>
            </li>
          ))}
        </ul>
      </section>

    </main>
  );
}