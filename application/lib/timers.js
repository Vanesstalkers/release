({
  activeTimers: {},
  timerRestart(owner, data) {
    const timerId = this.activeTimers[owner._id];
    if (timerId) clearInterval(timerId);
    if (typeof owner.onTimerRestart === 'function') owner.onTimerRestart({ timerId, data });
    if (owner.status === 'inProcess') {
      this.activeTimers[owner._id] = setInterval(() => {
        if (typeof owner.onTimerTick === 'function') owner.onTimerTick({ timerId, data });
      }, 1000);
    } else {
      console.log('!!! fake timer', owner);
    }
  },
  timerDelete(owner) {
    const timerId = this.activeTimers[owner._id];
    if (timerId) clearInterval(timerId);
    if (typeof owner.onTimerDelete === 'function') owner.onTimerDelete({ timerId });
  },
});
