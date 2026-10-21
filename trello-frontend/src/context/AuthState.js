import React, { useState } from "react";
import authContext from "./authContext";

const host = "http://localhost:5000";

const AuthState = (props) => {
    const [authToken, setAuthToken] = useState(localStorage.getItem("token") || null);

    // Login: save the token after successful login
    const login = async (email, password) => {
        const response = await fetch(`${host}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });
        const json = await response.json();

        if (json.success) {
            localStorage.setItem("token", json.authtoken);
            setAuthToken(json.authtoken);
            return { success: true };
        } else {
            return { success: false, error: json.error || "Login failed" };
        }
    };

    // Signup: create account and save the token
    const signup = async (name, email, password) => {
        const response = await fetch(`${host}/api/auth/createuser`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password }),
        });
        const json = await response.json();

        if (json.success) {
            localStorage.setItem("token", json.authtoken);
            setAuthToken(json.authtoken);
            return { success: true };
        } else {
            return { success: false, error: json.error || "Signup failed" };
        }
    };

    // Logout: clear the token
    const logout = () => {
        localStorage.removeItem("token");
        setAuthToken(null);
    };

    return (
        <authContext.Provider value={{ host, authToken, login, signup, logout }}>
            {props.children}
        </authContext.Provider>
    );
};

export default AuthState;