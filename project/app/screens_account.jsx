/* ============================================================
   4iGadgets — Auth + Account + Support
   ============================================================ */

function Login() {
  const { navigate, login, isMobile } = useShop();
  const [tab, setTab] = useState('phone');
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
            <Field label="Phone number"><input className="inp" placeholder="01XXX-XXXXXX" defaultValue="01712-345678" /></Field>
          ) : (
            <Field label="Email address"><input className="inp" placeholder="you@example.com" /></Field>
          )}
          <div style={{ height: 14 }} />
          <Field label="Password"><input className="inp" type="password" placeholder="••••••••" defaultValue="demo1234" /></Field>
          <div className="between" style={{ margin: '12px 0 20px' }}>
            <label className="check" style={{ fontSize: 12.5 }}><input type="checkbox" defaultChecked /> Remember me</label>
            <span className="linkish" style={{ fontSize: 12.5 }}>Forgot password?</span>
          </div>
          <button className="btn btn-primary btn-block btn-lg" onClick={() => login('Tahsin Rahman')}>Login <Icon name="arrow-right" size={17} /></button>
          <div className="divider-or">or</div>
          <button className="btn btn-ghost btn-block" onClick={() => login('Tahsin Rahman')}><Icon name="smartphone" size={16} /> Continue with OTP</button>
          <p className="auth-foot">New to 4iGadgets? <span className="linkish" onClick={() => navigate('register')}>Create an account</span></p>
        </div>
      </div>
    </CustomerShell>
  );
}

function Register() {
  const { navigate, login, isMobile } = useShop();
  return (
    <CustomerShell>
      <div className="auth-wrap">
        <div className="auth-card fade-in">
          {!isMobile && <div className="logo" style={{ justifyContent: 'center', marginBottom: 18 }}>4i<span className="g">Gadgets</span></div>}
          <h1>Create your account</h1>
          <p className="sub">Join 50,000+ shoppers across Bangladesh.</p>
          <Field label="Full name"><input className="inp" placeholder="Your name" /></Field>
          <div style={{ height: 14 }} />
          <Field label="Phone number" hint="We'll send a one-time code to verify"><input className="inp" placeholder="01XXX-XXXXXX" /></Field>
          <div style={{ height: 14 }} />
          <Field label="Email (optional)"><input className="inp" placeholder="you@example.com" /></Field>
          <div style={{ height: 14 }} />
          <Field label="Password" hint="At least 8 characters"><input className="inp" type="password" placeholder="Create a password" /></Field>
          <label className="check" style={{ fontSize: 12.5, margin: '14px 0 18px' }}><input type="checkbox" defaultChecked /> I agree to the Terms & Privacy Policy</label>
          <button className="btn btn-primary btn-block btn-lg" onClick={() => login('New Customer')}>Create account</button>
          <p className="auth-foot">Already have an account? <span className="linkish" onClick={() => navigate('login')}>Login</span></p>
        </div>
      </div>
    </CustomerShell>
  );
}

// ---------- Account / order history ----------
function OrderRow({ o, onOpen }) {
  const lines = o.items.map(([id, qty]) => ({ p: G.byId(id), qty }));
  const total = lines.reduce((s, l) => s + G.priceOf(l.p) * l.qty, 0);
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
  const { navigate, user, logout, isMobile } = useShop();
  const [open, setOpen] = useState(null);
  useEffect(() => { if (!user) navigate('login'); }, []);
  if (!user) return null;
  const nav = [['orders', 'package', 'My Orders'], ['profile', 'user', 'Profile'], ['address', 'map-pin', 'Addresses'], ['support', 'headset', 'Support']];
  const [tab, setTab] = useState('orders');

  return (
    <CustomerShell>
      <Crumb items={[{ label: 'Home', to: 'home' }, { label: 'My Account' }]} />
      <div className="wrap section" style={{ paddingTop: 8 }}>
        <div className="row gap-12" style={{ marginBottom: 20 }}>
          <div className="admin-avatar" style={{ width: 52, height: 52, fontSize: 19 }}>{user.name[0]}</div>
          <div><div style={{ fontWeight: 800, fontSize: 19 }}>{user.name}</div><div className="muted" style={{ fontSize: 13 }}>01712-345678 · Member since 2024</div></div>
        </div>
        <div className="acct-layout">
          <aside className="acct-nav">
            {nav.map(([k, ic, label]) => <a key={k} className={tab === k ? 'on' : ''} onClick={() => k === 'support' ? navigate('support') : setTab(k)}><Icon name={ic} size={17} /> {label}</a>)}
            <a onClick={() => { logout(); navigate('home'); }} style={{ color: 'var(--red)' }}><Icon name="log-out" size={17} /> Logout</a>
          </aside>
          <div>
            {tab === 'orders' && (
              <>
                <div className="sec-head" style={{ marginBottom: 14 }}><div><h2 style={{ fontSize: 21 }}>My Orders</h2><p>{G.myOrders.length} orders</p></div></div>
                {G.myOrders.map(o => <OrderRow key={o.id} o={o} onOpen={setOpen} />)}
              </>
            )}
            {tab === 'profile' && (
              <div className="card card-pad">
                <h2 style={{ fontSize: 19, marginTop: 0 }}>Profile</h2>
                <div className="form-grid">
                  <Field label="Full name"><input className="inp" defaultValue={user.name} /></Field>
                  <Field label="Phone"><input className="inp" defaultValue="01712-345678" /></Field>
                  <Field label="Email" span2><input className="inp" defaultValue="tahsin@example.com" /></Field>
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
  const lines = o.items.map(([id, qty]) => ({ p: G.byId(id), qty }));
  const total = lines.reduce((s, l) => s + G.priceOf(l.p) * l.qty, 0);
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
  const { user, navigate, isMobile } = useShop();
  const [msgs, setMsgs] = useState([
    { who: 'them', t: 'Assalamu alaikum! 👋 This is the 4iGadgets support team. How can we help you today?', time: '10:02 AM' },
    { who: 'me', t: 'Hi, when will my order ORD-24817 be delivered?', time: '10:03 AM' },
    { who: 'them', t: 'Let me check… your order is out for delivery and should arrive by 6 PM today. The rider will call you on 01712-345678. 🚚', time: '10:04 AM' },
  ]);
  const [val, setVal] = useState('');
  const bodyRef = useRef(null);
  const send = () => {
    if (!val.trim()) return;
    setMsgs(m => [...m, { who: 'me', t: val, time: 'now' }]);
    setVal('');
    setTimeout(() => setMsgs(m => [...m, { who: 'them', t: "Thanks for your message! Our team will reply within a few minutes. For urgent help, call 16xxx. 🙏", time: 'now' }]), 800);
  };
  useEffect(() => { if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight; }, [msgs]);

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

window.Screens = Object.assign(window.Screens || {}, { Login, Register, Account, Support });
