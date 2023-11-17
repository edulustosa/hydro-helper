verifyDate();

// Parse localStorage data
const waterIntake = JSON.parse(localStorage.getItem("intake"));
let goal = Number(localStorage.getItem("goal")) || 0;
let notifActive = JSON.parse(localStorage.getItem("notification")) || false;

toggleTabs();

// Check if the current date differs from the stored date in localStorage
function verifyDate() {
  const today = new Date().getDate();
  const storageDay = Number(localStorage.getItem("day"));

  if (!storageDay || today !== storageDay) {
    localStorage.setItem("intake", JSON.stringify([]));
    localStorage.setItem("day", today);
  }
}

// Toggle functionality for intake and goal tabs
function toggleTabs() {
  setIntakeSection();

  const toggleIntake = document.querySelector(".intake-tab");
  const toggleGoal = document.querySelector(".goal-tab");

  const intakeSection = document.querySelector(".intake-section");
  const goalSection = document.querySelector(".goal-section");
  let tabActive = false;

  toggleIntake.addEventListener("click", () => {
    toggleGoal.classList.remove("active");
    toggleIntake.classList.add("active");

    goalSection.classList.add("hidden");
    intakeSection.classList.remove("hidden");

    updateGoalSpan();
  });

  toggleGoal.addEventListener("click", () => {
    toggleIntake.classList.remove("active");
    toggleGoal.classList.add("active");

    intakeSection.classList.add("hidden");
    goalSection.classList.remove("hidden");

    if (!tabActive) {
      setGoalSection();
      tabActive = true;
    }
  });
}

function setIntakeSection() {
  // Add water intake from localStorage
  if (waterIntake) {
    for (let intake of waterIntake) addNewIntake(intake);
    updateGoalSpan();
  }

  handleNotif();

  const selectMl = document.querySelector(".select-ml");
  const customMl = document.querySelector(".custom-ml");
  const waterForm = document.querySelector("form");
  let ml = 0;

  selectMl.addEventListener("input", () => {
    customMl.value = "";
    ml = Number(selectMl.value);
  });

  customMl.addEventListener("input", () => {
    selectMl.selectedIndex = 0;
    formatInput(customMl);
    ml = Number(customMl.value);
  });

  waterForm.addEventListener("submit", (e) => {
    e.preventDefault();

    if (ml) {
      waterIntake.push(ml);

      saveIntake();

      addNewIntake(ml);

      updateGoalSpan();

      goalAchieved();

      createAlarm();
    }
  });

  // Add water intake to the UI
  function addNewIntake(intake) {
    const waterInfoHTML = addWaterInfo(intake);
    const waterConsumption = document.querySelector(".water-consumption");

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = waterInfoHTML;

    const waterInfoNode = tempDiv.firstElementChild;
    handleRemove(waterInfoNode, intake);

    waterConsumption.appendChild(waterInfoNode);
  }

  // Generates HTML markup for displaying water intake information based on the provided ml
  function addWaterInfo(ml) {
    if (ml < 500) {
      return `
        <div class="intake-information">
          <span class="material-symbols-outlined glass"> water_full </span>
          <span class="water-quantity">${ml}ml</span>
          <button class="remove-btn">
            <span class="material-symbols-outlined remove-icon styled-icon"> remove </span>
          </button>
        </div>
      `;
    } else if (ml < 1000) {
      return `
        <div class="intake-information">
          <span class="material-symbols-outlined bottle"> water_bottle </span>
          <span class="water-quantity">${ml}ml</span>
          <button class="remove-btn">
            <span class="material-symbols-outlined remove-icon styled-icon"> remove </span>
          </button>
        </div>
      `;
    } else {
      return `
        <div class="intake-information">
          <span class="material-symbols-outlined bottle-lg">
            water_bottle_large
          </span>
          <span class="water-quantity">${ml}ml</span>
          <button class="remove-btn">
            <span class="material-symbols-outlined remove-icon styled-icon"> remove </span>
          </button>
        </div>
      `;
    }
  }

  // Handles the removal of a water intake information node and related operations.
  function handleRemove(node, intake) {
    const removeBtn = node.querySelector(".remove-btn");

    removeBtn.addEventListener("click", () => {
      waterIntake.splice(waterIntake.indexOf(intake), 1);

      saveIntake();

      node.remove();

      updateGoalSpan();

      createAlarm();
    });
  }
}

