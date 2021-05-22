export default class App {
    constructor(msgs, input) {
        this.messages = document.querySelector(msgs);
        this.container = this.messages.querySelector('.overview');
        this.container.addEventListener('touchmove', e => e.preventDefault());
        $(msgs).tinyscrollbar();
        this.scrollbar = $(msgs).data("plugin_tinyscrollbar");
        this.checkEnd = () => {
            if (this.top <= this.scrollbar.contentPosition) {
                document.querySelector('.viewport').style.height = '98%';
                this.scrollbar.update('bottom');
            } else {
                document.querySelector('.viewport').style.height = '100%';
            }
        };
        $(msgs).bind('move', this.checkEnd);

        this.input = document.querySelector(input);

        this.text = this.input.querySelector('input');
        this.btn = this.input.querySelector('button');

        const onSend = () => {
            this.post(this.text.value);
        }
        this.btn.addEventListener('click', onSend);

        window.addEventListener('keypress', e => {
            if (e.code == "Enter" || e.keyCode == 13) {
                onSend();
            }
        });

        this.loop();
    }

    async loop() {
        const res = await fetch('/messages');
        const data = await res.json();
        this.addMessages(data);
        this.loop();
    }

    static getNick() {
        const cookieReg = /(?<=nick=)[^;]*/;
        const nick = document.cookie.match(cookieReg);
        return nick ? decodeURIComponent(nick) : null;
    }

    addMessages({ messages, users }) {
        messages.forEach(({ nick, text, timestamp }) => {
            const msg = document.createElement('div');
            msg.classList.add('msg');

            if (App.getNick() == nick) {
                msg.classList.add('my');
            }

            const content = document.createElement('p');
            content.classList.add('text');
            const user = document.createElement('div');
            user.classList.add('user');
            const time = document.createElement('div');
            time.classList.add('timestamp');

            content.innerHTML = text;
            user.innerHTML = nick;
            time.innerHTML = timestamp;
            content.appendChild(time);
            msg.appendChild(user);
            msg.appendChild(content);
            content.style.backgroundColor = users[nick];
            msg.style.color = users[nick];
            this.container.appendChild(msg);
            this.scrollbar.update("bottom");
            this.top = this.scrollbar.contentPosition;
            this.checkEnd();

            $('.text').emoticonize({ animate: false });
        });
    }

    async post(text) {
        if (!text) return;

        await fetch('/messages', {
            headers: {
                "Content-Type": "application/json"
            },
            method: "POST",
            body: JSON.stringify({
                text
            })
        });

        if (!App.getNick()) location.replace('/');

        this.text.value = "";
    }
}