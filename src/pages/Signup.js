import { useState, useEffect } from "react";
import { auth, db } from "../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { setDoc, doc, serverTimestamp } from "firebase/firestore";
import { useNavigate, Link } from "react-router-dom";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [ip, setIp] = useState("");
  const navigate = useNavigate();

  // IP fetch karne ka effect, component mount hote hi chalega
  useEffect(() => {
    fetch("https://api.ipify.org?format=json")
      .then((res) => res.json())
      .then((data) => setIp(data.ip))
      .catch(() => setIp("N/A"));
  }, []);

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        email,
        password, // Only for demo, remove in prod
        signupTime: serverTimestamp(),
        ip,
      });
      alert("User registered successfully!");
      navigate("/dashboard");
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <div className="center-wrapper">
      <div className="form-container">
        <h2>Sign Up</h2>
        <form onSubmit={handleSignup}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="Enter email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          {/* IP field ko hide bhi kar sakte ho kyunki auto fetch ho raha hai */}
          <div className="form-group" style={{ display: "none" }}>
            <label>IP</label>
            <input type="text" className="input" value={ip} readOnly />
          </div>
          <button type="submit" className="btn btn-success">
            Sign Up
          </button>
        </form>
        <p className="text-center" style={{ marginTop: "20px" }}>
          Have an account?{" "}
          <Link to="/" className="link">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
