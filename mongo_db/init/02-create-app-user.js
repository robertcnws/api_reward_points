try {
  const appDb = db.getSiblingDB(process.env.MONGO_INITDB_DATABASE || 'appdb');
  const appUser = process.env.MONGO_DB_USERNAME || 'appuser';
  const appPwd  = process.env.MONGO_DB_PASSWORD || 'apppass';

  const exists = appDb.getUser(appUser);
  if (!exists) {
    appDb.createUser({
      user: appUser,
      pwd: appPwd,
      roles: [{ role: 'readWrite', db: appDb.getName() }],
    });
    print(`[init] Usuario '${appUser}' creado.`);
  } else {
    print(`[init] Usuario '${appUser}' ya existía.`);
  }
} catch (e) {
  print(`[init] 02-create-app-user.js error: ${e.message}`);
}