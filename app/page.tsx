const steps = [
  ['01', 'Choose from the menu', 'Add the dishes you would like us to prepare this weekend.'],
  ['02', 'Choose how to receive it', 'Select self-pickup or send us a delivery request around Penang Island.'],
  ['03', 'Choose your service date', 'Add your details, review the order and follow the DuitNow instructions.'],
];

const methodSteps = [
  ['01', 'Freshly Pounded', 'Whole spices are selected and pounded shortly before marination, fresh for the cooking batch.', '/method-spices.png'],
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
      <div className="hero-copy"><p className="eyebrow">Weekend kitchen · Penang Island</p><h1>Hyderabadi dum<br/><em>for your table.</em></h1><p className="hero-text">The flavours I grew up with in Hyderabad, prepared in small weekend batches here in Penang.</p><div className="hero-offer"><strong>From RM18</strong><span>limited weekend portions</span></div><a className="button" href="/menu">Browse this weekend’s menu <span>→</span></a><p className="fine-print">Self-pickup or delivery request · Advance orders only</p></div>
      <figure className="hero-card"><img className="hero-food" src="/chicken-dum-biryani.png" alt="Hyderabadi chicken dum biryani with raita"/><figcaption><p>Hyderabadi Chicken Dum Biryani</p><small>Freshly pounded spices · sealed dum</small></figcaption></figure>
    </section>

    <section className="order-strip section-wrap" aria-label="How weekend ordering works"><div><p className="eyebrow">Weekend ordering</p><strong>Menu first. Fulfilment second.</strong><span>Choose your dishes, then select pickup or request delivery on an available date.</span></div><a className="text-link" href="/menu">Start an order <span>→</span></a></section>

    <section id="menu" className="menu-section section-wrap">
      <div className="section-intro menu-heading"><div><p className="eyebrow">The weekend menu</p><h2>A few good things,<br/><em>done properly.</em></h2></div><p className="menu-intro">A concise menu prepared in limited batches. Add what you want, then choose your date and how you would like to receive it.</p></div>
      <article className="dish-card customer-card"><div className="dish-visual"><img src="/chicken-dum-biryani.png" alt="Chicken dum biryani served with raita"/><span className="image-badge">Includes raita</span></div><div className="dish-details"><div><p className="eyebrow">The original</p><h3>Hyderabadi Chicken<br/>Dum Biryani</h3></div><p>Long-grain basmati, marinated chicken and freshly pounded whole spices, cooked together in a sealed pot.</p><div className="dish-meta"><strong>RM22 <small>/ portion</small></strong><span>One chicken drumstick</span></div><div className="order-preview"><span>More dishes available this weekend</span><a className="text-link" href="/menu">See the full menu <span>→</span></a></div></div></article>
    </section>

    <section id="method" className="method-section"><div className="section-wrap"><div className="method-heading"><div><p className="eyebrow">The Deccan Island method</p><h2>Good biryani<br/><em>takes time.</em></h2></div><p>We keep the process close to the pot: whole spices, patient marination and a sealed dum that lets the ingredients finish together.</p></div><div className="method-grid">{methodSteps.map(([number,title,body,image]) => <article className="method-card" key={number}><div className="method-image-wrap"><img className="method-image" src={image} alt=""/></div><span className="method-number">{number}</span><div className="method-rule"/><h3>{title}</h3><p>{body}</p></article>)}</div></div></section>

    <section id="how" className="dark-section"><div className="section-wrap"><div className="section-intro light"><p className="eyebrow">Three simple steps</p><h2>From our pot<br/><em>to your table.</em></h2></div><div className="steps">{steps.map(([number,title,body]) => <article className="step" key={number}><span>{number}</span><h3>{title}</h3><p>{body}</p></article>)}</div></div></section>

    <section id="story" className="story-section section-wrap"><div className="story-mark" aria-hidden="true">DI</div><div className="story-copy"><p className="eyebrow">From Hyderabad to Penang</p><h2>Rooted in Hyderabad.<br/><em>Made in Penang.</em></h2><p>Growing up in Hyderabad, biryani was part of everyday food culture — familiar aromas, long-grain rice, balanced spices and the anticipation of opening a dum-cooked pot.</p><p>After moving to Penang, I wanted to recreate the flavours I remembered. What began as cooking for family and friends became Deccan Island — a small weekend kitchen sharing a taste of Hyderabad, one batch at a time.</p><p className="story-signoff">— The founder of Deccan Island</p></div></section>

    <section id="pickup" className="pickup section-wrap"><div><p className="eyebrow">Pickup & delivery</p><h2>Made for a<br/><em>weekend pause.</em></h2></div><div className="pickup-copy"><p>Choose self-pickup on an available service date, or send us a delivery request around Penang Island. Exact instructions and delivery arrangements are confirmed with your order.</p><p className="note">Delivery is coordinated manually so we can confirm the rider fee, timing and practical details with you first.</p></div></section>

    <section id="preorder" className="preorder"><div className="section-wrap preorder-inner"><p className="eyebrow">Weekend ordering</p><h2>Choose your dish.<br/><em>We’ll handle the rest.</em></h2><p>Browse the menu, choose pickup or delivery and select an available service date. Payment instructions follow after your order request is created.</p><a className="button button-light" href="/menu">Start with the menu <span>→</span></a></div></section>

    <section className="faq section-wrap"><div><p className="eyebrow">Good to know</p><h2>Questions,<br/><em>answered.</em></h2></div><div className="faq-list"><details open><summary>When can I order?</summary><p>Available service dates are shown after you add dishes and choose pickup or delivery.</p></details><details><summary>How do I receive my order?</summary><p>Choose self-pickup or send a delivery request. Delivery timing, rider fee and details are confirmed separately by WhatsApp.</p></details><details><summary>How do I pay?</summary><p>DuitNow instructions are shown after an order request is created. Your order is confirmed after payment is verified.</p></details></div></section>

    <footer><div className="section-wrap footer-inner"><a className="brand-logo footer-logo" href="#top"><img src="/deccan-island-logo.svg" alt="Deccan Island — Hyderabadi Dum Kitchen" /></a><p>Hyderabadi dum kitchen · Penang Island, Malaysia</p><div className="footer-bottom"><span>© 2026 Deccan Island</span><span>Small-batch weekend cooking</span></div></div></footer>
  </main>;
}
