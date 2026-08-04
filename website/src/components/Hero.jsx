export default function Hero({ restaurantName }) {
  return (
    <section className="hero">
      <div className="hero-eyebrow">Order online · Dine in · Takeaway</div>
      <h1>Good food, honestly made,<br />served fast.</h1>
      <p>Browse the full menu at {restaurantName || 'our restaurant'} and place your order — for your table or to pick up.</p>
    </section>
  );
}
