document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");
  let hideMessageTimeout;

  const showMessage = (text, type = "info") => {
    messageDiv.textContent = text;
    messageDiv.className = `message ${type}`;
    messageDiv.classList.remove("hidden");

    if (hideMessageTimeout) {
      clearTimeout(hideMessageTimeout);
    }

    hideMessageTimeout = setTimeout(() => {
      messageDiv.classList.add("hidden");
    }, 5000);
  };

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities");
      const activities = await response.json();

      // Clear previous entries
      activitiesList.innerHTML = "";
      activitySelect.innerHTML = '<option value="">-- Select an activity --</option>';

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;
        const participantsList =
          details.participants && details.participants.length
            ? details.participants
                .map(
                  (participantEmail) => `
              <li class="participant-item" data-email="${participantEmail}">
                <span class="participant-email">${participantEmail}</span>
                <button
                  type="button"
                  class="remove-participant"
                  data-activity="${name}"
                  data-email="${participantEmail}"
                  aria-label="Remove ${participantEmail} from ${name}"
                  title="Remove participant"
                >
                  <span class="remove-icon" aria-hidden="true"></span>
                </button>
              </li>
            `
                )
                .join("")
            : '<li class="participant-item no-participants">No participants yet. Be the first to join!</li>';

        activityCard.innerHTML = `
          <h4>${name}</h4>
          <p>${details.description}</p>
          <p><strong>Schedule:</strong> ${details.schedule}</p>
          <p><strong>Availability:</strong> ${spotsLeft} spots left</p>
          <div class="participants-section">
            <p class="participants-title">Participants</p>
            <ul class="participants-list">
              ${participantsList}
            </ul>
          </div>
        `;

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        showMessage(result.message, "success");
        signupForm.reset();
        fetchActivities();
      } else {
        showMessage(result.detail || "An error occurred", "error");
      }
    } catch (error) {
      console.error("Error signing up:", error);
      showMessage("Failed to sign up. Please try again.", "error");
    }
  });

  // Handle participant removal
  activitiesList.addEventListener("click", async (event) => {
    const deleteButton = event.target.closest(".remove-participant");

    if (!deleteButton) {
      return;
    }

    const { activity, email } = deleteButton.dataset;

    if (!activity || !email) {
      return;
    }

    deleteButton.disabled = true;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/participants/${encodeURIComponent(email)}`,
        { method: "DELETE" }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || "Failed to remove participant");
      }

      showMessage(result.message, "success");
      fetchActivities();
    } catch (error) {
      console.error("Error removing participant:", error);
      showMessage(error.message || "Failed to remove participant", "error");
    } finally {
      deleteButton.disabled = false;
    }
  });

  // Initialize app
  fetchActivities();
});
