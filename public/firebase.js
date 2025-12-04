// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getDatabase, ref } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-database.js";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyD9eLfQCtUh9_QovY0FnkkHMEc9Qc5wLBE",
  authDomain: "oxybit-8609b.firebaseapp.com",
  databaseURL: "https://oxybit-8609b-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "oxybit-8609b",
  storageBucket: "oxybit-8609b.appspot.com",
  messagingSenderId: "726940544542",
  appId: "1:726940544542:web:9a95b1208464e0b324880f",
  measurementId: "G-5WEDZFTZHB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
