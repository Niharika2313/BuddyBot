let currentStep = null;

function handleKeyPress(event) {
  if (event.key === "Enter") {
    sendMessage();
  }
}

async function sendMessage(userInput = null) {
  if (!userInput) {
    userInput = document.getElementById("user-input").value.trim();
    if (userInput === "") return;
    appendMessage(userInput, "user-message");
    document.getElementById("user-input").value = "";
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

function sendQuickMessage(action) {
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
    };
    optionsDiv.appendChild(btn);
  });

  chatBox.appendChild(optionsDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
}
