<<<<<<< HEAD
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCWHOiZVpj2CG4gIZfRXe1PlTC6s2eGWQg",
  authDomain: "algonomic.firebaseapp.com",
  projectId: "algonomic",
  storageBucket: "algonomic.appspot.com",
  messagingSenderId: "1066043172063",
  appId: "1:1066043172063:web:59d9a7914124c1a071f56a",
  measurementId: "G-JLRWY0PFXD"
};

const app = initializeApp(firebaseConfig);
=======
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCWHOiZVpj2CG4gIZfRXe1PlTC6s2eGWQg",
  authDomain: "algonomic.firebaseapp.com",
  projectId: "algonomic",
  storageBucket: "algonomic.appspot.com",
  messagingSenderId: "1066043172063",
  appId: "1:1066043172063:web:59d9a7914124c1a071f56a",
  measurementId: "G-JLRWY0PFXD"
};

const app = initializeApp(firebaseConfig);
>>>>>>> 9039fd2 (Initial commit)
export const auth = getAuth(app); 