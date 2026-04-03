const firebaseConfig = {
  apiKey: "8MxQunxD6GDKtKVBRRkdtQvsZvr7eim414ggEFOP",
  authDomain: "oxybit-8609b.firebaseapp.com",
  databaseURL: "https://oxybit-8609b-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "oxybit-8609b",
  storageBucket: "oxybit-8609b.appspot.com",
  messagingSenderId: "931238910410",
  appId: "1:931238910410:web:486a665287f311c1d04495"
};

firebase.initializeApp(firebaseConfig);
const database = firebase.database();
const LATEST_DATA_REF = database.ref('HealthData');
const LOGS_REF = database.ref('History');

console.log('Firebase initialized successfully');



