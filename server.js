const path = require('path');
const express = require('express');
const cookieParser = require('cookie-parser');
const { messages, responses, users } = require('./data');


const PORT = process.env.PORT || 3000;
const app = express();

app.use(express.json());
app.use(express.urlencoded({
    extended: false
}));
app.use(cookieParser());

app.get('/', (req, res) => {
    if (req.cookies.nick) {
        if (!users[req.cookies.nick]) {
            users[req.cookies.nick] = `#${Math.floor(Math.random() * 2 ** 24 - 1).toString(16)}`;
        }

        res.sendFile(path.join(__dirname, 'templates', 'chat.html'));
        return;
    }

    res.sendFile(path.join(__dirname, 'static', 'index.html'));
});

app.post('/', (req, res) => {
    res.cookie('nick', req.body.nick);
    users[req.body.nick] = `#${Math.floor(Math.random() * 2 ** 24 - 1).toString(16)}`;
    res.sendFile(path.join(__dirname, 'templates', 'chat.html'));
});

app.use(express.static(path.join(__dirname, 'static')));

app.get('/messages', async (req, res) => {
    responses.push(res);
});

app.post('/messages', (req, res) => {
    const text = req.body.text;

    const nickRegex = /^\/nick .*$/i;
    let newNick = nickRegex.exec(text);
    if (newNick) {
        newNick = newNick[0].replace('/nick ', '');
        users[newNick] = users[req.cookies.nick];
        delete users[req.cookies.nick];
        res.cookie('nick', newNick);
        res.send('ok');
        return;
    }

    const colorRegex = /^\/color .*$/i;
    let newColor = colorRegex.exec(text);
    if (newColor) {
        newColor = newColor[0].replace('/color ', '');
        users[req.cookies.nick] = newColor;
        res.send('ok');
        return;
    }

    const quitRegex = /^\/quit$/i;
    const quitCommand = quitRegex.test(text);
    if (quitCommand) {
        delete users[req.cookies.nick];
        res.clearCookie('nick');
        res.send('ok');
        return;
    }

    const message = {};

    message.nick = req.cookies.nick;
    message.text = text;
    message.timestamp = new Date().toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' });

    messages.push(message);

    res.send('ok');
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

setInterval(() => {
    if (messages.length > 0) {
        responses.forEach(res => {
            res.send({ messages, users });
        });
        messages.splice(0);
        responses.splice(0);
    }
}, 100)
