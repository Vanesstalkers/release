const events = {};
function addEvents(self) {
  // все эти манипуляциии для того, чтобы внутри функций в self остался vue-компонент, но при этом сохранилась бы ссылка на функцию для корректного удаления ее в removeEvents
  Object.assign(events, {
    resizeBG(event) {
      const bgHeight = 1024;
      const bgWidth = 2048;
      self.bg.top = window.innerHeight / 2 - bgHeight / 2;
      self.bg.left = window.innerWidth / 2 - bgWidth / 2;
      self.bg.scale = Math.max(window.innerHeight / bgHeight, window.innerWidth / bgWidth);
    },
  });

  window.addEventListener('resize', events.resizeBG);
}

function removeEvents() {
  window.removeEventListener('resize', events.resizeBG);
}

export { addEvents, removeEvents, events };
