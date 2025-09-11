import { useState } from "react";
import { auth } from "../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { useNavigate, Link } from "react-router-dom";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      navigate("/dashboard");
    } catch (error) {
      alert(error.message);
    }
  };

  // return (
  //   <div className="flex items-center justify-center min-h-screen bg-gray-100">
  //     <div className="card w-80 max-w-sm">
  //       <h2 className="text-xl font-bold mb-4 text-center">Sign Up</h2>
  //       <form onSubmit={handleSignup} className="space-y-3">
  //         <div>
  //           <label className="block text-sm font-medium mb-1">Email</label>
  //           <input
  //             type="email"
  //             placeholder="Enter your email"
  //             className="input"
  //             value={email}
  //             onChange={(e) => setEmail(e.target.value)}
  //           />
  //         </div>
  //         <div>
  //           <label className="block text-sm font-medium mb-1">Password</label>
  //           <input
  //             type="password"
  //             placeholder="Enter your password"
  //             className="input"
  //             value={password}
  //             onChange={(e) => setPassword(e.target.value)}
  //           />
  //         </div>
  //         <button type="submit" className="btn btn-success w-full">
  //           Sign Up
  //         </button>
  //       </form>
  //       <p className="mt-3 text-sm text-center">
  //         Have an account?{" "}
  //         <Link to="/" className="text-blue-600 hover:underline">
  //           Login
  //         </Link>
  //       </p>
  //     </div>
  //   </div>
  // );
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
            />
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