function setGoalSection() {
  const goalSpan = document.querySelectorAll(".goal")[1];
  if (goal) goalSpan.innerHTML = `${goal}ml`;

  const userWeight = document.querySelector(".user-weight");
  const customGoal = document.querySelector(".custom-goal");

  // Update the user's goal

  userWeight.addEventListener("input", () => {
    customGoal.value = "";
    formatInput(userWeight, true);

    if (userWeight.value) {
      const weight = Number(userWeight.value);
      goal = Math.round(weight * 40);
      goalSpan.innerHTML = `${goal}ml`;
    } else {
      goalSpan.innerHTML = "--";
      goal = 0;
    }

    saveGoal();
  });

  customGoal.addEventListener("input", () => {
    userWeight.value = "";
    formatInput(customGoal);

    if (customGoal.value) {
      goal = Number(customGoal.value);
      goalSpan.innerHTML = `${goal}ml`;
    } else {
      goalSpan.innerHTML = "--";
      goal = 0;
    }

    saveGoal();
  });
}

// Display the user's current water intake and their goal
function updateGoalSpan() {
  const goalSpan = document.querySelectorAll(".goal")[0];
  const sumIntake = waterIntake.reduce((sum, ml) => sum + ml, 0);

  if (goal) {
    goalSpan.innerHTML = `${sumIntake}ml / ${goal}ml`;
  } else {
    goalSpan.innerHTML = `${sumIntake}ml / --`;
  }
}

function saveIntake() {
  localStorage.setItem("intake", JSON.stringify(waterIntake));
}

function saveGoal() {
  localStorage.setItem("goal", goal);
}

function createAlarm() {
  cancelAlarm();

  if (!goalAchieved() && notifActive) {
    chrome.alarms.create("Drink Water", {
      delayInMinutes: 90,
      periodInMinutes: 90,
    });
  }
}

function cancelAlarm() {
  chrome.alarms.clear("Drink Water");
}

// Checks if the goal is achieved based on current intake and goal data
function goalAchieved() {
  const sumIntake = waterIntake.reduce((sum, ml) => sum + ml, 0);
  if (sumIntake >= goal) {
    cancelAlarm();
    return true;
  }
  return false;
}

function handleNotif() {
  const notifBtn = document.querySelector(".notification-btn");
  const notifIconOff = document.querySelector(".notifications_off");
  const notifIconActive = document.querySelector(".notifications_active");

  if (notifActive) {
    createAlarm();
    removeHoverEffect();
  } else {
    addHoverEffect();
  }

  notifBtn.addEventListener("click", () => {
    notifActive = !notifActive;
    saveNotif();

    if (notifActive) {
      createAlarm();
      removeHoverEffect();
    } else {
      cancelAlarm();
      addHoverEffect();
    }
  });

  function saveNotif() {
    localStorage.setItem("notification", JSON.stringify(notifActive));
  }

  function addHoverEffect() {
    notifBtn.addEventListener("mouseover", handleMouseOver);
    notifBtn.addEventListener("mouseout", handleMouseOut);
    notifBtn.style.backgroundColor = "";
  }

  function removeHoverEffect() {
    notifBtn.removeEventListener("mouseover", handleMouseOver);
    notifBtn.removeEventListener("mouseout", handleMouseOut);
    handleMouseOver();
    notifBtn.style.backgroundColor = "lightskyblue";
  }

  function handleMouseOver() {
    notifIconOff.classList.add("hidden");
    notifIconActive.classList.remove("hidden");
  }

  function handleMouseOut() {
    notifIconOff.classList.remove("hidden");
    notifIconActive.classList.add("hidden");
  }
}

// Formats user input to allow only numerical values
function formatInput(input, point = false) {
  if (point) {
    input.value = input.value.replace(/[^0-9.]/g, "");

    if ((input.value.match(/\./g) || []).length > 1) {
      input.value = input.value.substring(0, input.value.lastIndexOf("."));
    }
  } else {
    input.value = input.value.replace(/[^0-9]/g, "");
  }
}
