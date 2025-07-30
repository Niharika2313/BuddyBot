document.addEventListener('DOMContentLoaded', function() {
    const settingsButton = document.getElementById('settings-button');
    const settingsDropdown = document.getElementById('settings-dropdown');
    const themeToggle = document.getElementById('theme-toggle');
    const clearChatButton = document.getElementById('clear-chat-button');
    const chatBox = document.getElementById('chat-box');
    const userInputElement = document.getElementById("user-input");
    const body = document.body;

    const initialBotMessage = "Hey there! I'm BuddyBot, your friendly assistant. How can I lend a hand today?";
    let loadingMessageDiv = null;

    function appendMessage(text, className) {
        let messageDiv = document.createElement("div");
        messageDiv.className = `message ${className}`;
        messageDiv.innerHTML = text;
        chatBox.appendChild(messageDiv);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    function showOptions(options) {
        const existingOptions = chatBox.querySelector('.options');
        if (existingOptions) {
            existingOptions.remove();
        }

        let optionsDiv = document.createElement("div");
        optionsDiv.className = "options";

        options.forEach(option => {
            let btn = document.createElement("button");
            btn.className = "option-btn quick-actions-button";
            btn.innerText = option;
            btn.onclick = function() {
                appendMessage(option, "user-message");
                sendMessage(option.toLowerCase());
                optionsDiv.remove();
            };
            optionsDiv.appendChild(btn);
        });

        chatBox.appendChild(optionsDiv);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    async function fetchResponse(userInput) {
        loadingMessageDiv = document.createElement("div");
        loadingMessageDiv.className = "message bot-message loading";
        loadingMessageDiv.innerHTML = "BuddyBot is typing...";
        chatBox.appendChild(loadingMessageDiv);
        chatBox.scrollTop = chatBox.scrollHeight;

        try {
            const response = await fetch("/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: userInput })
            });

            if (!response.ok) {
                throw new Error(`Server responded with status: ${response.status}`);
            }

            const data = await response.json();

            if (loadingMessageDiv) {
                loadingMessageDiv.remove();
                loadingMessageDiv = null;
            }

            appendMessage(marked.parse(data.reply), "bot-message");

        } catch (error) {
            console.error("Fetch Error:", error);
            if (loadingMessageDiv) {
                loadingMessageDiv.remove();
                loadingMessageDiv = null;
            }
            appendMessage("⚠️ Oops! BuddyBot can't reach the server right now. Please try again!", "bot-message");
        }
    }

    window.sendMessage = async function(userInput = null) {
        if (userInput === null) {
            userInput = userInputElement.value.trim();
            if (userInput === "") return;
            appendMessage(userInput, "user-message");
            userInputElement.value = "";
        }
        fetchResponse(userInput);
    }

    window.sendQuickMessage = function(action) {
        appendMessage(action, "user-message");

        if (action === "Cheer me up!") {
            fetchResponse("Tell me a funny joke!");
        } else if (action === "What's new today?") {
            fetchResponse("Give me a quick update on current events or interesting facts.");
        } else if (action === "Got any fun facts?") {
            fetchResponse("Tell me a cool and random fun fact.");
        } else if (action === "Help me decide...") {
            fetchResponse("I need a recommendation for something cool.");
        }
    }

    settingsButton.addEventListener('click', function(event) {
        event.stopPropagation();
        settingsDropdown.classList.toggle('show');
    });

    window.addEventListener('click', function(event) {
        if (settingsDropdown.classList.contains('show') && !settingsButton.contains(event.target)) {
            settingsDropdown.classList.remove('show');
        }
    });

    themeToggle.addEventListener('change', function() {
        if (themeToggle.checked) {
            body.classList.remove('light-mode');
            localStorage.setItem('theme', 'dark');
        } else {
            body.classList.add('light-mode');
            localStorage.setItem('theme', 'light');
        }
    });

    // Load saved theme on startup
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === null) {
        // No theme saved, check system preference
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            body.classList.remove('light-mode');
            themeToggle.checked = true;
        } else {
            body.classList.add('light-mode');
            themeToggle.checked = false;
        }
    } else {
        // Theme found in localStorage, use it
        if (savedTheme === 'light') {
            body.classList.add('light-mode');
            themeToggle.checked = false;
        } else {
            body.classList.remove('light-mode');
            themeToggle.checked = true;
        }
    }

    clearChatButton.addEventListener('click', function() {
        chatBox.innerHTML = '';
        setupInitialChat();
        settingsDropdown.classList.remove('show');
    });

    userInputElement.addEventListener('keypress', function(event) {
        if (event.key === "Enter") {
            sendMessage();
        }
    });

    function setupInitialChat() {
        appendMessage(initialBotMessage, "bot-message");
    }

    setupInitialChat();
});