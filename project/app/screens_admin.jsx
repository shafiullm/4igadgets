/* ============================================================
   4iGadgets — Admin screens
   ============================================================ */

function AdminLogin() {
  const { navigate, loginAdmin } = useShop();
  return (
    <div className="auth-wrap" style={{ background: 'linear-gradient(160deg,#0c3e4b,#082c36)' }}>
      <div className="auth-card fade-in" style={{ background: '#fff' }}>
        <div className="row gap-10" style={{ marginBottom: 6 }}>
          <div style={{ width: 40, height: 40, borderRadius: 11, background: 'var(--teal)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="shield" size={20} /></div>
          <div className="logo" style={{ fontSize: 19 }}>4i<span className="g">Gadgets</span></div>
        </div>
        <h1 style={{ marginTop: 14 }}>Admin Panel</h1>
        <p className="sub">Staff access only. Customer accounts won't work here.</p>
        <Field label="Admin email"><input className="inp" defaultValue="admin@4igadgets.bd" /></Field>
        <div style={{ height: 14 }} />
        <Field label="Password"><input className="inp" type="password" defaultValue="admin1234" /></Field>
        <div style={{ height: 20 }} />
        <button className="btn btn-primary btn-block btn-lg" onClick={() => loginAdmin()}><Icon name="lock" size={16} /> Secure login</button>
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
  const { navigate, isMobile } = useShop();
  const orders = G.orders;
  const revenue = orders.filter(o => o.payStatus === 'paid').reduce((s, o) => s + o.items.reduce((a, [id, q]) => a + G.priceOf(G.byId(id)) * q, 0), 0);
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
                  const total = o.items.reduce((a, [id, q]) => a + G.priceOf(G.byId(id)) * q, 0);
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
  const { toast } = useShop();
  const [orders, setOrders] = useState(G.orders);
  const [filter, setFilter] = useState('all');
  const [open, setOpen] = useState(null);
  const list = filter === 'all' ? orders : orders.filter(o => filter === 'unpaid' ? o.payStatus !== 'paid' : o.status === filter);

  const setStatus = (id, status) => { setOrders(os => os.map(o => o.id === id ? { ...o, status } : o)); toast('Order ' + id + ' → ' + G.statusMeta[status].label, 'check-circle-2'); };
  const confirmPay = (id) => { setOrders(os => os.map(o => o.id === id ? { ...o, payStatus: 'paid' } : o)); toast('Payment confirmed for ' + id, 'check-circle-2'); };

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
                const total = o.items.reduce((a, [id, q]) => a + G.priceOf(G.byId(id)) * q, 0);
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
  const lines = o.items.map(([id, qty]) => ({ p: G.byId(id), qty }));
  const total = lines.reduce((s, l) => s + G.priceOf(l.p) * l.qty, 0);
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
  const { toast } = useShop();
  const [cats, setCats] = useState(G.adminCats);
  const [edit, setEdit] = useState(null);
  const [name, setName] = useState('');

  const save = () => {
    if (!name.trim()) return;
    if (edit && edit.id) setCats(cs => cs.map(c => c.id === edit.id ? { ...c, name } : c));
    else setCats(cs => [...cs, { id: 'c' + Date.now(), name, icon: 'tag', products: 0, active: true }]);
    toast(edit && edit.id ? 'Category updated' : 'Category added', 'check-circle-2');
    setEdit(null); setName('');
  };
  const del = (id) => { setCats(cs => cs.filter(c => c.id !== id)); toast('Category deleted', 'trash-2'); };

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
                    <button className="act-btn danger" onClick={() => del(c.id)}><Icon name="trash-2" size={15} /></button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {edit && (
        <Modal title={edit.id ? 'Edit category' : 'Add category'} onClose={() => setEdit(null)}
          footer={<><button className="btn btn-ghost" onClick={() => setEdit(null)}>Cancel</button><button className="btn btn-primary" onClick={save}>Save</button></>}>
          <Field label="Category name"><input className="inp" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Smart Home" autoFocus /></Field>
        </Modal>
      )}
    </AdminShell>
  );
}

function AdminProducts() {
  const { toast, isMobile } = useShop();
  const [prods, setProds] = useState(G.products);
  const [edit, setEdit] = useState(null);
  const [del, setDel] = useState(null);

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
      {edit && <ProductFormModal p={edit} onClose={() => setEdit(null)} onSave={(np) => {
        if (np.id) setProds(ps => ps.map(x => x.id === np.id ? np : x)); else setProds(ps => [{ ...np, id: 'p' + Date.now() }, ...ps]);
        toast(np.id ? 'Product updated' : 'Product added', 'check-circle-2'); setEdit(null);
      }} />}
      {del && (
        <Modal title="Delete product?" onClose={() => setDel(null)}
          footer={<><button className="btn btn-ghost" onClick={() => setDel(null)}>Cancel</button><button className="btn btn-accent" style={{ background: 'var(--red)' }} onClick={() => { setProds(ps => ps.filter(x => x.id !== del.id)); toast('Product deleted', 'trash-2'); setDel(null); }}>Delete</button></>}>
          <p style={{ margin: 0, lineHeight: 1.6 }}>Are you sure you want to delete <b>{del.name}</b>? This action can't be undone.</p>
        </Modal>
      )}
    </AdminShell>
  );
}

function ProductFormModal({ p, onClose, onSave }) {
  const [f, setF] = useState({ id: p.id || null, name: p.name || '', cat: p.cat || 'smartphones', brand: p.brand || '', desc: p.desc || '', price: p.price || '', disc: p.disc || '', stock: p.stock || '', tint: p.tint || 'a', rating: p.rating || 4.5, reviews: p.reviews || 0, features: p.features || [] });
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
        <Field label="Product image" span2>
          <div style={{ border: '1.5px dashed var(--line-2)', borderRadius: 'var(--r)', padding: 22, textAlign: 'center', color: 'var(--muted)', cursor: 'pointer' }}>
            <Icon name="image-plus" size={26} style={{ color: 'var(--teal)' }} />
            <div style={{ fontSize: 13, marginTop: 8 }}>Drag an image here or <span className="tk" style={{ fontWeight: 700 }}>browse</span></div>
            <div style={{ fontSize: 11, marginTop: 3 }}>PNG or JPG, up to 5MB</div>
          </div>
        </Field>
      </div>
    </Modal>
  );
}

window.Screens = Object.assign(window.Screens || {}, { AdminLogin, AdminDashboard, AdminOrders, AdminCategories, AdminProducts });
