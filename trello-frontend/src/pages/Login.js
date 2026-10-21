import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authContext from '../context/authContext';

const Login = () => {
    const context = useContext(authContext);
    const { login } = context;
    let navigate = useNavigate();

    const [credentials, setCredentials] = useState({ email: "", password: "" });
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        
        const result = await login(credentials.email, credentials.password);
        
        if (result.success) {
            const pendingToken = localStorage.getItem("pendingInviteToken");
            if (pendingToken) {
                navigate(`/invite/${pendingToken}`);
            } else {
                navigate("/boards");
            }
        } else {
            setError(result.error);
        }
    };

    const onChange = (e) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <h2 className="text-white text-center mb-4 font-weight-bold">Login To Trello-App</h2>
                
                {error && <div className="alert alert-danger py-2 small" role="alert">{error}</div>}
                
                <form onSubmit={handleSubmit}>
                    {/* Email Field */}
                    <div className="mb-3">
                        <label htmlFor="email" className="form-label text-white small mb-1">Email address</label>
                        <input
                            type="email"
                            className="form-control"
                            value={credentials.email}
                            onChange={onChange}
                            id="email"
                            name="email"
                            style={{ backgroundColor: "#0b0e14", color: "#ffffff", border: "1px solid #2d323e" }}
                            placeholder="Enter Your Email"
                            required
                        />
                    </div>
                    
                    {/* Password Field */}
                    <div className="mb-4">
                        <label htmlFor="password" className="form-label text-white small mb-1">Password</label>
                        <div style={{ position: "relative", width: "100%" }}>
                            <input
                                type={showPassword ? "text" : "password"}
                                className="form-control"
                                value={credentials.password}
                                onChange={onChange}
                                name="password"
                                id="password"
                                style={{ 
                                    backgroundColor: "#0b0e14", 
                                    color: "#ffffff", 
                                    border: "1px solid #2d323e",
                                    paddingRight: "45px",
                                    borderRadius: "6px",
                                    width: "100%"
                                }}
                                placeholder="Enter Your Password"
                                required
                            />
                            <span
                                className="d-flex align-items-center justify-content-center"
                                style={{ 
                                    cursor: "pointer",
                                    position: "absolute",
                                    right: "12px",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    color: "#9fadbc",
                                    zIndex: 10,
                                    background: "none",
                                    border: "none", 
                                    height: "100%",
                                    width: "30px"
                                }}
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                <i className={`fa ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
                            </span>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button type="submit" className="btn w-100 mb-3" style={{ backgroundColor: '#5c6bc0', color: '#ffffff', fontWeight: '600', border: 'none' }}>
                        Submit
                    </button>
                </form>
                
                {/* Footer Navigation Links */}
                <div className="text-center small mt-2">
                    <span className="text-white-50">Don't have an account? </span>
                    <Link to="/signup" style={{ color: '#818cf8', textDecoration: 'none' }}>Signup</Link>
                </div>
                
                <div className="text-center small mt-4">
                    <Link to="/about" style={{ color: '#9fadbc', textDecoration: 'none', fontSize: '0.75rem' }}>About this app</Link>
                </div>
            </div>
        </div>
    );
};

export default Login;