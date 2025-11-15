/**
 * YouTube Watch Later Playlist Cleaner
 *
 * This script allows you to delete all items from your YouTube "Watch Later" playlist.
 * It automatically handles API errors (409 Conflict, 400 Bad Request) and lazy loading.
 *
 * @author lgourain
 * @license MIT
 */

(function () {
  "use strict";

  // Configuration
  const CONFIG = {
    deleteInterval: 100, // Delay between each deletion (ms)
    retryDelay: 2000, // Delay before retry after 409/400 error (ms)
    maxRetries: 3, // Maximum number of attempts per video
    checkScrollInterval: 500, // Lazy loading check interval (ms)
    statsUpdateInterval: 1000, // Stats update interval (ms)
  };

  // Script state
  const state = {
    currentIndex: 0,
    deletedCount: 0,
    errorCount: 0,
    retryCount: 0,
    isRunning: false,
    interval: null,
    statsInterval: null,
    startTime: null,
    lastButtonCount: 0,
  };

  /**
   * Display real-time statistics
   */
  function updateStats() {
    const buttons = document.querySelectorAll(
      "#contents yt-icon-button#button"
    );
    const elapsed = Math.floor((Date.now() - state.startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;

    console.clear();
    console.log("╔════════════════════════════════════════════════════════╗");
    console.log("║   YouTube Watch Later Playlist Cleaner - Running      ║");
    console.log("╠════════════════════════════════════════════════════════╣");
    console.log(
      `║ Vidéos restantes : ${buttons.length.toString().padEnd(33)}║`
    );
    console.log(
      `║ Vidéos supprimées : ${state.deletedCount.toString().padEnd(32)}║`
    );
    console.log(
      `║ Erreurs rencontrées : ${state.errorCount.toString().padEnd(30)}║`
    );
    console.log(
      `║ Tentatives de retry : ${state.retryCount.toString().padEnd(30)}║`
    );
    console.log(`║ Temps écoulé : ${`${minutes}m ${seconds}s`.padEnd(36)}║`);
    console.log("╠════════════════════════════════════════════════════════╣");
    console.log("║ Pour arrêter : tapez stopCleaning() dans la console   ║");
    console.log("╚════════════════════════════════════════════════════════╝");
  }

  /**
   * Attempt to delete a video with retry handling
   */
  async function deleteVideo(button, retryAttempt = 0) {
    try {
      // Open dropdown menu
      button.click();

      // Wait a bit for the menu to display
      await sleep(50);

      // Click on the 3rd menu item (Remove from playlist)
      const items = document.querySelector("tp-yt-paper-listbox#items");
      if (!items || !items.children[2]) {
        throw new Error("Menu items not found");
      }

      const removeFromPlaylistButton = items.children[2];
      removeFromPlaylistButton.click();

      state.deletedCount++;
      return true;
    } catch (error) {
      console.warn(
        `Error during deletion (attempt ${retryAttempt + 1}/${
          CONFIG.maxRetries
        }):`,
        error.message
      );

      if (retryAttempt < CONFIG.maxRetries) {
        state.retryCount++;
        await sleep(CONFIG.retryDelay);
        return deleteVideo(button, retryAttempt + 1);
      } else {
        state.errorCount++;
        console.error("Failed after multiple attempts, moving to next video");
        return false;
      }
    }
  }

  /**
   * Utility sleep function
   */
  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Check and handle lazy loading
   */
  function checkLazyLoading() {
    const buttons = document.querySelectorAll(
      "#contents yt-icon-button#button"
    );

    // If the number of buttons has decreased significantly, it's a good sign
    if (buttons.length < state.lastButtonCount) {
      state.lastButtonCount = buttons.length;
    }

    // If we're near the end of the visible list, scroll to load more
    if (state.currentIndex >= buttons.length - 10 && buttons.length > 0) {
      const lastVideo = buttons[buttons.length - 1];
      lastVideo.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }

  /**
   * Main deletion loop
   */
  async function deleteLoop() {
    const buttons = document.querySelectorAll(
      "#contents yt-icon-button#button"
    );

    // Check if there are any videos left
    if (buttons.length === 0) {
      console.log("\n✅ All visible videos have been deleted!");
      console.log(
        "💡 If the playlist is not empty, reload the page and restart the script."
      );
      stopCleaning();
      return;
    }

    // Always target the first button (because after deletion, indices change)
    const button = buttons[0];

    if (button) {
      await deleteVideo(button);
      checkLazyLoading();
    }
  }

  /**
   * Start cleaning the playlist
   */
  function startCleaning() {
    if (state.isRunning) {
      console.warn("⚠️  The script is already running!");
      return;
    }

    const buttons = document.querySelectorAll(
      "#contents yt-icon-button#button"
    );
    if (buttons.length === 0) {
      console.error("❌ No videos found in the playlist.");
      console.log(
        "💡 Make sure you are on the page: https://www.youtube.com/playlist?list=WL"
      );
      return;
    }

    console.log("🚀 Starting playlist cleaning...");
    console.log(`📊 ${buttons.length} videos detected\n`);

    state.isRunning = true;
    state.startTime = Date.now();
    state.lastButtonCount = buttons.length;
    state.currentIndex = 0;
    state.deletedCount = 0;
    state.errorCount = 0;
    state.retryCount = 0;

    // Deletion loop
    state.interval = setInterval(deleteLoop, CONFIG.deleteInterval);

    // Stats display
    state.statsInterval = setInterval(updateStats, CONFIG.statsUpdateInterval);
    updateStats();
  }

  /**
   * Stop cleaning the playlist
   */
  function stopCleaning() {
    if (!state.isRunning) {
      console.warn("⚠️  The script is not running.");
      return;
    }

    clearInterval(state.interval);
    clearInterval(state.statsInterval);
    state.isRunning = false;

    const elapsed = Math.floor((Date.now() - state.startTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;

    console.log("\n╔════════════════════════════════════════════════════════╗");
    console.log("║   YouTube Watch Later Playlist Cleaner - Arrêté       ║");
    console.log("╠════════════════════════════════════════════════════════╣");
    console.log(
      `║ Vidéos supprimées : ${state.deletedCount.toString().padEnd(32)}║`
    );
    console.log(
      `║ Erreurs rencontrées : ${state.errorCount.toString().padEnd(30)}║`
    );
    console.log(
      `║ Tentatives de retry : ${state.retryCount.toString().padEnd(30)}║`
    );
    console.log(`║ Temps total : ${`${minutes}m ${seconds}s`.padEnd(38)}║`);
    console.log("╠════════════════════════════════════════════════════════╣");
    console.log("║ Pour relancer : tapez startCleaning() dans la console ║");
    console.log("╚════════════════════════════════════════════════════════╝\n");
  }

  // Expose functions globally
  window.startCleaning = startCleaning;
  window.stopCleaning = stopCleaning;

  // Display welcome message
  console.log("╔════════════════════════════════════════════════════════╗");
  console.log("║   YouTube Watch Later Playlist Cleaner - Loaded       ║");
  console.log("╠════════════════════════════════════════════════════════╣");
  console.log("║ Available commands:                                    ║");
  console.log("║  • startCleaning() - Start cleaning                    ║");
  console.log("║  • stopCleaning()  - Stop cleaning                     ║");
  console.log("╚════════════════════════════════════════════════════════╝\n");
})();
