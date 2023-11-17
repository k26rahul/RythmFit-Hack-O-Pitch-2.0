const log = console.log.bind(console);
// const error = console.error.bind(console);
const error = () => {};

log('App.js loaded 👍');

function getCurrentRoute() {
  return location.hash.slice(2);
}

const router = {
  routes: {},

  addRoute(route, handler) {
    this.routes[route] = handler;
  },

  run() {
    let currentRoute = getCurrentRoute();
    Object.entries(this.routes).forEach(([route, handler]) => {
      if (route === currentRoute) handler();
    });
  },
};

window.addEventListener('hashchange', () => {
  router.run();
});

const viewController = {
  views: {},

  addView(name, children) {
    this.views[name] = children;
  },

  show(name, childToShow) {
    Object.entries(this.views[name]).forEach(([child, el]) => {
      if (child === childToShow) el.classList.add('active');
      else el.classList.remove('active');
    });
  },
};

const selectedAsanas = {
  Bhujangasana: false,
  Parvatasana: false,
  Sarvangasana: false,
  Trikonasana: false,
  Virabhadrasana: false,
  Vrikshasana: false,
};

const yogaState = {
  startingTime: null,
  lastTime: null,
  poseTime: 15000,
  progress: 0,
  currentPose: 'Tree',
};

Object.assign(window, {
  log,
  error,
  router,
  viewController,
  selectedAsanas,
  yogaState,
});
