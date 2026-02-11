const ticketInput = document.querySelector('#ticketCount');
const generateBtn = document.querySelector('#generate');
const rerollBtn = document.querySelector('#reroll');
const clearBtn = document.querySelector('#clear');
const copyBtn = document.querySelector('#copy');
const ticketsEl = document.querySelector('#tickets');
const metaEl = document.querySelector('#meta');
const sortedToggle = document.querySelector('#sorted');
const uniqueToggle = document.querySelector('#uniqueSets');
const steppers = document.querySelectorAll('[data-step]');

const MAX_NUMBER = 45;
const NUMBERS_PER_TICKET = 6;
const MAX_TICKETS = 10;

const state = {
  tickets: [],
  lastConfig: null,
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const formatTime = () => {
  const now = new Date();
  return now.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

const getRandomNumbers = () => {
  const numbers = new Set();
  while (numbers.size < NUMBERS_PER_TICKET) {
    numbers.add(Math.floor(Math.random() * MAX_NUMBER) + 1);
  }
  return Array.from(numbers);
};

const makeTicket = (sorted) => {
  const numbers = getRandomNumbers();
  const output = sorted ? numbers.sort((a, b) => a - b) : numbers;
  return {
    numbers: output,
    time: formatTime(),
  };
};

const buildTickets = (count, sorted, unique) => {
  const tickets = [];
  const seen = new Set();
  let guard = 0;

  while (tickets.length < count && guard < 2000) {
    const ticket = makeTicket(sorted);
    const key = ticket.numbers.join(',');

    if (!unique || !seen.has(key)) {
      tickets.push(ticket);
      seen.add(key);
    }
    guard += 1;
  }

  return tickets;
};

const renderTickets = () => {
  ticketsEl.innerHTML = '';

  state.tickets.forEach((ticket, index) => {
    const card = document.createElement('div');
    card.className = 'ticket';

    const numbers = document.createElement('div');
    numbers.className = 'numbers';

    ticket.numbers.forEach((number, i) => {
      const ball = document.createElement('span');
      ball.className = `ball ${i % 2 === 0 ? '' : 'alt'}`;
      ball.textContent = number.toString().padStart(2, '0');
      numbers.appendChild(ball);
    });

    const meta = document.createElement('div');
    meta.className = 'ticket-time';
    meta.textContent = `${index + 1}번 · ${ticket.time}`;

    card.appendChild(numbers);
    card.appendChild(meta);
    ticketsEl.appendChild(card);
  });

  if (state.tickets.length === 0) {
    metaEl.textContent = '아직 생성된 번호가 없습니다.';
    return;
  }

  const latestTime = state.tickets[state.tickets.length - 1].time;
  metaEl.textContent = `${state.tickets.length}장 생성 완료 · 마지막 생성 ${latestTime}`;
};

const updateTickets = (useLastConfig = false) => {
  const baseConfig = useLastConfig && state.lastConfig
    ? state.lastConfig
    : {
        count: clamp(Number.parseInt(ticketInput.value || '1', 10), 1, MAX_TICKETS),
        sorted: sortedToggle.checked,
        unique: uniqueToggle.checked,
      };

  ticketInput.value = baseConfig.count;
  sortedToggle.checked = baseConfig.sorted;
  uniqueToggle.checked = baseConfig.unique;

  state.lastConfig = baseConfig;
  state.tickets = buildTickets(baseConfig.count, baseConfig.sorted, baseConfig.unique);

  renderTickets();
};

const copyTickets = async () => {
  if (state.tickets.length === 0) {
    return;
  }

  const lines = state.tickets.map((ticket, idx) => {
    const nums = ticket.numbers.join(' ');
    return `${idx + 1}번: ${nums}`;
  });

  try {
    await navigator.clipboard.writeText(lines.join('\n'));
    copyBtn.textContent = '복사 완료!';
    setTimeout(() => {
      copyBtn.textContent = '전체 복사';
    }, 1500);
  } catch (err) {
    copyBtn.textContent = '복사 실패';
    setTimeout(() => {
      copyBtn.textContent = '전체 복사';
    }, 1500);
  }
};

steppers.forEach((btn) => {
  btn.addEventListener('click', () => {
    const step = Number.parseInt(btn.dataset.step, 10);
    const current = Number.parseInt(ticketInput.value || '1', 10);
    ticketInput.value = clamp(current + step, 1, MAX_TICKETS);
  });
});

generateBtn.addEventListener('click', () => updateTickets(false));
rerollBtn.addEventListener('click', () => updateTickets(true));
clearBtn.addEventListener('click', () => {
  state.tickets = [];
  renderTickets();
});
copyBtn.addEventListener('click', copyTickets);

renderTickets();
