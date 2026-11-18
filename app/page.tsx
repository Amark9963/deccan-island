import HomeMenuPreview from './components/HomeMenuPreview';

const steps = [
  ['01', 'Choose your dishes', 'Browse the live weekend menu and add what you would like us to prepare.'],
  ['02', 'Pickup or delivery', 'Select self-pickup or send us a delivery request around Penang Island.'],
  ['03', 'Choose your date', 'Pick an available service date, add your details and review the order.'],
];

const methodSteps = [
  ['01', 'Freshly Pounded', 'Whole spices are pounded shortly before marination, fresh for the cooking batch.', '/method-spices.png'],
  ['02', 'Marinated with Care', 'Chicken rests with yogurt, freshly prepared spices and aromatics for around 2–3 hours.', '/method-marination.png'],
  ['03', 'Sealed Dum Cooking', 'Marinated chicken and partially cooked basmati rice finish together in a sealed pot.', '/method-dum.png'],
];

export default function Home() {
  return <main className="home-page">
    <header className="home-header">
      <a className="brand-logo" href="#top" aria-label="Deccan Island home"><img src="/deccan-island-logo.svg" alt="Deccan Island — Hyderabadi Dum Kitchen" /></a>
      <nav aria-label="Homepage sections"><a href="#menu">Menu</a><a href="#method">Our method</a><a href="#story">Our story</a></nav>
      <a className="home-header-order" href="/menu">Browse menu <span>→</span></a>
    </header>

    <section id="top" className="hero section-wrap">
      <div className="hero-copy"><p className="eyebrow">Hyderabadi dum kitchen · Penang</p><h1>Hyderabadi dum<br/><em>for your table.</em></h1><p className="hero-text">The flavours I grew up with in Hyderabad, prepared in small weekend batches here in Penang.</p><a className="button" href="/menu">Browse this weekend’s menu <span>→</span></a><p className="fine-print">Advance pre-orders · Self-pickup or delivery request</p></div>
      <figure className="hero-card"><img className="hero-food" src="/chicken-dum-biryani.png" alt="Hyderabadi chicken dum biryani with raita"/><figcaption><p>Hyderabadi Chicken Dum Biryani</p><small>Freshly pounded spices · sealed dum</small></figcaption></figure>
    </section>

    <HomeMenuPreview />

    <section id="method" className="method-section"><div className="section-wrap"><div className="method-heading"><div><p className="eyebrow">The Deccan Island method</p><h2>Good biryani<br/><em>takes time.</em></h2></div><p>We keep the process close to the pot: whole spices, patient marination and a sealed dum that lets the ingredients finish together.</p></div><div className="method-grid">{methodSteps.map(([number,title,body,image]) => <article className="method-card" key={number}><div className="method-image-wrap"><img className="method-image" src={image} alt=""/></div><span className="method-number">{number}</span><h3>{title}</h3><p>{body}</p></article>)}</div></div></section>

    <section id="how" className="dark-section"><div className="section-wrap"><div className="section-intro light"><p className="eyebrow">Weekend pre-orders</p><h2>From our pot<br/><em>to your table.</em></h2></div><div className="steps">{steps.map(([number,title,body]) => <article className="step" key={number}><span>{number}</span><h3>{title}</h3><p>{body}</p></article>)}</div><p className="how-note">Delivery requests are reviewed manually. Rider timing and fee are confirmed with you by WhatsApp.</p></div></section>

    <section id="story" className="story-section section-wrap"><div className="story-mark" aria-hidden="true">DI</div><div className="story-copy"><p className="eyebrow">From Hyderabad to Penang</p><h2>Rooted in Hyderabad.<br/><em>Made in Penang.</em></h2><p>Growing up in Hyderabad, biryani was part of everyday food culture — familiar aromas, long-grain rice, balanced spices and the anticipation of opening a dum-cooked pot.</p><p>After moving to Penang, I wanted to recreate the flavours I remembered. Cooking for family and friends eventually became Deccan Island — a small weekend kitchen sharing a taste of Hyderabad, one batch at a time.</p><p className="story-signoff">— The founder of Deccan Island</p></div></section>

    <section className="faq section-wrap"><div><p className="eyebrow">Good to know</p><h2>Questions,<br/><em>answered.</em></h2></div><div className="faq-list"><details open><summary>When can I order?</summary><p>Available service dates are shown after you add dishes and choose pickup or delivery.</p></details><details><summary>How does delivery work?</summary><p>Send us a delivery request with your address. Rider timing and fee are confirmed separately by WhatsApp.</p></details><details><summary>How do I pay?</summary><p>DuitNow instructions follow after your order request is created. Your order is confirmed after payment is verified.</p></details></div></section>

    <section className="preorder"><div className="section-wrap preorder-inner"><p className="eyebrow">This weekend</p><h2>Choose your dish.<br/><em>We’ll prepare the rest.</em></h2><p>See what is available, add your dishes and choose how you would like to receive them.</p><a className="button button-light" href="/menu">Browse the menu <span>→</span></a></div></section>

    <footer><div className="section-wrap footer-inner"><a className="brand-logo footer-logo" href="#top"><img src="/deccan-island-logo.svg" alt="Deccan Island — Hyderabadi Dum Kitchen" /></a><p>Hyderabadi dum kitchen · Penang Island, Malaysia</p><div className="footer-bottom"><span>© 2026 Deccan Island</span><span>Small-batch weekend cooking</span></div></div></footer>
  </main>;
}
