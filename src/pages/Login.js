import { useState } from "react";
import { auth } from "../firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/dashboard");
    } catch (error) {
      alert(error.message);
    }
  };

  // return (
  // <div className="min-h-screen flex items-center justify-center bg-gray-100">
  //   <div className="bg-white p-6 rounded-lg shadow-md w-96">
  //     <h2 className="text-2xl font-bold mb-4 text-center">Login</h2>

  //     <form onSubmit={handleLogin} className="space-y-4">
  //       <div>
  //         <label className="block text-sm font-medium mb-1">Email</label>
  //         <input
  //           type="email"
  //           placeholder="Enter your email"
  //           className="input w-full"
  //           value={email}
  //           onChange={(e) => setEmail(e.target.value)}
  //         />
  //       </div>

  //       <div>
  //         <label className="block text-sm font-medium mb-1">Password</label>
  //         <input
  //           type="password"
  //           placeholder="Enter your password"
  //           className="input w-full"
  //           value={password}
  //           onChange={(e) => setPassword(e.target.value)}
  //         />
  //       </div>

  //       <button type="submit" className="btn btn-primary w-full">
  //         Login
  //       </button>
  //     </form>

  //     <p className="mt-4 text-center text-sm">
  //       Create account?{" "}
  //       <Link to="/signup" className="text-blue-600 hover:underline">
  //         Sign Up
  //       </Link>
  //     </p>
  //   </div>
  // </div>
  return (
    <div className="center-wrapper">
      <div className="form-container">
        <h2>Login</h2>
        <form onSubmit={handleLogin}>
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
          <button type="submit" className="btn">
            Login
          </button>
        </form>
        <p className="text-center" style={{ marginTop: "20px" }}>
          Create account?{" "}
          <Link to="/signup" className="link">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
}
