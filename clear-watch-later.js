/**
 * YouTube Watch Later Playlist Cleaner
 *
 * Ce script permet de supprimer tous les éléments de votre playlist "À regarder plus tard" YouTube.
 * Il gère automatiquement les erreurs d'API (409 Conflict, 400 Bad Request) et le lazy loading.
 *
 * @author lgourain
 * @license MIT
 */

(function () {
  "use strict";

  // Configuration
  const CONFIG = {
    deleteInterval: 100, // Délai entre chaque suppression (ms)
    retryDelay: 2000, // Délai avant retry après erreur 409/400 (ms)
    maxRetries: 3, // Nombre max de tentatives par vidéo
    checkScrollInterval: 500, // Intervalle de vérification du lazy loading (ms)
    statsUpdateInterval: 1000, // Intervalle de mise à jour des stats (ms)
  };

  // État du script
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
   * Affiche les statistiques en temps réel
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
   * Tente de supprimer une vidéo avec gestion des retries
   */
  async function deleteVideo(button, retryAttempt = 0) {
    try {
      // Ouvrir le menu dropdown
      button.click();

      // Attendre un peu que le menu s'affiche
      await sleep(50);

      // Cliquer sur le 3ème élément du menu (Retirer de la playlist)
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
        `Erreur lors de la suppression (tentative ${retryAttempt + 1}/${
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
        console.error(
          "Échec après plusieurs tentatives, passage à la vidéo suivante"
        );
        return false;
      }
    }
  }

  /**
   * Fonction sleep utilitaire
   */
  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Vérifie et gère le lazy loading
   */
  function checkLazyLoading() {
    const buttons = document.querySelectorAll(
      "#contents yt-icon-button#button"
    );

    // Si le nombre de boutons a diminué de manière significative, c'est bon signe
    if (buttons.length < state.lastButtonCount) {
      state.lastButtonCount = buttons.length;
    }

    // Si on arrive vers la fin de la liste visible, scroller pour charger plus
    if (state.currentIndex >= buttons.length - 10 && buttons.length > 0) {
      const lastVideo = buttons[buttons.length - 1];
      lastVideo.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }

  /**
   * Boucle principale de suppression
   */
  async function deleteLoop() {
    const buttons = document.querySelectorAll(
      "#contents yt-icon-button#button"
    );

    // Vérifier s'il reste des vidéos
    if (buttons.length === 0) {
      console.log("\n✅ Toutes les vidéos visibles ont été supprimées !");
      console.log(
        "💡 Si la playlist n'est pas vide, rechargez la page et relancez le script."
      );
      stopCleaning();
      return;
    }

    // Toujours cibler le premier bouton (car après suppression, les indices changent)
    const button = buttons[0];

    if (button) {
      await deleteVideo(button);
      checkLazyLoading();
    }
  }

  /**
   * Démarre le nettoyage de la playlist
   */
  function startCleaning() {
    if (state.isRunning) {
      console.warn("⚠️  Le script est déjà en cours d'exécution !");
      return;
    }

    const buttons = document.querySelectorAll(
      "#contents yt-icon-button#button"
    );
    if (buttons.length === 0) {
      console.error("❌ Aucune vidéo trouvée dans la playlist.");
      console.log(
        "💡 Assurez-vous d'être sur la page : https://www.youtube.com/playlist?list=WL"
      );
      return;
    }

    console.log("🚀 Démarrage du nettoyage de la playlist...");
    console.log(`📊 ${buttons.length} vidéos détectées\n`);

    state.isRunning = true;
    state.startTime = Date.now();
    state.lastButtonCount = buttons.length;
    state.currentIndex = 0;
    state.deletedCount = 0;
    state.errorCount = 0;
    state.retryCount = 0;

    // Boucle de suppression
    state.interval = setInterval(deleteLoop, CONFIG.deleteInterval);

    // Affichage des stats
    state.statsInterval = setInterval(updateStats, CONFIG.statsUpdateInterval);
    updateStats();
  }

  /**
   * Arrête le nettoyage de la playlist
   */
  function stopCleaning() {
    if (!state.isRunning) {
      console.warn("⚠️  Le script n'est pas en cours d'exécution.");
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

  // Exposer les fonctions globalement
  window.startCleaning = startCleaning;
  window.stopCleaning = stopCleaning;

  // Démarrage automatique
  console.log("╔════════════════════════════════════════════════════════╗");
  console.log("║   YouTube Watch Later Playlist Cleaner - Chargé       ║");
  console.log("╠════════════════════════════════════════════════════════╣");
  console.log("║ Commandes disponibles :                               ║");
  console.log("║  • startCleaning() - Démarre le nettoyage             ║");
  console.log("║  • stopCleaning()  - Arrête le nettoyage              ║");
  console.log("╚════════════════════════════════════════════════════════╝\n");

  // Démarrage automatique
  startCleaning();
})();
