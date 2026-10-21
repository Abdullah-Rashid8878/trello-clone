import React, { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import authContext from './context/authContext';

// description ke words count karne wala helper - empty/spaces ko ignore karta hai
const countWords = (text) => {
    if (!text || !text.trim()) return 0;
    return text.trim().split(/\s+/).length;
};

const CardModal = ({ card, onClose, onUpdate, onUpdateSuccess }) => {
    const context = useContext(authContext);
    const { host, authToken } = context;

    const [title, setTitle] = useState(card.title || '');
    const [description, setDescription] = useState(card.description || '');
    const [file, setFile] = useState(null);
    const [isDraggingOver, setIsDraggingOver] = useState(false); // drag-drop ke liye highlight dikhane ke liye
    const [attachments, setAttachments] = useState(card.attachments || []);
    const [otherCardsAttachments, setOtherCardsAttachments] = useState([]);
    const [loadingOther, setLoadingOther] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (card && card._id) {
            fetchOtherAttachments();
        }
        // eslint-disable-next-line
    }, [card]);

    const fetchOtherAttachments = async () => {
        try {
            setLoadingOther(true);

            const cardsRes = await axios.get(`${host}/api/cards/fetchallcards`, {
                headers: { 'auth-token': authToken }
            });

            let listsMap = {};
            if (card.board) {
                try {
                    const listsRes = await axios.get(`${host}/api/lists/fetchlists/${card.board}`, {
                        headers: { 'auth-token': authToken }
                    });
                    if (listsRes.data && Array.isArray(listsRes.data)) {
                        listsRes.data.forEach(l => {
                            listsMap[l._id] = l.title;
                        });
                    }
                } catch (e) {
                    console.log("lists map nahi mil saka, koi baat nahi");
                }
            }

            if (cardsRes.data && Array.isArray(cardsRes.data)) {
                const attachmentsList = [];
                cardsRes.data.forEach((c) => {
                    if (c._id !== card._id && c.attachments && c.attachments.length > 0) {
                        const listName = listsMap[c.list] || "Board";
                        c.attachments.forEach((att) => {
                            attachmentsList.push({
                                ...att,
                                sourceCardTitle: c.title,
                                sourceListTitle: listName
                            });
                        });
                    }
                });
                setOtherCardsAttachments(attachmentsList);
            }
        } catch (err) {
            console.error("Could not fetch other cards attachments:", err.message);
        } finally {
            setLoadingOther(false);
        }
    };

    const handleCopyAttachmentToCurrentCard = async (attachment) => {
        const newAttachmentsList = [...attachments, { filename: attachment.filename, filepath: attachment.filepath || attachment.path }];

        try {
            const res = await axios.put(`${host}/api/cards/updatecard/${card._id}`, {
                title,
                description,
                attachments: newAttachmentsList
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'auth-token': authToken
                }
            });

            if (res.data) {
                setAttachments(res.data.attachments || newAttachmentsList);
                if (onUpdate) onUpdate();
                alert("Attachment successfully pulled to this card!");
            }
        } catch (err) {
            console.error('Error pulling attachment:', err);
            alert('Failed to pull attachment.');
        }
    };

    const handleDeleteAttachment = async (indexToDelete) => {
        if (!window.confirm("Do you really want to delete this attachment?")) return;

        const updatedAttachments = attachments.filter((_, index) => index !== indexToDelete);

        try {
            const res = await axios.put(`${host}/api/cards/updatecard/${card._id}`, {
                title,
                description,
                attachments: updatedAttachments
            }, {
                headers: {
                    'Content-Type': 'application/json',
                    'auth-token': authToken
                }
            });

            if (res.data) {
                setAttachments(res.data.attachments || updatedAttachments);
                if (onUpdate) onUpdate();
            }
        } catch (err) {
            console.error('Error deleting attachment:', err);
            alert('Failed to delete attachment.');
        }
    };

    // yahi wala function title, description aur naya file upload sab sambhalta hai
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData();
        formData.append('title', title);
        formData.append('description', description);
        if (file) {
            formData.append('file', file);
        }

        try {
            const res = await axios.put(`${host}/api/cards/updatecard/${card._id}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    'auth-token': authToken
                }
            });

            if (res.data) {
                if (onUpdate) onUpdate();
                if (onUpdateSuccess) onUpdateSuccess(res.data);
                onClose();
            }
        } catch (err) {
            console.error('Error updating card:', err);
            alert('Failed to update card and upload file.');
        } finally {
            setLoading(false);
        }
    };

    // ============ drag & drop wala hissa ============
    // PC se seedha file khींch kar box par chhod sakte hain, alag se browse karne ki zaroorat nahi

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOver(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOver(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            // filhal sirf pehli file lete hain, ek time mein ek attachment
            setFile(e.dataTransfer.files[0]);
        }
    };

    return (
        <div
            className="modal show d-block"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}
            tabIndex="-1"
        >
            <div className="modal-dialog modal-dialog-centered modal-lg">
                <div className="modal-content shadow">
                    <form onSubmit={handleSubmit}>
                        <div className="modal-header">
                            <h5 className="modal-title fw-bold">📁 Edit Card & Attachments</h5>
                            <button type="button" className="btn-close" onClick={onClose}></button>
                        </div>

                        <div className="modal-body">
                            <div className="row">
                                {/* left wala side - title, desc, upload aur jo attachments already hain */}
                                <div className="col-md-6 border-end d-flex flex-column gap-3">
                                    <div>
                                        <label className="form-label small fw-bold">Title</label>
                                        <input
                                            type="text"
                                            className="form-control form-control-sm"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="form-label small fw-bold">Description</label>
                                        <textarea
                                            className="form-control form-control-sm"
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder="Add description..."
                                            rows={2}
                                        />
                                        <div className="text-muted text-end" style={{ fontSize: "0.7rem" }}>
                                            {countWords(description)} words
                                        </div>
                                    </div>

                                    <div>
                                        <label className="form-label small fw-bold">Upload New Attachment</label>

                                        {/* drag & drop box - PC se file yahan khींच kar chhod do */}
                                        <div
                                            onDragOver={handleDragOver}
                                            onDragLeave={handleDragLeave}
                                            onDrop={handleDrop}
                                            onClick={() => document.getElementById('cardFileInput').click()}
                                            style={{
                                                border: isDraggingOver ? "2px dashed #0079bf" : "2px dashed #dfe1e6",
                                                borderRadius: "6px",
                                                padding: "18px 10px",
                                                textAlign: "center",
                                                cursor: "pointer",
                                                backgroundColor: isDraggingOver ? "#e6f2fa" : "#fafbfc",
                                                transition: "all 0.15s ease-in-out"
                                            }}
                                        >
                                            {file ? (
                                                <div className="d-flex justify-content-between align-items-center">
                                                    <span style={{ fontSize: "0.8rem" }}>📎 {file.name}</span>
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-outline-danger py-0 px-1"
                                                        style={{ fontSize: "0.7rem" }}
                                                        onClick={(e) => {
                                                            e.stopPropagation(); // taake box ka click event (file browser khulna) trigger na ho
                                                            setFile(null);
                                                        }}
                                                        title="Remove selected file"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-muted" style={{ fontSize: "0.8rem" }}>
                                                    Drag files here or click to upload
                                                </span>
                                            )}
                                        </div>

                                        {/* actual file input hidden hai, drag-drop box hi trigger karta hai isko */}
                                        <input
                                            id="cardFileInput"
                                            type="file"
                                            className="d-none"
                                            onChange={(e) => setFile(e.target.files[0])}
                                        />
                                    </div>

                                    {attachments && attachments.length > 0 && (
                                        <div>
                                            <h6 className="fw-bold small mb-1">Existing Attachments:</h6>
                                            <ul className="list-group" style={{ maxHeight: '120px', overflowY: 'auto' }}>
                                                {attachments.map((att, index) => (
                                                    <li key={index} className="list-group-item py-1 small d-flex justify-content-between align-items-center">
                                                        <a
                                                            href={`${host}/${att.filepath || att.path || att}`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="text-decoration-none text-truncate"
                                                            style={{ maxWidth: '150px' }}
                                                        >
                                                            {att.filename || att}
                                                        </a>
                                                        <button
                                                            type="button"
                                                            className="btn btn-sm btn-outline-danger p-0 px-1"
                                                            style={{ fontSize: "0.75rem" }}
                                                            onClick={() => handleDeleteAttachment(index)}
                                                            title="Delete"
                                                        >
                                                            &times;
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>

                                {/* right wala side - baaki cards se attachments pull karne ke liye */}
                                <div className="col-md-6">
                                    <h6 className="fw-bold text-success small">📋 Import From Other Cards</h6>
                                    <p className="text-muted" style={{ fontSize: '0.75rem' }}>Select file from other cards to attach here:</p>

                                    {loadingOther ? (
                                        <div className="text-center py-2">
                                            <div className="spinner-border spinner-border-sm text-success" role="status"></div>
                                        </div>
                                    ) : otherCardsAttachments.length > 0 ? (
                                        <ul className="list-group" style={{ maxHeight: '220px', overflowY: 'auto' }}>
                                            {otherCardsAttachments.map((att, idx) => (
                                                <li key={idx} className="list-group-item py-2 px-2 d-flex justify-content-between align-items-center">
                                                    <div>
                                                        <div className="fw-bold text-dark" style={{ fontSize: '0.75rem' }}>
                                                            📌 {att.sourceCardTitle} <span className="badge bg-secondary font-monospace" style={{ fontSize: '0.55rem' }}>{att.sourceListTitle}</span>
                                                        </div>
                                                        <div className="text-muted text-truncate" style={{ maxWidth: '170px', fontSize: '0.7rem' }}>
                                                            📎 {att.filename}
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        className="btn btn-sm btn-outline-success py-0 px-2 text-nowrap"
                                                        style={{ fontSize: '0.7rem' }}
                                                        onClick={() => handleCopyAttachmentToCurrentCard(att)}
                                                    >
                                                        + Pull
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <div className="text-muted small text-center p-3 border rounded bg-light" style={{ fontSize: '0.75rem' }}>
                                            No other card attachments available.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button
                                type="button"
                                className="btn btn-secondary btn-sm"
                                onClick={onClose}
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="btn btn-primary btn-sm fw-bold"
                                disabled={loading}
                            >
                                {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default CardModal;