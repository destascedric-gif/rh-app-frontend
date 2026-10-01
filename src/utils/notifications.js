// À appeler après avoir traité une demande (congé, pointage) : la cloche de
// la barre du haut recharge alors son compteur (voir NotificationBell).
export const notifyRequestsChanged = () => {
  window.dispatchEvent(new Event('orgaly:notifications-changed'));
};
