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
  const lines = o.items.map(([id, qty]) => ({ p: G.byId(id), qty }));

  return (
    <CustomerShell>
      <div className="wrap section">
        <div className="confirm">
          <div className="check-circle"><Icon name="check" /></div>
          <h1>Order placed, ধন্যবাদ! 🎉</h1>
          <p className="muted" style={{ fontSize: 15, maxWidth: 460, margin: '0 auto 6px', lineHeight: 1.55 }}>
            Thank you, {o.name.split(' ')[0]}! Your order is confirmed. We'll call <b>{o.phone}</b> shortly to confirm delivery.
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
                <b>{o.name}</b> · {o.phone}<br />{o.address}, {o.area}<br />{o.district}, {o.division}
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

window.Screens = Object.assign(window.Screens || {}, { Cart, Checkout, Confirmation });
