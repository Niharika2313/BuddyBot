document.addEventListener('DOMContentLoaded', function() {
    // --- Mobile Viewport Height Fix ---
    // Corrects the viewport height on mobile to account for browser UI elements.
    function setRealVh() {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--real-vh', `${vh}px`);
    }

    setRealVh();
    window.addEventListener('resize', setRealVh);

    // --- DOM Element References ---
    const settingsButton = document.getElementById('settings-button');
    const settingsDropdown = document.getElementById('settings-dropdown');
    const themeToggle = document.getElementById('theme-toggle');
    const clearChatButton = document.getElementById('clear-chat-button');
    const chatBox = document.getElementById('chat-box');
    const userInputElement = document.getElementById("user-input");
    const body = document.body;

    // --- Chatbot Specific Variables ---
    const initialBotMessage = "Hey there! I'm BuddyBot, your friendly assistant. How can I lend a hand today?";
    let loadingMessageDiv = null;
    let currentStep = null; // For multi-step conversations

    // --- Chat Display Functions ---

    /**
     * Appends a new message to the chat box.
     * @param {string} text - The message content (supports Markdown).
     * @param {string} className - CSS class for styling (e.g., "user-message", "bot-message").
     */
    function appendMessage(text, className) {
        let messageDiv = document.createElement("div");
        messageDiv.className = `message ${className}`;
        messageDiv.innerHTML = text;
        chatBox.appendChild(messageDiv);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    /**
     * Displays clickable options within the chat (e.g., "Yes/No" buttons).
     * @param {Array<string>} options - An array of strings for the option buttons.
     */
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

    // --- Backend Communication ---

    /**
     * Sends user input to the backend and handles the chatbot's response, including loading state and error handling.
     * @param {string} userInput - The message or action to send.
     */
    async function fetchResponse(userInput) {
        // Show "BuddyBot is typing..." indicator
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

            // Remove loading indicator
            if (loadingMessageDiv) {
                loadingMessageDiv.remove();
                loadingMessageDiv = null;
            }

            appendMessage(marked.parse(data.reply), "bot-message");

            // Handle multi-step cart confirmation
            if (currentStep === "add_to_cart") {
                appendMessage("Would you like to add these ingredients to your cart?", "bot-message");
                showOptions(["Yes", "No"]);
            }

        } catch (error) {
            console.error("Fetch Error:", error);
            if (loadingMessageDiv) {
                loadingMessageDiv.remove();
                loadingMessageDiv = null;
            }
            appendMessage("⚠️ Oops! BuddyBot can't reach the server right now. Please try again!", "bot-message");
        }
    }

    // --- User Input & Actions ---

    /**
     * Sends a message to the chatbot, either from the input field or a quick action.
     * @param {string|null} userInput - The message content. If null, it's from the input field.
     */
    window.sendMessage = async function(userInput = null) {
        if (userInput === null) {
            userInput = userInputElement.value.trim();
            if (userInput === "") return;
            appendMessage(userInput, "user-message");
            userInputElement.value = "";
        }

        // Clear active options if user types a new message
        const activeOptions = chatBox.querySelector('.options');
        if (activeOptions && currentStep !== "add_to_cart") {
            activeOptions.remove();
        }

        // Multi-step conversation logic (adapt or remove if not needed)
        if (currentStep === "budget") {
            fetchResponse(`Make a grocery list under ₹${userInput} for a week`);
            currentStep = null;
        } else if (currentStep === "ingredient_list") {
            fetchResponse(`Give the ingredient list for ${userInput}`);
            currentStep = "add_to_cart";
        } else if (currentStep === "add_to_cart") {
            if (userInput.toLowerCase() === "yes") {
                fetchResponse("Got it! Adding those ingredients to your cart for you.");
            } else {
                appendMessage("Okay, not adding to the cart for now.", "bot-message");
            }
            currentStep = null;
        } else {
            fetchResponse(userInput);
        }
    }

    /**
     * Handles clicks on quick action buttons, sending a predefined message to the chatbot.
     * @param {string} action - The text of the quick action button.
     */
    window.sendQuickMessage = function(action) {
        appendMessage(action, "user-message");

        // Map quick actions to backend prompts
        if (action === "Cheer me up!") {
            fetchResponse("Tell me a funny joke!");
            currentStep = null;
        } else if (action === "What's new today?") {
            fetchResponse("Give me a quick update on current events or interesting facts.");
            currentStep = null;
        } else if (action === "Got any fun facts?") {
            fetchResponse("Tell me a cool and random fun fact.");
            currentStep = null;
        } else if (action === "Help me decide...") {
            fetchResponse("I need a recommendation for something cool.");
            currentStep = null;
        }
    }

    // --- UI Event Listeners & Initialization ---

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
    if (savedTheme === 'light') {
        body.classList.add('light-mode');
        themeToggle.checked = false;
    } else {
        body.classList.remove('light-mode');
        themeToggle.checked = true;
    }

    clearChatButton.addEventListener('click', function() {
        chatBox.innerHTML = '';
        setupInitialChat();
        currentStep = null;
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

    setupInitialChat(); // Initialize chat on load
});