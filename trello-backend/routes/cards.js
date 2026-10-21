const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Card = require('../models/Card');
const List = require('../models/List');
const fetchuser = require('../middleware/fetchuser');
require('dotenv').config();

// uploads folder agar exist nahi karti to bana do (server start pe crash na ho isliye)
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Local disk storage - file seedha backend/uploads folder mein save hogi
// (S3 abhi ke liye hata diya hai kyunki .env mein real AWS keys nahi thi)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // unique naam taake do files ka naam clash na ho
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// ROUTE 1: Fetch cards (Supports both List ID & Board ID): GET "/api/cards/fetchcards/:id". Login required
router.get('/fetchcards/:id', fetchuser, async (req, res) => {
    try {
        const lists = await List.find({ board: req.params.id });
        const listIds = lists.map(list => list._id);

        const cards = await Card.find({
            $or: [
                { list: req.params.id },
                { board: req.params.id },
                { list: { $in: listIds } }
            ]
        });

        res.json(cards);
    } catch (err) {
        console.error("Fetch cards error:", err.message);
        res.status(500).json({ message: err.message });
    }
});

// ROUTE 2: Add a new Card: POST "/api/cards/addcard/:listId". Login required
router.post('/addcard/:listId', fetchuser, async (req, res) => {
    try {
        const { title, description, dueDate, labels } = req.body;

        const listObj = await List.findById(req.params.listId);

        let cardLabels = [];
        if (labels) {
            cardLabels = Array.isArray(labels) ? labels : [labels];
        }

        const card = new Card({
            title,
            description: description || '',
            dueDate: dueDate ? new Date(dueDate) : null,
            labels: cardLabels,
            list: req.params.listId,
            board: listObj ? listObj.board : null
        });

        const savedCard = await card.save();
        res.json(savedCard);
    } catch (err) {
        console.error("Add card error:", err.message);
        res.status(500).json({ message: err.message });
    }
});

// ROUTE 3: Edit Card & File Upload: PUT "/api/cards/:id"
router.put('/:id', upload.single('file'), async (req, res) => {
    try {
        const { title, description, list, dueDate, labels, attachments } = req.body;
        let updateData = {};

        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (list !== undefined) updateData.list = list;

        if (dueDate !== undefined) {
            updateData.dueDate = (dueDate && dueDate !== "") ? new Date(dueDate) : null;
        }

        if (labels !== undefined) {
            updateData.labels = Array.isArray(labels) ? labels : (labels ? [labels] : []);
        }

        if (attachments !== undefined) {
            updateData.attachments = typeof attachments === 'string' ? JSON.parse(attachments) : attachments;
        }

        let updateQuery = { $set: updateData };

        // naya file upload hua ho to attachments array mein push kar do
        // filepath yahan local /uploads/xxxx.png wala relative path hoga
        if (req.file) {
            const newAttachment = {
                filename: req.file.originalname,
                filepath: 'uploads/' + req.file.filename
            };
            updateQuery.$push = { attachments: newAttachment };
        }

        const updatedCard = await Card.findByIdAndUpdate(
            req.params.id,
            updateQuery,
            { new: true }
        );

        return res.json(updatedCard);
    } catch (err) {
        console.error("Update Card Error:", err.message);
        res.status(500).json({ message: err.message });
    }
});

// ROUTE 4: Edit Card Alias: PUT "/api/cards/updatecard/:id"
router.put('/updatecard/:id', upload.single('file'), async (req, res) => {
    try {
        const { title, description, list, dueDate, labels, attachments } = req.body;
        let updateData = {};

        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (list !== undefined) updateData.list = list;

        if (dueDate !== undefined) {
            updateData.dueDate = (dueDate && dueDate !== "") ? new Date(dueDate) : null;
        }

        if (labels !== undefined) {
            updateData.labels = Array.isArray(labels) ? labels : (labels ? [labels] : []);
        }

        if (attachments !== undefined) {
            updateData.attachments = typeof attachments === 'string' ? JSON.parse(attachments) : attachments;
        }

        let updateQuery = { $set: updateData };

        if (req.file) {
            const newAttachment = {
                filename: req.file.originalname,
                filepath: 'uploads/' + req.file.filename
            };
            updateQuery.$push = { attachments: newAttachment };
        }

        const updatedCard = await Card.findByIdAndUpdate(
            req.params.id,
            updateQuery,
            { new: true }
        );

        return res.json(updatedCard);
    } catch (err) {
        console.error("Update Card Error:", err.message);
        res.status(500).json({ message: err.message });
    }
});

// ROUTE 5: Delete Card: DELETE "/api/cards/deletecard/:id" or DELETE "/api/cards/:id"
router.delete('/deletecard/:id', fetchuser, async (req, res) => {
    try {
        const card = await Card.findByIdAndDelete(req.params.id);
        if (!card) return res.status(404).json({ message: "Card not found" });
        res.json({ success: true, message: "Card deleted successfully", card });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.delete('/:id', fetchuser, async (req, res) => {
    try {
        const card = await Card.findByIdAndDelete(req.params.id);
        if (!card) return res.status(404).json({ message: "Card not found" });
        res.json({ success: true, message: "Card deleted successfully", card });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ROUTE 6: Get all cards (For pulling attachments or linking from other cards): GET "/api/cards/fetchallcards"
router.get('/fetchallcards', fetchuser, async (req, res) => {
    try {
        const cards = await Card.find({});
        res.json(cards);
    } catch (err) {
        console.error("Fetch all cards error:", err.message);
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;