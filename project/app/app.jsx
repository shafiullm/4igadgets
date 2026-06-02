/* ============================================================
   4iGadgets — App shell: router, state, device toggle
   ============================================================ */
const S = window.Screens;

function genOrderId() { return 'ORD-' + (24818 + Math.floor(Math.random() * 80)); }

function App() {
  const [route, setRoute] = useState({ name: 'home', params: {} });
  const [cart, setCart] = useState([{ id: 'p7', qty: 1 }, { id: 'p15', qty: 2 }]);
  const [user, setUser] = useState(null);
  const [admin, setAdmin] = useState(false);
  const [view, setView] = useState('desktop'); // desktop | mobile
  const [adminCollapsed, setAdminCollapsed] = useState(false);
  const [hero, setHero] = useState('B');
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
  const scrollRef = useRef(null);

  const isMobile = view === 'mobile';

  // re-render lucide icons after every paint
  useEffect(() => { if (window.lucide) window.lucide.createIcons(); });

  // scroll to top on route change
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = 0; }, [route]);

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

  const login = (name) => { setUser({ name }); navigate('account'); toast('Welcome, ' + name.split(' ')[0] + '!', 'check-circle-2'); };
  const loginAdmin = () => { setAdmin(true); navigate('admin-dashboard'); };
  const logout = () => { setUser(null); setAdmin(false); };

  const placeOrder = (data) => {
    const order = {
      id: genOrderId(), date: '03 Jun 2026', customer: data.name, guest: !user, phone: data.phone,
      items: cart.map(c => [c.id, c.qty]), pay: data.pay,
      payStatus: data.pay === 'cod' ? 'pending' : 'paid', status: 'placed',
      txn: data.txn || '', total: data.total, address: data.address, area: data.area, district: data.district, division: data.division,
    };
    setLastOrder(order); setCart([]); navigate('confirmation');
  };

  const ctx = { route, navigate, cart, cartCount: cart.reduce((s, c) => s + c.qty, 0), addToCart, setQty, removeFromCart,
    user, login, logout, admin, loginAdmin, placeOrder, lastOrder, hero, isMobile, toast, banner, setBanner,
    adminCollapsed, setAdminCollapsed };

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
      <div className="presenter">
        <div className="presenter-bar">
          <div className="pb-brand">4i<b>Gadgets</b><span className="dot">.</span> <span style={{ fontWeight: 500, color: '#9fb4b8', fontSize: 12, marginLeft: 6 }}>Prototype</span></div>
          <div className="seg" style={{ marginLeft: 8 }}>
            <button className={!isAdmin ? 'on' : ''} onClick={() => navigate('home')}><Icon name="store" size={14} /> Storefront</button>
            <button className={isAdmin ? 'on' : ''} onClick={() => navigate(admin ? 'admin-dashboard' : 'admin-login')}><Icon name="shield" size={14} /> Admin</button>
          </div>
          <div className="pb-spacer" />
          {route.name === 'home' && !isMobile && (
            <div className="pb-note">
              <Icon name="palette" size={14} /> Hero:
              <div className="seg" style={{ background: 'rgba(255,255,255,.08)' }}>
                {['A', 'B', 'C'].map(h => <button key={h} className={hero === h ? 'on' : ''} onClick={() => setHero(h)}>{h}</button>)}
              </div>
            </div>
          )}
          <div className="seg">
            <button className={view === 'desktop' ? 'on' : ''} onClick={() => setView('desktop')}><Icon name="monitor" size={14} /> Desktop</button>
            <button className={view === 'mobile' ? 'on' : ''} onClick={() => setView('mobile')}><Icon name="smartphone" size={14} /> Mobile</button>
          </div>
        </div>
        <div className="stage">
          <div className={'viewport ' + view} key={view}>
            {isMobile && <div className="notch" />}
            <div className="scroll" ref={scrollRef}>
              <Guarded />
            </div>
            <div id="overlay-host" />
            <div className="toast-wrap">
              {toasts.map(t => <div className="toast" key={t.id}>{t.icon && <Icon name={t.icon} size={16} className="ic" />}{t.msg}</div>)}
            </div>
          </div>
        </div>
      </div>
    </Shop.Provider>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
