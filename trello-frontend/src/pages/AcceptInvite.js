import React, { useContext, useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import authContext from "../context/authContext";

const AcceptInvite = () => {
    const { token } = useParams();
    const context = useContext(authContext);
    const { host, authToken } = context;
    const navigate = useNavigate();

    const [status, setStatus] = useState("loading"); // loading | success | error
    const [message, setMessage] = useState("");

    useEffect(() => {
        if (!authToken) {
            // Unregistered / Logged out user -> Save token & send to signup
            localStorage.setItem("pendingInviteToken", token);
            navigate("/signup"); 
            return;
        }

        const acceptInvite = async () => {
            try {
                const response = await fetch(`${host}/api/boards/acceptinvite/${token}`, {
                    method: "POST",
                    headers: { 
                        "Content-Type": "application/json",
                        "auth-token": authToken 
                    },
                });
                const json = await response.json();

                if (json.success) {
                    setStatus("success");
                    setMessage(`You've joined "${json.boardTitle || "the board"}"! Redirecting...`);
                    localStorage.removeItem("pendingInviteToken");
                    setTimeout(() => {
                        navigate(`/board/${json.boardId}`);
                    }, 2000);
                } else {
                    setStatus("error");
                    setMessage(json.error || "Could not accept this invite.");
                }
            } catch (err) {
                setStatus("error");
                setMessage("Something went wrong while accepting the invite.");
            }
        };

        acceptInvite();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [authToken, token]);

    return (
        <div className="container mt-5 text-center" style={{ maxWidth: "500px" }}>
            {status === "loading" && (
                <div className="card p-4 shadow-sm">
                    <h5>Processing your invite...</h5>
                    <div className="spinner-border text-primary mx-auto mt-3" role="status"></div>
                </div>
            )}
            
            {status === "success" && (
                <div className="alert alert-success shadow-sm">
                    <h4>Welcome!</h4>
                    <p className="mb-0">{message}</p>
                </div>
            )}
            
            {status === "error" && (
                <div className="card p-4 shadow-sm border-danger">
                    <div className="alert alert-danger">{message}</div>
                    <div className="d-flex justify-content-center gap-2">
                        <Link to="/boards" className="btn btn-primary">Go to My Boards</Link>
                        <Link to="/login" className="btn btn-outline-secondary">Switch Account</Link>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AcceptInvite;