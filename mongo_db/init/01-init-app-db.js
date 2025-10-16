const appDbName = process.env.MONGO_INITDB_DATABASE || 'appdb';
const appUser   = process.env.MONGO_DB_USERNAME    || 'appuser';
const appPwd    = process.env.MONGO_DB_PASSWORD    || 'apppass';

print(`[init] appDbName=${appDbName}, appUser=${appUser}`);

const appDb = db.getSiblingDB(appDbName);

try {
  appDb.createCollection('login_users');
  print(`[init] Colección 'login_users' creada (o ya existía).`);
} catch (e) {
  print(`[init] Aviso al crear 'login_users': ${e.message}`);
}

try {
  appDb.login_users.updateOne(
    { _seed: true },
    { $set: { _seed: true, createdAt: new Date() } },
    { upsert: true }
  );
  print(`[init] Documento seed upsert en 'login_users' ok.`);
} catch (e) {
  print(`[init] Error seed 'login_users': ${e.message}`);
}

try {
  const exists = appDb.getUsers().some(u => u.user === appUser);
  if (!exists) {
    appDb.createUser({
      user: appUser,
      pwd:  appPwd,
      roles: [
        { role: 'readWrite', db: appDbName },
        { role: 'dbAdmin',   db: appDbName }
      ]
    });
    print(`[init] Usuario '${appUser}' creado en DB '${appDbName}'.`);
  } else {
    print(`[init] Usuario '${appUser}' ya existe en DB '${appDbName}'.`);
  }
} catch (e) {
  print(`[init] Error al crear usuario '${appUser}': ${e.message}`);
}

try {
  const dbs = db.getSiblingDB('admin').adminCommand({ listDatabases: 1 }).databases;
  const names = dbs.map(d => d.name).join(', ');
  print(`[init] Databases visibles: ${names}`);
} catch (e) {
  print(`[init] Error listDatabases: ${e.message}`);
}

print('[init] DONE');
