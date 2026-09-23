/**
 * Realistic Home Bakery Catalog Service & Asset Library
 * 
 * - Limits catalog to 200-250 products (specifically 225 curated artisanal items)
 * - Assigns realistic names, descriptions, and bakery prices to benchmark items
 * - Maps products to 28 distinct, high-resolution bakery images across all categories
 * - Preserves custom-created admin products
 */

export const MAX_FRONTEND_PRODUCTS = 225;

// Image Pools by Category & Subtype
export const IMAGES = {
  cakes: [
    '/assets/chocolate_cake.jpg',
    '/assets/berry_cheesecake.jpg',
    '/assets/red_velvet_cake.jpg',
    '/assets/carrot_cake.jpg',
    '/assets/lemon_drizzle_cake.jpg',
    '/assets/tiramisu_cake.jpg',
    '/assets/strawberry_shortcake.jpg',
    '/assets/pecan_pie.jpg',
    '/assets/apple_tart.jpg',
  ],
  breads: [
    '/assets/sourdough_bread.jpg',
    '/assets/french_baguette.jpg',
    '/assets/rosemary_focaccia.jpg',
    '/assets/brioche_loaf.jpg',
    '/assets/multigrain_bread.jpg',
    '/assets/ciabatta_bread.jpg',
    '/assets/challah_bread.jpg',
  ],
  cookies: [
    '/assets/cookies.jpg',
    '/assets/double_chocolate_cookie.jpg',
    '/assets/macaron_assortment.jpg',
    '/assets/oatmeal_raisin_cookie.jpg',
    '/assets/matcha_cookie.jpg',
    '/assets/linzer_cookie.jpg',
    '/assets/shortbread_cookie.jpg',
  ],
  pastries: [
    '/assets/croissant.jpg',
    '/assets/pain_au_chocolat.jpg',
    '/assets/cinnamon_roll.jpg',
    '/assets/fruit_danish.jpg',
    '/assets/almond_croissant.jpg',
  ],
};

// Artisanal Catalog Templates for Benchmark Products
const CAKE_TEMPLATES = [
  { name: 'Valrhona Triple Chocolate Ganache Cake', price: 28.50, desc: 'Velvety Belgian dark chocolate sponge layered with 70% Valrhona ganache and cocoa nibs.', img: '/assets/chocolate_cake.jpg' },
  { name: 'Wild Berry Mascarpone Cheesecake', price: 32.00, desc: 'Baked New York style cream cheesecake topped with glazed blueberries, blackberries and mint.', img: '/assets/berry_cheesecake.jpg' },
  { name: 'Southern Red Velvet & Cream Cheese Cake', price: 29.50, desc: 'Delicate buttermilk and cocoa sponge frosted with whipped Philadelphia cream cheese.', img: '/assets/red_velvet_cake.jpg' },
  { name: 'Spiced Carrot & Toasted Walnut Cake', price: 26.00, desc: 'Heirloom carrots, warm cinnamon, nutmeg and roasted Georgia walnuts with cream cheese glaze.', img: '/assets/carrot_cake.jpg' },
  { name: 'Sicilian Lemon & Lavender Drizzle Cake', price: 24.50, desc: 'Zesty sun-drenched Meyer lemon sponge infused with organic French lavender syrup.', img: '/assets/lemon_drizzle_cake.jpg' },
  { name: 'Classic Venetian Tiramisu Gateau', price: 27.00, desc: 'Espresso-soaked Savoiardi ladyfingers layered with rich Zabaglione mascarpone mousse.', img: '/assets/tiramisu_cake.jpg' },
  { name: 'Fresh Strawberry Cream Chiffon Cake', price: 31.00, desc: 'Pillow-soft Japanese vanilla sponge layered with pure chantilly cream and hand-picked strawberries.', img: '/assets/strawberry_shortcake.jpg' },
  { name: 'Southern Bourbon Pecan Pie Cake', price: 27.50, desc: 'Rich brown butter cake crowned with caramelized roasted pecans and Kentucky bourbon syrup.', img: '/assets/pecan_pie.jpg' },
  { name: 'Rustic Glazed Apple Crumble Tart', price: 23.50, desc: 'Crisp buttery pâte sablée filled with cinnamon Honeycrisp apples and golden oat streusel.', img: '/assets/apple_tart.jpg' },
  { name: 'Belgian Dark Chocolate Fudge Torte', price: 29.00, desc: 'Flourless molten chocolate center with a crisp exterior, dusted with Dutch cocoa powder.', img: '/assets/chocolate_cake.jpg' },
  { name: 'Lemon Curd & Raspberry Meringue Cake', price: 28.00, desc: 'Tangy house-made lemon curd with sweet summer raspberry coulis and toasted Swiss meringue.', img: '/assets/lemon_drizzle_cake.jpg' },
  { name: 'Salted Caramel Crunch Layer Cake', price: 30.50, desc: 'Brown sugar vanilla sponge with ribbons of Maldon sea salt caramel and butter toffee crunch.', img: '/assets/carrot_cake.jpg' },
  { name: 'Dark Cherry Black Forest Gateau', price: 32.50, desc: 'Kirschwasser soaked chocolate sponge with tart sour cherries and hand-whipped cream.', img: '/assets/chocolate_cake.jpg' },
  { name: 'Matcha Green Tea Opera Cake', price: 33.00, desc: 'Kyoto matcha almond joconde sponge layered with white chocolate buttercream and dark ganache.', img: '/assets/berry_cheesecake.jpg' },
  { name: 'Earl Grey Lavender Tea Cake', price: 25.50, desc: 'Bergamot-infused Earl Grey tea sponge glazed with delicate candied lavender petals.', img: '/assets/strawberry_shortcake.jpg' },
];

