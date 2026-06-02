/* ============================================================
   4iGadgets — Mock data (global window.G)
   ============================================================ */
(function () {
  const taka = (n) => '৳' + Number(n).toLocaleString('en-IN');

  const categories = [
    { id: 'smartphones', name: 'Smartphones', icon: 'smartphone', count: 42, group: 'tech' },
    { id: 'laptops', name: 'Laptops', icon: 'laptop', count: 28, group: 'tech' },
    { id: 'headphones', name: 'Audio', icon: 'headphones', count: 36, group: 'tech' },
    { id: 'smartwatches', name: 'Wearables', icon: 'watch', count: 19, group: 'tech' },
    { id: 'mens', name: "Men's Fashion", icon: 'shirt', count: 88, group: 'fashion' },
    { id: 'womens', name: "Women's Fashion", icon: 'shopping-bag', count: 96, group: 'fashion' },
    { id: 'shoes', name: 'Shoes', icon: 'footprints', count: 54, group: 'fashion' },
    { id: 'appliances', name: 'Appliances', icon: 'washing-machine', count: 33, group: 'home' },
    { id: 'home', name: 'Home & Living', icon: 'sofa', count: 71, group: 'home' },
    { id: 'beauty', name: 'Beauty', icon: 'sparkles', count: 47, group: 'home' },
    { id: 'accessories', name: 'Accessories', icon: 'cable', count: 64, group: 'tech' },
    { id: 'gaming', name: 'Gaming', icon: 'gamepad-2', count: 31, group: 'tech' },
  ];

  const descFor = {
    tech: (n) => `The ${n} blends premium build quality with everyday reliability. Backed by official warranty and tested before delivery, it's a dependable pick trusted by thousands of customers across Bangladesh.`,
    fashion: (n) => `Look and feel your best with the ${n}. Made from comfortable, breathable fabric with a true-to-size fit and finishing built to last wash after wash. Easy exchange if the size isn't right.`,
    shoes: (n) => `Step out in confidence with the ${n}. Cushioned for all-day comfort with a durable, non-slip sole that is equally at home on the street or on the go. Easy size exchange available.`,
    home: (n) => `Bring comfort and quality home with the ${n}. Thoughtfully made from premium materials that are easy to clean and built to last. A reliable everyday essential for any Bangladeshi home.`,
    beauty: (n) => `Care for yourself with the ${n}. 100% authentic, dermatologically tested and gentle on skin. Sealed and genuine, exactly what your routine deserves.`,
  };
  const featFor = {
    tech: ['1 year official warranty', 'Genuine, brand-new sealed unit', '7-day easy replacement', 'Free delivery inside Dhaka'],
    fashion: ['Premium, comfortable fabric', 'True-to-size fit', '7-day easy size exchange', 'Cash on delivery available'],
    shoes: ['Cushioned all-day comfort', 'Durable non-slip sole', '7-day easy size exchange', 'Free delivery inside Dhaka'],
    home: ['1–5 year brand warranty', 'Free home delivery & setup', 'Energy-efficient & durable', 'EMI available on appliances'],
    beauty: ['100% authentic & sealed', 'Dermatologically tested', 'Gentle, everyday formula', 'Cash on delivery available'],
  };
  const groupOf = (catId) => (categories.find(c => c.id === catId) || {}).group || 'tech';
  const styleGroup = (catId) => {
    if (['mens', 'womens'].includes(catId)) return 'fashion';
    if (catId === 'shoes') return 'shoes';
    if (catId === 'beauty') return 'beauty';
    if (['appliances', 'home'].includes(catId)) return 'home';
    return 'tech';
  };

  const P = (id, name, cat, price, disc, rating, reviews, stock, brand, tint) => {
    const g = styleGroup(cat);
    return {
      id, name, cat, price, disc, rating, reviews, stock, brand, tint,
      desc: descFor[g](name), features: featFor[g === 'shoes' ? 'shoes' : g],
    };
  };

  const products = [
    // ---- Tech ----
    P('p1', 'Aurora X12 Smartphone (8/256GB)', 'smartphones', 42990, 37990, 4.7, 312, 14, 'Aurora', 'b'),
    P('p2', 'Nimbus Note 5 Pro (12/512GB)', 'smartphones', 58500, 52900, 4.8, 188, 9, 'Nimbus', 'b'),
    P('p3', 'Aurora Lite A3 (6/128GB)', 'smartphones', 18990, 16490, 4.4, 540, 31, 'Aurora', 'b'),
    P('p4', 'Stratos UltraBook 14 (i7/16GB)', 'laptops', 112000, 99900, 4.9, 76, 6, 'Stratos', 'a'),
    P('p5', 'Stratos Air 13 (Ryzen 5)', 'laptops', 74500, 68900, 4.6, 142, 11, 'Stratos', 'a'),
    P('p7', 'EchoBuds Pro 2 ANC', 'headphones', 8900, 6490, 4.6, 760, 52, 'Echo', 'a'),
    P('p8', 'Sonus Over-Ear Studio', 'headphones', 14500, 11900, 4.7, 233, 18, 'Sonus', 'a'),
    P('p10', 'Pulse Watch S2 (AMOLED)', 'smartwatches', 12900, 9990, 4.5, 410, 22, 'Pulse', 'b'),
    P('p11', 'Pulse Watch Active', 'smartwatches', 5990, 4490, 4.2, 690, 40, 'Pulse', 'b'),
    P('p14', '65W GaN Charger (3-Port)', 'accessories', 2890, 2190, 4.8, 540, 75, 'VoltCore', 'a'),
    P('p15', 'Braided USB-C Cable 2m', 'accessories', 690, 490, 4.5, 2100, 300, 'VoltCore', 'a'),
    P('p18', 'Raptor Wireless Gamepad', 'gaming', 4290, 3490, 4.6, 470, 36, 'Raptor', 'a'),
    P('p19', 'Raptor RGB Mechanical Keyboard', 'gaming', 6900, 5490, 4.7, 290, 21, 'Raptor', 'a'),
    P('p12', 'VoltCore 20000mAh Power Bank', 'accessories', 3490, 2790, 4.7, 880, 64, 'VoltCore', 'b'),

    // ---- Men's Fashion ----
    P('p25', 'Classic Oxford Shirt', 'mens', 1890, 1490, 4.6, 320, 60, 'Deshi Thread', 'a'),
    P('p26', 'Slim-Fit Chino Pants', 'mens', 2290, 1790, 4.5, 210, 48, 'Deshi Thread', 'b'),
    P('p27', 'Cotton Polo T-Shirt', 'mens', 990, 790, 4.4, 540, 120, 'Urban BD', 'a'),
    P('p28', 'Washed Denim Jacket', 'mens', 3490, 2790, 4.7, 132, 22, 'Urban BD', 'b'),
    P('p48', 'Premium Panjabi (Eid Edition)', 'mens', 2990, 2290, 4.8, 410, 35, 'Aarshi', 'a'),

    // ---- Women's Fashion ----
    P('p29', 'Floral Summer Dress', 'womens', 2490, 1990, 4.7, 288, 40, 'Aarshi', 'a'),
    P('p30', 'Embroidered Cotton Kurti', 'womens', 1690, 1290, 4.6, 612, 75, 'Aarshi', 'b'),
    P('p31', 'Handloom Cotton Saree', 'womens', 3990, 3290, 4.8, 196, 18, 'Tant Bazaar', 'a'),
    P('p32', 'Soft Knit Cardigan', 'womens', 2190, 1690, 4.4, 154, 33, 'Urban BD', 'b'),
    P('p49', 'Three-Piece Salwar Set', 'womens', 3290, 2590, 4.7, 240, 28, 'Aarshi', 'a'),

    // ---- Shoes ----
    P('p33', 'AirStride Running Sneakers', 'shoes', 3490, 2790, 4.6, 470, 44, 'StepUp', 'b'),
    P('p34', 'Genuine Leather Loafers', 'shoes', 4290, 3490, 4.7, 188, 20, 'StepUp', 'a'),
    P('p35', 'Casual Canvas Shoes', 'shoes', 1690, 1290, 4.3, 540, 90, 'Urban BD', 'a'),
    P('p36', 'Comfort Sport Sandals', 'shoes', 1290, 990, 4.5, 720, 130, 'StepUp', 'b'),

    // ---- Appliances ----
    P('p37', '1.5 Ton Inverter AC', 'appliances', 64900, 58900, 4.6, 96, 8, 'Komfort', 'b'),
    P('p38', 'Front-Load Washing Machine 8kg', 'appliances', 48900, 43900, 4.7, 142, 11, 'Komfort', 'a'),
    P('p39', 'Digital Microwave Oven 25L', 'appliances', 14900, 12900, 4.5, 233, 26, 'Komfort', 'b'),
    P('p40', 'Double-Door Refrigerator 320L', 'appliances', 52900, 47900, 4.6, 188, 9, 'Komfort', 'a'),

    // ---- Home & Living ----
    P('p41', 'Non-Stick Cookware Set (5pc)', 'home', 3490, 2690, 4.6, 410, 60, 'HomePro', 'a'),
    P('p42', 'Memory Foam Pillow (2pc)', 'home', 1890, 1390, 4.5, 880, 100, 'HomePro', 'b'),
    P('p43', 'LED Desk Lamp (Dimmable)', 'home', 1290, 890, 4.4, 320, 80, 'HomePro', 'a'),
    P('p44', 'Ceramic Dinner Set (24pc)', 'home', 4290, 3490, 4.7, 156, 24, 'HomePro', 'b'),

    // ---- Beauty ----
    P('p45', 'Vitamin C Face Serum', 'beauty', 1290, 990, 4.6, 540, 75, 'Glow', 'a'),
    P('p46', 'Ionic Hair Dryer 2000W', 'beauty', 2490, 1890, 4.5, 288, 40, 'Glow', 'b'),
    P('p47', 'Skincare Gift Set', 'beauty', 2990, 2290, 4.7, 196, 30, 'Glow', 'a'),
  ];

  const featuredIds = ['p29', 'p4', 'p33', 'p1', 'p37', 'p8', 'p30', 'p41'];
  const dealIds = ['p25', 'p33', 'p37', 'p10', 'p29', 'p7', 'p46', 'p44'];

  const divisions = {
    Dhaka: ['Dhaka', 'Gazipur', 'Narayanganj', 'Tangail', 'Manikganj', 'Munshiganj'],
    Chattogram: ['Chattogram', "Cox's Bazar", 'Cumilla', 'Feni', 'Noakhali'],
    Sylhet: ['Sylhet', 'Moulvibazar', 'Habiganj', 'Sunamganj'],
    Rajshahi: ['Rajshahi', 'Bogura', 'Pabna', 'Natore', 'Sirajganj'],
    Khulna: ['Khulna', 'Jashore', 'Kushtia', 'Satkhira'],
    Barishal: ['Barishal', 'Bhola', 'Patuakhali', 'Pirojpur'],
    Rangpur: ['Rangpur', 'Dinajpur', 'Kurigram', 'Gaibandha'],
    Mymensingh: ['Mymensingh', 'Jamalpur', 'Netrokona', 'Sherpur'],
  };

  const orders = [
    { id: 'ORD-24817', date: '02 Jun 2026', customer: 'Tahsin Rahman', guest: false, phone: '01712-345678',
      items: [['p7', 2], ['p15', 1]], pay: 'bkash', payStatus: 'paid', status: 'delivered', txn: 'BKH7X29QLM' },
    { id: 'ORD-24816', date: '02 Jun 2026', customer: 'Guest', guest: true, phone: '01819-220011',
      items: [['p29', 1], ['p33', 1]], pay: 'cod', payStatus: 'pending', status: 'shipped', txn: '' },
    { id: 'ORD-24815', date: '01 Jun 2026', customer: 'Nusrat Jahan', guest: false, phone: '01911-556677',
      items: [['p30', 2], ['p45', 1]], pay: 'nagad', payStatus: 'paid', status: 'packed', txn: 'NGD55K1822' },
    { id: 'ORD-24814', date: '01 Jun 2026', customer: 'Imran Hossain', guest: false, phone: '01533-998877',
      items: [['p37', 1]], pay: 'bkash', payStatus: 'pending', status: 'confirmed', txn: '' },
    { id: 'ORD-24813', date: '31 May 2026', customer: 'Guest', guest: true, phone: '01677-112233',
      items: [['p27', 3]], pay: 'cod', payStatus: 'unpaid', status: 'cancelled', txn: '' },
    { id: 'ORD-24812', date: '31 May 2026', customer: 'Sadia Akter', guest: false, phone: '01744-665544',
      items: [['p41', 1], ['p44', 1]], pay: 'bkash', payStatus: 'paid', status: 'delivered', txn: 'BKH2M88PQ1' },
    { id: 'ORD-24811', date: '30 May 2026', customer: 'Rifat Chowdhury', guest: false, phone: '01855-443322',
      items: [['p18', 1], ['p34', 1]], pay: 'nagad', payStatus: 'paid', status: 'shipped', txn: 'NGD90Z2210' },
    { id: 'ORD-24810', date: '30 May 2026', customer: 'Guest', guest: true, phone: '01966-778899',
      items: [['p1', 1]], pay: 'cod', payStatus: 'pending', status: 'placed', txn: '' },
  ];

  const myOrders = [
    orders[0],
    { id: 'ORD-24790', date: '24 May 2026', customer: 'Tahsin Rahman', guest: false, phone: '01712-345678',
      items: [['p48', 1]], pay: 'bkash', payStatus: 'paid', status: 'delivered', txn: 'BKH1A55RT9' },
    { id: 'ORD-24755', date: '12 May 2026', customer: 'Tahsin Rahman', guest: false, phone: '01712-345678',
      items: [['p3', 1], ['p36', 1]], pay: 'cod', payStatus: 'paid', status: 'delivered', txn: '' },
    { id: 'ORD-24812b', date: '02 Jun 2026', customer: 'Tahsin Rahman', guest: false, phone: '01712-345678',
      items: [['p8', 1]], pay: 'nagad', payStatus: 'pending', status: 'packed', txn: 'NGD41X9920' },
  ];

  const statusMeta = {
    placed: { label: 'Placed', cls: 'b-grey' },
    confirmed: { label: 'Confirmed', cls: 'b-teal' },
    packed: { label: 'Packed', cls: 'b-teal' },
    shipped: { label: 'Shipped', cls: 'b-amber' },
    delivered: { label: 'Delivered', cls: 'b-green' },
    cancelled: { label: 'Cancelled', cls: 'b-red' },
  };
  const payMeta = {
    paid: { label: 'Paid', cls: 'b-green' },
    pending: { label: 'Pending', cls: 'b-amber' },
    unpaid: { label: 'Unpaid', cls: 'b-red' },
  };
  const payMethod = {
    bkash: { label: 'bKash', short: 'bKash', cls: 'bkash' },
    nagad: { label: 'Nagad', short: 'Nagad', cls: 'nagad' },
    cod: { label: 'Cash on Delivery', short: 'COD', cls: 'cod' },
  };

  const adminCats = categories.map(c => ({ ...c, products: c.count, active: true }));

  window.G = {
    taka, categories, products, divisions, orders, myOrders, featuredIds, dealIds,
    statusMeta, payMeta, payMethod, adminCats,
    byId: (id) => products.find(p => p.id === id),
    priceOf: (p) => (p.disc && p.disc > 0 ? p.disc : p.price),
    catName: (id) => (categories.find(c => c.id === id) || {}).name || id,
    statusOrder: ['placed', 'confirmed', 'packed', 'shipped', 'delivered', 'cancelled'],
  };
})();
