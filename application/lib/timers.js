({
  activeTimers: {},
  timerRestart(owner, data) {
    const timerId = this.activeTimers[owner._id];
    if (timerId) clearInterval(timerId);
    if (typeof owner.onTimerRestart === 'function') owner.onTimerRestart({ timerId, data });
    this.activeTimers[owner._id] = setInterval(async () => {
      if (typeof owner.onTimerTick === 'function') await owner.onTimerTick({ timerId, data });
    }, 1000);
  },
  timerDelete(owner) {
    const timerId = this.activeTimers[owner._id];
    if (timerId) clearInterval(timerId);
    if (typeof owner.onTimerDelete === 'function') owner.onTimerDelete({ timerId });
  },
});
