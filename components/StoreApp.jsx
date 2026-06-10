"use client";
/* ============================================================
   4iMart - interactive storefront + admin (client).

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
import { ICONS, FallbackIcon } from "./icons";

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
   Data layer (G) - static config + arrays hydrated from the API.
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
  navCats: [], // categories pinned to the header nav (admin-configurable)
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
  // Header/footer category anchors: the admin's picks (by slug), or the
  // first 5 categories when nothing has been configured.
  const picked = (data.navCats || [])
    .map((slug) => G.categories.find((c) => c.id === slug))
    .filter(Boolean);
  G.navCats = picked.length ? picked : G.categories.slice(0, 5);
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
   4iMart - Shared components
   ============================================================ */

// ---- App context (nav, cart, auth, toast) ----
const Shop = createContext(null);
const useShop = () => useContext(Shop);

// ---- Icon (real React SVG via lucide-react) ----
// Keeps `data-lucide` so the existing CSS size rules ([data-lucide]{...},
// .stars [data-lucide], .es-ic [data-lucide], etc.) still apply, and applies
// an inline width/height when a `size` is given (overrides the CSS), matching
// the original prototype exactly - but without any DOM mutation.
function Icon({ name, size, className, style }) {
  const Cmp = ICONS[name] || FallbackIcon;
  const s = size ? { width: size, height: size } : null;
  return <Cmp data-lucide={name} className={'ic ' + (className || '')} style={{ ...s, ...style }} />;
}

// ---- Brand logo (4iMart) ----
// Inline SVG versions of /public/assets/4imart-logo*.svg so the logo renders
// crisply at any size and on any background without extra requests.
const BRAND_PATHS = {
  diag: "M32.3 12.7 L15.5 38 L43.5 38",
  stem: "M38 34 L38 42",
  fourI:
    "M84.99 39.94L71.05 39.94L71.05 36.58L81.13 17.47L87.43 17.47L77.98 34.95L84.99 34.95L84.99 28.18L90.62 28.18L90.62 34.95L94.32 34.95L94.32 39.94L90.62 39.94L90.62 47L84.99 47L84.99 39.94ZM100.16 23.44L100.16 23.44Q98.81 23.44 97.93 22.54Q97.05 21.63 97.05 20.29L97.05 20.29Q97.05 18.99 97.93 18.06Q98.81 17.14 100.16 17.14L100.16 17.14Q101.50 17.14 102.38 18.06Q103.26 18.99 103.26 20.29L103.26 20.29Q103.26 21.63 102.38 22.54Q101.50 23.44 100.16 23.44ZM102.93 47L97.38 47L97.38 26.71L102.93 26.71L102.93 47Z",
  mart:
    "M113.68 47L107.97 47L107.97 17.47L112 17.47L122.79 34.78L133.59 17.47L137.62 17.47L137.62 47L131.95 47L131.95 29.40L124.73 40.95L120.86 40.95L113.68 29.36L113.68 47ZM151.14 47.42L151.14 47.42Q148.37 47.42 146.17 46.03Q143.96 44.65 142.68 42.25Q141.40 39.86 141.40 36.88L141.40 36.88Q141.40 33.90 142.68 31.48Q143.96 29.07 146.17 27.68Q148.37 26.29 151.10 26.29L151.10 26.29Q152.91 26.29 154.44 26.92Q155.97 27.55 157.02 28.65L157.02 28.65L157.02 26.71L162.48 26.71L162.48 47L157.02 47L157.02 45.07Q155.97 46.16 154.46 46.79Q152.95 47.42 151.14 47.42ZM152.15 42.34L152.15 42.34Q154.46 42.34 155.89 40.80Q157.32 39.27 157.32 36.84L157.32 36.84Q157.32 34.44 155.89 32.91Q154.46 31.38 152.15 31.38L152.15 31.38Q149.88 31.38 148.46 32.91Q147.03 34.44 147.03 36.84L147.03 36.84Q147.03 39.27 148.46 40.80Q149.88 42.34 152.15 42.34ZM172.44 47L166.94 47L166.94 26.71L172.44 26.71L172.44 28.52Q173.36 27.47 174.66 26.88Q175.97 26.29 177.69 26.29L177.69 26.29Q180.63 26.29 182.48 28.35L182.48 28.35L179.03 32.30Q178.02 31.29 176.43 31.29L176.43 31.29Q174.62 31.29 173.53 32.41Q172.44 33.52 172.44 35.79L172.44 35.79L172.44 47ZM192.64 47L187.14 47L187.14 31.54L182.39 31.54L182.39 26.71L187.14 26.71L187.14 18.27L192.64 18.27L192.64 26.71L197.39 26.71L197.39 31.54L192.64 31.54L192.64 47Z",
};

// Icon-only mark (the "4" with delivery wheels).
function LogoMark({ size = 28, color = "var(--teal)", wheels = "var(--amber)", style }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} fill="none" aria-hidden="true" style={style}>
      <path d={BRAND_PATHS.diag} stroke={color} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
      <path d={BRAND_PATHS.stem} stroke={color} strokeWidth="7" strokeLinecap="round" />
      <circle cx="20" cy="52" r="4.5" fill={wheels} />
      <circle cx="38" cy="52" r="4.5" fill={wheels} />
    </svg>
  );
}

