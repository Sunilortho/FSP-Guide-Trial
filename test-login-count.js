const admin = require('firebase-admin');
const serviceAccount = require('/Users/sunilkumarsingh/Downloads/perfect-stock-486708-k1-firebase-adminsdk-fbsvc-649932748f.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();
db.settings({ databaseId: 'ai-studio-b66d1fc7-4771-4214-9119-ebc9fcf94cb7' });

async function run() {
  const snapshot = await db.collection('users').get();
  console.log('Total users:', snapshot.size);
  snapshot.forEach(doc => {
    console.log(doc.id, '=>', doc.data().email, 'loginCount:', doc.data().loginCount, 'hasPaid:', doc.data().hasPaid);
  });
  console.log("Done");
  process.exit(0);
}
run();
