/* ============================================================
   4iGadgets — Shared components
   ============================================================ */
const { useState, useEffect, useRef, useContext, createContext } = React;

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
        <Thumb label={p.brand + ' shot'} tint={p.tint} style={{ height: '100%' }} />
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
  return host ? ReactDOM.createPortal(content, host) : content;
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

Object.assign(window, {
  Shop, useShop, Icon, Thumb, Tk, Stars, Badge, StatusBadge, PayBadge,
  ProductCard, Field, Qty, Header, MobileTabs, Footer, Crumb, Modal, CustomerShell,
  MarketingBanner, BannerCard, BANNER_THEMES,
});
