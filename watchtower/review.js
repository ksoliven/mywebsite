const inspectionSelect = document.querySelector('#inspection');
const frame = document.querySelector('#inspection-frame');
const image = document.querySelector('#inspection-image');
const overlays = document.querySelector('#overlays');
const loadStatus = document.querySelector('#load-status');
const findings = document.querySelector('#findings');
const summary = document.querySelector('#findings-summary');
const actions = document.querySelector('#review-actions');
const confirmButton = document.querySelector('#confirm');
const dismissButton = document.querySelector('#dismiss');

let inspection;
let selectedId;
const decisions = new Map();

function decisionKey(id) {
  return `${inspection.id}/${id}`;
}

function statusFor(id) {
  return decisions.get(decisionKey(id)) ?? 'Needs review';
}

function selectFinding(id) {
  selectedId = id;
  renderReview();
}

function renderReview() {
  const { detections } = inspection;
  const activeElement = document.activeElement;
  const activeFinding = activeElement.dataset.finding;
  const focusContainer = activeElement.parentElement === overlays ? overlays : findings;

  overlays.replaceChildren();
  findings.replaceChildren();

  for (const detection of detections) {
    const { id, label, bounds } = detection;
    const status = statusFor(id);
    const selected = String(id === selectedId);
    const box = document.createElement('button');
    box.type = 'button';
    box.className = 'detection';
    box.dataset.finding = id;
    box.dataset.status = status.toLowerCase();
    box.setAttribute('aria-label', `${label}, ${status}`);
    box.setAttribute('aria-pressed', selected);
    for (const [property, value] of Object.entries(bounds)) {
      box.style[property] = `${value}%`;
    }
    box.addEventListener('click', () => selectFinding(id));
    overlays.append(box);

    const row = document.createElement('li');
    const button = document.createElement('button');
    const statusLabel = document.createElement('span');
    button.type = 'button';
    button.className = 'finding';
    button.dataset.finding = id;
    button.dataset.status = status.toLowerCase();
    button.setAttribute('aria-pressed', selected);
    statusLabel.textContent = status;
    button.append(label, statusLabel);
    button.addEventListener('click', () => selectFinding(id));
    row.append(button);
    findings.append(row);
  }

  const pending = detections.filter(({ id }) => statusFor(id) === 'Needs review').length;
  summary.textContent = detections.length
    ? `${pending} to review · ${detections.length - pending} reviewed`
    : 'No sample detections in this image.';

  actions.hidden = selectedId === undefined;
  confirmButton.setAttribute('aria-pressed', String(statusFor(selectedId) === 'Confirmed'));
  dismissButton.setAttribute('aria-pressed', String(statusFor(selectedId) === 'Dismissed'));

  if (activeFinding) {
    const replacement = Array.from(focusContainer.querySelectorAll('[data-finding]'))
      .find(button => button.dataset.finding === activeFinding);
    replacement?.focus({ preventScroll: true });
  }
}

function recordDecision(status) {
  decisions.set(decisionKey(selectedId), status);
  renderReview();
}

function showInspection(nextInspection) {
  inspection = nextInspection;
  selectedId = undefined;
  image.alt = inspection.alt;
  image.src = inspection.image;
  renderReview();
}

async function initialize() {
  try {
    const response = await fetch('./samples.json');
    if (!response.ok) throw new Error('Could not load inspections');
    const samples = await response.json();
    for (const sample of samples) {
      inspectionSelect.add(new Option(sample.label, sample.id));
    }
    inspectionSelect.addEventListener('change', () => {
      showInspection(samples.find(sample => sample.id === inspectionSelect.value));
    });
    confirmButton.addEventListener('click', () => recordDecision('Confirmed'));
    dismissButton.addEventListener('click', () => recordDecision('Dismissed'));

    showInspection(samples[0]);
    loadStatus.hidden = true;
    frame.hidden = false;
    inspectionSelect.disabled = false;
  } catch {
    loadStatus.textContent = 'Sample inspections could not be loaded. Refresh to try again.';
  }
}

initialize();