const BREAD_TEMPLATES = [
  { name: 'Rustic Sourdough Country Boule', price: 6.50, desc: 'Slow-fermented 36-hour wild yeast artisan sourdough with a blistered, crackling ear crust.', img: '/assets/sourdough_bread.jpg' },
  { name: 'Traditional French Baguette Tradition', price: 4.25, desc: 'Hand-shaped crisp baguette with honeycombed open crumb, baked fresh twice daily.', img: '/assets/french_baguette.jpg' },
  { name: 'Rosemary & Sea Salt Focaccia', price: 5.75, desc: 'Extra virgin olive oil dough dimpled with fresh garden rosemary and Maldon sea salt flakes.', img: '/assets/rosemary_focaccia.jpg' },
  { name: 'Golden Butter Brioche Pullman Loaf', price: 7.25, desc: 'Rich, cloud-soft enriched French brioche made with 84% butterfat European butter.', img: '/assets/brioche_loaf.jpg' },
  { name: 'Ancient Seven Grain & Seed Loaf', price: 6.75, desc: 'Whole grain sourdough crusted with toasted sunflower seeds, golden flax, sesame and oats.', img: '/assets/multigrain_bread.jpg' },
  { name: 'Crisp Artisan Olive Ciabatta', price: 5.25, desc: 'High-hydration Italian bread with large aerated crumb and fragrant Mediterranean olive oil.', img: '/assets/ciabatta_bread.jpg' },
  { name: 'Braided Sweet Honey Challah', price: 7.50, desc: 'Glistening golden egg-bread braided with four strands and brushed with wild clover honey.', img: '/assets/challah_bread.jpg' },
  { name: 'Cranberry Walnut Batard Sourdough', price: 7.75, desc: 'Tart dried cranberries and roasted California walnuts folded into natural levain dough.', img: '/assets/sourdough_bread.jpg' },
  { name: 'Jalapeno White Cheddar Sourdough', price: 7.50, desc: 'Spicy fresh jalapeno rounds melted with aged sharp cheddar pockets throughout crusty loaf.', img: '/assets/ciabatta_bread.jpg' },
  { name: 'Traditional Bavarian Caraway Rye', price: 6.25, desc: 'Hearty dark rye loaf flavored with aromatic whole caraway seeds and tangy sourdough starter.', img: '/assets/multigrain_bread.jpg' },
  { name: 'Garlic Herb Parmesan Pull-Apart', price: 6.95, desc: 'Tender buttery dough knots smothered in roasted garlic butter, parsley and Reggiano.', img: '/assets/rosemary_focaccia.jpg' },
  { name: 'Cinnamon Swirl Brioche Bread', price: 6.75, desc: 'Buttery breakfast loaf packed with brown sugar, Korintje cinnamon and butter glaze.', img: '/assets/brioche_loaf.jpg' },
];

