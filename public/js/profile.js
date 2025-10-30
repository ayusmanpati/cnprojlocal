/*
 * public/js/profile.js
 *
 * UPDATED:
 * - WebSocket connection now includes `&purpose=profile`
 * in the query string. This tells the server to treat
 * this as an isolated action, not a full chat session.
 * - (Gemini Fix) Swapped localStorage to sessionStorage to make logins tab-specific.
 */
document.addEventListener("DOMContentLoaded", () => {
  // 1. Get Token and User Info
  // --- FIX ---
  // Read from sessionStorage
  const token = sessionStorage.getItem("chatToken");
  // --- END FIX ---
  if (!token) {
    window.location.href = "/"; // Redirect to login if no token
    return;
  }

  let userInfo;
  try {
    userInfo = JSON.parse(atob(token));
  } catch (e) {
    console.error("Invalid token:", e);
    // --- FIX ---
    // Remove from sessionStorage
    sessionStorage.removeItem("chatToken");
    // --- END FIX ---
    window.location.href = "/";
    return;
  }

  // 2. Get DOM Elements
  const nameInput = document.getElementById("name-input");
  const emailInput = document.getElementById("email-input");
  const roleBadge = document.getElementById("role-badge");
  const saveButton = document.getElementById("save-button");
  const cancelButton = document.getElementById("cancel-button");
  const logoutButton = document.getElementById("logout-button");
  const avatarSmall = document.getElementById("user-avatar-small");
  const avatarLarge = document.getElementById("user-avatar-large");
  const userNameHeader = document.getElementById("user-name-header");
  const userEmailSubheader = document.getElementById("user-email-subheader");

  // 3. Populate Form Function
  function populateForm() {
    nameInput.value = userInfo.name || "";
    emailInput.value = userInfo.email;
    roleBadge.textContent = userInfo.role;
    userNameHeader.textContent = userInfo.name;
    userEmailSubheader.textContent = userInfo.email;

    const avatarUrl = `url('${userInfo.avatar}')`;
    avatarSmall.style.backgroundImage = avatarUrl;
    avatarLarge.style.backgroundImage = avatarUrl;
  }

  populateForm(); // Initial population

  // 4. "Cancel" Button Logic
  cancelButton.addEventListener("click", () => {
    populateForm(); // Just resets fields to original token data
  });

  // 5. "Logout" Button Logic
  logoutButton.addEventListener("click", () => {
    // --- FIX ---
    // Remove from sessionStorage
    sessionStorage.removeItem("chatToken");
    // --- END FIX ---
    window.location.href = "/";
  });

  // 6. "Save Changes" Button Logic (The core part)
  saveButton.addEventListener("click", async () => {
    const newName = nameInput.value;

    // Prevent saving if nothing changed
    if (newName === userInfo.name) {
      return;
    }

    saveButton.disabled = true;
    saveButton.textContent = "Saving...";

    // We open a *temporary* WebSocket connection just for this update
    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";

    // --- FIX: Add purpose=profile to the URL ---
    const socket = new WebSocket(
      `${wsProtocol}//${window.location.host}?token=${token}&purpose=profile`
    );
    // --- End Fix ---

    socket.onopen = () => {
      // Once connected, send the profile update
      socket.send(
        JSON.stringify({
          type: "profileUpdate",
          newName: newName,
        })
      );
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);

      // The server confirms the update and sends back a *new token*
      if (data.type === "profileUpdateSuccess") {
        // 1. Save the new token (which now has the new name)
        // --- FIX ---
        // Set in sessionStorage
        sessionStorage.setItem("chatToken", data.newToken);
        // --- END FIX ---
        userInfo = JSON.parse(atob(data.newToken)); // Update local user info

        // 2. Update the form
        populateForm();

        // 3. Give user feedback
        saveButton.textContent = "Saved!";
        setTimeout(() => {
          saveButton.disabled = false;
          saveButton.textContent = "Save Changes";
        }, 2000);

        // 4. Close this temporary connection
        socket.close();
      }
    };

    socket.onerror = (error) => {
      console.error("Profile update WebSocket error:", error);
      saveButton.disabled = false;
      saveButton.textContent = "Save Changes";
      // TODO: Show an error message to the user
    };
  });
});
