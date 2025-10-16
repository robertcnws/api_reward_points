const appDbName = process.env.MONGO_INITDB_DATABASE || 'appdb';
const dbApp = db.getSiblingDB(appDbName);

print(`[init-03] Creando colecciones en DB=${appDbName}`);

const collections = [
  'external_users',
  'intro_step',
  'login_users',
  'reward_attachment',
  'reward_invoice_line_item',
  'reward_invoice_tax',
  'reward_invoices',
  'reward_item',
  'reward_joy_ride',
  'reward_points',
  'reward_points_history',
  'reward_points_settings',
  'reward_sales_orders',
  'reward_store_products',
  'reward_store_product_review',
  'reward_store_product_review_reaction',
  'reward_store_product_selection',
  'reward_store_product_selection_buy',
  'reward_store_product_selection_cart',
  'reward_store_product_users',
  'tracking',
  'user_role',
];

collections.forEach(col => {
  try {
    const exists = dbApp.getCollectionInfos({ name: col }).length > 0;
    if (!exists) {
      dbApp.createCollection(col);
      print(`[init-03] Colección '${col}' creada.`);
    } else {
      print(`[init-03] Colección '${col}' ya existe.`);
    }
  } catch (e) {
    print(`[init-03] Aviso con colección '${col}': ${e.message}`);
  }
});

print('[init-03] DONE');
