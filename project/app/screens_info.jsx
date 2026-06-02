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

window.Screens = Object.assign(window.Screens || {}, { DeliveryInfo, RefundPolicy });
