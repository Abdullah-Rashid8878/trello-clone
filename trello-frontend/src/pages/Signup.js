import React, { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import authContext from "../context/authContext";

const Signup = () => {
    const context = useContext(authContext);
    const { signup } = context;
    const navigate = useNavigate();

    const [credentials, setCredentials] = useState({
        name: "",
        email: "",
        password: "",
        cpassword: "",
        role: "", // Added role/dropdown state if needed
    });

    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (credentials.password !== credentials.cpassword) {
            setError("Passwords do not match");
            return;
        }

        setLoading(true);
        const result = await signup(
            credentials.name,
            credentials.email,
            credentials.password
        );
        setLoading(false);

        if (result.success) {
            const pendingInviteToken = localStorage.getItem("pendingInviteToken");
            if (pendingInviteToken) {
                navigate(`/invite/${pendingInviteToken}`);
            } else {
                navigate("/boards");
            }
        } else {
            setError(result.error);
        }
    };

    const onChange = (e) => {
        setCredentials({
            ...credentials,
            [e.target.name]: e.target.value,
        });
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <h2>Signup</h2>

                {error && <div className="alert alert-danger py-2" role="alert">{error}</div>}

                <form onSubmit={handleSubmit}>
                    {/* Name */}
                    <div className="mb-3">
                        <label className="form-label">Name</label>
                        <input
                            type="text"
                            className="form-control"
                            name="name"
                            placeholder="Enter Your Name"
                            value={credentials.name}
                            onChange={onChange}
                            minLength={3}
                            required
                        />
                    </div>

                    {/* Email */}
                    <div className="mb-3">
                        <label className="form-label">Email address</label>
                        <input
                            type="email"
                            className="form-control"
                            name="email"
                            placeholder="Enter Your Email"
                            value={credentials.email}
                            onChange={onChange}
                            required
                        />
                    </div>

                    {/* Optional Dropdown Field with Dropdown/Arrow Icon */}
                    <div className="mb-3">
                        <label className="form-label">Role / Workspace Type</label>
                        <div style={{ position: "relative" }}>
                            <select
                                className="form-control"
                                name="role"
                                value={credentials.role}
                                onChange={onChange}
                                style={{ appearance: "none", paddingRight: "35px" }}
                                required
                            >
                                <option value="">Select your role</option>
                                <option value="developer">Developer</option>
                                <option value="designer">Designer</option>
                                <option value="manager">Manager</option>
                            </select>
                            <span
                                style={{
                                    position: "absolute",
                                    right: "12px",
                                    top: "50%",
                                    transform: "translateY(-50%)",
                                    pointerEvents: "none",
                                    color: "#6c757d"
                                }}
                            >
                                <i className="fa fa-chevron-down"></i>
                            </span>
                        </div>
                    </div>

                    {/* Password */}
                    <div className="mb-3 password-box">
                        <label className="form-label">Password</label>
                        <div className="password-wrapper" style={{ position: "relative" }}>
                            <input
                                type={showPassword ? "text" : "password"}
                                className="form-control"
                                name="password"
                                placeholder="Create a Password"
                                value={credentials.password}
                                onChange={onChange}
                                minLength={5}
                                required
                            />
                            <span
                                className="eye-icon"
                                style={{ cursor: "pointer", position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)" }}
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                <i className={`fa ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
                            </span>
                        </div>
                    </div>

                    {/* Confirm Password */}
                    <div className="mb-4">
                        <label className="form-label">Confirm Password</label>
                        <input
                            type={showPassword ? "text" : "password"}
                            className="form-control"
                            name="cpassword"
                            placeholder="Confirm Your Password"
                            value={credentials.cpassword}
                            onChange={onChange}
                            required
                        />
                    </div>

                    {/* Button */}
                    <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                        {loading ? "Creating Account..." : "Signup"}
                    </button>
                </form>

                {/* Login Link */}
                <div className="account-link text-center mt-3">
                    Already have an account? <Link to="/login">Login</Link>
                </div>

                {/* About */}
                <div className="text-center mt-3">
                    <Link to="/about" style={{ fontSize: '0.75rem' }}>About this app</Link>
                </div>
            </div>
        </div>
    );
};

export default Signup;