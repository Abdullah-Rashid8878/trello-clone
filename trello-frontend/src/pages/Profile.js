import React, { useContext, useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import authContext from "../context/authContext";

const Profile = () => {
    const context = useContext(authContext);
    const { host, authToken } = context;
    const navigate = useNavigate();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const fetchUser = async () => {
        try {
            const response = await fetch(`${host}/api/auth/getuser`, {
                method: "POST",
                headers: { "auth-token": authToken },
            });
            const json = await response.json();
            if (json.name) setName(json.name);
            if (json.email) setEmail(json.email);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        if (!authToken) {
            navigate("/login");
        } else {
            fetchUser();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authToken]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setMessage("");

        const body = { name };
        if (password.trim()) {
            body.password = password;
        }

        try {
            const response = await fetch(`${host}/api/auth/updateuser`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", "auth-token": authToken },
                body: JSON.stringify(body),
            });
            const json = await response.json();

            if (json.success) {
                setMessage("Profile updated successfully!");
                setPassword("");
            } else {
                setError("Could not update profile.");
            }
        } catch (err) {
            setError("Server error while updating profile.");
        }
    };

    return (
        <div className="container mt-5" style={{ maxWidth: "400px"}}>
            <h2 className="mb-4 fw-bold">My Profile</h2>
            {message && <div className="alert alert-success">{message}</div>}
            {error && <div className="alert alert-danger">{error}</div>}

            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label className="form-label fw-medium">Email</label>
                    <input type="email" className="form-control" value={email} disabled />
                </div>

                <div className="mb-3">
                    <label className="form-label fw-medium">Name</label>
                    <input
                        type="text"
                        className="form-control"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        minLength={3}
                        required
                    />
                </div>

                {/* Password Field with Integrated Font Awesome Eye Icon */}
                <div className="mb-4">
                    <label htmlFor="password" className="form-label fw-medium mb-1">
                        New Password <span className="text-muted fw-normal fs-7">(leave blank to keep current)</span>
                    </label>
                    
                    <div style={{ position: "relative", width: "100%" }}>
                        <input
                            type={showPassword ? "text" : "password"}
                            className="form-control"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            name="password"
                            id="password"
                            style={{ 
                                paddingRight: "45px",
                                width: "100%"
                            }}
                            placeholder="Enter New Password"
                            minLength={5}
                        />
                        <span
                            className="d-flex align-items-center justify-content-center"
                            style={{ 
                                cursor: "pointer",
                                position: "absolute",
                                right: "12px",
                                top: "50%",
                                transform: "translateY(-50%)",
                                color: "#6c757d",
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

                <button type="submit" className="btn btn-primary w-100 fw-bold">
                    Update Profile
                </button>
            </form>

            <p className="mt-3 text-center">
                <Link to="/boards" className="text-decoration-none fw-semibold">
                    &larr; Back to Boards
                </Link>
            </p>
        </div>
    );
};

export default Profile;