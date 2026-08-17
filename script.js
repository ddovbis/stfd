const slogans = [
  'Sit happens. Let it.',
  'Your socks deserve a future.',
  'Pee like a gentleman, not a sprinkler.',
  'Real kings use the throne.',
  'Splash damage is not a love language.',
  'Aim is temporary. Hygiene is forever.',
  'Lower the body. Raise the standards.',
  'If you can scan a QR code, you can sit down.',
  'This bathroom has seen enough war.',
  'Take a seat. Save a relationship.'
];

const pledges = [
  'Excellent. The floor sends regards.',
  'Civilization advanced by 0.7%.',
  'Your bathroom karma is now positive.',
  'A quiet victory for socks everywhere.',
  'Welcome to the porcelain enlightenment.'
];

const line = document.querySelector('#line');
const more = document.querySelector('#more');
const pledge = document.querySelector('#pledge');
const microcopy = document.querySelector('#microcopy');

let index = 0;

function nextSlogan() {
  index = (index + 1) % slogans.length;
  line.animate([
    { opacity: 1, transform: 'translateY(0)' },
    { opacity: 0, transform: 'translateY(8px)' }
  ], { duration: 130, easing: 'ease-out' }).onfinish = () => {
    line.textContent = `“${slogans[index]}”`;
    line.animate([
      { opacity: 0, transform: 'translateY(-8px)' },
      { opacity: 1, transform: 'translateY(0)' }
    ], { duration: 180, easing: 'ease-out' });
  };
}

more.addEventListener('click', nextSlogan);
pledge.addEventListener('click', () => {
  microcopy.textContent = pledges[Math.floor(Math.random() * pledges.length)];
  pledge.textContent = 'Pledge accepted ✅';
});
