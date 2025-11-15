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
    deleteInterval: {
      min: 1500, // Minimum delay between deletions (ms)
      max: 3000, // Maximum delay between deletions (ms)
    },
    menuOpenDelay: {
      min: 150, // Minimum delay for menu to open (ms)
      max: 300, // Maximum delay for menu to open (ms)
    },
    clickDelay: {
      min: 100, // Minimum delay before clicking remove button (ms)
      max: 250, // Maximum delay before clicking remove button (ms)
    },
    retryDelay: 5000, // Delay before retry after 409/400 error (ms)
    maxRetries: 3, // Maximum number of attempts per video
    pauseAfterErrors: {
      threshold: 3, // Number of consecutive errors before pause
      duration: 30000, // Pause duration (ms) - 30 seconds
    },
    statsUpdateInterval: 1000, // Stats update interval (ms)
  };

  /**
   * Generate a random delay between min and max
   */
  function randomDelay(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // Script state
  const state = {
    currentIndex: 0,
    deletedCount: 0,
    errorCount: 0,
    consecutiveErrors: 0,
    retryCount: 0,
    isRunning: false,
    isPaused: false,
    interval: null,
    statsInterval: null,
    startTime: null,
    lastButtonCount: 0,
    totalPausedTime: 0,
    lastPauseStart: null,
  };

  /**
   * Display real-time statistics
   */
  function updateStats() {
    const buttons = document.querySelectorAll(
      "#contents yt-icon-button#button"
    );
    const elapsed = Math.floor(
      (Date.now() - state.startTime - state.totalPausedTime) / 1000
    );
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;

    // Calculate average speed (videos per hour)
    const videosPerHour =
      elapsed > 0 ? Math.floor((state.deletedCount / elapsed) * 3600) : 0;

    console.clear();
    console.log("╔════════════════════════════════════════════════════════╗");
    console.log("║   YouTube Watch Later Playlist Cleaner - Running      ║");
    console.log("╠════════════════════════════════════════════════════════╣");
    console.log(`║ Videos remaining: ${buttons.length.toString().padEnd(34)}║`);
    console.log(
      `║ Videos deleted: ${state.deletedCount.toString().padEnd(36)}║`
    );
    console.log(
      `║ Errors encountered: ${state.errorCount.toString().padEnd(32)}║`
    );
    console.log(`║ Retry attempts: ${state.retryCount.toString().padEnd(36)}║`);
    console.log(`║ Time elapsed: ${`${minutes}m ${seconds}s`.padEnd(38)}║`);
    console.log(
      `║ Average speed: ${`${videosPerHour} videos/hour`.padEnd(37)}║`
    );
    if (state.isPaused) {
      console.log("╠════════════════════════════════════════════════════════╣");
      console.log("║ ⏸️  PAUSED - Too many errors, waiting...              ║");
    }
    console.log("╠════════════════════════════════════════════════════════╣");
    console.log("║ To stop: type stopCleaning() in console               ║");
    console.log("╚════════════════════════════════════════════════════════╝");
  }

  /**
   * Attempt to delete a video with retry handling
   */
  async function deleteVideo(button, retryAttempt = 0) {
    try {
      // Open dropdown menu with human-like delay
      button.click();

      // Wait for the menu to display (variable delay)
      await sleep(
        randomDelay(CONFIG.menuOpenDelay.min, CONFIG.menuOpenDelay.max)
      );

      // Click on the 3rd menu item (Remove from playlist)
      const items = document.querySelector("tp-yt-paper-listbox#items");
      if (!items || !items.children[2]) {
        throw new Error("Menu items not found");
      }

      // Add another small delay before clicking remove button
      await sleep(randomDelay(CONFIG.clickDelay.min, CONFIG.clickDelay.max));

      const removeFromPlaylistButton = items.children[2];
      removeFromPlaylistButton.click();

      state.deletedCount++;
      state.consecutiveErrors = 0; // Reset consecutive errors on success
      return true;
    } catch (error) {
      console.warn(
        `Error during deletion (attempt ${retryAttempt + 1}/${
          CONFIG.maxRetries
        }):`,
        error.message
      );

      state.consecutiveErrors++;

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
    // Check if we need to pause due to too many consecutive errors
    if (
      state.consecutiveErrors >= CONFIG.pauseAfterErrors.threshold &&
      !state.isPaused
    ) {
      state.isPaused = true;
      state.lastPauseStart = Date.now();
      console.log(
        `\n⏸️  Pausing for ${CONFIG.pauseAfterErrors.duration / 1000}s due to ${
          state.consecutiveErrors
        } consecutive errors...`
      );

      setTimeout(() => {
        state.isPaused = false;
        state.totalPausedTime += Date.now() - state.lastPauseStart;
        state.consecutiveErrors = 0;
        console.log("▶️  Resuming...");
      }, CONFIG.pauseAfterErrors.duration);
      return;
    }

    // Skip if paused
    if (state.isPaused) {
      return;
    }

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
    state.consecutiveErrors = 0;
    state.retryCount = 0;
    state.isPaused = false;
    state.totalPausedTime = 0;
    state.lastPauseStart = null;

    // Deletion loop with variable interval
    const runDeletionLoop = async () => {
      await deleteLoop();
      if (state.isRunning) {
        const nextDelay = randomDelay(
          CONFIG.deleteInterval.min,
          CONFIG.deleteInterval.max
        );
        state.interval = setTimeout(runDeletionLoop, nextDelay);
      }
    };
    runDeletionLoop();

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

    clearTimeout(state.interval);
    clearInterval(state.statsInterval);
    state.isRunning = false;
    state.isPaused = false;

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