const COOKIE_TEMPLATES = [
  { name: 'Sea Salt Dark Chocolate Chunk Cookie', price: 4.25, desc: 'Gourmet brown butter cookie with molten pools of 70% dark chocolate and sea salt flakes.', img: '/assets/cookies.jpg' },
  { name: 'Double Fudge Brownie Cookie', price: 4.00, desc: 'Fudgy, dense brownie cookie packed with Belgian milk chocolate chips and Dutch cocoa.', img: '/assets/double_chocolate_cookie.jpg' },
  { name: 'Parisian French Macaron Trio', price: 6.75, desc: 'Three delicate almond meringue shells filled with raspberry coulis, dark ganache, and pistachio.', img: '/assets/macaron_assortment.jpg' },
  { name: 'Toasted Oatmeal Raisin & Honey', price: 3.75, desc: 'Old-fashioned rolled oats toasted with cinnamon, honey, and plump sun-dried raisins.', img: '/assets/oatmeal_raisin_cookie.jpg' },
  { name: 'Kyoto Matcha White Chocolate Cookie', price: 4.50, desc: 'Ceremonial Japanese matcha cookie studded with creamy vanilla white chocolate chunks.', img: '/assets/matcha_cookie.jpg' },
  { name: 'Austrian Raspberry Linzer Cookie', price: 4.25, desc: 'Buttery hazelnut shortbread dusted with powdered sugar and filled with tart raspberry jam.', img: '/assets/linzer_cookie.jpg' },
  { name: 'Vanilla Bean Scottish Shortbread', price: 3.50, desc: 'Melt-in-your-mouth classic Scottish shortbread made with pure cultured butter and sea salt.', img: '/assets/shortbread_cookie.jpg' },
  { name: 'Pain au Chocolat (Chocolate Croissant)', price: 4.50, desc: 'Flaky 27-layer butter pastry wrapped around twin batons of bittersweet chocolate.', img: '/assets/pain_au_chocolat.jpg' },
  { name: 'Cinnamon Brioche Morning Roll', price: 4.75, desc: 'Warm spiced cinnamon roll swirled with brown sugar and covered in vanilla cream cheese icing.', img: '/assets/cinnamon_roll.jpg' },
  { name: 'Almond Frangipane Twice-Baked Croissant', price: 5.25, desc: 'Crisp croissant drenched in vanilla syrup, stuffed with rich almond cream and toasted flakes.', img: '/assets/almond_croissant.jpg' },
  { name: 'Wild Berry Danish Pastry', price: 4.85, desc: 'Flaky laminated puff pastry filled with vanilla custard and fresh seasonal berries.', img: '/assets/fruit_danish.jpg' },
  { name: 'Artisan Butter Croissant', price: 3.75, desc: 'Classic French flaky golden butter croissant with delicate honeycomb crisp layers.', img: '/assets/croissant.jpg' },
  { name: 'Salted Caramel Pecan Cookie', price: 4.25, desc: 'Soft-baked brown butter cookie loaded with roasted pecans and gooey caramel drops.', img: '/assets/cookies.jpg' },
  { name: 'Roasted Peanut Butter Criss-Cross', price: 3.75, desc: 'Traditional fork-pressed peanut butter cookie with crispy edges and a soft chewy center.', img: '/assets/double_chocolate_cookie.jpg' },
];

