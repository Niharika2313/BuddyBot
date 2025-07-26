document.addEventListener('DOMContentLoaded', function() {
  const settingsButton = document.getElementById('settings-button');
  const settingsDropdown = document.getElementById('settings-dropdown');
  const themeToggle = document.getElementById('theme-toggle');
  const body = document.body;

  settingsButton.addEventListener('click', function(event) {
    event.stopPropagation();
    settingsDropdown.classList.toggle('show');
  });

  window.addEventListener('click', function(event) {
    if (settingsDropdown.classList.contains('show')) {
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

  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'light') {
    body.classList.add('light-mode');
    themeToggle.checked = false;
  } else {
    body.classList.remove('light-mode');
    themeToggle.checked = true;
  }

  let currentStep = null;

  window.handleKeyPress = function(event) {
    if (event.key === "Enter") {
      sendMessage();
    }
  }

  window.sendMessage = async function(userInput = null) {
    if (!userInput) {
      const userInputElement = document.getElementById("user-input");
      userInput = userInputElement.value.trim();
      if (userInput === "") return;
      appendMessage(userInput, "user-message");
      userInputElement.value = "";
    }

    if (currentStep === "budget") {
      fetchResponse(`Make a grocery list under ₹${userInput} for a week`);
      currentStep = null;
    } else if (currentStep === "ingredient_list") {
      fetchResponse(`Give the ingredient list for ${userInput}`);
      currentStep = "add_to_cart";
    } else if (currentStep === "add_to_cart") {
      if (userInput.toLowerCase() === "yes") {
        fetchResponse("Adding ingredients to cart.");
      } else {
        appendMessage("Okay, not adding to the cart.", "bot-message");
      }
      currentStep = null;
    } else {
      fetchResponse(userInput);
    }
  }

  window.sendQuickMessage = function(action) {
    appendMessage(action, "user-message");

    if (action === "Budget List") {
      appendMessage("Enter your budget (₹):", "bot-message");
      currentStep = "budget";
    } else if (action === "Get Ingredient List") {
      appendMessage("Enter the recipe name:", "bot-message");
      currentStep = "ingredient_list";
    } else {
      fetchResponse(action);
    }
  }

  async function fetchResponse(userInput) {
    try {
      let response = await fetch("/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userInput })
      });
      let data = await response.json();
      appendMessage(marked.parse(data.reply), "bot-message");

      if (currentStep === "add_to_cart") {
        appendMessage("Would you like to add these ingredients to your cart?", "bot-message");
        showOptions(["Yes", "No"]);
      }
    } catch (error) {
      console.error("Fetch Error:", error);
      appendMessage("⚠️ Error: Could not reach the server.", "bot-message");
    }
  }

  function appendMessage(text, className) {
    let chatBox = document.getElementById("chat-box");
    let messageDiv = document.createElement("div");
    messageDiv.className = `message ${className}`;
    messageDiv.innerHTML = text;
    chatBox.appendChild(messageDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  function showOptions(options) {
    let chatBox = document.getElementById("chat-box");
    let optionsDiv = document.createElement("div");
    optionsDiv.className = "options";

    options.forEach(option => {
      let btn = document.createElement("button");
      btn.className = "option-btn";
      btn.innerText = option;
      btn.onclick = function () {
        appendMessage(option, "user-message");
        sendMessage(option.toLowerCase());
        optionsDiv.remove();
      };
      optionsDiv.appendChild(btn);
    });

    chatBox.appendChild(optionsDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
  }
});