// Full lockup: mark + "4i" + "Mart" wordmark. `dark` switches to the
// light-on-dark palette (text #f3f7f8, "4i"/mark accents #7ecbe8).
function Logo({ height = 30, dark, style }) {
  const mark = dark ? "#f3f7f8" : "var(--teal)";
  const fourI = dark ? "#7ecbe8" : "var(--blue)";
  const mart = dark ? "#f3f7f8" : "var(--teal)";
  return (
    <svg viewBox="8 8 192 48" height={height} fill="none" role="img" aria-label="4iMart" style={{ display: "block", ...style }}>
      <path d={BRAND_PATHS.diag} stroke={mark} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
      <path d={BRAND_PATHS.stem} stroke={mark} strokeWidth="7" strokeLinecap="round" />
      <circle cx="20" cy="52" r="4.5" fill="var(--amber)" />
      <circle cx="38" cy="52" r="4.5" fill="var(--amber)" />
      <path d={BRAND_PATHS.fourI} fill={fourI} />
      <path d={BRAND_PATHS.mart} fill={mart} />
    </svg>
  );
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
        <Icon key={i} name="star" style={{ fill: i < Math.round(rating) ? '#ee8434' : 'none', color: i < Math.round(rating) ? '#ee8434' : '#d8d2c6' }} />
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

// ---- Rating summary text (handles the "no reviews yet" case) ----
function RatingText({ p }) {
  if (!p.reviews) return <span className="pc-rate"><Stars rating={0} /><span>No ratings yet</span></span>;
  return <span className="pc-rate"><Stars rating={p.rating} /><span>{p.rating.toFixed(1)} · {p.reviews}</span></span>;
}

// ---- Product card ----
function ProductCard({ p }) {
  const { navigate, addToCart, favIds, toggleFav } = useShop();
  const price = G.priceOf(p);
  const off = p.disc && p.disc > 0 ? Math.round((1 - p.disc / p.price) * 100) : 0;
  const liked = favIds.includes(p.id);
  return (
    <div className="pcard fade-in" onClick={() => navigate('product', { id: p.id })}>
      <div className="pc-img">
        {off > 0 && <span className="sale-tag">-{off}%</span>}
        <button className="pc-fav" title={liked ? 'Remove from favourites' : 'Save to favourites'} onClick={(e) => { e.stopPropagation(); toggleFav(p.id); }}>
          <Icon name="heart" size={16} style={liked ? { fill: '#ee8434', color: '#ee8434' } : null} />
        </button>
        {p.imageUrl
          ? <img src={p.imageUrl} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <Thumb label={p.brand + ' shot'} tint={p.tint} style={{ height: '100%' }} />}
      </div>
      <div className="pc-body">
        <div className="pc-cat">{G.catName(p.cat)}</div>
        <div className="pc-name">{p.name}</div>
        <RatingText p={p} />
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
    ...G.navCats.map(c => [`cat:${c.id}`, c.name]),
  ];
  if (isMobile) {
    return (
      <header className="hdr">
        <div className="deliver-strip">🚚 Free delivery over <b>৳2,000</b> · <b>Cash on Delivery</b> available</div>
        <div className="wrap hdr-top" style={{ height: 60, gap: 12 }}>
          <div className="logo" onClick={() => navigate('home')}><Logo height={26} /></div>
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
        <div className="logo" onClick={() => navigate('home')}><Logo height={32} /></div>
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
          <div className="logo" style={{ marginBottom: 14 }}><Logo dark height={30} /></div>
          <p style={{ fontSize: 13, color: '#a9c1c5', lineHeight: 1.6, margin: '0 0 16px', maxWidth: 300 }}>
            Bangladesh's friendly everything store. Genuine products, honest prices, and delivery to your door পুরো দেশজুড়ে।
          </p>
        </div>
        <div>
          <h5>Shop</h5>
          {G.navCats.map(c => <a key={c.id} onClick={() => navigate('category', { cat: c.id })}>{c.name}</a>)}
        </div>
        <div>
          <h5>Help</h5>
          <a onClick={() => navigate('support')}>Contact us</a>
          <a onClick={() => navigate('delivery')}>Delivery info</a>
          <a onClick={() => navigate('refund')}>Refund Policy</a>
        </div>
        <div>
          <h5>Reach us</h5>
          <li><Icon name="phone" size={13} style={{ marginRight: 6 }} />01600000034 (9am-9pm)</li>
          <li><Icon name="mail" size={13} style={{ marginRight: 6 }} />hello@4imart.bd</li>
          <li><Icon name="map-pin" size={13} style={{ marginRight: 6 }} />ECB Chattar, Dhaka 1206</li>
        </div>
      </div>
      <div className="wrap ftr-bottom">
        <span>© 2026 4iMart. All rights reserved.</span>
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
        <BannerCard banner={banner} isMobile={isMobile} onCta={() => { const [n, p] = heroTarget(banner.linkTo); navigate(n, p); }} />
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
   4iMart - Customer screens
   ============================================================ */

// ---------- HERO (admin-editable: layout A/B/C + content + image) ----------
// Mirrors HERO_DEFAULT in lib/settings.ts so first paint matches the server.
const HERO_DEFAULT = {
  layout: 'B',
  eyebrow: 'New arrivals weekly',
  title: 'Everything you need,',
  titleAccent: 'without the worry.',
  subtitle: 'Phones, fashion, shoes, appliances & home essentials. Every order is checked, packed with care, and delivered to your door across Bangladesh.',
  ctaText: 'Start shopping',
  ctaLink: 'category',
  imageUrl: '',
  stats: [
    { value: '50k+', label: 'happy customers' },
    { value: '4.8★', label: 'avg. rating' },
    { value: '64', label: 'districts served' },
  ],
};

// Mirrors BANNER_DEFAULT in lib/settings.ts.
const BANNER_DEFAULT = {
  enabled: true,
  theme: 'amber',
  eyebrow: 'EID DHAMAKA',
  title: 'Up to 30% off across the store',
  subtitle: 'Limited-time festival deals on phones, fashion, appliances & more.',
  cta: 'Shop the sale',
  linkTo: 'deals',
};

function heroTarget(link) {
  if (link === 'deals') return ['category', { sort: 'discount' }];
  if (link && link.indexOf('cat:') === 0) return ['category', { cat: link.slice(4) }];
  return [link || 'category', {}];
}
function HeroLines({ text }) {
  return (text || '').split('\n').map((ln, i) => <React.Fragment key={i}>{i > 0 && <br />}{ln}</React.Fragment>);
}
function HeroImage({ cfg, label, tint, style }) {
  return cfg.imageUrl
    ? <img src={cfg.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', ...style }} />
    : <Thumb label={label} tint={tint} style={{ height: '100%', ...style }} />;
}

function Hero({ cfg }) {
  const { navigate } = useShop();
  const c = cfg || HERO_DEFAULT;
  const go = () => { const [n, p] = heroTarget(c.ctaLink); navigate(n, p); };

  if (c.layout === 'A') {
    return (
      <div className="hero-a">
        <div>
          {c.eyebrow && <span className="hero-eyebrow"><span className="dot" /> {c.eyebrow}</span>}
          <h1><HeroLines text={c.title} />{c.titleAccent ? <> {c.titleAccent}</> : null}</h1>
          {c.subtitle && <p>{c.subtitle}</p>}
          <div className="row gap-12" style={{ flexWrap: 'wrap' }}>
            {c.ctaText && <button className="btn btn-accent btn-lg" onClick={go}>{c.ctaText} <Icon name="arrow-right" size={17} /></button>}
            <button className="btn btn-lg" style={{ background: 'rgba(255,255,255,.12)', color: '#fff' }} onClick={() => navigate('category', { cat: 'smartphones' })}>Browse phones</button>
          </div>
          {c.stats && c.stats.length > 0 && (
            <div className="hero-stat-row">
              {c.stats.map((s, i) => <div className="hero-stat" key={i}><b>{s.value}</b><span>{s.label}</span></div>)}
            </div>
          )}
        </div>
        <div className="hero-visual"><HeroImage cfg={c} label="hero product shot" style={{ borderRadius: 18 }} /></div>
      </div>
    );
  }
  if (c.layout === 'C') {
    return (
      <div className="hero-c">
        <div className="blob" style={{ width: 280, height: 280, background: '#2596be', top: -80, right: -40 }} />
        <div className="blob" style={{ width: 180, height: 180, background: '#ee8434', bottom: -70, right: 180, opacity: .35 }} />
        <div style={{ position: 'relative', zIndex: 2 }}>
          {c.eyebrow && <span className="hero-eyebrow"><span className="dot" /> {c.eyebrow}</span>}
          <h1><HeroLines text={c.title} />{c.titleAccent ? <> {c.titleAccent}</> : null}</h1>
          {c.subtitle && <p>{c.subtitle}</p>}
          {c.ctaText && <button className="btn btn-accent btn-lg" onClick={go}>{c.ctaText} <Icon name="arrow-right" size={17} /></button>}
        </div>
      </div>
    );
  }
  // layout B (default)
  return (
    <div className="hero-b">
      <div className="hb-copy">
        {c.eyebrow && <span className="hero-eyebrow" style={{ background: 'var(--amber-50)', color: 'var(--amber-600)', alignSelf: 'flex-start' }}><span className="dot" /> {c.eyebrow}</span>}
        <h1><HeroLines text={c.title} />{c.titleAccent ? <> <em>{c.titleAccent}</em></> : null}</h1>
        {c.subtitle && <p>{c.subtitle}</p>}
        <div className="row gap-12" style={{ flexWrap: 'wrap' }}>
          {c.ctaText && <button className="btn btn-primary btn-lg" onClick={go}>{c.ctaText} <Icon name="arrow-right" size={17} /></button>}
          <button className="btn btn-ghost btn-lg" onClick={() => navigate('support')}>Talk to us</button>
        </div>
      </div>
      <div className="hb-visual"><HeroImage cfg={c} label="lifestyle hero shot" tint="b" /></div>
    </div>
  );
}

function Home() {
  const { navigate, heroConfig, isMobile } = useShop();
  const featured = G.featuredIds.map(G.byId);
  const deals = G.dealIds.map(G.byId).slice(0, isMobile ? 4 : 5);
  const trust = [
    ['truck', 'Free delivery', 'On orders over ৳2,000', 'var(--teal-50)', 'var(--teal)'],
    ['shield-check', '1-year warranty', 'Official, genuine units', 'var(--amber-50)', 'var(--amber-600)'],
    ['rotate-ccw', '7-day replacement', 'Easy, no-fuss returns', 'var(--teal-50)', 'var(--teal)'],
    ['banknote', 'Cash on Delivery', 'Pay when it arrives', 'var(--amber-50)', 'var(--amber-600)'],
  ];
  return (
    <CustomerShell>
      <div className="wrap" style={{ paddingTop: 24 }}><Hero cfg={heroConfig} /></div>

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

      {/* marketing banner - editable from the admin dashboard */}
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
// ---- Interactive star rating input ----
function StarInput({ value, onChange }) {
  const [hover, setHover] = useState(0);
  const cur = hover || value;
  return (
    <span style={{ display: 'inline-flex', gap: 3, cursor: 'pointer' }} onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} onMouseEnter={() => setHover(i)} onClick={() => onChange(i)}>
          <Icon name="star" size={26} style={{ fill: i <= cur ? '#ee8434' : 'none', color: i <= cur ? '#ee8434' : '#d8d2c6' }} />
        </span>
      ))}
    </span>
  );
}

function Product() {
  const { route, navigate, addToCart, isMobile, user, favIds, toggleFav, reloadCatalog, toast } = useShop();
  const p = G.byId(route.params.id) || G.products[0];
  const [qty, setQty] = useState(1);
  const [img, setImg] = useState(0);
  const [data, setData] = useState({ reviews: [], myReview: null, canReview: false });
  const [draftRating, setDraftRating] = useState(0);
  const [draftComment, setDraftComment] = useState('');
  const price = G.priceOf(p);
  const off = p.disc && p.disc > 0 ? Math.round((1 - p.disc / p.price) * 100) : 0;
  const related = G.products.filter(x => x.cat === p.cat && x.id !== p.id).slice(0, isMobile ? 2 : 4);
  const liked = favIds.includes(p.id);
  const imgs = p.images && p.images.length ? p.images : (p.imageUrl ? [p.imageUrl] : []);

  const loadReviews = async () => {
    try {
      const r = await api('/api/products/' + p.slug);
      setData({ reviews: r.reviews || [], myReview: r.myReview || null, canReview: !!r.canReview });
      if (r.myReview) { setDraftRating(r.myReview.rating); setDraftComment(r.myReview.comment || ''); }
    } catch { /* ignore */ }
  };
  useEffect(() => { setImg(0); setDraftRating(0); setDraftComment(''); loadReviews(); }, [p.id]);

  const submitReview = async () => {
    if (!user) { toast('Log in to leave a review', 'star'); navigate('login'); return; }
    if (!draftRating) { toast('Pick a star rating first', 'alert-triangle'); return; }
    try {
      await api('/api/products/' + p.slug, { method: 'POST', body: JSON.stringify({ rating: draftRating, comment: draftComment }) });
      await loadReviews();
      await reloadCatalog(); // refresh the aggregate shown on cards + this page
      toast('Thanks for your review!', 'check-circle-2');
    } catch (e) { toast(e.message || 'Could not submit review', 'alert-triangle'); }
  };

  return (
    <CustomerShell>
      <Crumb items={[{ label: 'Home', to: 'home' }, { label: G.catName(p.cat), to: 'category', params: { cat: p.cat } }, { label: p.name }]} />
      <div className="wrap section" style={{ paddingTop: 8 }}>
        <div className="pdp">
          <div className="pdp-gallery">
            <div className="pdp-main-img">{off > 0 && <span className="sale-tag">-{off}% OFF</span>}{imgs.length ? <img src={imgs[Math.min(img, imgs.length - 1)]} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Thumb label={`${p.brand} · view ${img + 1}`} tint={p.tint} style={{ height: '100%' }} />}</div>
            <div className="pdp-thumbs">{imgs.length
              ? imgs.map((u, i) => <div key={i} className={'t' + (img === i ? ' on' : '')} onClick={() => setImg(i)}><img src={u} alt={`${p.name} view ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>)
              : [0, 1, 2, 3].map(i => <div key={i} className={'t' + (img === i ? ' on' : '')} onClick={() => setImg(i)}><Thumb label={`v${i + 1}`} tint={p.tint} style={{ height: '100%' }} /></div>)}</div>
          </div>
          <div>
            <div className="pc-cat">{G.catName(p.cat)} · {p.brand}</div>
            <h1>{p.name}</h1>
            <div className="row gap-10"><Stars rating={p.rating} /><span className="muted" style={{ fontSize: 13.5 }}>{p.reviews ? `${p.rating.toFixed(1)} · ${p.reviews} review${p.reviews === 1 ? '' : 's'}` : 'No ratings yet'}</span>
              {p.stock <= 10 && <Badge kind="b-amber" icon="flame">Only {p.stock} left</Badge>}</div>
            <div className="pdp-price"><span className="now"><Tk>{price}</Tk></span>{off > 0 && <><span className="was"><Tk>{p.price}</Tk></span><Badge kind="b-red">Save <Tk>{p.price - price}</Tk></Badge></>}</div>
            <p className="pdp-desc">{p.desc}</p>
            <div style={{ margin: '18px 0' }}>{p.features.map(f => <div className="pdp-feature" key={f}><Icon name="check-circle-2" size={17} className="ic" />{f}</div>)}</div>
            <div className="divider" />
            <div className="pdp-buy">
              <Qty value={qty} onChange={setQty} max={p.stock} />
              <button className="btn btn-primary btn-lg" style={{ flex: 1 }} onClick={() => addToCart(p.id, qty)}><Icon name="shopping-cart" size={18} /> Add to Cart</button>
              <button className="btn btn-accent btn-lg" onClick={() => { addToCart(p.id, qty); navigate('cart'); }}>Buy Now</button>
              <button className="btn btn-ghost btn-icon btn-lg" title={liked ? 'Remove from favourites' : 'Save to favourites'} onClick={() => toggleFav(p.id)}>
                <Icon name="heart" size={18} style={liked ? { fill: '#ee8434', color: '#ee8434' } : null} />
              </button>
            </div>
            <div className="row gap-16 muted" style={{ fontSize: 12.5, flexWrap: 'wrap' }}>
              <span className="row gap-6"><Icon name="truck" size={15} /> Delivered in 2-4 days</span>
              <span className="row gap-6"><Icon name="shield-check" size={15} /> Official warranty</span>
              <span className="row gap-6"><Icon name="rotate-ccw" size={15} /> 7-day replacement</span>
            </div>
          </div>
        </div>

        {/* Ratings & reviews */}
        <div className="section" style={{ paddingBottom: 0 }}>
          <div className="sec-head"><h2 style={{ fontSize: 21 }}>Ratings & reviews</h2></div>
          <div className="card card-pad">
            <div className="row gap-20" style={{ flexWrap: 'wrap', alignItems: 'flex-start' }}>
              <div style={{ textAlign: 'center', minWidth: 120 }}>
                <div style={{ fontSize: 38, fontWeight: 800, color: 'var(--teal)', lineHeight: 1 }}>{p.reviews ? p.rating.toFixed(1) : '-'}</div>
                <div style={{ margin: '6px 0' }}><Stars rating={p.rating} /></div>
                <div className="muted" style={{ fontSize: 12 }}>{p.reviews} review{p.reviews === 1 ? '' : 's'}</div>
              </div>
              <div style={{ flex: 1, minWidth: 240 }}>
                {!user ? (
                  <div className="muted" style={{ fontSize: 14, lineHeight: 1.6 }}>Bought this and have an opinion? <span className="linkish" onClick={() => navigate('login')}>Log in</span> to rate it and leave a review.</div>
                ) : (data.canReview || data.myReview) ? (
                  <>
                    <div style={{ fontWeight: 700, fontSize: 14.5, marginBottom: 8 }}>{data.myReview ? 'Update your review' : 'Rate this product'}</div>
                    <StarInput value={draftRating} onChange={setDraftRating} />
                    <textarea className="inp" style={{ marginTop: 10, minHeight: 70 }} placeholder="Share your thoughts (optional)" value={draftComment} onChange={e => setDraftComment(e.target.value)} />
                    <button className="btn btn-primary btn-sm" style={{ marginTop: 10 }} onClick={submitReview}>{data.myReview ? 'Update review' : 'Submit review'}</button>
                  </>
                ) : (
                  <div className="muted" style={{ fontSize: 14, lineHeight: 1.6 }}><Icon name="lock" size={14} style={{ verticalAlign: -2, marginRight: 4 }} />Only verified buyers can review. Purchase this product to share your rating.</div>
                )}
              </div>
            </div>
            <div className="divider" />
            {data.reviews.length === 0 ? (
              <div className="muted" style={{ fontSize: 14, padding: '6px 0' }}>No reviews yet. Be the first to review this product.</div>
            ) : data.reviews.map(rv => (
              <div key={rv.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--line)' }}>
                <div className="between" style={{ flexWrap: 'wrap', gap: 8 }}>
                  <div className="row gap-8"><div className="ca" style={{ width: 30, height: 30, borderRadius: '50%' }}>{rv.userName[0]}</div><b style={{ fontSize: 13.5 }}>{rv.userName}</b></div>
                  <Stars rating={rv.rating} />
                </div>
                {rv.comment && <p style={{ margin: '8px 0 0', fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.5 }}>{rv.comment}</p>}
              </div>
            ))}
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
   4iMart - Cart, Checkout, Confirmation
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
   4iMart - Auth + Account + Support
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
          {!isMobile && <div className="logo" style={{ justifyContent: 'center', marginBottom: 18 }}><Logo height={32} /></div>}
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
          <p className="auth-foot">New to 4iMart? <span className="linkish" onClick={() => navigate('register')}>Create an account</span></p>
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
          {!isMobile && <div className="logo" style={{ justifyContent: 'center', marginBottom: 18 }}><Logo height={32} /></div>}
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
  const { navigate } = useShop();
  const lines = o.items.map(([id, qty]) => ({ p: G.byId(id), qty })).filter(l => l.p);
  const total = o.total;
  return (
    <div className="order-card">
      <div className="oc-head">
        <div><div className="oc-id">{o.id}</div><div className="oc-date">Placed {o.date} · {lines.length} item{lines.length > 1 ? 's' : ''}</div></div>
        <div className="row gap-8" style={{ flexWrap: 'wrap' }}><PayBadge status={o.payStatus} /><StatusBadge status={o.status} /></div>
      </div>
      <div className="between" style={{ gap: 14, flexWrap: 'wrap' }}>
        <div className="order-thumbs">{lines.slice(0, 4).map((l, i) => <div className="ot" key={i} title={l.p.name} style={{ cursor: 'pointer' }} onClick={() => navigate('product', { id: l.p.id })}><Thumb label="" tint={l.p.tint} style={{ height: '100%' }} /></div>)}</div>
        <div className="row gap-16">
          <div><div className="muted" style={{ fontSize: 11.5 }}>Total</div><div style={{ fontWeight: 800, color: 'var(--teal)', fontSize: 16 }}><Tk>{total}</Tk></div></div>
          <button className="btn btn-ghost btn-sm" onClick={() => onOpen(o)}>View details <Icon name="arrow-right" size={14} /></button>
        </div>
      </div>
    </div>
  );
}

function Account() {
  const { navigate, user, logout, isMobile, myOrders, refreshMyOrders, favIds } = useShop();
  const [open, setOpen] = useState(null);
  const [tab, setTab] = useState('orders');
  const favProducts = favIds.map(G.byId).filter(Boolean);
  useEffect(() => { if (!user) navigate('login'); else refreshMyOrders(); }, []);
  if (!user) return null;
  const nav = [['orders', 'package', 'My Orders'], ['favourites', 'heart', 'Favourites'], ['profile', 'user', 'Profile'], ['address', 'map-pin', 'Addresses'], ['support', 'headset', 'Support']];

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
            {tab === 'favourites' && (
              <>
                <div className="sec-head" style={{ marginBottom: 14 }}><div><h2 style={{ fontSize: 21 }}>Favourites</h2><p>{favProducts.length} saved item{favProducts.length === 1 ? '' : 's'}</p></div></div>
                {favProducts.length === 0 ? (
                  <div className="empty-state"><div className="es-ic"><Icon name="heart" /></div><h3>No favourites yet</h3><p>Tap the heart on any product to save it here for later.</p><button className="btn btn-primary btn-lg" onClick={() => navigate('category')}>Browse products</button></div>
                ) : (
                  <div className="pgrid">{favProducts.map(fp => <ProductCard key={fp.id} p={fp} />)}</div>
                )}
              </>
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
  const { navigate } = useShop();
  const lines = o.items.map(([id, qty]) => ({ p: G.byId(id), qty })).filter(l => l.p);
  const total = o.total;
  const steps = ['placed', 'confirmed', 'packed', 'shipped', 'delivered'];
  const curIdx = steps.indexOf(o.status);
  // Download a server-generated PDF invoice (same-origin GET sends the session cookie).
  const downloadInvoice = () => {
    const a = document.createElement('a');
    a.href = `/api/orders/${o.id}/invoice`;
    a.download = `invoice-${o.id}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };
  return (
    <Modal title={`Order ${o.id}`} onClose={onClose} footer={<><button className="btn btn-ghost" onClick={onClose}>Close</button><button className="btn btn-primary" onClick={downloadInvoice}><Icon name="download" size={16} /> Invoice</button></>}>
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
        <div className="mini-item" key={l.p.id} style={{ cursor: 'pointer' }} title={`View ${l.p.name}`} onClick={() => { onClose(); navigate('product', { id: l.p.id }); }}>
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
  const greeting = { who: 'them', t: 'Assalamu alaikum! 👋 This is the 4iMart support team. How can we help you today?', time: '' };
  const [thread, setThread] = useState([]); // chat messages from the API
  const [val, setVal] = useState('');
  const bodyRef = useRef(null);

  // Each row is one message; render by sender (admin -> them/left, you -> me/right).
  const msgs = [greeting, ...thread.map(m => ({ who: m.sender === 'admin' ? 'them' : 'me', t: m.body, time: fmtTime(m.createdAt) }))];

  const load = async () => {
    try { const r = await api('/api/support'); setThread(r.messages || []); } catch { /* not logged in */ }
  };
  // Load on open and poll so admin replies appear without a manual refresh.
  useEffect(() => {
    if (!user) return;
    load();
    const iv = setInterval(load, 6000);
    return () => clearInterval(iv);
  }, [user]);

  const send = async () => {
    if (!val.trim()) return;
    const text = val.trim();
    setVal('');
    try { const r = await api('/api/support', { method: 'POST', body: JSON.stringify({ body: text }) }); setThread(r.messages || []); }
    catch (e) { toast(e.message || 'Could not send message', 'alert-triangle'); }
  };
  useEffect(() => { if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight; }, [thread]);

  return (
    <CustomerShell>
      <Crumb items={[{ label: 'Home', to: 'home' }, { label: 'Support' }]} />
      <div className="wrap section" style={{ paddingTop: 8, maxWidth: 760 }}>
        <div className="sec-head" style={{ marginBottom: 16 }}><div><h2>Help & Support</h2><p>Message the shop directly, we usually reply within minutes</p></div></div>
        <div className="trust-row" style={{ marginBottom: 20, gridTemplateColumns: isMobile ? '1fr' : 'repeat(3,1fr)' }}>
          <div className="trust-item"><div className="ti-ic" style={{ background: 'var(--teal-50)', color: 'var(--teal)' }}><Icon name="phone" size={19} /></div><div><h4>Call us</h4><p>16xxx · 9am-9pm daily</p></div></div>
          <div className="trust-item"><div className="ti-ic" style={{ background: 'var(--amber-50)', color: 'var(--amber-600)' }}><Icon name="message-circle" size={19} /></div><div><h4>WhatsApp</h4><p>+880 1777-000111</p></div></div>
          <div className="trust-item"><div className="ti-ic" style={{ background: 'var(--teal-50)', color: 'var(--teal)' }}><Icon name="mail" size={19} /></div><div><h4>Email</h4><p>help@4imart.bd</p></div></div>
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
              <div className="av"><LogoMark size={24} color="#fff" /></div>
              <div><div style={{ fontWeight: 700, fontSize: 14.5 }}>4iMart Support</div><div style={{ fontSize: 12, color: 'var(--green)' }}>● Online · replies in ~5 min</div></div>
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
   4iMart - Info pages: Delivery info & Refund Policy
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
          <div className="info-stat-sub">1-2 business days · ৳80 (free over ৳2,000)</div>
        </div>
        <div className="info-stat-card">
          <div className="kpi-ic" style={{ background: 'var(--amber-50)', color: 'var(--amber-600)' }}><Icon name="globe" size={20} /></div>
          <div className="info-stat-val">Outside Dhaka</div>
          <div className="info-stat-sub">2-4 business days · ৳120 nationwide</div>
        </div>
        <div className="info-stat-card">
          <div className="kpi-ic" style={{ background: 'var(--teal-50)', color: 'var(--teal)' }}><Icon name="package-check" size={20} /></div>
          <div className="info-stat-val">Free delivery</div>
          <div className="info-stat-sub">On every order over ৳2,000</div>
        </div>
      </div>

      <div className="info-section">
        <InfoBlock icon="clock" title="How long will my order take?">
          <p>Orders placed before 6 PM are dispatched the same day. Inside Dhaka city you'll usually receive your parcel within <b>1-2 business days</b>, and anywhere else in the country within <b>2-4 business days</b>. Large appliances may take an extra day for safe handling.</p>
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
          <p>Our team is here 9am-9pm, every day.</p>
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
          <div className="info-stat-sub">1-5 years on eligible products</div>
        </div>
        <div className="info-stat-card">
          <div className="kpi-ic" style={{ background: 'var(--teal-50)', color: 'var(--teal)' }}><Icon name="wallet" size={20} /></div>
          <div className="info-stat-val">Fast refunds</div>
          <div className="info-stat-sub">To bKash/Nagad within 3-5 days</div>
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
          <p>Once we receive and inspect the returned item, your refund is issued to your original payment method: <b>bKash or Nagad within 3-5 business days</b>. For Cash on Delivery orders, we refund to your preferred mobile wallet.</p>
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
   4iMart - Admin screens
   ============================================================ */

function AdminLogin() {
  const { navigate, loginAdmin } = useShop();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const submit = () => loginAdmin(email.trim(), password);
  return (
    <div className="auth-wrap" style={{ background: 'linear-gradient(160deg,#11414e,#0a2730)' }}>
      <div className="auth-card fade-in" style={{ background: '#fff' }}>
        <div className="row gap-10" style={{ marginBottom: 6 }}>
          <div style={{ width: 40, height: 40, borderRadius: 11, background: 'var(--teal)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="shield" size={20} /></div>
          <div className="logo"><Logo height={26} /></div>
        </div>
        <h1 style={{ marginTop: 14 }}>Admin Panel</h1>
        <p className="sub">Staff access only. Customer accounts won't work here.</p>
        <Field label="Admin email"><input className="inp" placeholder="Enter admin email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
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
    ['admin-support', 'headset', 'Support'],
  ];
  const collapsed = !isMobile && adminCollapsed;
  return (
    <div className={'admin' + (collapsed ? ' collapsed' : '')}>
      <aside className="admin-side">
        <div className="as-logo">
          {collapsed ? <LogoMark size={28} color="#f3f7f8" /> : <><Logo dark height={24} /> <span style={{ fontSize: 10, color: '#8fa9ad', fontWeight: 700, letterSpacing: '.1em', marginLeft: 2 }}>ADMIN</span></>}
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
      <p className="muted" style={{ margin: '0 0 20px', fontSize: 14 }}>Welcome back! Here's what's happening at 4iMart today.</p>
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
          {isMobile ? (
            <div className="adm-list">
              {orders.slice(0, 6).map(o => (
                <div className="adm-item" key={o.id} style={{ cursor: 'pointer' }} onClick={() => navigate('admin-orders')}>
                  <div className="ai-head">
                    <div><div className="cell-strong">{o.id}</div><div className="muted" style={{ fontSize: 11.5 }}>{o.guest ? 'Guest' : o.customer}</div></div>
                    <div className="ai-badges"><PayBadge status={o.payStatus} /><StatusBadge status={o.status} /></div>
                  </div>
                  <div className="adm-kv"><span className="row gap-6"><span className={'pay-logo ' + o.pay} style={{ width: 'auto', minWidth: 30, height: 20, fontSize: 9, padding: '0 6px' }}>{G.payMethod[o.pay].short}</span></span><span className="cell-strong"><Tk>{o.total}</Tk></span></div>
                </div>
              ))}
            </div>
          ) : (
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
          )}
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

      <NavManager />
      <HeroManager />
      <BannerManager />
    </AdminShell>
  );
}

// ---- Homepage marketing banner manager ----
function BannerManager() {
  const { banner, reloadCatalog, toast, isMobile } = useShop();
  const [edit, setEdit] = useState(false);
  // Persist the visibility toggle so the storefront actually reflects it.
  const toggleVisible = async (enabled) => {
    try { await api('/api/admin/banner', { method: 'PUT', body: JSON.stringify({ ...banner, enabled }) }); await reloadCatalog(); }
    catch (e) { toast(e.message || 'Could not update banner', 'alert-triangle'); }
  };
  return (
    <div className="tbl-card" style={{ marginTop: 20 }}>
      <div className="tbl-head">
        <div className="row gap-10">
          <div className="kpi-ic" style={{ width: 38, height: 38, margin: 0, borderRadius: 10, background: 'var(--amber-50)', color: 'var(--amber-600)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="image" size={19} /></div>
          <div><h3>Homepage banner</h3><div className="muted" style={{ fontSize: 12 }}>Shown at the top-middle of the storefront homepage</div></div>
        </div>
        <div className="row gap-10">
          <label className="check" style={{ fontSize: 13, gap: 6 }}>
            <input type="checkbox" checked={banner.enabled} onChange={e => toggleVisible(e.target.checked)} /><span>Visible</span>
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
  const { banner, reloadCatalog, toast, isMobile } = useShop();
  const [f, setF] = useState({ ...BANNER_DEFAULT, ...banner });
  const set = (k) => (e) => setF(s => ({ ...s, [k]: e.target.value }));
  const themes = [['amber', 'Orange', '#ee8434'], ['teal', 'Teal', '#165060'], ['cream', 'Light', '#FAF7F2']];
  const targets = [['category', 'Shop All'], ['cat:smartphones', 'Smartphones'], ['cat:mens', "Men's Fashion"], ['cat:womens', "Women's Fashion"], ['cat:appliances', 'Appliances'], ['deals', 'Best deals']];
  const save = async () => {
    try {
      await api('/api/admin/banner', { method: 'PUT', body: JSON.stringify(f) });
      await reloadCatalog();
      toast('Banner updated, now live on the homepage', 'check-circle-2');
      onClose();
    } catch (e) { toast(e.message || 'Could not save banner', 'alert-triangle'); }
  };
  const currentLink = f.linkTo || 'deals';

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

// ---- Storefront navbar manager ----
// Lets the admin choose which categories appear as anchors in the header
// (and the footer "Shop" column). "Home" and "Shop All" are fixed.
const NAV_LINKS_MAX = 5;
function NavManager() {
  const { reloadCatalog, toast, isMobile } = useShop();
  const pad = (slugs) => [...slugs, ...Array(Math.max(0, NAV_LINKS_MAX - slugs.length)).fill('')].slice(0, NAV_LINKS_MAX);
  // Seed the slots from the live nav (admin picks, or the automatic first 5).
  const [slots, setSlots] = useState(() => pad(G.navCats.map(c => c.id)));
  const [saving, setSaving] = useState(false);
  const setSlot = (i) => (e) => setSlots(s => s.map((x, xi) => xi === i ? e.target.value : x));

  const save = async () => {
    setSaving(true);
    try {
      await api('/api/admin/nav', { method: 'PUT', body: JSON.stringify({ slugs: slots.filter(Boolean) }) });
      await reloadCatalog();
      setSlots(pad(G.navCats.map(c => c.id)));
      toast('Navbar updated, now live on the storefront', 'check-circle-2');
    } catch (e) { toast(e.message || 'Could not save navbar', 'alert-triangle'); }
    finally { setSaving(false); }
  };

  const picked = slots.filter(Boolean).map(slug => G.categories.find(c => c.id === slug)).filter(Boolean);
  return (
    <div className="tbl-card" style={{ marginTop: 20 }}>
      <div className="tbl-head">
        <div className="row gap-10">
          <div className="kpi-ic" style={{ width: 38, height: 38, margin: 0, borderRadius: 10, background: 'var(--teal-50)', color: 'var(--teal)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="menu" size={19} /></div>
          <div><h3>Storefront navbar</h3><div className="muted" style={{ fontSize: 12 }}>Category links shown in the header & footer — “Home” and “Shop All” are fixed</div></div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={save} disabled={saving}><Icon name="check" size={15} /> {saving ? 'Saving…' : 'Save & publish'}</button>
      </div>
      <div style={{ padding: isMobile ? 16 : 24 }}>
        <div className="banner-preview-label">Live preview</div>
        <div className="chips" style={{ marginBottom: 20 }}>
          <span className="chip on"><Icon name="lock" size={12} style={{ marginRight: 5 }} />Home</span>
          <span className="chip on"><Icon name="lock" size={12} style={{ marginRight: 5 }} />Shop All</span>
          {picked.map(c => <span className="chip" key={c.id}>{c.name}</span>)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10 }}>
          {slots.map((slug, i) => (
            <Field key={i} label={'Link ' + (i + 1)}>
              <select className="sel" value={slug} onChange={setSlot(i)}>
                <option value="">— None —</option>
                {G.categories
                  .filter(c => c.id === slug || !slots.includes(c.id))
                  .map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
          ))}
        </div>
        <div className="muted" style={{ fontSize: 12, marginTop: 12 }}>
          Up to {NAV_LINKS_MAX} category links, shown in this order. Leave all empty to show the first {NAV_LINKS_MAX} categories automatically.
        </div>
      </div>
    </div>
  );
}

// ---- Homepage hero manager (edit layout, copy, image, stats) ----
function HeroManager() {
  const { heroConfig, isMobile } = useShop();
  const [edit, setEdit] = useState(false);
  return (
    <div className="tbl-card" style={{ marginTop: 20 }}>
      <div className="tbl-head">
        <div className="row gap-10">
          <div className="kpi-ic" style={{ width: 38, height: 38, margin: 0, borderRadius: 10, background: 'var(--teal-50)', color: 'var(--teal)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="image" size={19} /></div>
          <div><h3>Homepage hero</h3><div className="muted" style={{ fontSize: 12 }}>The big banner at the top of the storefront homepage</div></div>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setEdit(true)}><Icon name="pencil" size={15} /> Edit hero</button>
      </div>
      <div style={{ padding: isMobile ? 16 : 24 }}>
        <div style={{ pointerEvents: 'none' }}><Hero cfg={heroConfig} /></div>
      </div>
      {edit && <HeroEditorModal onClose={() => setEdit(false)} />}
    </div>
  );
}

function HeroEditorModal({ onClose }) {
  const { heroConfig, reloadCatalog, toast, isMobile } = useShop();
  const [f, setF] = useState({ ...HERO_DEFAULT, ...heroConfig, stats: (heroConfig.stats || HERO_DEFAULT.stats).map(s => ({ ...s })) });
  const set = (k) => (e) => setF(s => ({ ...s, [k]: e.target.value }));
  const setStat = (i, key) => (e) => setF(s => ({ ...s, stats: s.stats.map((x, xi) => xi === i ? { ...x, [key]: e.target.value } : x) }));
  const layouts = [['A', 'Image + stats'], ['B', 'Split panel'], ['C', 'Full-width banner']];
  const targets = [['category', 'Shop All'], ['cat:smartphones', 'Smartphones'], ['cat:mens', "Men's Fashion"], ['cat:womens', "Women's Fashion"], ['cat:appliances', 'Appliances'], ['deals', 'Best deals']];

  const save = async () => {
    try {
      await api('/api/admin/hero', { method: 'PUT', body: JSON.stringify(f) });
      await reloadCatalog();
      toast('Homepage hero updated, now live', 'check-circle-2');
      onClose();
    } catch (e) { toast(e.message || 'Could not save hero', 'alert-triangle'); }
  };

  return (
    <Modal title="Edit homepage hero" onClose={onClose}
      footer={<><button className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={save}><Icon name="check" size={16} /> Save & publish</button></>}>
      <div className="banner-preview-label">Live preview</div>
      <div style={{ marginBottom: 22, pointerEvents: 'none' }}><Hero cfg={f} /></div>

      <Field label="Layout">
        <div className="chips">
          {layouts.map(([id, name]) => (
            <span key={id} className={'chip' + (f.layout === id ? ' on' : '')} onClick={() => setF(s => ({ ...s, layout: id }))}>{name}</span>
          ))}
        </div>
      </Field>
      <div style={{ height: 16 }} />
      <Field label="Eyebrow (small label)"><input className="inp" value={f.eyebrow} onChange={set('eyebrow')} placeholder="e.g. New arrivals weekly" /></Field>
      <div style={{ height: 16 }} />
      <div className="banner-editor-grid">
        <Field label="Headline" hint="Use Enter for a line break"><textarea className="inp" value={f.title} onChange={set('title')} placeholder="Main headline" style={{ minHeight: 64 }} /></Field>
        <Field label="Highlighted tail" hint="Shown emphasized after the headline"><input className="inp" value={f.titleAccent} onChange={set('titleAccent')} placeholder="e.g. without the worry." /></Field>
      </div>
      <div style={{ height: 16 }} />
      <Field label="Subtitle"><textarea className="inp" value={f.subtitle} onChange={set('subtitle')} placeholder="Supporting paragraph" style={{ minHeight: 70 }} /></Field>
      <div style={{ height: 16 }} />
      <div className="banner-editor-grid">
        <Field label="Button text" hint="Leave empty to hide the button"><input className="inp" value={f.ctaText} onChange={set('ctaText')} placeholder="e.g. Start shopping" /></Field>
        <Field label="Button links to">
          <select className="sel" value={f.ctaLink} onChange={set('ctaLink')}>
            {targets.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </Field>
      </div>
      <div style={{ height: 16 }} />
      {/* Image is a URL for now (no paid storage). Cloudflare R2 could back uploads later. */}
      <Field label="Hero image URL" hint="Used by the 'Image + stats' and 'Split panel' layouts. Leave empty for the styled placeholder.">
        <input className="inp" value={f.imageUrl} onChange={set('imageUrl')} placeholder="https://…/hero.jpg" />
      </Field>
      {f.layout === 'A' && (
        <>
          <div style={{ height: 16 }} />
          <Field label="Stats (shown on the 'Image + stats' layout)">
            <div style={{ display: 'grid', gap: 10 }}>
              {f.stats.map((s, i) => (
                <div key={i} className="row gap-10">
                  <input className="inp" value={s.value} onChange={setStat(i, 'value')} placeholder="e.g. 50k+" style={{ flex: '0 0 110px' }} />
                  <input className="inp" value={s.label} onChange={setStat(i, 'label')} placeholder="e.g. happy customers" />
                </div>
              ))}
            </div>
          </Field>
        </>
      )}
    </Modal>
  );
}

function AdminOrders() {
  const { toast, adminOrders, refreshAdminOrders, isMobile } = useShop();
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

  const StatusSelect = ({ o }) => (
    <select className="status-select" value={o.status} onChange={e => setStatus(o.id, e.target.value)} disabled={o.status === 'cancelled'}>
      {G.statusOrder.map(s => <option key={s} value={s}>{G.statusMeta[s].label}</option>)}
    </select>
  );

  return (
    <AdminShell active="admin-orders" title="Orders">
      <div className="chips" style={{ marginBottom: 16, overflowX: 'auto', flexWrap: isMobile ? 'nowrap' : 'wrap', paddingBottom: isMobile ? 4 : 0 }}>
        {[['all', 'All'], ['placed', 'New'], ['shipped', 'Shipped'], ['delivered', 'Delivered'], ['unpaid', 'Payment due'], ['cancelled', 'Cancelled']].map(([k, l]) => (
          <span key={k} className={'chip' + (filter === k ? ' on' : '')} style={{ whiteSpace: 'nowrap' }} onClick={() => setFilter(k)}>{l}</span>
        ))}
      </div>
      <div className="tbl-card">
        <div className="tbl-head"><h3>{list.length} orders</h3>{!isMobile && <div className="search" style={{ maxWidth: 240 }}><div className="inp-group"><span className="pfx"><Icon name="search" size={15} /></span><input placeholder="Search orders…" /></div></div>}</div>
        {isMobile ? (
          <div className="adm-list">
            {list.map(o => {
              const qty = o.items.reduce((a, [, q]) => a + q, 0);
              return (
                <div className="adm-item" key={o.id}>
                  <div className="ai-head">
                    <div onClick={() => setOpen(o)} style={{ cursor: 'pointer' }}>
                      <div className="cell-strong">{o.id}</div>
                      <div className="muted" style={{ fontSize: 11.5 }}>{o.date} · {qty} item{qty > 1 ? 's' : ''}</div>
                    </div>
                    <div className="ai-badges"><PayBadge status={o.payStatus} /><StatusBadge status={o.status} /></div>
                  </div>
                  <div className="adm-kv">
                    <span className="row gap-8"><div className="ca" style={{ width: 30, height: 30 }}>{o.guest ? 'G' : o.customer[0]}</div><span><div style={{ fontWeight: 600, fontSize: 13 }}>{o.guest ? 'Guest' : o.customer}</div><div className="muted" style={{ fontSize: 11.5 }}>{o.phone}</div></span></span>
                    <span className="cell-strong"><Tk>{o.total}</Tk></span>
                  </div>
                  <div className="adm-kv"><span className="k">Payment</span><span className="row gap-6"><span className={'pay-logo ' + o.pay} style={{ width: 'auto', minWidth: 32, height: 22, fontSize: 9.5, padding: '0 7px' }}>{G.payMethod[o.pay].short}</span></span></div>
                  <div className="adm-kv"><span className="k">Status</span><StatusSelect o={o} /></div>
                  <div className="adm-actions">
                    <button className="btn btn-soft btn-sm" onClick={() => setOpen(o)}><Icon name="eye" size={15} /> View</button>
                    {o.payStatus !== 'paid' && o.status !== 'cancelled' && <button className="btn btn-ghost btn-sm" onClick={() => confirmPay(o.id)}><Icon name="badge-check" size={15} /> Confirm</button>}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
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
                    <td><StatusSelect o={o} /></td>
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
        )}
      </div>
      {open && <AdminOrderModal o={open} onClose={() => setOpen(null)} onStatus={setStatus} onPay={confirmPay} />}
    </AdminShell>
  );
}

function AdminOrderModal({ o, onClose, onStatus, onPay }) {
  const lines = o.items.map(([id, qty]) => ({ p: G.byId(id), qty })).filter(l => l.p);
  const total = o.total;
  const [showCustomer, setShowCustomer] = useState(false);
  const [showProduct, setShowProduct] = useState(null);
  const addr = [[o.address, o.area].filter(Boolean).join(', '), [o.district, o.division].filter(Boolean).join(', ')].filter(Boolean);
  return (
    <Modal title={`Order ${o.id}`} onClose={onClose}
      footer={<>
        {o.payStatus !== 'paid' && o.status !== 'cancelled' && <button className="btn btn-ghost" onClick={() => { onPay(o.id); onClose(); }}><Icon name="badge-check" size={16} /> Confirm payment</button>}
        {o.status !== 'delivered' && o.status !== 'cancelled' && <button className="btn btn-primary" onClick={() => { onStatus(o.id, 'delivered'); onClose(); }}>Mark delivered</button>}
      </>}>
      <div className="row gap-8" style={{ marginBottom: 16, flexWrap: 'wrap' }}><StatusBadge status={o.status} /><PayBadge status={o.payStatus} /><span className="muted" style={{ fontSize: 12.5 }}>· {o.date}</span></div>

      {/* Customer - click to see full details */}
      <div className="card" style={{ padding: 14, marginBottom: 12, background: 'var(--cream)', cursor: 'pointer' }} title="View customer details" onClick={() => setShowCustomer(true)}>
        <div className="cust-cell">
          <div className="ca" style={{ width: 40, height: 40 }}>{o.guest ? 'G' : o.customer[0]}</div>
          <div style={{ flex: 1 }}><div style={{ fontWeight: 700 }}>{o.guest ? 'Guest checkout' : o.customer}</div><div className="muted" style={{ fontSize: 12.5 }}>{o.phone} · {G.payMethod[o.pay].label}{o.txn && ` · TrxID ${o.txn}`}</div></div>
          <span className="linkish" style={{ fontSize: 12.5 }}>Details <Icon name="arrow-right" size={13} /></span>
        </div>
      </div>

      {/* Shipping address */}
      <div className="card" style={{ padding: 14, marginBottom: 16 }}>
        <div className="row gap-10" style={{ alignItems: 'flex-start' }}>
          <Icon name="map-pin" size={16} style={{ color: 'var(--teal)', marginTop: 2 }} />
          <div style={{ fontSize: 13.5, lineHeight: 1.5 }}>
            <div style={{ fontWeight: 700, marginBottom: 2 }}>Shipping address</div>
            {addr.length ? addr.map((l, i) => <div key={i} className="muted">{l}</div>) : <div className="muted">No address on file</div>}
          </div>
        </div>
      </div>

      {lines.map(l => (
        <div className="mini-item" key={l.p.id} style={{ cursor: 'pointer' }} title={`View ${l.p.name}`} onClick={() => setShowProduct(l.p.id)}>
          <div className="mi-img"><Thumb label={l.p.brand} tint={l.p.tint} style={{ height: '100%' }} /></div>
          <div><div className="mi-name">{l.p.name}</div><div className="mi-qty">Qty {l.qty} × <Tk>{G.priceOf(l.p)}</Tk></div></div>
          <div className="mi-price"><Tk>{G.priceOf(l.p) * l.qty}</Tk></div>
        </div>
      ))}
      <div className="summary-row total" style={{ borderTop: '1.5px dashed var(--line-2)', marginTop: 10 }}><span>Total</span><span><Tk>{total}</Tk></span></div>

      {showCustomer && <AdminCustomerModal order={o} onClose={() => setShowCustomer(false)} />}
      {showProduct && <AdminProductModal productId={showProduct} onClose={() => setShowProduct(null)} />}
    </Modal>
  );
}

function AdminInfoRow({ icon, label, value }) {
  return (
    <div className="row gap-10" style={{ alignItems: 'flex-start', padding: '8px 0', borderBottom: '1px solid var(--line)' }}>
      <Icon name={icon} size={15} style={{ color: 'var(--teal)', marginTop: 2 }} />
      <div style={{ flex: 1 }}>
        <div className="muted" style={{ fontSize: 11.5 }}>{label}</div>
        <div style={{ fontSize: 13.5 }}>{value || '-'}</div>
      </div>
    </div>
  );
}

function AdminCustomerModal({ order, onClose }) {
  const [c, setC] = useState(null);
  const [loading, setLoading] = useState(!order.guest);
  useEffect(() => {
    if (order.guest) return;
    (async () => {
      try { const r = await api('/api/admin/customers/' + order.userId); setC(r.customer); } catch { /* ignore */ }
      setLoading(false);
    })();
  }, []);
  const shipAddr = [[order.address, order.area].filter(Boolean).join(', '), [order.district, order.division].filter(Boolean).join(', ')].filter(Boolean).join(' · ');
  const savedAddr = c && [c.fullAddress, c.area, c.district, c.division].filter(Boolean).join(', ');
  return (
    <Modal title="Customer details" onClose={onClose} footer={<button className="btn btn-primary" onClick={onClose}>Close</button>}>
      <div className="cust-cell" style={{ marginBottom: 14 }}>
        <div className="ca" style={{ width: 46, height: 46, fontSize: 17 }}>{(order.customer || '?')[0]}</div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 16 }}>{order.customer}{order.guest && <span className="guest-tag" style={{ marginLeft: 8 }}>Guest</span>}</div>
          <div className="muted" style={{ fontSize: 12.5 }}>{order.guest ? 'Guest checkout (no account)' : (loading ? 'Loading…' : c ? `Member since ${c.memberSince}` : '')}</div>
        </div>
      </div>
      <AdminInfoRow icon="phone" label="Phone" value={order.phone || (c && c.phone)} />
      <AdminInfoRow icon="mail" label="Email" value={(c && c.email) || order.email} />
      <AdminInfoRow icon="map-pin" label="Shipping address (this order)" value={shipAddr} />
      {!order.guest && <AdminInfoRow icon="home" label="Saved address" value={savedAddr} />}
      {!order.guest && (
        <div className="row gap-20" style={{ marginTop: 14 }}>
          <div><div className="muted" style={{ fontSize: 11.5 }}>Total orders</div><div style={{ fontWeight: 800, fontSize: 18 }}>{loading ? '…' : (c ? c.orderCount : '-')}</div></div>
          <div><div className="muted" style={{ fontSize: 11.5 }}>Total paid</div><div style={{ fontWeight: 800, fontSize: 18, color: 'var(--teal)' }}>{loading ? '…' : (c ? G.taka(c.totalSpent) : '-')}</div></div>
        </div>
      )}
    </Modal>
  );
}

function AdminProductModal({ productId, onClose }) {
  const { navigate } = useShop();
  const p = G.byId(productId);
  if (!p) return <Modal title="Product" onClose={onClose} footer={<button className="btn btn-primary" onClick={onClose}>Close</button>}><p style={{ margin: 0 }}>This product is no longer available.</p></Modal>;
  return (
    <Modal title="Product details" onClose={onClose}
      footer={<><button className="btn btn-ghost" onClick={onClose}>Close</button><button className="btn btn-primary" onClick={() => { onClose(); navigate('product', { id: p.id }); }}><Icon name="arrow-right" size={16} /> Open product page</button></>}>
      <div className="row gap-14" style={{ alignItems: 'flex-start', marginBottom: 14 }}>
        <div style={{ width: 96, height: 96, borderRadius: 'var(--r)', overflow: 'hidden', border: '1px solid var(--line)', flex: '0 0 96px' }}>{p.imageUrl ? <img src={p.imageUrl} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Thumb label={p.brand} tint={p.tint} style={{ height: '100%' }} />}</div>
        <div>
          <div className="pc-cat">{G.catName(p.cat)} · {p.brand}</div>
          <div style={{ fontWeight: 800, fontSize: 16, margin: '2px 0 6px' }}>{p.name}</div>
          <div className="row gap-8" style={{ alignItems: 'baseline' }}><span style={{ fontWeight: 800, color: 'var(--teal)', fontSize: 18 }}><Tk>{G.priceOf(p)}</Tk></span>{p.disc > 0 && <span style={{ fontSize: 13, color: 'var(--muted-2)', textDecoration: 'line-through' }}><Tk>{p.price}</Tk></span>}</div>
          <div className="muted" style={{ fontSize: 12.5, marginTop: 6 }}>Stock: {p.stock} · {p.reviews ? `${p.rating.toFixed(1)}★ (${p.reviews})` : 'No ratings yet'}</div>
        </div>
      </div>
      <div className="divider" />
      <div style={{ fontWeight: 700, fontSize: 13.5, marginBottom: 6 }}>Description</div>
      <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.6, color: 'var(--ink-2)' }}>{p.desc || 'No description provided.'}</p>
    </Modal>
  );
}

function AdminCategories() {
  const { toast, reloadCatalog, isMobile } = useShop();
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
        {isMobile ? (
          <div className="adm-list">
            {cats.map(c => (
              <div className="adm-item" key={c.id}>
                <div className="ai-head">
                  <div className="cust-cell"><div className="ca" style={{ borderRadius: 10 }}><Icon name={c.icon} size={16} /></div><span className="cell-strong">{c.name}</span></div>
                  <Badge kind="b-green" icon="check">Active</Badge>
                </div>
                <div className="adm-kv"><span className="k">Products</span><span>{c.products} items</span></div>
                <div className="adm-actions">
                  <button className="btn btn-soft btn-sm" onClick={() => { setEdit(c); setName(c.name); }}><Icon name="pencil" size={15} /> Edit</button>
                  <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red)', flex: '0 0 auto' }} onClick={() => del(c.dbId)}><Icon name="trash-2" size={15} /></button>
                </div>
              </div>
            ))}
          </div>
        ) : (
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
        )}
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
        <div className="tbl-head"><h3>{prods.length} products</h3>{!isMobile && <div className="search" style={{ maxWidth: 240 }}><div className="inp-group"><span className="pfx"><Icon name="search" size={15} /></span><input placeholder="Search products…" /></div></div>}</div>
        {isMobile ? (
          <div className="adm-list">
            {prods.map(p => (
              <div className="adm-item" key={p.id}>
                <div className="adm-prod">
                  <div className="ap-img">{p.imageUrl ? <img src={p.imageUrl} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Thumb label="" tint={p.tint} style={{ height: '100%' }} />}</div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div className="cell-strong" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
                    <div className="muted" style={{ fontSize: 11.5 }}>{p.brand} · {G.catName(p.cat)}</div>
                    <div className="row gap-8" style={{ marginTop: 4, alignItems: 'baseline' }}>
                      <span className="cell-strong" style={{ color: 'var(--teal)' }}><Tk>{G.priceOf(p)}</Tk></span>
                      {p.disc > 0 && <span className="muted" style={{ fontSize: 11.5, textDecoration: 'line-through' }}><Tk>{p.price}</Tk></span>}
                    </div>
                  </div>
                  <div>{p.stock <= 10 ? <Badge kind="b-amber">{p.stock} left</Badge> : <span className="muted" style={{ fontSize: 12.5 }}>{p.stock} in stock</span>}</div>
                </div>
                <div className="adm-actions">
                  <button className="btn btn-soft btn-sm" onClick={() => setEdit(p)}><Icon name="pencil" size={15} /> Edit</button>
                  <button className="btn btn-ghost btn-sm" style={{ color: 'var(--red)', flex: '0 0 auto' }} onClick={() => setDel(p)}><Icon name="trash-2" size={15} /></button>
                </div>
              </div>
            ))}
          </div>
        ) : (
        <div className="tbl-wrap">
          <table className="tbl">
            <thead><tr><th>Product</th><th>Category</th><th>Price</th><th>Stock</th><th>Actions</th></tr></thead>
            <tbody>
              {prods.map(p => (
                <tr key={p.id}>
                  <td><div className="cust-cell"><div style={{ width: 42, height: 42, borderRadius: 9, overflow: 'hidden', flex: '0 0 42px', border: '1px solid var(--line)' }}>{p.imageUrl ? <img src={p.imageUrl} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <Thumb label="" tint={p.tint} style={{ height: '100%' }} />}</div><div><div className="cell-strong" style={{ maxWidth: 220, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div><div className="muted" style={{ fontSize: 11.5 }}>{p.brand}</div></div></div></td>
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
        )}
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
  const [f, setF] = useState({ id: p.id || null, name: p.name || '', cat: p.cat || 'smartphones', brand: p.brand || '', desc: p.desc || '', price: p.price || '', disc: p.disc || '', stock: p.stock || '', tint: p.tint || 'a' });
  // Image URL rows; the first non-empty URL becomes the cover image. Max 8.
  const [imgs, setImgs] = useState(() => (p.images && p.images.length ? p.images : (p.imageUrl ? [p.imageUrl] : [''])));
  const set = (k) => (e) => setF(s => ({ ...s, [k]: e.target.value }));
  const setImgAt = (i) => (e) => setImgs(list => list.map((u, j) => (j === i ? e.target.value : u)));
  const addImg = () => setImgs(list => [...list, '']);
  const rmImg = (i) => setImgs(list => (list.length > 1 ? list.filter((_, j) => j !== i) : ['']));
  return (
    <Modal title={p.id ? 'Edit product' : 'Add product'} onClose={onClose}
      footer={<><button className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-primary" onClick={() => onSave({ ...f, price: +f.price, disc: +f.disc || 0, stock: +f.stock, images: imgs.map(u => u.trim()).filter(Boolean) })}><Icon name="check" size={16} /> Save product</button></>}>
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
        {/* Images are stored as URLs for now (no paid storage) - see README "Product
            images" for free hosting options. Cloudflare R2 could later back direct
            uploads; these fields would then hold the R2 URLs. */}
        <Field label="Images" span2 hint="Paste public image URLs - the first is the cover photo (max 8)">
          {imgs.map((u, i) => (
            <div className="row gap-8" key={i} style={{ marginBottom: 8 }}>
              <div style={{ width: 38, height: 38, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--line)', flex: '0 0 38px' }}>
                {u.trim() && <img src={u.trim()} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
              </div>
              <input className="inp" style={{ flex: 1 }} value={u} onChange={setImgAt(i)} placeholder={i === 0 ? 'https://…/cover.jpg' : 'https://…/photo.jpg'} />
              <button className="btn btn-ghost btn-icon" title="Remove image" style={{ flex: '0 0 auto' }} onClick={() => rmImg(i)}><Icon name="x" size={15} /></button>
            </div>
          ))}
          {imgs.length < 8 && <button className="btn btn-soft btn-sm" onClick={addImg}><Icon name="plus" size={15} /> Add another image</button>}
        </Field>
      </div>
    </Modal>
  );
}

// ---- Admin support inbox (two-way chat with customers) ----
function AdminSupport() {
  const { isMobile, toast } = useShop();
  const fmtTime = (ts) => new Date(ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const [convos, setConvos] = useState([]);
  const [selId, setSelId] = useState(null);
  const [val, setVal] = useState('');
  const bodyRef = useRef(null);

  const load = async () => {
    try {
      const r = await api('/api/admin/support');
      const list = r.conversations || [];
      setConvos(list);
      setSelId((cur) => cur || (list[0] && list[0].userId) || null);
    } catch { /* ignore */ }
  };
  // Load + poll so new customer messages appear without a manual refresh.
  useEffect(() => { load(); const iv = setInterval(load, 6000); return () => clearInterval(iv); }, []);

  const sel = convos.find((c) => c.userId === selId) || null;
  useEffect(() => { if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight; }, [sel && sel.messages.length, selId]);

  const send = async () => {
    if (!val.trim() || !sel) return;
    const text = val.trim(); setVal('');
    try { await api('/api/admin/support', { method: 'POST', body: JSON.stringify({ userId: sel.userId, body: text }) }); await load(); }
    catch (e) { toast(e.message || 'Could not send reply', 'alert-triangle'); }
  };

  return (
    <AdminShell active="admin-support" title="Support">
      {convos.length === 0 ? (
        <div className="tbl-card"><div className="empty-state"><div className="es-ic"><Icon name="messages-square" /></div><h3>No messages yet</h3><p>Customer support chats will show up here as they come in.</p></div></div>
      ) : (
        <div className="tbl-card" style={{ overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '280px 1fr' }}>
            {/* conversation list */}
            <div style={{ borderRight: isMobile ? 'none' : '1px solid var(--line)', borderBottom: isMobile ? '1px solid var(--line)' : 'none', maxHeight: isMobile ? 220 : 560, overflowY: 'auto' }}>
              {convos.map((c) => (
                <div key={c.userId} onClick={() => setSelId(c.userId)} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '13px 16px', cursor: 'pointer', borderBottom: '1px solid var(--line)', background: c.userId === selId ? 'var(--teal-50)' : '#fff' }}>
                  <div className="ca" style={{ width: 38, height: 38, borderRadius: '50%', flex: '0 0 38px' }}>{c.userName[0]}</div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div className="between"><span className="cell-strong" style={{ fontSize: 13.5 }}>{c.userName}</span>{c.awaitingReply && <span className="badge b-amber" style={{ fontSize: 10 }}>New</span>}</div>
                    <div className="muted" style={{ fontSize: 12, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.messages[c.messages.length - 1].body}</div>
                  </div>
                </div>
              ))}
            </div>
            {/* chat panel */}
            {sel && (
              <div className="chat" style={{ height: isMobile ? 440 : 560, border: 'none', borderRadius: 0 }}>
                <div className="chat-head">
                  <div className="av">{sel.userName[0]}</div>
                  <div><div style={{ fontWeight: 700, fontSize: 14.5 }}>{sel.userName}</div><div className="muted" style={{ fontSize: 12 }}>{sel.userPhone}</div></div>
                </div>
                <div className="chat-body" ref={bodyRef}>
                  {sel.messages.map((m) => <div key={m.id} className={'bubble ' + (m.sender === 'admin' ? 'me' : 'them')}>{m.body}<span className="time">{fmtTime(m.createdAt)}</span></div>)}
                </div>
                <div className="chat-input">
                  <input className="inp" placeholder="Type a reply…" value={val} onChange={(e) => setVal(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') send(); }} />
                  <button className="btn btn-primary btn-icon" onClick={send}><Icon name="send" size={18} /></button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </AdminShell>
  );
}


/* ===== app.jsx ===== */
/* ============================================================
   4iMart - App shell: router, state, device toggle
   ============================================================ */
const S = { Home, Listing, Product, Cart, Checkout, Confirmation, Login, Register, Account, Support, DeliveryInfo, RefundPolicy, AdminLogin, AdminDashboard, AdminOrders, AdminCategories, AdminProducts, AdminSupport };

function App({ initialRoute = 'home' }) {
  const [route, setRoute] = useState({ name: initialRoute, params: {} });
  const [cart, setCart] = useState([]);
  const [user, setUser] = useState(null);
  const [admin, setAdmin] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [adminCollapsed, setAdminCollapsed] = useState(false);
  const [heroConfig, setHeroConfig] = useState(HERO_DEFAULT);
  const [banner, setBanner] = useState(BANNER_DEFAULT);
  const [lastOrder, setLastOrder] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [myOrders, setMyOrders] = useState([]);
  const [adminOrders, setAdminOrders] = useState([]);
  const [favIds, setFavIds] = useState([]);
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

  // scroll to top on route change
  useEffect(() => { window.scrollTo({ top: 0 }); }, [route]);

  // initial hydrate: catalog + any existing sessions
  const reloadCatalog = async () => {
    const data = await api('/api/catalog');
    applyCatalog(data);
    if (data.hero) setHeroConfig(data.hero);
    if (data.banner) setBanner(data.banner);
    setCatalogVersion((v) => v + 1);
  };
  useEffect(() => {
    (async () => {
      try { await reloadCatalog(); } catch { /* empty catalog */ }
      try { const me = await api('/api/auth/me'); if (me.user) { setUser(me.user); loadFavourites(); } } catch { /* guest */ }
      try { const a = await api('/api/admin/me'); if (a.admin) setAdmin(true); } catch { /* not admin */ }
      setLoaded(true);
    })();
  }, []);

  // ---- favourites (wishlist) ----
  const loadFavourites = async () => {
    try { const r = await api('/api/favourites'); setFavIds(r.ids || []); } catch { setFavIds([]); }
  };
  const toggleFav = async (productId) => {
    if (!user) { toast('Log in to save favourites', 'heart'); navigate('login'); return; }
    setFavIds((ids) => ids.includes(productId) ? ids.filter((x) => x !== productId) : [...ids, productId]); // optimistic
    try { const r = await api('/api/favourites', { method: 'POST', body: JSON.stringify({ productId }) }); setFavIds(r.ids || []); }
    catch (e) { toast(e.message || 'Could not update favourite', 'alert-triangle'); loadFavourites(); }
  };

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
      setUser(r.user); await refreshMyOrders(); loadFavourites(); navigate('account');
      toast('Welcome, ' + r.user.name.split(' ')[0] + '!', 'check-circle-2');
    } catch (e) { toast(e.message || 'Login failed', 'alert-triangle'); }
  };
  const register = async (payload) => {
    try {
      const r = await api('/api/auth/register', { method: 'POST', body: JSON.stringify(payload) });
      setUser(r.user); loadFavourites(); navigate('account');
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
    setUser(null); setAdmin(false); setMyOrders([]); setFavIds([]);
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
    user, login, register, logout, admin, loginAdmin, placeOrder, lastOrder, heroConfig, setHeroConfig, isMobile, toast, banner, setBanner,
    adminCollapsed, setAdminCollapsed, loaded, catalogVersion, reloadCatalog,
    myOrders, refreshMyOrders, adminOrders, refreshAdminOrders, favIds, toggleFav };

  const isAdmin = route.name.startsWith('admin');
  const Screen = {
    home: S.Home, category: S.Listing, product: S.Product, cart: S.Cart, checkout: S.Checkout,
    confirmation: S.Confirmation, login: S.Login, register: S.Register, account: S.Account, support: S.Support,
    delivery: S.DeliveryInfo, refund: S.RefundPolicy,
    'admin-login': S.AdminLogin, 'admin-dashboard': S.AdminDashboard, 'admin-orders': S.AdminOrders,
    'admin-categories': S.AdminCategories, 'admin-products': S.AdminProducts, 'admin-support': S.AdminSupport,
  }[route.name] || S.Home;

  // guard admin screens
  const Guarded = (isAdmin && route.name !== 'admin-login' && !admin) ? S.AdminLogin : Screen;

  return (
    <Shop.Provider value={ctx}>
      <div className={'app-root' + (isMobile ? ' mobile' : '')}>
        {loaded ? <Guarded /> : (
          <div style={{ minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            {/* Animated brand mark: the "4" draws in, the stem pops, the wheels bounce. */}
            <svg className="fourimart-loader" viewBox="0 0 64 64" fill="none" role="img" aria-label="Loading">
              <path className="diag" d={BRAND_PATHS.diag} stroke="var(--teal)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
              <path className="stem" d={BRAND_PATHS.stem} stroke="var(--teal)" strokeWidth="7" strokeLinecap="round" />
              <circle className="wheel w1" cx="20" cy="52" r="4.5" fill="var(--amber)" />
              <circle className="wheel w2" cx="38" cy="52" r="4.5" fill="var(--amber)" />
            </svg>
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