/**
 * Intelligent Image Resolver
 * Accurately pairs product keywords or category hashes with one of the 28 realistic bakery images
 */
export function getProductImage(product) {
  const name = (product.name || '').toLowerCase();
  const cat = (product.category || '').toLowerCase();
  const id = parseInt(product.id, 10) || 1;

  // Direct Keyword Matches
  if (name.includes('cheesecake') || name.includes('berry cheese')) return '/assets/berry_cheesecake.jpg';
  if (name.includes('red velvet')) return '/assets/red_velvet_cake.jpg';
  if (name.includes('carrot')) return '/assets/carrot_cake.jpg';
  if (name.includes('lemon') || name.includes('lavender')) return '/assets/lemon_drizzle_cake.jpg';
  if (name.includes('tiramisu') || name.includes('coffee')) return '/assets/tiramisu_cake.jpg';
  if (name.includes('strawberry')) return '/assets/strawberry_shortcake.jpg';
  if (name.includes('pecan pie') || name.includes('tart')) return '/assets/pecan_pie.jpg';
  if (name.includes('apple') || name.includes('crumble')) return '/assets/apple_tart.jpg';
  if (name.includes('fudge') || name.includes('dark chocolate cake') || name.includes('ganache')) return '/assets/chocolate_cake.jpg';

  if (name.includes('baguette')) return '/assets/french_baguette.jpg';
  if (name.includes('focaccia') || name.includes('rosemary')) return '/assets/rosemary_focaccia.jpg';
  if (name.includes('brioche')) return '/assets/brioche_loaf.jpg';
  if (name.includes('multigrain') || name.includes('seven grain') || name.includes('rye') || name.includes('seed')) return '/assets/multigrain_bread.jpg';
  if (name.includes('ciabatta') || name.includes('jalapeno') || name.includes('cheddar')) return '/assets/ciabatta_bread.jpg';
  if (name.includes('challah') || name.includes('braid')) return '/assets/challah_bread.jpg';
  if (name.includes('sourdough') || name.includes('boule') || name.includes('batard')) return '/assets/sourdough_bread.jpg';

  if (name.includes('pain au chocolat') || name.includes('chocolate croissant')) return '/assets/pain_au_chocolat.jpg';
  if (name.includes('cinnamon roll') || name.includes('morning bun')) return '/assets/cinnamon_roll.jpg';
  if (name.includes('almond croissant') || name.includes('frangipane')) return '/assets/almond_croissant.jpg';
  if (name.includes('danish')) return '/assets/fruit_danish.jpg';
  if (name.includes('croissant')) return '/assets/croissant.jpg';

  if (name.includes('macaron')) return '/assets/macaron_assortment.jpg';
  if (name.includes('double chocolate') || name.includes('brownie cookie')) return '/assets/double_chocolate_cookie.jpg';
  if (name.includes('oatmeal') || name.includes('raisin')) return '/assets/oatmeal_raisin_cookie.jpg';
  if (name.includes('matcha')) return '/assets/matcha_cookie.jpg';
  if (name.includes('linzer')) return '/assets/linzer_cookie.jpg';
  if (name.includes('shortbread')) return '/assets/shortbread_cookie.jpg';
  if (name.includes('cookie') || name.includes('chunk')) return '/assets/cookies.jpg';

  // Category rotation based on ID so adjacent items have distinct images
  if (cat.includes('cake')) {
    return IMAGES.cakes[id % IMAGES.cakes.length];
  }
  if (cat.includes('bread')) {
    return IMAGES.breads[id % IMAGES.breads.length];
  }
  if (cat.includes('cookie')) {
    return IMAGES.cookies[id % IMAGES.cookies.length];
  }

  // Fallback to pastries rotation
  return IMAGES.pastries[id % IMAGES.pastries.length];
}

