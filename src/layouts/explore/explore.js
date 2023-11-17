log('explore.js loaded 👍');

let ExploreEntry = document.querySelector('.explore-section.ExploreEntry');
let ExploreYogaIntro = document.querySelector(
  '.explore-section.ExploreYogaIntro'
);
let ExploreStage = document.querySelector('.explore-section.ExploreStage');
let ExploreBMI = document.querySelector('.explore-section.ExploreBMI');

viewController.addView('explore', {
  ExploreEntry,
  ExploreYogaIntro,
  ExploreStage,
  ExploreBMI,
});

window.playSound = async function playSound() {
  await import('https://cdn.jsdelivr.net/npm/howler@2.2.3/dist/howler.min.js');
  var sound = new Howl({
    // src: ['/videoplayback.m4a'],
    src: ['/WhatsApp Audio 2023-05-15 at 10.35.48 PM.mpeg'],
    autoplay: true,
    loop: true,
  });
  sound.seek(12);
  sound.play();
};
