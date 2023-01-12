const express = require('express')
const {renderMain, renderRoom, createRoom, enterRoom, removeRoom, sendChat, sendGif} = require('../controllers')
const Chat = require('../schemas/chat')

const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router()

router.get('/', renderMain)
router.get('/room', renderRoom)
router.post('/room', createRoom)
router.get('/room/:id', enterRoom)
router.delete('/room/:id', removeRoom)
router.post('/room/:id/chat', sendChat)

try {
    fs.readdirSync('uploads');
} catch (err) {
    console.error('uploads 폴더가 없어 uploads 폴더를 생성합니다.');
    fs.mkdirSync('uploads');
}

const upload = multer({
    storage: multer.diskStorage({
        destination(req, file, done) {
            done(null, 'uploads/');
        },
        filename(req, file, done) {
            const ext = path.extname(file.originalname);
            done(null, path.basename(file.originalname, ext) + Date.now() + ext); // 파일명에 타임스탬프(Date.now())를 붙힘
        },
    }),
    limits: { fileSize: 5 * 1024 * 1024}, // 용량을 5MB로 제한
});

router.post('/room/:id/gif', upload.single('gif'), async (req, res, next) => {
    try {
        const chat = await Chat.create({
            room: req.params.id,
            user: req.session.color,
            gif: req.file.filename,
        });
        req.app.get('io').of('/chat').to(req.params.id).emit('chat', chat);
        res.send('ok');
    } catch (error) {
        console.error(error);
        next(error);
    }
});

module.exports = router