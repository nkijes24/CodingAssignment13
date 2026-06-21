const STORAGE_KEY = "lootSplitterState";

let loot = [];
let partySize = 1;

let lootNameInput = document.getElementById("lootName");
let lootValueInput = document.getElementById("lootValue");
let quantityInput = document.getElementById("quantity");
let partySizeInput = document.getElementById("partySize");
let addLootButton = document.getElementById("addLootButton");
let splitLootButton = document.getElementById("splitLootButton");
let resetAllButton = document.getElementById("resetAllButton");
let lootRows = document.getElementById("lootRows");
let noLootMessage = document.getElementById("noLootMessage");
let totalLoot = document.getElementById("totalLoot");
let lootPerMember = document.getElementById("lootPerMember");
let totalsPanel = document.getElementById("totalsPanel");
let resultsSection = document.getElementById("resultsSection");
let message = document.getElementById("message");

addLootButton.addEventListener("click", addLoot);
splitLootButton.addEventListener("click", splitLoot);
resetAllButton.addEventListener("click", resetAll);
partySizeInput.addEventListener("input", changePartySize);

function saveState() {
  // State is saved as one object so loot and party size stay together as one lifecycle unit.
  let state = {
    loot: loot,
    partySize: partySize
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function restoreState() {
  let savedState = localStorage.getItem(STORAGE_KEY);

  if (savedState === null) {
    partySizeInput.value = partySize;
    return;
  }

  try {
    let parsedState = JSON.parse(savedState);

    if (typeof parsedState !== "object" || parsedState === null || !Array.isArray(parsedState.loot)) {
      loot = [];
      partySize = 1;
      partySizeInput.value = partySize;
      return;
    }

    let restoredLoot = [];

    // Each restored item is validated before entering application state.
    for (let i = 0; i < parsedState.loot.length; i++) {
      let currentItem = parsedState.loot[i];

      if (typeof currentItem === "object" && currentItem !== null) {
        let restoredItem = {
          name: String(currentItem.name).trim(),
          value: Number(currentItem.value),
          quantity: Number(currentItem.quantity)
        };

        if (isValidLootItem(restoredItem)) {
          restoredLoot.push(restoredItem);
        }
      }
    }

    loot = restoredLoot;

    if (isValidPartySize(Number(parsedState.partySize))) {
      partySize = Number(parsedState.partySize);
    } else {
      partySize = 1;
    }

    partySizeInput.value = partySize;
  } catch (error) {
    // Malformed saved data should never crash the app during page load.
    loot = [];
    partySize = 1;
    partySizeInput.value = partySize;
  }
}

function changePartySize() {
  let newPartySize = Number(partySizeInput.value);

  if (!isValidPartySize(newPartySize)) {
    message.innerText = "Please enter a valid party size of 1 or greater.";
    updateUI();
    return;
  }

  partySize = newPartySize;
  message.innerText = "Party size saved.";

  saveState();
  updateUI();
}

function addLoot() {
  let lootItem = {
    name: lootNameInput.value.trim(),
    value: Number(lootValueInput.value),
    quantity: Number(quantityInput.value)
  };

  if (!isValidLootItem(lootItem)) {
    message.innerText = "Please enter a loot name, a non-negative value, and a whole quantity of 1 or greater.";
    return;
  }

  loot.push(lootItem);

  saveState();

  lootNameInput.value = "";
  lootValueInput.value = "";
  quantityInput.value = "";
  message.innerText = "Loot added and saved.";

  updateUI();
}

function removeLoot(index) {
  loot.splice(index, 1);

  saveState();

  message.innerText = "Loot removed and saved.";
  updateUI();
}

function splitLoot() {
  updateUI();
  message.innerText = "Loot split calculated from current state.";
}

function resetAll() {
  loot = [];
  partySize = 1;

  localStorage.removeItem(STORAGE_KEY);

  partySizeInput.value = partySize;
  lootNameInput.value = "";
  lootValueInput.value = "";
  quantityInput.value = "";
  message.innerText = "All loot and saved data were reset.";

  updateUI();
}

function isValidLootItem(item) {
  return item.name !== "" &&
    !isNaN(item.value) &&
    item.value >= 0 &&
    !isNaN(item.quantity) &&
    item.quantity >= 1 &&
    Number.isInteger(item.quantity);
}

function isValidPartySize(size) {
  return !isNaN(size) &&
    size >= 1 &&
    Number.isInteger(size);
}

function updateUI() {
  let total = 0;
  let hasLoot = loot.length > 0;

  lootRows.innerHTML = "";
  partySizeInput.value = partySize;

  // Calculations stay inside updateUI so rendering remains tied to the current state.
  for (let i = 0; i < loot.length; i++) {
    total += loot[i].value * loot[i].quantity;
  }

  for (let i = 0; i < loot.length; i++) {
    let row = document.createElement("div");
    row.className = "loot-row";
    row.setAttribute("role", "row");

    let nameCell = document.createElement("div");
    nameCell.className = "loot-cell";
    nameCell.setAttribute("role", "cell");
    nameCell.innerText = loot[i].name;

    let valueCell = document.createElement("div");
    valueCell.className = "loot-cell";
    valueCell.setAttribute("role", "cell");
    valueCell.innerText = loot[i].value.toFixed(2);

    let quantityCell = document.createElement("div");
    quantityCell.className = "loot-cell";
    quantityCell.setAttribute("role", "cell");
    quantityCell.innerText = loot[i].quantity;

    let actionCell = document.createElement("div");
    actionCell.className = "loot-cell";
    actionCell.setAttribute("role", "cell");

    let removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.innerText = "Remove";
    removeButton.setAttribute("aria-label", "Remove " + loot[i].name);

    removeButton.addEventListener("click", function () {
      removeLoot(i);
    });

    actionCell.appendChild(removeButton);
    row.appendChild(nameCell);
    row.appendChild(valueCell);
    row.appendChild(quantityCell);
    row.appendChild(actionCell);
    lootRows.appendChild(row);
  }

  if (hasLoot) {
    noLootMessage.classList.add("hidden");
    totalsPanel.classList.remove("hidden");
    splitLootButton.disabled = false;
    resultsSection.classList.remove("hidden");
    lootPerMember.innerText = (total / partySize).toFixed(2);
  } else {
    noLootMessage.classList.remove("hidden");
    totalsPanel.classList.add("hidden");
    splitLootButton.disabled = true;
    resultsSection.classList.add("hidden");
    lootPerMember.innerText = "0.00";
  }

  totalLoot.innerText = total.toFixed(2);
}

restoreState();
updateUI();
