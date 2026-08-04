export default function CategoryRail({ categories, active, onSelect }) {
  return (
    <div className="category-rail">
      {categories.map((cat) => (
        <button
          key={cat}
          className={`category-pill ${active === cat ? 'active' : ''}`}
          onClick={() => onSelect(cat)}
        >
          {cat}
        </button>
      ))}
    </div>
  );
}
