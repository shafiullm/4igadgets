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
            <div className="pdp-main-img">{off > 0 && <span className="sale-tag">-{off}% OFF</span>}<Thumb label={`${p.brand} · view ${img + 1}`} tint={p.tint} style={{ height: '100%' }} /></div>
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

window.Screens = Object.assign(window.Screens || {}, { Home, Listing, Product, HeroA, HeroB, HeroC });
