document.addEventListener('DOMContentLoaded', function() {
    const settingsButton = document.getElementById('settings-button');
    const settingsDropdown = document.getElementById('settings-dropdown');
    const themeToggle = document.getElementById('theme-toggle');
    const clearChatButton = document.getElementById('clear-chat-button');
    const chatBox = document.getElementById('chat-box');
    const userInputElement = document.getElementById("user-input");
    const body = document.body;

    const initialBotMessage = "Hey there! I'm BuddyBot, your friendly assistant. How can I lend a hand today?";
    let loadingMessageDiv = null; // Used for loading indicator

    // --- Chat Display Functions ---

    function appendMessage(text, className) {
        let messageDiv = document.createElement("div");
        messageDiv.className = `message ${className}`;
        messageDiv.innerHTML = text; // For Markdown parsing
        chatBox.appendChild(messageDiv);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    function showOptions(options) {
        // Remove existing options to prevent duplicates
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
                optionsDiv.remove(); // Remove options after selection
            };
            optionsDiv.appendChild(btn);
        });

        chatBox.appendChild(optionsDiv);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    // --- Backend Communication ---

    async function fetchResponse(userInput) {
        // Show loading indicator
        loadingMessageDiv = document.createElement("div");
        loadingMessageDiv.className = "message bot-message loading";
        loadingMessageDiv.innerHTML = "BuddyBot is typing...";
        chatBox.appendChild(loadingMessageDiv);
        chatBox.scrollTop = chatBox.scrollHeight;

        try {
            let response = await fetch("/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: userInput })
            });

            if (!response.ok) {
                throw new Error(`Server responded with status: ${response.status}`);
            }

            let data = await response.json();

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

    let currentStep = null; // For multi-step conversations

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

        // Multi-step conversation logic
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