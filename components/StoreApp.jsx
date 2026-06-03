"use client";
/* ============================================================
   4iGadgets — interactive storefront + admin (client).

   This is the exported prototype UI, ported verbatim into Next.js.
   The ONLY functional change vs. the prototype is the data layer:
   instead of a hardcoded mock `G`, data is loaded from the D1-backed
   API (/api/*) and all writes (auth, checkout, admin CRUD, support)
   call real endpoints. The visual design is unchanged.
   ============================================================ */
import React, {
  useState,
  useEffect,
  useRef,
  useContext,
  createContext,
} from "react";
import { createPortal } from "react-dom";

// ---- tiny fetch helper ----
async function api(path, opts) {
  const res = await fetch(path, {
    headers: { "content-type": "application/json" },
    ...opts,
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* no body */
  }
  if (!res.ok) throw new Error((data && data.error) || "Request failed");
  return data;
}

/* ============================================================
   Data layer (G) — static config + arrays hydrated from the API.
   ============================================================ */
const taka = (n) => "৳" + Number(n).toLocaleString("en-IN");

const divisions = {
  Dhaka: ["Dhaka", "Gazipur", "Narayanganj", "Tangail", "Manikganj", "Munshiganj"],
  Chattogram: ["Chattogram", "Cox's Bazar", "Cumilla", "Feni", "Noakhali"],
  Sylhet: ["Sylhet", "Moulvibazar", "Habiganj", "Sunamganj"],
  Rajshahi: ["Rajshahi", "Bogura", "Pabna", "Natore", "Sirajganj"],
  Khulna: ["Khulna", "Jashore", "Kushtia", "Satkhira"],
  Barishal: ["Barishal", "Bhola", "Patuakhali", "Pirojpur"],
  Rangpur: ["Rangpur", "Dinajpur", "Kurigram", "Gaibandha"],
  Mymensingh: ["Mymensingh", "Jamalpur", "Netrokona", "Sherpur"],
};

const statusMeta = {
  placed: { label: "Placed", cls: "b-grey" },
  confirmed: { label: "Confirmed", cls: "b-teal" },
  packed: { label: "Packed", cls: "b-teal" },
  shipped: { label: "Shipped", cls: "b-amber" },
  delivered: { label: "Delivered", cls: "b-green" },
  cancelled: { label: "Cancelled", cls: "b-red" },
};
const payMeta = {
  paid: { label: "Paid", cls: "b-green" },
  pending: { label: "Pending", cls: "b-amber" },
  unpaid: { label: "Unpaid", cls: "b-red" },
};
const payMethod = {
  bkash: { label: "bKash", short: "bKash", cls: "bkash" },
  nagad: { label: "Nagad", short: "Nagad", cls: "nagad" },
  cod: { label: "Cash on Delivery", short: "COD", cls: "cod" },
};

const G = {
  taka,
  divisions,
  statusMeta,
  payMeta,
  payMethod,
  statusOrder: ["placed", "confirmed", "packed", "shipped", "delivered", "cancelled"],
  // hydrated from /api/catalog:
  categories: [],
  products: [],
  adminCats: [],
  featuredIds: [],
  dealIds: [],
  byId: (id) => G.products.find((p) => p.id === id),
  priceOf: (p) => (p.disc && p.disc > 0 ? p.disc : p.price),
  catName: (id) => (G.categories.find((c) => c.id === id) || {}).name || id,
};

/** Populate G from a /api/catalog response. */
function applyCatalog(data) {
  G.categories = data.categories || [];
  G.products = data.products || [];
  G.adminCats = G.categories.map((c) => ({ ...c, products: c.count, active: true }));
  // Featured = a spread across the catalog; Deals = biggest discounts.
  G.featuredIds = G.products.slice(0, 8).map((p) => p.id);
  G.dealIds = [...G.products]
    .filter((p) => p.disc && p.disc > 0)
    .sort((a, b) => b.price - b.disc - (a.price - a.disc))
    .slice(0, 8)
    .map((p) => p.id);
}

/* ===== components.jsx ===== */
/* ============================================================
   4iGadgets — Shared components
   ============================================================ */

// ---- App context (nav, cart, auth, toast) ----
const Shop = createContext(null);
const useShop = () => useContext(Shop);

// ---- Icon (lucide) ----
function Icon({ name, size, className, style }) {
  const s = size ? { width: size, height: size } : null;
  return <i data-lucide={name} className={'ic ' + (className || '')} style={{ ...s, ...style }} />;
}

// ---- Image placeholder ----
function Thumb({ label, tint, className, style }) {
  const t = tint === 'a' ? 'tint-a' : tint === 'b' ? 'tint-b' : '';
  return (
    <div className={'ph ' + t + ' ' + (className || '')} style={style}>
      <span className="ph-lbl">{label || 'image'}</span>
    </div>
  );
}

// ---- Taka ----
function Tk({ children }) {
  return <span className="taka">{G.taka(children)}</span>;
}

// ---- Stars ----
function Stars({ rating }) {
  return (
    <span className="stars">
      {[0, 1, 2, 3, 4].map(i => (
        <Icon key={i} name="star" style={{ fill: i < Math.round(rating) ? '#E76F51' : 'none', color: i < Math.round(rating) ? '#E76F51' : '#d8d2c6' }} />
      ))}
    </span>
  );
}

// ---- Badge ----
function Badge({ kind, children, icon }) {
  return <span className={'badge ' + kind}>{icon && <Icon name={icon} />}{children}</span>;
}
function StatusBadge({ status }) {
  const m = G.statusMeta[status]; return <Badge kind={m.cls}>{m.label}</Badge>;
}
function PayBadge({ status }) {
  const m = G.payMeta[status]; return <Badge kind={m.cls}>{m.label}</Badge>;
}

// ---- Product card ----
function ProductCard({ p }) {
  const { navigate, addToCart } = useShop();
  const price = G.priceOf(p);
  const off = p.disc && p.disc > 0 ? Math.round((1 - p.disc / p.price) * 100) : 0;
  return (
    <div className="pcard fade-in" onClick={() => navigate('product', { id: p.id })}>
      <div className="pc-img">
        {off > 0 && <span className="sale-tag">-{off}%</span>}
        <button className="pc-fav" onClick={(e) => { e.stopPropagation(); }}><Icon name="heart" size={16} /></button>
        {p.imageUrl
          ? <img src={p.imageUrl} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <Thumb label={p.brand + ' shot'} tint={p.tint} style={{ height: '100%' }} />}
      </div>
      <div className="pc-body">
        <div className="pc-cat">{G.catName(p.cat)}</div>
        <div className="pc-name">{p.name}</div>
        <div className="pc-rate"><Stars rating={p.rating} /><span>{p.rating} · {p.reviews}</span></div>
        <div className="pc-price">
          <span className="now"><Tk>{price}</Tk></span>
          {off > 0 && <span className="was"><Tk>{p.price}</Tk></span>}
        </div>
        <button className="btn btn-soft btn-sm pc-add" onClick={(e) => { e.stopPropagation(); addToCart(p.id, 1); }}>
          <Icon name="shopping-cart" size={15} /> Add to cart
        </button>
      </div>
    </div>
  );
}

// ---- Form field ----
function Field({ label, hint, children, span2 }) {
  return (
    <div className={'field' + (span2 ? ' span2' : '')}>
      {label && <label>{label}</label>}
      {children}
      {hint && <span className="hint">{hint}</span>}
    </div>
  );
}

// ---- Qty stepper ----
function Qty({ value, onChange, min = 1, max = 99 }) {
  return (
    <div className="qty">
      <button onClick={() => onChange(Math.max(min, value - 1))} disabled={value <= min}>−</button>
      <span className="n">{value}</span>
      <button onClick={() => onChange(Math.min(max, value + 1))} disabled={value >= max}>+</button>
    </div>
  );
}

// ---- Header (customer) ----
function Header() {
  const { navigate, route, cartCount, user, isMobile } = useShop();
  const navItems = [
    ['home', 'Home'], ['category', 'Shop All'],
    ...G.categories.slice(0, 5).map(c => [`cat:${c.id}`, c.name]),
  ];
  if (isMobile) {
    return (
      <header className="hdr">
        <div className="deliver-strip">🚚 Free delivery over <b>৳2,000</b> · <b>Cash on Delivery</b> available</div>
        <div className="wrap hdr-top" style={{ height: 60, gap: 12 }}>
          <div className="logo" onClick={() => navigate('home')} style={{ fontSize: 19 }}>4i<span className="g">Gadgets</span></div>
          <div className="pb-spacer" />
          <button className="icon-btn" onClick={() => navigate('category')}><Icon name="search" size={19} /></button>
          <button className="icon-btn" onClick={() => navigate('cart')}>
            <Icon name="shopping-cart" size={19} />
            {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
          </button>
        </div>
      </header>
    );
  }
  return (
    <header className="hdr">
      <div className="deliver-strip">🚚 Free delivery on orders over <b>৳2,000</b> across Bangladesh · <b>Cash on Delivery</b>, bKash & Nagad accepted</div>
      <div className="wrap hdr-top">
        <div className="logo" onClick={() => navigate('home')}>4i<span className="g">Gadgets</span></div>
        <div className="search">
          <div className="inp-group">
            <span className="pfx"><Icon name="search" size={17} /></span>
            <input placeholder="Search for phones, laptops, audio…" onKeyDown={(e) => { if (e.key === 'Enter') navigate('category'); }} />
          </div>
        </div>
        <div className="pb-spacer" />
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(user ? 'account' : 'login')}>
          <Icon name="user" size={16} /> {user ? user.name.split(' ')[0] : 'Login'}
        </button>
        <button className="icon-btn" onClick={() => navigate('cart')}>
          <Icon name="shopping-cart" size={19} />
          {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
        </button>
      </div>
      <div className="wrap">
        <nav className="hdr-nav">
          {navItems.map(([k, label]) => {
            const active = (k === route.name) || (k.startsWith('cat:') && route.name === 'category' && route.params.cat === k.slice(4));
            return <a key={k} className={active ? 'active' : ''} onClick={() => {
              if (k.startsWith('cat:')) navigate('category', { cat: k.slice(4) });
              else navigate(k);
            }}>{label}</a>;
          })}
          <div className="pb-spacer" />
          <a onClick={() => navigate('support')}><Icon name="headset" size={15} style={{ marginRight: 4 }} />Support</a>
        </nav>
      </div>
    </header>
  );
}

// ---- Mobile tab bar ----
function MobileTabs() {
  const { navigate, route, cartCount, user } = useShop();
  const tabs = [
    ['home', 'home', 'Home'],
    ['category', 'layout-grid', 'Shop'],
    ['cart', 'shopping-cart', 'Cart'],
    [user ? 'account' : 'login', 'user', user ? 'Account' : 'Login'],
  ];
  const isOn = (k) => k === route.name || (k === 'login' && route.name === 'account');
  return (
    <nav className="m-tabbar">
      {tabs.map(([k, ic, label]) => (
        <button key={label} className={isOn(k) ? 'on' : ''} onClick={() => navigate(k)}>
          <Icon name={ic} className="ic" />
          {k === 'cart' && cartCount > 0 && <span className="tb-badge">{cartCount}</span>}
          {label}
        </button>
      ))}
    </nav>
  );
}

// ---- Footer ----
function Footer() {
  const { navigate } = useShop();
  return (
    <footer className="ftr">
      <div className="wrap ftr-main">
        <div>
          <div className="logo" style={{ marginBottom: 14 }}>4i<span className="g">Gadgets</span></div>
          <p style={{ fontSize: 13, color: '#a9c1c5', lineHeight: 1.6, margin: '0 0 16px', maxWidth: 300 }}>
            Bangladesh's friendly everything store. Genuine products, honest prices, and delivery to your door পুরো দেশজুড়ে।
          </p>
        </div>
        <div>
          <h5>Shop</h5>
          {G.categories.slice(0, 5).map(c => <a key={c.id} onClick={() => navigate('category', { cat: c.id })}>{c.name}</a>)}
        </div>
        <div>
          <h5>Help</h5>
          <a onClick={() => navigate('support')}>Contact us</a>
          <a onClick={() => navigate('delivery')}>Delivery info</a>
          <a onClick={() => navigate('refund')}>Refund Policy</a>
        </div>
        <div>
          <h5>Reach us</h5>
          <li><Icon name="phone" size={13} style={{ marginRight: 6 }} />01600000034 (9am–9pm)</li>
          <li><Icon name="mail" size={13} style={{ marginRight: 6 }} />hello@4igadgets.bd</li>
          <li><Icon name="map-pin" size={13} style={{ marginRight: 6 }} />ECB Chattar, Dhaka 1206</li>
        </div>
      </div>
      <div className="wrap ftr-bottom">
        <span>© 2026 4iGadgets. All rights reserved.</span>
      </div>
    </footer>
  );
}

// ---- Marketing banner (content managed from the admin dashboard) ----
const BANNER_THEMES = {
  amber: { bg: 'linear-gradient(110deg,var(--amber),var(--amber-600))', fg: '#fff', sub: 'rgba(255,255,255,.92)', eye: 'rgba(255,255,255,.9)', btnBg: '#fff', btnFg: 'var(--amber-600)' },
  teal: { bg: 'linear-gradient(110deg,var(--teal),var(--teal-700))', fg: '#fff', sub: '#bfd6db', eye: '#9fd0d8', btnBg: 'var(--amber)', btnFg: '#fff' },
  cream: { bg: 'var(--surface)', fg: 'var(--ink)', sub: 'var(--muted)', eye: 'var(--amber-600)', btnBg: 'var(--teal)', btnFg: '#fff', border: '1px solid var(--line)' },
};

function BannerCard({ banner, isMobile, onCta }) {
  const t = BANNER_THEMES[banner.theme] || BANNER_THEMES.amber;
  return (
    <div className="mkt-banner" style={{ background: t.bg, color: t.fg, border: t.border || 0, padding: isMobile ? 24 : '34px 40px' }}>
      <div className="mkt-banner-copy">
        {banner.eyebrow && <div className="mkt-eye" style={{ color: t.eye }}>{banner.eyebrow}</div>}
        <div className="mkt-title" style={{ fontSize: isMobile ? 22 : 27 }}>{banner.title}</div>
        {banner.subtitle && <div className="mkt-sub" style={{ color: t.sub }}>{banner.subtitle}</div>}
      </div>
      {banner.cta && <button className="btn btn-lg" style={{ background: t.btnBg, color: t.btnFg }} onClick={onCta}>{banner.cta}</button>}
    </div>
  );
}

function MarketingBanner() {
  const { banner, navigate, isMobile } = useShop();
  if (!banner || !banner.enabled) return null;
  return (
    <section style={{ padding: '12px 0' }}>
      <div className="wrap">
        <BannerCard banner={banner} isMobile={isMobile} onCta={() => navigate(banner.target || 'category', banner.targetParams || {})} />
      </div>
    </section>
  );
}

// ---- Breadcrumb ----
function Crumb({ items }) {
  const { navigate } = useShop();
  return (
    <div className="wrap crumb">
      {items.map((it, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span className="sep">/</span>}
          {it.to ? <a onClick={() => navigate(it.to, it.params)}>{it.label}</a> : <span style={{ color: 'var(--ink-2)', fontWeight: 600 }}>{it.label}</span>}
        </React.Fragment>
      ))}
    </div>
  );
}

// ---- Modal (portals to the fixed overlay host so it anchors to the frame) ----
function Modal({ title, onClose, children, footer }) {
  const host = (typeof document !== 'undefined') && document.getElementById('overlay-host');
  // Modal opens via local child state (App doesn't re-render), so its freshly
  // mounted lucide icons need an explicit pass to render.
  useEffect(() => { if (window.lucide) window.lucide.createIcons(); });
  const content = (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="act-btn" onClick={onClose}><Icon name="x" size={18} /></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
  return host ? createPortal(content, host) : content;
}

// ---- Customer chrome wrapper ----
function CustomerShell({ children }) {
  const { isMobile } = useShop();
  return (
    <>
      <Header />
      <div style={{ minHeight: isMobile ? 'auto' : '60vh' }}>{children}</div>
      {!isMobile && <Footer />}
      {isMobile && <MobileTabs />}
    </>
  );
}


/* ===== screens_shop.jsx ===== */
/* ============================================================
   4iGadgets — Customer screens
   ============================================================ */

// ---------- HERO variants ----------
function HeroA() {
  const { navigate } = useShop();
  return (
    <div className="hero-a">
      <div>
        <span className="hero-eyebrow"><span className="dot" /> Eid Dhamaka · up to 30% off</span>
        <h1>Gadgets you can<br />trust, delivered<br />to your door.</h1>
        <p>Genuine, warranty-backed tech at honest prices. Pay with bKash, Nagad, or cash on delivery, anywhere in Bangladesh.</p>
        <div className="row gap-12" style={{ flexWrap: 'wrap' }}>
          <button className="btn btn-accent btn-lg" onClick={() => navigate('category')}>Shop deals <Icon name="arrow-right" size={17} /></button>
          <button className="btn btn-lg" style={{ background: 'rgba(255,255,255,.12)', color: '#fff' }} onClick={() => navigate('category', { cat: 'smartphones' })}>Browse phones</button>
        </div>
        <div className="hero-stat-row">
          <div className="hero-stat"><b>50k+</b><span>happy customers</span></div>
          <div className="hero-stat"><b>4.8★</b><span>avg. rating</span></div>
          <div className="hero-stat"><b>64</b><span>districts served</span></div>
        </div>
      </div>
      <div className="hero-visual"><Thumb label="hero product shot" style={{ height: '100%', borderRadius: 18 }} /></div>
    </div>
  );
}
function HeroB() {
  const { navigate } = useShop();
  return (
    <div className="hero-b">
      <div className="hb-copy">
        <span className="hero-eyebrow" style={{ background: 'var(--amber-50)', color: 'var(--amber-600)', alignSelf: 'flex-start' }}><span className="dot" /> New arrivals weekly</span>
        <h1>Everything you need, <em>without the worry.</em></h1>
        <p>Phones, fashion, shoes, appliances & home essentials. Every order is checked, packed with care, and delivered to your door across Bangladesh.</p>
        <div className="row gap-12" style={{ flexWrap: 'wrap' }}>
          <button className="btn btn-primary btn-lg" onClick={() => navigate('category')}>Start shopping <Icon name="arrow-right" size={17} /></button>
          <button className="btn btn-ghost btn-lg" onClick={() => navigate('support')}>Talk to us</button>
        </div>
      </div>
      <div className="hb-visual"><Thumb label="lifestyle hero shot" tint="b" style={{ height: '100%' }} /></div>
    </div>
  );
}
function HeroC() {
  const { navigate } = useShop();
  return (
    <div className="hero-c">
      <div className="blob" style={{ width: 280, height: 280, background: '#1c7a8c', top: -80, right: -40 }} />
      <div className="blob" style={{ width: 180, height: 180, background: '#E76F51', bottom: -70, right: 180, opacity: .35 }} />
      <div style={{ position: 'relative', zIndex: 2 }}>
        <span className="hero-eyebrow"><span className="dot" /> Trusted since 2026</span>
        <h1>Big tech energy.<br />Small, friendly prices.</h1>
        <p>Shop phones, laptops & audio with free Dhaka delivery and easy 7-day replacement.</p>
        <button className="btn btn-accent btn-lg" onClick={() => navigate('category')}>Explore the shop <Icon name="arrow-right" size={17} /></button>
      </div>
    </div>
  );
}

function Home() {
  const { navigate, hero, isMobile } = useShop();
  const featured = G.featuredIds.map(G.byId);
  const deals = G.dealIds.map(G.byId).slice(0, isMobile ? 4 : 5);
  const Hero = hero === 'B' ? HeroB : hero === 'C' ? HeroC : HeroA;
  const trust = [
    ['truck', 'Free delivery', 'On orders over ৳2,000', 'var(--teal-50)', 'var(--teal)'],
    ['shield-check', '1-year warranty', 'Official, genuine units', 'var(--amber-50)', 'var(--amber-600)'],
    ['rotate-ccw', '7-day replacement', 'Easy, no-fuss returns', 'var(--teal-50)', 'var(--teal)'],
    ['banknote', 'Cash on Delivery', 'Pay when it arrives', 'var(--amber-50)', 'var(--amber-600)'],
  ];
  return (
    <CustomerShell>
      <div className="wrap" style={{ paddingTop: 24 }}><Hero /></div>

      <section className="section" style={{ paddingTop: 30 }}>
        <div className="wrap">
          <div className="sec-head"><div><h2>Shop by category</h2><p>Find exactly what you need</p></div>
            {!isMobile && <span className="linkish" onClick={() => navigate('category')}>View all <Icon name="arrow-right" size={15} /></span>}</div>
          <div className="cat-scroll">
            {G.categories.map(c => (
              <div className="cat-card" key={c.id} onClick={() => navigate('category', { cat: c.id })}>
                <div className="ci"><Icon name={c.icon} /></div>
                <span>{c.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: isMobile ? '4px 0' : '8px 0' }}>
        <div className="wrap"><div className="trust-row">
          {trust.map(([ic, t, d, bg, col]) => (
            <div className="trust-item" key={t}>
              <div className="ti-ic" style={{ background: bg, color: col }}><Icon name={ic} size={20} /></div>
              <div><h4>{t}</h4><p>{d}</p></div>
            </div>
          ))}
        </div></div>
      </section>

      <section className="section">
        <div className="wrap">
          <div className="sec-head"><div><h2>🔥 Today's best deals</h2><p>Limited-time discounts, while stock lasts</p></div>
            <span className="linkish" onClick={() => navigate('category', { sort: 'discount' })}>All deals <Icon name="arrow-right" size={15} /></span></div>
          <div className={'pgrid' + (isMobile ? '' : ' cols-5')}>{deals.map(p => <ProductCard key={p.id} p={p} />)}</div>
        </div>
      </section>

      {/* marketing banner — editable from the admin dashboard */}
      <MarketingBanner />

      <section className="section">
        <div className="wrap">
          <div className="sec-head"><div><h2>Featured products</h2><p>Customer favourites this week</p></div></div>
          <div className="pgrid">{featured.map(p => <ProductCard key={p.id} p={p} />)}</div>
        </div>
      </section>
    </CustomerShell>
  );
}

// ---------- Category / listing ----------
function Listing() {
  const { route, navigate, isMobile } = useShop();
  const [cats, setCats] = useState(route.params.cat ? [route.params.cat] : []);
  const [sort, setSort] = useState(route.params.sort || 'popular');
  const [maxPrice, setMaxPrice] = useState(120000);
  const [showFilter, setShowFilter] = useState(false);

  useEffect(() => { setCats(route.params.cat ? [route.params.cat] : []); setSort(route.params.sort || 'popular'); }, [route.params.cat, route.params.sort]);

  let list = G.products.filter(p => (cats.length === 0 || cats.includes(p.cat)) && G.priceOf(p) <= maxPrice);
  if (sort === 'low') list = [...list].sort((a, b) => G.priceOf(a) - G.priceOf(b));
  else if (sort === 'high') list = [...list].sort((a, b) => G.priceOf(b) - G.priceOf(a));
  else if (sort === 'discount') list = [...list].sort((a, b) => (b.price - G.priceOf(b)) - (a.price - G.priceOf(a)));
  else if (sort === 'rating') list = [...list].sort((a, b) => b.rating - a.rating);

  const toggleCat = (id) => setCats(c => c.includes(id) ? c.filter(x => x !== id) : [...c, id]);
  const title = cats.length === 1 ? G.catName(cats[0]) : 'All Products';

  const Filters = () => (
    <>
      <div className="filter-group">
        <h4>Category</h4>
        {G.categories.map(c => (
          <label className="check" key={c.id}>
            <input type="checkbox" checked={cats.includes(c.id)} onChange={() => toggleCat(c.id)} />
            {c.name}<span className="cnt">{c.count}</span>
          </label>
        ))}
      </div>
      <div className="filter-group">
        <h4>Max price</h4>
        <input type="range" min="490" max="120000" step="500" value={maxPrice} onChange={e => setMaxPrice(+e.target.value)} style={{ width: '100%', accentColor: 'var(--teal)' }} />
        <div className="between" style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 6 }}><span>৳490</span><b style={{ color: 'var(--teal)' }}><Tk>{maxPrice}</Tk></b></div>
      </div>
      <div className="filter-group">
        <h4>Brand</h4>
        {['Aurora', 'Stratos', 'Deshi Thread', 'Aarshi', 'StepUp', 'Komfort', 'HomePro', 'Glow'].map(b => (
          <label className="check" key={b}><input type="checkbox" />{b}</label>
        ))}
      </div>
      <button className="btn btn-ghost btn-block btn-sm" onClick={() => { setCats([]); setMaxPrice(120000); }}>Clear filters</button>
    </>
  );

  return (
    <CustomerShell>
      <Crumb items={[{ label: 'Home', to: 'home' }, { label: title }]} />
      <div className="wrap section" style={{ paddingTop: 10 }}>
        <div className="sec-head" style={{ marginBottom: 18 }}>
          <div><h2>{title}</h2><p>{list.length} products available</p></div>
        </div>

        {isMobile && (
          <div className="m-filter-bar">
            <button className="btn btn-ghost btn-sm" onClick={() => setShowFilter(true)}><Icon name="sliders-horizontal" size={15} /> Filters {cats.length ? `(${cats.length})` : ''}</button>
            <select className="sel" style={{ flex: 1 }} value={sort} onChange={e => setSort(e.target.value)}>
              <option value="popular">Most popular</option><option value="low">Price: Low to High</option>
              <option value="high">Price: High to Low</option><option value="discount">Biggest discount</option><option value="rating">Top rated</option>
            </select>
          </div>
        )}

        <div className="listing">
          {!isMobile && <aside className="filter-card"><Filters /></aside>}
          <div>
            {!isMobile && (
              <div className="listing-top">
                <div className="chips">
                  <span className={'chip' + (cats.length === 0 ? ' on' : '')} onClick={() => setCats([])}>All</span>
                  {G.categories.map(c => <span key={c.id} className={'chip' + (cats.includes(c.id) ? ' on' : '')} onClick={() => setCats([c.id])}>{c.name}</span>)}
                </div>
                <select className="sel" style={{ width: 200 }} value={sort} onChange={e => setSort(e.target.value)}>
                  <option value="popular">Sort: Most popular</option><option value="low">Price: Low to High</option>
                  <option value="high">Price: High to Low</option><option value="discount">Biggest discount</option><option value="rating">Top rated</option>
                </select>
              </div>
            )}
            {list.length === 0 ? (
              <div className="empty-state"><div className="es-ic"><Icon name="search-x" /></div><h3>No products found</h3><p>Try widening your price range or clearing filters.</p></div>
            ) : (
              <div className="pgrid">{list.map(p => <ProductCard key={p.id} p={p} />)}</div>
            )}
          </div>
        </div>
      </div>
      {showFilter && isMobile && (
        <Modal title="Filters" onClose={() => setShowFilter(false)} footer={<button className="btn btn-primary btn-block" onClick={() => setShowFilter(false)}>Show {list.length} results</button>}>
          <Filters />
        </Modal>
      )}
    </CustomerShell>
  );
}

// ---------- Product detail ----------
function Product() {
  const { route, navigate, addToCart, isMobile } = useShop();
  const p = G.byId(route.params.id) || G.products[0];
  const [qty, setQty] = useState(1);
  const [img, setImg] = useState(0);
  const price = G.priceOf(p);
  const off = p.disc && p.disc > 0 ? Math.round((1 - p.disc / p.price) * 100) : 0;
  const related = G.products.filter(x => x.cat === p.cat && x.id !== p.id).slice(0, isMobile ? 2 : 4);

  return (
    <CustomerShell>
      <Crumb items={[{ label: 'Home', to: 'home' }, { label: G.catName(p.cat), to: 'category', params: { cat: p.cat } }, { label: p.name }]} />
      <div className="wrap section" style={{ paddingTop: 8 }}>
        <div className="pdp">
          <div className="pdp-gallery">
            <div className="pdp-main-img">{off > 0 && <span className="sale-tag">-{off}% OFF</span>}{p.imageUrl ? <img src={p.imageUrl} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Thumb label={`${p.brand} · view ${img + 1}`} tint={p.tint} style={{ height: '100%' }} />}</div>
            <div className="pdp-thumbs">{[0, 1, 2, 3].map(i => <div key={i} className={'t' + (img === i ? ' on' : '')} onClick={() => setImg(i)}><Thumb label={`v${i + 1}`} tint={p.tint} style={{ height: '100%' }} /></div>)}</div>
          </div>
          <div>
            <div className="pc-cat">{G.catName(p.cat)} · {p.brand}</div>
            <h1>{p.name}</h1>
            <div className="row gap-10"><Stars rating={p.rating} /><span className="muted" style={{ fontSize: 13.5 }}>{p.rating} · {p.reviews} reviews</span>
              {p.stock <= 10 && <Badge kind="b-amber" icon="flame">Only {p.stock} left</Badge>}</div>
            <div className="pdp-price"><span className="now"><Tk>{price}</Tk></span>{off > 0 && <><span className="was"><Tk>{p.price}</Tk></span><Badge kind="b-red">Save <Tk>{p.price - price}</Tk></Badge></>}</div>
            <p className="pdp-desc">{p.desc}</p>
            <div style={{ margin: '18px 0' }}>{p.features.map(f => <div className="pdp-feature" key={f}><Icon name="check-circle-2" size={17} className="ic" />{f}</div>)}</div>
            <div className="divider" />
            <div className="pdp-buy">
              <Qty value={qty} onChange={setQty} max={p.stock} />
              <button className="btn btn-primary btn-lg" style={{ flex: 1 }} onClick={() => addToCart(p.id, qty)}><Icon name="shopping-cart" size={18} /> Add to Cart</button>
              <button className="btn btn-accent btn-lg" onClick={() => { addToCart(p.id, qty); navigate('cart'); }}>Buy Now</button>
            </div>
            <div className="row gap-16 muted" style={{ fontSize: 12.5, flexWrap: 'wrap' }}>
              <span className="row gap-6"><Icon name="truck" size={15} /> Delivered in 2–4 days</span>
              <span className="row gap-6"><Icon name="shield-check" size={15} /> Official warranty</span>
              <span className="row gap-6"><Icon name="rotate-ccw" size={15} /> 7-day replacement</span>
            </div>
          </div>
        </div>

        <div className="section" style={{ paddingBottom: 0 }}>
          <div className="sec-head"><h2 style={{ fontSize: 21 }}>You may also like</h2></div>
          <div className="pgrid">{related.map(r => <ProductCard key={r.id} p={r} />)}</div>
        </div>
      </div>
    </CustomerShell>
  );
}


/* ===== screens_checkout.jsx ===== */
/* ============================================================
   4iGadgets — Cart, Checkout, Confirmation
   ============================================================ */

function Cart() {
  const { cart, setQty, removeFromCart, navigate, isMobile } = useShop();
  const lines = cart.map(c => ({ ...c, p: G.byId(c.id) })).filter(c => c.p);
  const subtotal = lines.reduce((s, l) => s + G.priceOf(l.p) * l.qty, 0);
  const saved = lines.reduce((s, l) => s + (l.p.disc && l.p.disc > 0 ? (l.p.price - l.p.disc) * l.qty : 0), 0);
  const shipping = subtotal >= 2000 || subtotal === 0 ? 0 : 80;

  if (lines.length === 0) {
    return (
      <CustomerShell>
        <div className="wrap section">
          <div className="empty-state">
            <div className="es-ic"><Icon name="shopping-cart" /></div>
            <h3>Your cart is empty</h3>
            <p>Looks like you haven't added anything yet. Let's find something you'll love.</p>
            <button className="btn btn-primary btn-lg" onClick={() => navigate('category')}><Icon name="layout-grid" size={17} /> Start shopping</button>
          </div>
        </div>
      </CustomerShell>
    );
  }

  return (
    <CustomerShell>
      <Crumb items={[{ label: 'Home', to: 'home' }, { label: 'Shopping Cart' }]} />
      <div className="wrap section" style={{ paddingTop: 8 }}>
        <div className="sec-head" style={{ marginBottom: 14 }}><h2>Shopping Cart <span className="muted" style={{ fontSize: 16, fontWeight: 600 }}>({lines.length} items)</span></h2></div>
        <div className="cart-layout">
          <div className="card card-pad" style={{ padding: isMobile ? 16 : 22 }}>
            {lines.map(l => (
              <div className="cart-item" key={l.id}>
                <div className="ci-img" onClick={() => navigate('product', { id: l.id })} style={{ cursor: 'pointer' }}><Thumb label={l.p.brand} tint={l.p.tint} style={{ height: '100%' }} /></div>
                <div>
                  <div className="ci-name" onClick={() => navigate('product', { id: l.id })} style={{ cursor: 'pointer' }}>{l.p.name}</div>
                  <div className="ci-meta">{G.catName(l.p.cat)} · {l.p.brand}</div>
                  <div className="row gap-8" style={{ marginTop: 6 }}>
                    <span style={{ fontWeight: 800, color: 'var(--teal)' }}><Tk>{G.priceOf(l.p)}</Tk></span>
                    {l.p.disc > 0 && <span className="was" style={{ fontSize: 12.5, color: 'var(--muted-2)', textDecoration: 'line-through' }}><Tk>{l.p.price}</Tk></span>}
                  </div>
                </div>
                <div className="ci-ctrl">
                  <Qty value={l.qty} onChange={(q) => setQty(l.id, q)} max={l.p.stock} />
                  <button className="act-btn danger" onClick={() => removeFromCart(l.id)}><Icon name="trash-2" size={16} /></button>
                </div>
              </div>
            ))}
            <div className="row gap-10" style={{ marginTop: 18 }}>
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('category')}><Icon name="arrow-left" size={15} /> Continue shopping</button>
            </div>
          </div>

          <div className="summary">
            <h3 style={{ margin: '0 0 14px', fontSize: 17, fontWeight: 800 }}>Order Summary</h3>
            <div className="summary-row"><span>Subtotal</span><span><Tk>{subtotal}</Tk></span></div>
            {saved > 0 && <div className="summary-row" style={{ color: 'var(--amber-600)' }}><span>Discount savings</span><span>− <Tk>{saved}</Tk></span></div>}
            <div className="summary-row"><span>Delivery</span><span>{shipping === 0 ? <b style={{ color: 'var(--green)' }}>FREE</b> : <Tk>{shipping}</Tk>}</span></div>
            {shipping > 0 && <div style={{ fontSize: 12, color: 'var(--muted)', background: 'var(--cream)', padding: '8px 11px', borderRadius: 8, margin: '6px 0' }}><Icon name="info" size={13} style={{ marginRight: 5, verticalAlign: -2 }} />Add <Tk>{2000 - subtotal}</Tk> more for free delivery</div>}
            <div className="summary-row total"><span>Total</span><span><Tk>{subtotal + shipping}</Tk></span></div>
            <button className="btn btn-primary btn-block btn-lg" style={{ marginTop: 16 }} onClick={() => navigate('checkout')}>Proceed to Checkout <Icon name="arrow-right" size={17} /></button>
            <div className="row gap-8" style={{ justifyContent: 'center', marginTop: 14, flexWrap: 'wrap' }}>
              <span className="pay-pill" style={{ fontSize: 11 }}><span className="bk">b</span>Kash</span>
              <span className="pay-pill" style={{ fontSize: 11 }}><span className="ng">◆</span>Nagad</span>
              <span className="pay-pill" style={{ fontSize: 11 }}><Icon name="banknote" size={13} /> COD</span>
            </div>
            <p className="muted" style={{ fontSize: 11.5, textAlign: 'center', marginTop: 12, lineHeight: 1.5 }}><Icon name="lock" size={12} style={{ verticalAlign: -1 }} /> Secure checkout · Your info stays private</p>
          </div>
        </div>
      </div>
    </CustomerShell>
  );
}

// ---------- Checkout ----------
function Checkout() {
  const { cart, navigate, user, placeOrder, isMobile, toast } = useShop();
  const lines = cart.map(c => ({ ...c, p: G.byId(c.id) })).filter(c => c.p);
  const subtotal = lines.reduce((s, l) => s + G.priceOf(l.p) * l.qty, 0);
  const shipping = subtotal >= 2000 ? 0 : 80;
  const total = subtotal + shipping;

  const [mode, setMode] = useState(user ? 'account' : 'guest');
  const [division, setDivision] = useState('Dhaka');
  const [pay, setPay] = useState('cod');
  const [form, setForm] = useState({ name: user ? user.name : '', phone: user ? '01712-345678' : '', email: '', district: 'Dhaka', area: '', address: '', txn: '' });
  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  useEffect(() => { if (lines.length === 0) navigate('cart'); }, []);

  const submit = () => {
    if (!form.name || !form.phone || !form.address) { toast('Please fill name, phone & address', 'alert-triangle'); return; }
    if ((pay === 'bkash' || pay === 'nagad') && !form.txn) { toast('Enter the transaction ID', 'alert-triangle'); return; }
    placeOrder({ ...form, division, pay, total });
  };

  return (
    <CustomerShell>
      <Crumb items={[{ label: 'Home', to: 'home' }, { label: 'Cart', to: 'cart' }, { label: 'Checkout' }]} />
      <div className="wrap section" style={{ paddingTop: 8 }}>
        <div className="sec-head" style={{ marginBottom: 16 }}><h2>Checkout</h2></div>
        <div className="checkout">
          <div>
            {/* account / guest */}
            {!user && (
              <div className="block">
                <div className="toggle-guest">
                  <button className={mode === 'guest' ? 'on' : ''} onClick={() => setMode('guest')}>Checkout as guest</button>
                  <button className={mode === 'login' ? 'on' : ''} onClick={() => navigate('login')}>Login to account</button>
                </div>
                <p className="muted" style={{ fontSize: 12.5, margin: 0 }}>No account needed, just give us where to deliver. You can create an account after if you like.</p>
              </div>
            )}

            <div className="block">
              <div className="block-head"><span className="step-n">1</span><h3>Contact details</h3></div>
              <div className="form-grid">
                <Field label="Full name"><input className="inp" value={form.name} onChange={set('name')} placeholder="e.g. Tahsin Rahman" /></Field>
                <Field label="Phone number" hint="We'll call before delivery">
                  <input className="inp" value={form.phone} onChange={set('phone')} placeholder="01XXX-XXXXXX" />
                </Field>
                <Field label="Email (optional)" span2><input className="inp" value={form.email} onChange={set('email')} placeholder="for order updates" /></Field>
              </div>
            </div>

            <div className="block">
              <div className="block-head"><span className="step-n">2</span><h3>Shipping address</h3></div>
              <div className="form-grid">
                <Field label="Division">
                  <select className="sel" value={division} onChange={e => { setDivision(e.target.value); setForm(f => ({ ...f, district: G.divisions[e.target.value][0] })); }}>
                    {Object.keys(G.divisions).map(d => <option key={d}>{d}</option>)}
                  </select>
                </Field>
                <Field label="District">
                  <select className="sel" value={form.district} onChange={set('district')}>
                    {G.divisions[division].map(d => <option key={d}>{d}</option>)}
                  </select>
                </Field>
                <Field label="Area / Thana"><input className="inp" value={form.area} onChange={set('area')} placeholder="e.g. Mirpur 10" /></Field>
                <Field label="Full address" span2><textarea className="inp" value={form.address} onChange={set('address')} placeholder="House / road / landmark for the rider" /></Field>
              </div>
            </div>

            <div className="block">
              <div className="block-head"><span className="step-n">3</span><h3>Payment method</h3></div>
              {[
                ['bkash', 'bKash', 'Send money, then enter the transaction ID', 'bKash'],
                ['nagad', 'Nagad', 'Send money, then enter the transaction ID', 'Nagad'],
                ['cod', 'Cash on Delivery', 'Pay with cash when your order arrives', 'COD'],
              ].map(([id, name, desc, logo]) => (
                <div key={id} className={'pay-opt' + (pay === id ? ' on' : '')} onClick={() => setPay(id)}>
                  <span className="radio" />
                  <span className={'pay-logo ' + id}>{logo}</span>
                  <div style={{ flex: 1 }}><h4>{name}</h4><p>{desc}</p></div>
                  {id === 'cod' && <Badge kind="b-green" icon="check">Popular</Badge>}
                </div>
              ))}
              {(pay === 'bkash' || pay === 'nagad') && (
                <div className="txn-box fade-in">
                  <p className="ins">Send <b><Tk>{total}</Tk></b> to our merchant number <b>{pay === 'bkash' ? '01777-000111' : '01888-000222'}</b> via {pay === 'bkash' ? 'bKash' : 'Nagad'} <b>“Payment”</b>, then enter the Transaction ID (TrxID) below.</p>
                  <Field label="Transaction ID (TrxID)"><input className="inp" value={form.txn} onChange={set('txn')} placeholder="e.g. BKH7X29QLM" style={{ textTransform: 'uppercase' }} /></Field>
                </div>
              )}
            </div>
          </div>

          {/* order summary */}
          <div className="summary">
            <h3 style={{ margin: '0 0 14px', fontSize: 17, fontWeight: 800 }}>Your order</h3>
            <div style={{ maxHeight: 230, overflowY: 'auto', marginBottom: 6 }}>
              {lines.map(l => (
                <div className="mini-item" key={l.id}>
                  <div className="mi-img"><Thumb label={l.p.brand} tint={l.p.tint} style={{ height: '100%' }} /></div>
                  <div><div className="mi-name">{l.p.name}</div><div className="mi-qty">Qty {l.qty}</div></div>
                  <div className="mi-price"><Tk>{G.priceOf(l.p) * l.qty}</Tk></div>
                </div>
              ))}
            </div>
            <div className="summary-row"><span>Subtotal</span><span><Tk>{subtotal}</Tk></span></div>
            <div className="summary-row"><span>Delivery</span><span>{shipping === 0 ? <b style={{ color: 'var(--green)' }}>FREE</b> : <Tk>{shipping}</Tk>}</span></div>
            <div className="summary-row total"><span>Total</span><span><Tk>{total}</Tk></span></div>
            <button className="btn btn-accent btn-block btn-lg" style={{ marginTop: 16 }} onClick={submit}><Icon name="check-circle-2" size={18} /> Place Order</button>
            <p className="muted" style={{ fontSize: 11.5, textAlign: 'center', marginTop: 12, lineHeight: 1.5 }}>By placing this order you agree to our terms. We'll confirm by phone.</p>
          </div>
        </div>
      </div>
    </CustomerShell>
  );
}

// ---------- Confirmation ----------
function Confirmation() {
  const { lastOrder, navigate, isMobile } = useShop();
  const o = lastOrder;
  useEffect(() => { if (!o) navigate('home'); }, []);
  if (!o) return null;
  const lines = o.items.map(([id, qty]) => ({ p: G.byId(id), qty })).filter(l => l.p);

  return (
    <CustomerShell>
      <div className="wrap section">
        <div className="confirm">
          <div className="check-circle"><Icon name="check" /></div>
          <h1>Order placed, ধন্যবাদ! 🎉</h1>
          <p className="muted" style={{ fontSize: 15, maxWidth: 460, margin: '0 auto 6px', lineHeight: 1.55 }}>
            Thank you, {o.customer.split(' ')[0]}! Your order is confirmed. We'll call <b>{o.phone}</b> shortly to confirm delivery.
          </p>
          <div className="order-ref">Order number: <b>{o.id}</b></div>

          <div className="card card-pad" style={{ textAlign: 'left', marginTop: 22 }}>
            <div className="between" style={{ marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Order summary</h3>
              <div className="row gap-8"><PayBadge status={o.payStatus} /><StatusBadge status={o.status} /></div>
            </div>
            {lines.map(l => (
              <div className="mini-item" key={l.p.id}>
                <div className="mi-img"><Thumb label={l.p.brand} tint={l.p.tint} style={{ height: '100%' }} /></div>
                <div><div className="mi-name">{l.p.name}</div><div className="mi-qty">Qty {l.qty} · <Tk>{G.priceOf(l.p)}</Tk></div></div>
                <div className="mi-price"><Tk>{G.priceOf(l.p) * l.qty}</Tk></div>
              </div>
            ))}
            <div className="summary-row total" style={{ borderTop: '1.5px dashed var(--line-2)', marginTop: 10 }}><span>Total ({G.payMethod[o.pay].label})</span><span><Tk>{o.total}</Tk></span></div>
            <div className="divider" />
            <div className="row gap-12" style={{ alignItems: 'flex-start' }}>
              <Icon name="map-pin" size={17} style={{ color: 'var(--teal)', marginTop: 2 }} />
              <div style={{ fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.5 }}>
                <b>{o.customer}</b> · {o.phone}<br />{o.address}, {o.area}<br />{o.district}, {o.division}
              </div>
            </div>
          </div>

          <div className="row gap-12" style={{ justifyContent: 'center', marginTop: 22, flexWrap: 'wrap' }}>
            <button className="btn btn-ghost btn-lg" onClick={() => navigate('home')}><Icon name="home" size={17} /> Back to home</button>
            <button className="btn btn-primary btn-lg" onClick={() => navigate('account')}>Track my order <Icon name="arrow-right" size={17} /></button>
          </div>
        </div>
      </div>
    </CustomerShell>
  );
}


/* ===== screens_account.jsx ===== */
/* ============================================================
   4iGadgets — Auth + Account + Support
   ============================================================ */

function Login() {
  const { navigate, login, isMobile } = useShop();
  const [tab, setTab] = useState('phone');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const submit = () => login(identifier.trim(), password);
  return (
    <CustomerShell>
      <div className="auth-wrap">
        <div className="auth-card fade-in">
          {!isMobile && <div className="logo" style={{ justifyContent: 'center', marginBottom: 18 }}>4i<span className="g">Gadgets</span></div>}
          <h1>Welcome back 👋</h1>
          <p className="sub">Login to track orders, save favourites & checkout faster.</p>
          <div className="pill-toggle" style={{ marginBottom: 18, width: '100%' }}>
            <button className={tab === 'phone' ? 'on' : ''} style={{ flex: 1 }} onClick={() => setTab('phone')}>Phone</button>
            <button className={tab === 'email' ? 'on' : ''} style={{ flex: 1 }} onClick={() => setTab('email')}>Email</button>
          </div>
          {tab === 'phone' ? (
            <Field label="Phone number"><input className="inp" placeholder="01XXX-XXXXXX" value={identifier} onChange={(e) => setIdentifier(e.target.value)} /></Field>
          ) : (
            <Field label="Email address"><input className="inp" placeholder="you@example.com" value={identifier} onChange={(e) => setIdentifier(e.target.value)} /></Field>
          )}
          <div style={{ height: 14 }} />
          <Field label="Password"><input className="inp" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') submit(); }} /></Field>
          <div className="between" style={{ margin: '12px 0 20px' }}>
            <label className="check" style={{ fontSize: 12.5 }}><input type="checkbox" defaultChecked /> Remember me</label>
            <span className="linkish" style={{ fontSize: 12.5 }}>Forgot password?</span>
          </div>
          <button className="btn btn-primary btn-block btn-lg" onClick={submit}>Login <Icon name="arrow-right" size={17} /></button>
          <p className="auth-foot">New to 4iGadgets? <span className="linkish" onClick={() => navigate('register')}>Create an account</span></p>
        </div>
      </div>
    </CustomerShell>
  );
}

function Register() {
  const { navigate, register, isMobile } = useShop();
  const [f, setF] = useState({ name: '', phone: '', email: '', password: '' });
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  return (
    <CustomerShell>
      <div className="auth-wrap">
        <div className="auth-card fade-in">
          {!isMobile && <div className="logo" style={{ justifyContent: 'center', marginBottom: 18 }}>4i<span className="g">Gadgets</span></div>}
          <h1>Create your account</h1>
          <p className="sub">Join 50,000+ shoppers across Bangladesh.</p>
          <Field label="Full name"><input className="inp" placeholder="Your name" value={f.name} onChange={set('name')} /></Field>
          <div style={{ height: 14 }} />
          <Field label="Phone number" hint="We'll send a one-time code to verify"><input className="inp" placeholder="01XXX-XXXXXX" value={f.phone} onChange={set('phone')} /></Field>
          <div style={{ height: 14 }} />
          <Field label="Email"><input className="inp" placeholder="you@example.com" value={f.email} onChange={set('email')} /></Field>
          <div style={{ height: 14 }} />
          <Field label="Password" hint="At least 8 characters"><input className="inp" type="password" placeholder="Create a password" value={f.password} onChange={set('password')} /></Field>
          <label className="check" style={{ fontSize: 12.5, margin: '14px 0 18px' }}><input type="checkbox" defaultChecked /> I agree to the Terms & Privacy Policy</label>
          <button className="btn btn-primary btn-block btn-lg" onClick={() => register(f)}>Create account</button>
          <p className="auth-foot">Already have an account? <span className="linkish" onClick={() => navigate('login')}>Login</span></p>
        </div>
      </div>
    </CustomerShell>
  );
}

// ---------- Account / order history ----------
function OrderRow({ o, onOpen }) {
  const lines = o.items.map(([id, qty]) => ({ p: G.byId(id), qty })).filter(l => l.p);
  const total = o.total;
  return (
    <div className="order-card">
      <div className="oc-head">
        <div><div className="oc-id">{o.id}</div><div className="oc-date">Placed {o.date} · {lines.length} item{lines.length > 1 ? 's' : ''}</div></div>
        <div className="row gap-8" style={{ flexWrap: 'wrap' }}><PayBadge status={o.payStatus} /><StatusBadge status={o.status} /></div>
      </div>
      <div className="between" style={{ gap: 14, flexWrap: 'wrap' }}>
        <div className="order-thumbs">{lines.slice(0, 4).map((l, i) => <div className="ot" key={i}><Thumb label="" tint={l.p.tint} style={{ height: '100%' }} /></div>)}</div>
        <div className="row gap-16">
          <div><div className="muted" style={{ fontSize: 11.5 }}>Total</div><div style={{ fontWeight: 800, color: 'var(--teal)', fontSize: 16 }}><Tk>{total}</Tk></div></div>
          <button className="btn btn-ghost btn-sm" onClick={() => onOpen(o)}>View details <Icon name="arrow-right" size={14} /></button>
        </div>
      </div>
    </div>
  );
}

function Account() {
  const { navigate, user, logout, isMobile, myOrders, refreshMyOrders } = useShop();
  const [open, setOpen] = useState(null);
  const [tab, setTab] = useState('orders');
  useEffect(() => { if (!user) navigate('login'); else refreshMyOrders(); }, []);
  if (!user) return null;
  const nav = [['orders', 'package', 'My Orders'], ['profile', 'user', 'Profile'], ['address', 'map-pin', 'Addresses'], ['support', 'headset', 'Support']];

  return (
    <CustomerShell>
      <Crumb items={[{ label: 'Home', to: 'home' }, { label: 'My Account' }]} />
      <div className="wrap section" style={{ paddingTop: 8 }}>
        <div className="row gap-12" style={{ marginBottom: 20 }}>
          <div className="admin-avatar" style={{ width: 52, height: 52, fontSize: 19 }}>{user.name[0]}</div>
          <div><div style={{ fontWeight: 800, fontSize: 19 }}>{user.name}</div><div className="muted" style={{ fontSize: 13 }}>{user.email}</div></div>
        </div>
        <div className="acct-layout">
          <aside className="acct-nav">
            {nav.map(([k, ic, label]) => <a key={k} className={tab === k ? 'on' : ''} onClick={() => k === 'support' ? navigate('support') : setTab(k)}><Icon name={ic} size={17} /> {label}</a>)}
            <a onClick={() => { logout(); navigate('home'); }} style={{ color: 'var(--red)' }}><Icon name="log-out" size={17} /> Logout</a>
          </aside>
          <div>
            {tab === 'orders' && (
              <>
                <div className="sec-head" style={{ marginBottom: 14 }}><div><h2 style={{ fontSize: 21 }}>My Orders</h2><p>{myOrders.length} orders</p></div></div>
                {myOrders.length === 0
                  ? <div className="empty-state"><div className="es-ic"><Icon name="package" /></div><h3>No orders yet</h3><p>When you place an order it will show up here.</p><button className="btn btn-primary btn-lg" onClick={() => navigate('category')}>Start shopping</button></div>
                  : myOrders.map(o => <OrderRow key={o.id} o={o} onOpen={setOpen} />)}
              </>
            )}
            {tab === 'profile' && (
              <div className="card card-pad">
                <h2 style={{ fontSize: 19, marginTop: 0 }}>Profile</h2>
                <div className="form-grid">
                  <Field label="Full name"><input className="inp" defaultValue={user.name} /></Field>
                  <Field label="Phone"><input className="inp" placeholder="01XXX-XXXXXX" /></Field>
                  <Field label="Email" span2><input className="inp" defaultValue={user.email} /></Field>
                </div>
                <button className="btn btn-primary" style={{ marginTop: 16 }}>Save changes</button>
              </div>
            )}
            {tab === 'address' && (
              <div className="card card-pad">
                <div className="between"><h2 style={{ fontSize: 19, margin: 0 }}>Saved addresses</h2><button className="btn btn-soft btn-sm"><Icon name="plus" size={15} /> Add</button></div>
                <div className="divider" />
                <div className="row gap-12" style={{ alignItems: 'flex-start', padding: '4px 0' }}>
                  <Icon name="home" size={18} style={{ color: 'var(--teal)', marginTop: 2 }} />
                  <div style={{ fontSize: 14, lineHeight: 1.5 }}><b>Home</b> <Badge kind="b-teal">Default</Badge><br /><span className="muted">House 12, Road 5, Mirpur 10, Dhaka, Dhaka</span></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {open && <OrderDetailModal o={open} onClose={() => setOpen(null)} />}
    </CustomerShell>
  );
}

function OrderDetailModal({ o, onClose }) {
  const lines = o.items.map(([id, qty]) => ({ p: G.byId(id), qty })).filter(l => l.p);
  const total = o.total;
  const steps = ['placed', 'confirmed', 'packed', 'shipped', 'delivered'];
  const curIdx = steps.indexOf(o.status);
  return (
    <Modal title={`Order ${o.id}`} onClose={onClose} footer={<><button className="btn btn-ghost" onClick={onClose}>Close</button><button className="btn btn-primary"><Icon name="download" size={16} /> Invoice</button></>}>
      <div className="row gap-8" style={{ marginBottom: 16 }}><StatusBadge status={o.status} /><PayBadge status={o.payStatus} /><span className="muted" style={{ fontSize: 12.5 }}>· {o.date}</span></div>
      {o.status !== 'cancelled' && (
        <div className="row" style={{ marginBottom: 22 }}>
          {steps.map((s, i) => (
            <React.Fragment key={s}>
              <div style={{ textAlign: 'center', flex: '0 0 auto' }}>
                <div style={{ width: 30, height: 30, borderRadius: '50%', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', background: i <= curIdx ? 'var(--teal)' : 'var(--line)', color: i <= curIdx ? '#fff' : 'var(--muted)' }}><Icon name={i < curIdx ? 'check' : 'circle'} size={15} /></div>
                <div style={{ fontSize: 10, marginTop: 4, color: i <= curIdx ? 'var(--teal)' : 'var(--muted-2)', fontWeight: 600, textTransform: 'capitalize' }}>{s}</div>
              </div>
              {i < steps.length - 1 && <div style={{ flex: 1, height: 2, background: i < curIdx ? 'var(--teal)' : 'var(--line)', margin: '0 2px', marginBottom: 18 }} />}
            </React.Fragment>
          ))}
        </div>
      )}
      {lines.map(l => (
        <div className="mini-item" key={l.p.id}>
          <div className="mi-img"><Thumb label={l.p.brand} tint={l.p.tint} style={{ height: '100%' }} /></div>
          <div><div className="mi-name">{l.p.name}</div><div className="mi-qty">Qty {l.qty}</div></div>
          <div className="mi-price"><Tk>{G.priceOf(l.p) * l.qty}</Tk></div>
        </div>
      ))}
      <div className="summary-row total" style={{ borderTop: '1.5px dashed var(--line-2)', marginTop: 10 }}><span>Total · {G.payMethod[o.pay].label}</span><span><Tk>{total}</Tk></span></div>
      {o.txn && <div style={{ fontSize: 12.5, color: 'var(--muted)', marginTop: 8 }}>Transaction ID: <b style={{ color: 'var(--ink)' }}>{o.txn}</b></div>}
    </Modal>
  );
}

// ---------- Support / chat ----------
function Support() {
  const { user, navigate, isMobile, toast } = useShop();
  const fmtTime = (ts) => new Date(ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const greeting = { who: 'them', t: 'Assalamu alaikum! 👋 This is the 4iGadgets support team. How can we help you today?', time: '' };
  const [thread, setThread] = useState([]); // raw support messages from the API
  const [val, setVal] = useState('');
  const bodyRef = useRef(null);

  // Flatten DB rows into chat bubbles: each message + any admin reply.
  const msgs = [greeting];
  for (const m of thread) {
    msgs.push({ who: 'me', t: m.message, time: fmtTime(m.createdAt) });
    if (m.reply) msgs.push({ who: 'them', t: m.reply, time: '' });
  }

  const load = async () => {
    try { const r = await api('/api/support'); setThread(r.messages || []); } catch { /* not logged in */ }
  };
  useEffect(() => { if (user) load(); }, [user]);

  const send = async () => {
    if (!val.trim()) return;
    const text = val.trim();
    setVal('');
    try { await api('/api/support', { method: 'POST', body: JSON.stringify({ message: text }) }); await load(); }
    catch (e) { toast(e.message || 'Could not send message', 'alert-triangle'); }
  };
  useEffect(() => { if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight; }, [thread]);

  return (
    <CustomerShell>
      <Crumb items={[{ label: 'Home', to: 'home' }, { label: 'Support' }]} />
      <div className="wrap section" style={{ paddingTop: 8, maxWidth: 760 }}>
        <div className="sec-head" style={{ marginBottom: 16 }}><div><h2>Help & Support</h2><p>Message the shop directly, we usually reply within minutes</p></div></div>
        <div className="trust-row" style={{ marginBottom: 20, gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)' }}>
          <div className="trust-item"><div className="ti-ic" style={{ background: 'var(--teal-50)', color: 'var(--teal)' }}><Icon name="phone" size={19} /></div><div><h4>Call us</h4><p>16xxx · 9am–9pm daily</p></div></div>
          <div className="trust-item"><div className="ti-ic" style={{ background: 'var(--amber-50)', color: 'var(--amber-600)' }}><Icon name="message-circle" size={19} /></div><div><h4>WhatsApp</h4><p>+880 1777-000111</p></div></div>
          <div className="trust-item"><div className="ti-ic" style={{ background: 'var(--teal-50)', color: 'var(--teal)' }}><Icon name="mail" size={19} /></div><div><h4>Email</h4><p>help@4igadgets.bd</p></div></div>
        </div>

        {!user ? (
          <div className="card card-pad" style={{ textAlign: 'center' }}>
            <div className="es-ic" style={{ margin: '0 auto 14px' }}><Icon name="lock" /></div>
            <h3 style={{ margin: '0 0 6px' }}>Login to message the shop</h3>
            <p className="muted" style={{ margin: '0 auto 18px', maxWidth: 360 }}>Sign in so we can connect your messages to your orders and reply faster.</p>
            <button className="btn btn-primary btn-lg" onClick={() => navigate('login')}>Login to continue</button>
          </div>
        ) : (
          <div className="chat">
            <div className="chat-head">
              <div className="av">4i</div>
              <div><div style={{ fontWeight: 700, fontSize: 14.5 }}>4iGadgets Support</div><div style={{ fontSize: 12, color: 'var(--green)' }}>● Online · replies in ~5 min</div></div>
            </div>
            <div className="chat-body" ref={bodyRef}>
              {msgs.map((m, i) => <div key={i} className={'bubble ' + m.who}>{m.t}<span className="time">{m.time}</span></div>)}
            </div>
            <div className="chat-input">
              <input className="inp" placeholder="Type your message…" value={val} onChange={e => setVal(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') send(); }} />
              <button className="btn btn-primary btn-icon" onClick={send}><Icon name="send" size={18} /></button>
            </div>
          </div>
        )}
      </div>
    </CustomerShell>
  );
}


/* ===== screens_info.jsx ===== */
/* ============================================================
   4iGadgets — Info pages: Delivery info & Refund Policy
   ============================================================ */

function InfoPage({ crumb, icon, title, intro, children }) {
  return (
    <CustomerShell>
      <Crumb items={[{ label: 'Home', to: 'home' }, { label: crumb }]} />
      <div className="wrap section" style={{ paddingTop: 8, maxWidth: 860 }}>
        <div className="info-hero">
          <div className="info-hero-ic"><Icon name={icon} size={26} /></div>
          <div>
            <h1>{title}</h1>
            <p>{intro}</p>
          </div>
        </div>
        {children}
      </div>
    </CustomerShell>
  );
}

function InfoBlock({ icon, title, children }) {
  return (
    <div className="info-block">
      <div className="info-block-ic"><Icon name={icon} size={19} /></div>
      <div className="info-block-body">
        <h3>{title}</h3>
        {children}
      </div>
    </div>
  );
}

function DeliveryInfo() {
  const { navigate } = useShop();
  return (
    <InfoPage crumb="Delivery info" icon="truck" title="Delivery information"
      intro="We deliver across all 64 districts of Bangladesh, carefully packed and tracked every step of the way.">
      <div className="info-cards">
        <div className="info-stat-card">
          <div className="kpi-ic" style={{ background: 'var(--teal-50)', color: 'var(--teal)' }}><Icon name="map-pin" size={20} /></div>
          <div className="info-stat-val">Inside Dhaka</div>
          <div className="info-stat-sub">1–2 business days · ৳80 (free over ৳2,000)</div>
        </div>
        <div className="info-stat-card">
          <div className="kpi-ic" style={{ background: 'var(--amber-50)', color: 'var(--amber-600)' }}><Icon name="globe" size={20} /></div>
          <div className="info-stat-val">Outside Dhaka</div>
          <div className="info-stat-sub">2–4 business days · ৳120 nationwide</div>
        </div>
        <div className="info-stat-card">
          <div className="kpi-ic" style={{ background: 'var(--teal-50)', color: 'var(--teal)' }}><Icon name="package-check" size={20} /></div>
          <div className="info-stat-val">Free delivery</div>
          <div className="info-stat-sub">On every order over ৳2,000</div>
        </div>
      </div>

      <div className="info-section">
        <InfoBlock icon="clock" title="How long will my order take?">
          <p>Orders placed before 6 PM are dispatched the same day. Inside Dhaka city you'll usually receive your parcel within <b>1–2 business days</b>, and anywhere else in the country within <b>2–4 business days</b>. Large appliances may take an extra day for safe handling.</p>
        </InfoBlock>
        <InfoBlock icon="phone-call" title="We call before we deliver">
          <p>Our rider or courier partner will call you on the phone number from your order before arriving, so please keep it switched on. If we can't reach you, we'll try again the next day.</p>
        </InfoBlock>
        <InfoBlock icon="banknote" title="Cash on Delivery">
          <p>Prefer to pay when it arrives? Choose <b>Cash on Delivery</b> at checkout and pay the rider in cash. Available nationwide, with no extra charge.</p>
        </InfoBlock>
        <InfoBlock icon="package-search" title="Tracking your parcel">
          <p>Once your order ships, you can follow its status anytime from <span className="linkish" onClick={() => navigate('account')}>My Orders</span> in your account, from Placed all the way to Delivered.</p>
        </InfoBlock>
      </div>

      <div className="info-cta">
        <div>
          <h3>Have a question about your delivery?</h3>
          <p>Our team is here 9am–9pm, every day.</p>
        </div>
        <button className="btn btn-primary btn-lg" onClick={() => navigate('support')}><Icon name="headset" size={17} /> Contact support</button>
      </div>
    </InfoPage>
  );
}

function RefundPolicy() {
  const { navigate } = useShop();
  return (
    <InfoPage crumb="Refund Policy" icon="rotate-ccw" title="Refund Policy"
      intro="Shop with confidence. If something isn't right, we'll make it right, with easy returns, replacements, and refunds.">
      <div className="info-cards">
        <div className="info-stat-card">
          <div className="kpi-ic" style={{ background: 'var(--teal-50)', color: 'var(--teal)' }}><Icon name="calendar-clock" size={20} /></div>
          <div className="info-stat-val">7-day returns</div>
          <div className="info-stat-sub">From the day you receive your order</div>
        </div>
        <div className="info-stat-card">
          <div className="kpi-ic" style={{ background: 'var(--amber-50)', color: 'var(--amber-600)' }}><Icon name="shield-check" size={20} /></div>
          <div className="info-stat-val">Brand warranty</div>
          <div className="info-stat-sub">1–5 years on eligible products</div>
        </div>
        <div className="info-stat-card">
          <div className="kpi-ic" style={{ background: 'var(--teal-50)', color: 'var(--teal)' }}><Icon name="wallet" size={20} /></div>
          <div className="info-stat-val">Fast refunds</div>
          <div className="info-stat-sub">To bKash/Nagad within 3–5 days</div>
        </div>
      </div>

      <div className="info-section">
        <InfoBlock icon="rotate-ccw" title="7-day easy returns">
          <p>Changed your mind or received the wrong item? You can request a return within <b>7 days</b> of delivery. The product should be unused, in its original packaging, with all accessories and tags intact.</p>
        </InfoBlock>
        <InfoBlock icon="shield-check" title="Warranty & replacement">
          <p>Many products carry an official brand warranty (clearly shown on the product page). If a fault appears during the warranty period, we'll arrange a repair or replacement at no cost to you.</p>
        </InfoBlock>
        <InfoBlock icon="wallet" title="How refunds work">
          <p>Once we receive and inspect the returned item, your refund is issued to your original payment method: <b>bKash or Nagad within 3–5 business days</b>. For Cash on Delivery orders, we refund to your preferred mobile wallet.</p>
        </InfoBlock>
        <InfoBlock icon="shirt" title="Clothing & shoes">
          <p>Apparel and footwear can be exchanged for a different size within 7 days, as long as they're unworn and undamaged. Hygiene items like innerwear and beauty products that have been opened cannot be returned.</p>
        </InfoBlock>
        <InfoBlock icon="circle-alert" title="What can't be returned">
          <p>For everyone's safety, opened beauty/skincare, used hygiene products, and items damaged through misuse aren't eligible. Don't worry, if you received a damaged or defective item, that's always covered.</p>
        </InfoBlock>
      </div>

      <div className="info-cta">
        <div>
          <h3>Need to start a return?</h3>
          <p>Message us with your order number and we'll take care of the rest.</p>
        </div>
        <button className="btn btn-primary btn-lg" onClick={() => navigate('support')}><Icon name="headset" size={17} /> Contact support</button>
      </div>
    </InfoPage>
  );
}


/* ===== screens_admin.jsx ===== */
/* ============================================================
   4iGadgets — Admin screens
   ============================================================ */

function AdminLogin() {
  const { navigate, loginAdmin } = useShop();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const submit = () => loginAdmin(email.trim(), password);
  return (
    <div className="auth-wrap" style={{ background: 'linear-gradient(160deg,#0c3e4b,#082c36)' }}>
      <div className="auth-card fade-in" style={{ background: '#fff' }}>
        <div className="row gap-10" style={{ marginBottom: 6 }}>
          <div style={{ width: 40, height: 40, borderRadius: 11, background: 'var(--teal)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="shield" size={20} /></div>
          <div className="logo" style={{ fontSize: 19 }}>4i<span className="g">Gadgets</span></div>
        </div>
        <h1 style={{ marginTop: 14 }}>Admin Panel</h1>
        <p className="sub">Staff access only. Customer accounts won't work here.</p>
        <Field label="Admin email"><input className="inp" placeholder="admin@4igadgets.bd" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
        <div style={{ height: 14 }} />
        <Field label="Password"><input className="inp" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') submit(); }} /></Field>
        <div style={{ height: 20 }} />
        <button className="btn btn-primary btn-block btn-lg" onClick={submit}><Icon name="lock" size={16} /> Secure login</button>
        <p className="auth-foot"><span className="linkish" onClick={() => navigate('home')}>Back to storefront</span></p>
      </div>
    </div>
  );
}

function AdminShell({ active, title, children, action }) {
  const { navigate, logout, isMobile, adminCollapsed, setAdminCollapsed } = useShop();
  const nav = [
    ['admin-dashboard', 'layout-dashboard', 'Dashboard'],
    ['admin-orders', 'package', 'Orders'],
    ['admin-products', 'box', 'Products'],
    ['admin-categories', 'tags', 'Categories'],
  ];
  const collapsed = !isMobile && adminCollapsed;
  return (
    <div className={'admin' + (collapsed ? ' collapsed' : '')}>
      <aside className="admin-side">
        <div className="as-logo">
          {collapsed ? <span style={{ fontWeight: 800 }}>4i</span> : <><span>4i<span className="g">Gadgets</span></span> <span style={{ fontSize: 10, color: '#8fa9ad', fontWeight: 700, letterSpacing: '.1em', marginLeft: 2 }}>ADMIN</span></>}
        </div>
        {nav.map(([k, ic, label]) => <a key={k} className={active === k ? 'on' : ''} onClick={() => navigate(k)} title={collapsed ? label : undefined}><Icon name={ic} size={18} /> <span className="as-label">{label}</span></a>)}
        <div className="as-foot">
          <a onClick={() => navigate('home')} title={collapsed ? 'View storefront' : undefined}><Icon name="store" size={18} /> <span className="as-label">View storefront</span></a>
          <a onClick={() => { logout(); navigate('admin-login'); }} title={collapsed ? 'Logout' : undefined}><Icon name="log-out" size={18} /> <span className="as-label">Logout</span></a>
        </div>
      </aside>
      <div className="admin-main">
        <div className="admin-topbar">
          <div className="row gap-12">
            <button className="act-btn" onClick={() => isMobile ? navigate('admin-dashboard') : setAdminCollapsed(c => !c)} title={collapsed ? 'Expand menu' : 'Collapse menu'}>
              <Icon name={isMobile ? 'menu' : (collapsed ? 'panel-left-open' : 'panel-left-close')} size={18} />
            </button>
            <h1>{title}</h1>
          </div>
          <div className="row gap-12">
            {action}
            <div className="row gap-8"><div className="admin-avatar">A</div>{!isMobile && <div style={{ fontSize: 13 }}><b>Admin</b><div className="muted" style={{ fontSize: 11.5 }}>Owner</div></div>}</div>
          </div>
        </div>
        {isMobile && (
          <div style={{ display: 'flex', overflowX: 'auto', gap: 6, padding: '10px 16px', background: '#fff', borderBottom: '1px solid var(--line)' }}>
            {nav.map(([k, ic, label]) => <button key={k} className={'chip' + (active === k ? ' on' : '')} onClick={() => navigate(k)} style={{ whiteSpace: 'nowrap' }}>{label}</button>)}
          </div>
        )}
        <div className="admin-content">{children}</div>
      </div>
    </div>
  );
}

function AdminDashboard() {
  const { navigate, isMobile, adminOrders, refreshAdminOrders } = useShop();
  useEffect(() => { refreshAdminOrders('all'); }, []);
  const orders = adminOrders;
  const revenue = orders.filter(o => o.payStatus === 'paid').reduce((s, o) => s + o.total, 0);
  const counts = {
    pending: orders.filter(o => ['placed', 'confirmed', 'packed'].includes(o.status)).length,
    shipped: orders.filter(o => o.status === 'shipped').length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    payPending: orders.filter(o => o.payStatus !== 'paid').length,
  };
  const kpis = [
    ['banknote', G.taka(revenue), "Revenue (paid)", 'var(--teal-50)', 'var(--teal)', '+12.4%'],
    ['shopping-bag', orders.length, 'Total orders', 'var(--amber-50)', 'var(--amber-600)', '+8 today'],
    ['clock', counts.pending, 'Awaiting fulfilment', 'var(--st-amber-bg)', 'var(--st-amber)', ''],
    ['credit-card', counts.payPending, 'Payments to confirm', 'var(--red-bg)', 'var(--red)', ''],
  ];
  const statusBreakdown = G.statusOrder.map(s => ({ s, n: orders.filter(o => o.status === s).length })).filter(x => x.n > 0);
  const maxN = Math.max(...statusBreakdown.map(x => x.n));

  return (
    <AdminShell active="admin-dashboard" title="Dashboard">
      <p className="muted" style={{ margin: '0 0 20px', fontSize: 14 }}>Welcome back! Here's what's happening at 4iGadgets today.</p>
      <div className="kpi-grid">
        {kpis.map(([ic, val, lbl, bg, col, trend]) => (
          <div className="kpi" key={lbl}>
            <div className="kpi-ic" style={{ background: bg, color: col }}><Icon name={ic} size={21} /></div>
            <div className="kpi-val">{val}</div>
            <div className="kpi-lbl">{lbl}</div>
            {trend && <div className="kpi-trend up"><Icon name="trending-up" size={13} /> {trend}</div>}
          </div>
        ))}
      </div>
      <div className="dash-grid">
        <div className="tbl-card">
          <div className="tbl-head"><h3>Recent orders</h3><button className="btn btn-soft btn-sm" onClick={() => navigate('admin-orders')}>View all <Icon name="arrow-right" size={14} /></button></div>
          <div className="tbl-wrap">
            <table className="tbl">
              <thead><tr><th>Order</th><th>Customer</th><th>Payment</th><th>Status</th><th>Total</th></tr></thead>
              <tbody>
                {orders.slice(0, 6).map(o => {
                  const total = o.total;
                  return (
                    <tr key={o.id} style={{ cursor: 'pointer' }} onClick={() => navigate('admin-orders')}>
                      <td className="cell-strong">{o.id}</td>
                      <td>{o.guest ? <span className="guest-tag">Guest</span> : o.customer}</td>
                      <td><span className="row gap-6" style={{ fontSize: 12.5 }}><span className={'pay-logo ' + o.pay} style={{ width: 'auto', minWidth: 30, height: 20, fontSize: 9, padding: '0 6px' }}>{G.payMethod[o.pay].short}</span><PayBadge status={o.payStatus} /></span></td>
                      <td><StatusBadge status={o.status} /></td>
                      <td className="cell-strong"><Tk>{total}</Tk></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        <div className="tbl-card">
          <div className="tbl-head"><h3>Orders by status</h3></div>
          <div style={{ padding: '18px 22px' }}>
            {statusBreakdown.map(({ s, n }) => (
              <div key={s} style={{ marginBottom: 14 }}>
                <div className="between" style={{ marginBottom: 6 }}><StatusBadge status={s} /><b style={{ fontSize: 14 }}>{n}</b></div>
                <div className="stock-bar"><i style={{ width: (n / maxN * 100) + '%', background: s === 'cancelled' ? 'var(--red)' : s === 'delivered' ? 'var(--green)' : 'var(--teal)' }} /></div>
              </div>
            ))}
            <div className="divider" />
            <div className="between"><span className="muted" style={{ fontSize: 13 }}>Low stock alerts</span><Badge kind="b-amber">{G.products.filter(p => p.stock <= 10).length} items</Badge></div>
          </div>
        </div>
      </div>

      <BannerManager />
    </AdminShell>
  );
}

// ---- Homepage marketing banner manager ----
function BannerManager() {
  const { banner, setBanner, isMobile } = useShop();
  const [edit, setEdit] = useState(false);
  return (
    <div className="tbl-card" style={{ marginTop: 20 }}>
      <div className="tbl-head">
        <div className="row gap-10">
          <div className="kpi-ic" style={{ width: 38, height: 38, margin: 0, borderRadius: 10, background: 'var(--amber-50)', color: 'var(--amber-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="image" size={19} /></div>
          <div><h3>Homepage banner</h3><div className="muted" style={{ fontSize: 12 }}>Shown at the top-middle of the storefront homepage</div></div>
        </div>
        <div className="row gap-10">
          <label className="check" style={{ fontSize: 13, gap: 6 }}>
            <input type="checkbox" checked={banner.enabled} onChange={e => setBanner(b => ({ ...b, enabled: e.target.checked }))} /><span>Visible</span>
          </label>
          <button className="btn btn-primary btn-sm" onClick={() => setEdit(true)}><Icon name="pencil" size={15} /> Edit banner</button>
        </div>
      </div>
      <div style={{ padding: isMobile ? 16 : 24 }}>
        {banner.enabled ? (
          <BannerCard banner={banner} isMobile={isMobile} onCta={() => {}} />
        ) : (
          <div style={{ textAlign: 'center', color: 'var(--muted)', padding: '26px 0', fontSize: 13.5 }}>
            <Icon name="eye-off" size={22} style={{ color: 'var(--muted-2)' }} />
            <div style={{ marginTop: 8 }}>Banner is hidden from the storefront. Toggle “Visible” to show it.</div>
          </div>
        )}
      </div>
      {edit && <BannerEditorModal onClose={() => setEdit(false)} />}
    </div>
  );
}

function BannerEditorModal({ onClose }) {
  const { banner, setBanner, toast, isMobile } = useShop();
  const [f, setF] = useState({ ...banner });
  const set = (k) => (e) => setF(s => ({ ...s, [k]: e.target.value }));
  const themes = [['amber', 'Terracotta', '#E76F51'], ['teal', 'Teal', '#0F4C5C'], ['cream', 'Light', '#FAF7F2']];
  const targets = [['category', 'Shop All'], ['cat:smartphones', 'Smartphones'], ['cat:mens', "Men's Fashion"], ['cat:womens', "Women's Fashion"], ['cat:appliances', 'Appliances'], ['deals', 'Best deals']];
  const save = () => {
    let target = 'category', targetParams = {};
    if (f.linkTo === 'deals') { target = 'category'; targetParams = { sort: 'discount' }; }
    else if ((f.linkTo || '').startsWith('cat:')) { target = 'category'; targetParams = { cat: f.linkTo.slice(4) }; }
    setBanner({ ...f, target, targetParams });
    toast('Banner updated — now live on the homepage', 'check-circle-2');
    onClose();
  };
  const currentLink = f.linkTo || (banner.targetParams && banner.targetParams.sort === 'discount' ? 'deals' : banner.targetParams && banner.targetParams.cat ? 'cat:' + banner.targetParams.cat : 'category');

  return (
    <Modal title="Edit homepage banner" onClose={onClose}
      footer={<><button className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={save}><Icon name="check" size={16} /> Save & publish</button></>}>
      <div className="banner-preview-label">Live preview</div>
      <div style={{ marginBottom: 22 }}><BannerCard banner={f} isMobile={isMobile} onCta={() => {}} /></div>

      <Field label="Theme">
        <div className="theme-swatches">
          {themes.map(([id, name, col]) => (
            <div key={id} className={'theme-swatch' + (f.theme === id ? ' on' : '')} style={{ background: col, color: id === 'cream' ? 'var(--ink)' : '#fff' }} onClick={() => setF(s => ({ ...s, theme: id }))}>
              {name}{f.theme === id && <span className="chk"><Icon name="check" size={14} /></span>}
            </div>
          ))}
        </div>
      </Field>
      <div style={{ height: 16 }} />
      <Field label="Eyebrow (small label)"><input className="inp" value={f.eyebrow} onChange={set('eyebrow')} placeholder="e.g. EID DHAMAKA" /></Field>
      <div style={{ height: 16 }} />
      <Field label="Headline"><input className="inp" value={f.title} onChange={set('title')} placeholder="Main banner message" /></Field>
      <div style={{ height: 16 }} />
      <Field label="Subtitle"><textarea className="inp" value={f.subtitle} onChange={set('subtitle')} placeholder="Supporting line" style={{ minHeight: 70 }} /></Field>
      <div style={{ height: 16 }} />
      <div className="banner-editor-grid">
        <Field label="Button text" hint="Leave empty to hide the button"><input className="inp" value={f.cta} onChange={set('cta')} placeholder="e.g. Shop the sale" /></Field>
        <Field label="Button links to">
          <select className="sel" value={currentLink} onChange={e => setF(s => ({ ...s, linkTo: e.target.value }))}>
            {targets.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </Field>
      </div>
    </Modal>
  );
}

function AdminOrders() {
  const { toast, adminOrders, refreshAdminOrders } = useShop();
  const [filter, setFilter] = useState('all');
  const [open, setOpen] = useState(null);
  useEffect(() => { refreshAdminOrders('all'); }, []);
  const orders = adminOrders;
  const list = filter === 'all' ? orders : orders.filter(o => filter === 'unpaid' ? o.payStatus !== 'paid' : o.status === filter);

  const setStatus = async (id, status) => {
    try { await api('/api/admin/orders/' + id, { method: 'PATCH', body: JSON.stringify({ status }) }); await refreshAdminOrders('all'); toast('Order ' + id + ' → ' + G.statusMeta[status].label, 'check-circle-2'); }
    catch (e) { toast(e.message || 'Update failed', 'alert-triangle'); }
  };
  const confirmPay = async (id) => {
    try { await api('/api/admin/orders/' + id, { method: 'PATCH', body: JSON.stringify({ confirmPay: true }) }); await refreshAdminOrders('all'); toast('Payment confirmed for ' + id, 'check-circle-2'); }
    catch (e) { toast(e.message || 'Update failed', 'alert-triangle'); }
  };

  return (
    <AdminShell active="admin-orders" title="Orders">
      <div className="chips" style={{ marginBottom: 16 }}>
        {[['all', 'All'], ['placed', 'New'], ['shipped', 'Shipped'], ['delivered', 'Delivered'], ['unpaid', 'Payment due'], ['cancelled', 'Cancelled']].map(([k, l]) => (
          <span key={k} className={'chip' + (filter === k ? ' on' : '')} onClick={() => setFilter(k)}>{l}</span>
        ))}
      </div>
      <div className="tbl-card">
        <div className="tbl-head"><h3>{list.length} orders</h3><div className="search" style={{ maxWidth: 240 }}><div className="inp-group"><span className="pfx"><Icon name="search" size={15} /></span><input placeholder="Search orders…" /></div></div></div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>Order</th><th>Customer</th><th>Items</th><th>Payment</th><th>Total</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {list.map(o => {
                const total = o.total;
                const qty = o.items.reduce((a, [, q]) => a + q, 0);
                return (
                  <tr key={o.id}>
                    <td><div className="cell-strong">{o.id}</div><div className="muted" style={{ fontSize: 11.5 }}>{o.date}</div></td>
                    <td><div className="cust-cell"><div className="ca">{o.guest ? 'G' : o.customer[0]}</div><div><div style={{ fontWeight: 600 }}>{o.guest ? 'Guest' : o.customer}</div><div className="muted" style={{ fontSize: 11.5 }}>{o.phone}</div></div></div></td>
                    <td>{qty} item{qty > 1 ? 's' : ''}</td>
                    <td><div className="row gap-6"><span className={'pay-logo ' + o.pay} style={{ width: 'auto', minWidth: 32, height: 22, fontSize: 9.5, padding: '0 7px' }}>{G.payMethod[o.pay].short}</span><PayBadge status={o.payStatus} /></div></td>
                    <td className="cell-strong"><Tk>{total}</Tk></td>
                    <td>
                      <select className="status-select" value={o.status} onChange={e => setStatus(o.id, e.target.value)} disabled={o.status === 'cancelled'}>
                        {G.statusOrder.map(s => <option key={s} value={s}>{G.statusMeta[s].label}</option>)}
                      </select>
                    </td>
                    <td>
                      <div className="row-actions">
                        <button className="act-btn" onClick={() => setOpen(o)} title="View"><Icon name="eye" size={16} /></button>
                        {o.payStatus !== 'paid' && o.status !== 'cancelled' && <button className="act-btn" style={{ color: 'var(--green)' }} onClick={() => confirmPay(o.id)} title="Confirm payment"><Icon name="badge-check" size={16} /></button>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      {open && <AdminOrderModal o={open} onClose={() => setOpen(null)} onStatus={setStatus} onPay={confirmPay} />}
    </AdminShell>
  );
}

function AdminOrderModal({ o, onClose, onStatus, onPay }) {
  const lines = o.items.map(([id, qty]) => ({ p: G.byId(id), qty })).filter(l => l.p);
  const total = o.total;
  return (
    <Modal title={`Order ${o.id}`} onClose={onClose}
      footer={<>
        {o.payStatus !== 'paid' && o.status !== 'cancelled' && <button className="btn btn-ghost" onClick={() => { onPay(o.id); onClose(); }}><Icon name="badge-check" size={16} /> Confirm payment</button>}
        {o.status !== 'delivered' && o.status !== 'cancelled' && <button className="btn btn-primary" onClick={() => { onStatus(o.id, 'delivered'); onClose(); }}>Mark delivered</button>}
      </>}>
      <div className="row gap-8" style={{ marginBottom: 16, flexWrap: 'wrap' }}><StatusBadge status={o.status} /><PayBadge status={o.payStatus} /><span className="muted" style={{ fontSize: 12.5 }}>· {o.date}</span></div>
      <div className="card" style={{ padding: 14, marginBottom: 16, background: 'var(--cream)' }}>
        <div className="cust-cell"><div className="ca" style={{ width: 40, height: 40 }}>{o.guest ? 'G' : o.customer[0]}</div>
          <div><div style={{ fontWeight: 700 }}>{o.guest ? 'Guest checkout' : o.customer}</div><div className="muted" style={{ fontSize: 12.5 }}>{o.phone} · {G.payMethod[o.pay].label}{o.txn && ` · TrxID ${o.txn}`}</div></div>
        </div>
      </div>
      {lines.map(l => (
        <div className="mini-item" key={l.p.id}>
          <div className="mi-img"><Thumb label={l.p.brand} tint={l.p.tint} style={{ height: '100%' }} /></div>
          <div><div className="mi-name">{l.p.name}</div><div className="mi-qty">Qty {l.qty} × <Tk>{G.priceOf(l.p)}</Tk></div></div>
          <div className="mi-price"><Tk>{G.priceOf(l.p) * l.qty}</Tk></div>
        </div>
      ))}
      <div className="summary-row total" style={{ borderTop: '1.5px dashed var(--line-2)', marginTop: 10 }}><span>Total</span><span><Tk>{total}</Tk></span></div>
    </Modal>
  );
}

function AdminCategories() {
  const { toast, reloadCatalog } = useShop();
  const [cats, setCats] = useState([]);
  const [edit, setEdit] = useState(null);
  const [name, setName] = useState('');

  const load = async () => {
    try { const r = await api('/api/admin/categories'); setCats(r.categories || []); }
    catch (e) { toast(e.message || 'Could not load categories', 'alert-triangle'); }
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!name.trim()) return;
    try {
      if (edit && edit.dbId) await api('/api/admin/categories/' + edit.dbId, { method: 'PATCH', body: JSON.stringify({ name }) });
      else await api('/api/admin/categories', { method: 'POST', body: JSON.stringify({ name }) });
      toast(edit && edit.dbId ? 'Category updated' : 'Category added', 'check-circle-2');
      setEdit(null); setName(''); await load(); reloadCatalog();
    } catch (e) { toast(e.message || 'Save failed', 'alert-triangle'); }
  };
  const del = async (dbId) => {
    try { await api('/api/admin/categories/' + dbId, { method: 'DELETE' }); toast('Category deleted', 'trash-2'); await load(); reloadCatalog(); }
    catch (e) { toast(e.message || 'Delete failed', 'alert-triangle'); }
  };

  return (
    <AdminShell active="admin-categories" title="Categories"
      action={<button className="btn btn-primary btn-sm" onClick={() => { setEdit({}); setName(''); }}><Icon name="plus" size={16} /> Add category</button>}>
      <div className="tbl-card">
        <div className="tbl-head"><h3>{cats.length} categories</h3></div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>Category</th><th>Products</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {cats.map(c => (
                <tr key={c.id}>
                  <td><div className="cust-cell"><div className="ca" style={{ borderRadius: 10 }}><Icon name={c.icon} size={16} /></div><span className="cell-strong">{c.name}</span></div></td>
                  <td>{c.products} items</td>
                  <td><Badge kind="b-green" icon="check">Active</Badge></td>
                  <td><div className="row-actions">
                    <button className="act-btn" onClick={() => { setEdit(c); setName(c.name); }}><Icon name="pencil" size={15} /></button>
                    <button className="act-btn danger" onClick={() => del(c.dbId)}><Icon name="trash-2" size={15} /></button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {edit && (
        <Modal title={edit.dbId ? 'Edit category' : 'Add category'} onClose={() => setEdit(null)}
          footer={<><button className="btn btn-ghost" onClick={() => setEdit(null)}>Cancel</button><button className="btn btn-primary" onClick={save}>Save</button></>}>
          <Field label="Category name"><input className="inp" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Smart Home" autoFocus /></Field>
        </Modal>
      )}
    </AdminShell>
  );
}

function AdminProducts() {
  const { toast, isMobile, reloadCatalog } = useShop();
  const [prods, setProds] = useState([]);
  const [edit, setEdit] = useState(null);
  const [del, setDel] = useState(null);

  const load = async () => {
    try { const r = await api('/api/admin/products'); setProds(r.products || []); }
    catch (e) { toast(e.message || 'Could not load products', 'alert-triangle'); }
  };
  useEffect(() => { load(); }, []);

  return (
    <AdminShell active="admin-products" title="Products"
      action={<button className="btn btn-primary btn-sm" onClick={() => setEdit({})}><Icon name="plus" size={16} /> Add product</button>}>
      <div className="tbl-card">
        <div className="tbl-head"><h3>{prods.length} products</h3><div className="search" style={{ maxWidth: 240 }}><div className="inp-group"><span className="pfx"><Icon name="search" size={15} /></span><input placeholder="Search products…" /></div></div></div>
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Actions</th></tr></thead>
            <tbody>
              {prods.map(p => (
                <tr key={p.id}>
                  <td><div className="cust-cell"><div style={{ width: 42, height: 42, borderRadius: 9, overflow: 'hidden', flex: '0 0 42px', border: '1px solid var(--line)' }}><Thumb label="" tint={p.tint} style={{ height: '100%' }} /></div><div><div className="cell-strong" style={{ maxWidth: 220, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div><div className="muted" style={{ fontSize: 11.5 }}>{p.brand}</div></div></div></td>
                  <td>{G.catName(p.cat)}</td>
                  <td><div className="cell-strong"><Tk>{G.priceOf(p)}</Tk></div>{p.disc > 0 && <div className="muted" style={{ fontSize: 11.5, textDecoration: 'line-through' }}><Tk>{p.price}</Tk></div>}</td>
                  <td>{p.stock <= 10 ? <Badge kind="b-amber">{p.stock} left</Badge> : <span>{p.stock}</span>}</td>
                  <td><div className="row-actions">
                    <button className="act-btn" onClick={() => setEdit(p)}><Icon name="pencil" size={15} /></button>
                    <button className="act-btn danger" onClick={() => setDel(p)}><Icon name="trash-2" size={15} /></button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {edit && <ProductFormModal p={edit} onClose={() => setEdit(null)} onSave={async (np) => {
        try {
          if (np.id) await api('/api/admin/products/' + np.id, { method: 'PATCH', body: JSON.stringify(np) });
          else await api('/api/admin/products', { method: 'POST', body: JSON.stringify(np) });
          toast(np.id ? 'Product updated' : 'Product added', 'check-circle-2');
          setEdit(null); await load(); reloadCatalog();
        } catch (e) { toast(e.message || 'Save failed', 'alert-triangle'); }
      }} />}
      {del && (
        <Modal title="Delete product?" onClose={() => setDel(null)}
          footer={<><button className="btn btn-ghost" onClick={() => setDel(null)}>Cancel</button><button className="btn btn-accent" style={{ background: 'var(--red)' }} onClick={async () => { try { await api('/api/admin/products/' + del.id, { method: 'DELETE' }); toast('Product deleted', 'trash-2'); setDel(null); await load(); reloadCatalog(); } catch (e) { toast(e.message || 'Delete failed', 'alert-triangle'); } }}>Delete</button></>}>
          <p style={{ margin: 0, lineHeight: 1.6 }}>Are you sure you want to delete <b>{del.name}</b>? This action can't be undone.</p>
        </Modal>
      )}
    </AdminShell>
  );
}

function ProductFormModal({ p, onClose, onSave }) {
  const [f, setF] = useState({ id: p.id || null, name: p.name || '', cat: p.cat || 'smartphones', brand: p.brand || '', desc: p.desc || '', price: p.price || '', disc: p.disc || '', stock: p.stock || '', tint: p.tint || 'a', imageUrl: p.imageUrl || '' });
  const set = (k) => (e) => setF(s => ({ ...s, [k]: e.target.value }));
  return (
    <Modal title={p.id ? 'Edit product' : 'Add product'} onClose={onClose}
      footer={<><button className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={() => onSave({ ...f, price: +f.price, disc: +f.disc || 0, stock: +f.stock })}><Icon name="check" size={16} /> Save product</button></>}>
      <div className="form-grid">
        <Field label="Product name" span2><input className="inp" value={f.name} onChange={set('name')} placeholder="e.g. Aurora X12 Smartphone" /></Field>
        <Field label="Category">
          <select className="sel" value={f.cat} onChange={set('cat')}>{G.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        </Field>
        <Field label="Brand"><input className="inp" value={f.brand} onChange={set('brand')} placeholder="e.g. Aurora" /></Field>
        <Field label="Price (৳)"><input className="inp" type="number" value={f.price} onChange={set('price')} placeholder="0" /></Field>
        <Field label="Discounted price (৳)" hint="Leave 0 for no discount"><input className="inp" type="number" value={f.disc} onChange={set('disc')} placeholder="0" /></Field>
        <Field label="Stock quantity"><input className="inp" type="number" value={f.stock} onChange={set('stock')} placeholder="0" /></Field>
        <Field label="Image tone">
          <select className="sel" value={f.tint} onChange={set('tint')}><option value="a">Warm</option><option value="b">Cool</option></select>
        </Field>
        <Field label="Description" span2><textarea className="inp" value={f.desc} onChange={set('desc')} placeholder="Describe the product…" /></Field>
        {/* Image is stored as a URL for now (no paid storage). Cloudflare R2 could
            be added later for direct uploads; this field would then hold the R2 URL. */}
        <Field label="Image URL" span2 hint="Paste a public image URL (R2 uploads can be added later)">
          <input className="inp" value={f.imageUrl} onChange={set('imageUrl')} placeholder="https://…/product.jpg" />
        </Field>
      </div>
    </Modal>
  );
}


/* ===== app.jsx ===== */
/* ============================================================
   4iGadgets — App shell: router, state, device toggle
   ============================================================ */
const S = { Home, Listing, Product, Cart, Checkout, Confirmation, Login, Register, Account, Support, DeliveryInfo, RefundPolicy, AdminLogin, AdminDashboard, AdminOrders, AdminCategories, AdminProducts };

function App({ initialRoute = 'home' }) {
  const [route, setRoute] = useState({ name: initialRoute, params: {} });
  const [cart, setCart] = useState([]);
  const [user, setUser] = useState(null);
  const [admin, setAdmin] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [adminCollapsed, setAdminCollapsed] = useState(false);
  const [hero] = useState('B');
  const [banner, setBanner] = useState({
    enabled: true,
    theme: 'amber',
    eyebrow: 'EID DHAMAKA',
    title: 'Up to 30% off across the store',
    subtitle: 'Limited-time festival deals on phones, fashion, appliances & more.',
    cta: 'Shop the sale',
    target: 'category',
    targetParams: { sort: 'discount' },
  });
  const [lastOrder, setLastOrder] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [myOrders, setMyOrders] = useState([]);
  const [adminOrders, setAdminOrders] = useState([]);
  const [catalogVersion, setCatalogVersion] = useState(0);

  // Responsive: drive the mobile layout from the real viewport width
  // (reuses all the prototype's existing `.mobile ...` styles).
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  // Render lucide icons, and keep converting any <i data-lucide> nodes that get
  // inserted later (admin tables, modals, order lists load asynchronously). A
  // MutationObserver fixes icons that previously stayed blank until the next
  // re-render/interaction.
  useEffect(() => {
    if (typeof window === 'undefined' || !window.lucide) return;
    const draw = () => { try { window.lucide.createIcons(); } catch { /* ignore */ } };
    draw();
    let raf = 0;
    const obs = new MutationObserver(() => {
      if (raf) return;
      raf = requestAnimationFrame(() => { raf = 0; draw(); });
    });
    obs.observe(document.body, { childList: true, subtree: true });
    return () => { obs.disconnect(); if (raf) cancelAnimationFrame(raf); };
  }, []);

  // scroll to top on route change
  useEffect(() => { window.scrollTo({ top: 0 }); }, [route]);

  // initial hydrate: catalog + any existing sessions
  const reloadCatalog = async () => {
    const data = await api('/api/catalog');
    applyCatalog(data);
    setCatalogVersion((v) => v + 1);
  };
  useEffect(() => {
    (async () => {
      try { await reloadCatalog(); } catch { /* empty catalog */ }
      try { const me = await api('/api/auth/me'); if (me.user) setUser(me.user); } catch { /* guest */ }
      try { const a = await api('/api/admin/me'); if (a.admin) setAdmin(true); } catch { /* not admin */ }
      setLoaded(true);
    })();
  }, []);

  const refreshMyOrders = async () => {
    try { const r = await api('/api/orders'); setMyOrders(r.orders || []); } catch { /* ignore */ }
  };
  const refreshAdminOrders = async (filter = 'all') => {
    try { const r = await api('/api/admin/orders?filter=' + filter); setAdminOrders(r.orders || []); } catch { /* ignore */ }
  };

  const navigate = (name, params = {}) => setRoute({ name, params });
  const toast = (msg, icon) => {
    const id = Date.now() + Math.random();
    setToasts(t => [...t, { id, msg, icon }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 2600);
  };

  const addToCart = (id, qty) => {
    setCart(c => { const e = c.find(x => x.id === id); return e ? c.map(x => x.id === id ? { ...x, qty: x.qty + qty } : x) : [...c, { id, qty }]; });
    const p = G.byId(id); toast((p ? p.name.split(' ').slice(0, 2).join(' ') : 'Item') + ' added to cart', 'shopping-cart');
  };
  const setQty = (id, qty) => setCart(c => c.map(x => x.id === id ? { ...x, qty } : x));
  const removeFromCart = (id) => setCart(c => c.filter(x => x.id !== id));

  const login = async (identifier, password) => {
    try {
      const r = await api('/api/auth/login', { method: 'POST', body: JSON.stringify({ identifier, password }) });
      setUser(r.user); await refreshMyOrders(); navigate('account');
      toast('Welcome, ' + r.user.name.split(' ')[0] + '!', 'check-circle-2');
    } catch (e) { toast(e.message || 'Login failed', 'alert-triangle'); }
  };
  const register = async (payload) => {
    try {
      const r = await api('/api/auth/register', { method: 'POST', body: JSON.stringify(payload) });
      setUser(r.user); navigate('account');
      toast('Welcome, ' + r.user.name.split(' ')[0] + '!', 'check-circle-2');
    } catch (e) { toast(e.message || 'Could not create account', 'alert-triangle'); }
  };
  const loginAdmin = async (email, password) => {
    try {
      await api('/api/admin/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      setAdmin(true); await refreshAdminOrders(); navigate('admin-dashboard');
    } catch (e) { toast(e.message || 'Admin login failed', 'alert-triangle'); }
  };
  const logout = async () => {
    try { await api('/api/auth/logout', { method: 'POST' }); } catch { /* ignore */ }
    try { await api('/api/admin/logout', { method: 'POST' }); } catch { /* ignore */ }
    setUser(null); setAdmin(false); setMyOrders([]);
  };

  const placeOrder = async (data) => {
    try {
      const r = await api('/api/orders', {
        method: 'POST',
        body: JSON.stringify({ ...data, items: cart.map((c) => ({ id: c.id, qty: c.qty })) }),
      });
      setLastOrder(r.order); setCart([]); navigate('confirmation'); refreshMyOrders();
    } catch (e) { toast(e.message || 'Could not place order', 'alert-triangle'); }
  };

  const ctx = { route, navigate, cart, cartCount: cart.reduce((s, c) => s + c.qty, 0), addToCart, setQty, removeFromCart,
    user, login, register, logout, admin, loginAdmin, placeOrder, lastOrder, hero, isMobile, toast, banner, setBanner,
    adminCollapsed, setAdminCollapsed, loaded, catalogVersion, reloadCatalog,
    myOrders, refreshMyOrders, adminOrders, refreshAdminOrders };

  const isAdmin = route.name.startsWith('admin');
  const Screen = {
    home: S.Home, category: S.Listing, product: S.Product, cart: S.Cart, checkout: S.Checkout,
    confirmation: S.Confirmation, login: S.Login, register: S.Register, account: S.Account, support: S.Support,
    delivery: S.DeliveryInfo, refund: S.RefundPolicy,
    'admin-login': S.AdminLogin, 'admin-dashboard': S.AdminDashboard, 'admin-orders': S.AdminOrders,
    'admin-categories': S.AdminCategories, 'admin-products': S.AdminProducts,
  }[route.name] || S.Home;

  // guard admin screens
  const Guarded = (isAdmin && route.name !== 'admin-login' && !admin) ? S.AdminLogin : Screen;

  return (
    <Shop.Provider value={ctx}>
      <div className={'app-root' + (isMobile ? ' mobile' : '')}>
        {loaded ? <Guarded /> : (
          <div style={{ minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, color: 'var(--muted)' }}>
            <div className="logo" style={{ fontSize: 26 }}>4i<span className="g">Gadgets</span></div>
            <div style={{ fontSize: 13 }}>Loading store…</div>
          </div>
        )}
        {/* Modals portal here; toasts float above everything. */}
        <div id="overlay-host" />
        <div className="toast-wrap">
          {toasts.map(t => <div className="toast" key={t.id}>{t.icon && <Icon name={t.icon} size={16} className="ic" />}{t.msg}</div>)}
        </div>
      </div>
    </Shop.Provider>
  );
}


export default App;