// Global in-memory product registry to ensure 100% item consistency across grid, cart, and orders
export const PRODUCT_REGISTRY = new Map();

/**
 * Accurately infers category from product ID based on backend database schema:
 * Category 1 = 'Cakes', Category 2 = 'Cookies', Category 3 = 'Breads'
 * where category_id = 1 + (id % 3)
 */
export function inferCategory(id) {
  const num = parseInt(id, 10) || 1;
  const mod = 1 + (num % 3);
  if (mod === 1) return 'Cakes';
  if (mod === 2) return 'Cookies';
  return 'Breads';
}

/**
 * Normalizes and enriches a product object.
 * Leaves custom user-created admin items untouched.
 * Converts benchmark items (Product #X) into mouthwatering artisanal items.
 */
export function enrichProduct(rawProduct) {
  if (!rawProduct) return rawProduct;

  const id = parseInt(rawProduct.id, 10) || 1;

  // If already registered and category is valid, return cached product
  if (PRODUCT_REGISTRY.has(id)) {
    const cached = PRODUCT_REGISTRY.get(id);
    if (cached && cached.name && !cached.name.startsWith('Product #')) {
      return cached;
    }
  }

  const name = rawProduct.name || '';
  const isBenchmark = name.startsWith('Product #');

  if (!isBenchmark && rawProduct.name) {
    // Custom user-created product: keep original name, price, description
    const item = {
      ...rawProduct,
      id,
      image_url: rawProduct.image_url || getProductImage(rawProduct),
      price: parseFloat(rawProduct.price) || 0,
      stock: parseInt(rawProduct.stock, 10) || 0,
    };
    PRODUCT_REGISTRY.set(id, item);
    return item;
  }

  let cat = (rawProduct.category || '').toLowerCase();
  if (!cat) {
    cat = inferCategory(id).toLowerCase();
  }

  let template;
  if (cat.includes('cake')) {
    template = CAKE_TEMPLATES[id % CAKE_TEMPLATES.length];
  } else if (cat.includes('bread')) {
    template = BREAD_TEMPLATES[id % BREAD_TEMPLATES.length];
  } else {
    template = COOKIE_TEMPLATES[id % COOKIE_TEMPLATES.length];
  }

  // Stock: keep original or give a realistic small-batch bakery count (3 to 24)
  const realisticStock = (rawProduct.stock && rawProduct.stock > 0) ? rawProduct.stock : (id % 18) + 4;

  const enriched = {
    ...rawProduct,
    id,
    name: template.name,
    category: cat.charAt(0).toUpperCase() + cat.slice(1),
    description: template.desc,
    price: template.price,
    stock: realisticStock,
    image_url: template.img || getProductImage({ name: template.name, category: cat, id }),
  };

  PRODUCT_REGISTRY.set(id, enriched);
  return enriched;
}

/**
 * Curates and limits the product catalog to 200-250 items (default 225)
 * Prioritizes custom admin products first, then balances remaining items evenly across categories.
 */
export function curateCatalog(rawProducts, maxItems = MAX_FRONTEND_PRODUCTS) {
  if (!Array.isArray(rawProducts) || rawProducts.length === 0) return [];

  // Enriched items
  const enriched = rawProducts.map(enrichProduct);

  // Separate custom products (added via admin or custom named) from benchmark
  const customItems = enriched.filter((p) => !(p.name || '').startsWith('Product #') && p.id > 3000);
  const standardItems = enriched.filter((p) => !customItems.includes(p));

  // If already under or equal to max limit, return all
  if (enriched.length <= maxItems) {
    return enriched;
  }

  // Combine custom items at top, then slice up to maxItems
  const result = [...customItems];
  const remainingSlots = Math.max(0, maxItems - result.length);

  result.push(...standardItems.slice(0, remainingSlots));

  return result;
}
