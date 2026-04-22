import './AboutPage.css';

const infoItems = [
  { id: 1, label: 'Versión', val: '1.0' },
  { id: 2, label: 'Fuente de datos', val: 'Open Library API' },
  { id: 3, label: 'Framework', val: 'React 19 + Vite' },
  { id: 4, label: 'Enrutamiento', val: 'Enrutamientocon react 19' },
];

function renderInfoBlock(itemData: { id: number; label: string; val: string }) {
  return (
    <li key={itemData.id} className="about-page__info-item">
      <span className="about-page__info-label">{itemData.label}:</span>
      <span className="about-page__info-val">{itemData.val}</span>
    </li>
  );
}

export function AboutPage() {
  const teamData = [
    { nombre: 'Ariel', rol: 'Desarrollado web' },
  ];

  function makeTeamItem(p: { nombre: string; rol: string }, idx: number) {
    return (
      <li key={idx} className="about-page__team-item">
        <strong>{p.nombre}</strong> — {p.rol}
      </li>
    );
  }

  return (
    <main className="about-page">
      <section className="about-page__section">
        <h1 className="about-page__title">Acerca de JU Library</h1>
        <p className="about-page__desc">
          JU Library es una aplicación de catálogo de libros construida como proyecto
          académico. Permite buscar, filtrar y explorar libros del catálogo de Open Library,
          con soporte para modo oscuro y navegación entre vistas.
        </p>
      </section>

      <section className="about-page__section">
        <h2 className="about-page__subtitle">Información técnica</h2>
        <ul className="about-page__info-list">
          {infoItems.map(renderInfoBlock)}
        </ul>
      </section>

      <section className="about-page__section">
        <h2 className="about-page__subtitle">Equipo</h2>
        <ul className="about-page__team-list">
          {teamData.map(makeTeamItem)}
        </ul>
      </section>
    </main>
  );
}
