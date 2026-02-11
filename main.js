const ingredientsInput = document.querySelector('#ingredients');
const generateBtn = document.querySelector('#generate');
const resetBtn = document.querySelector('#reset');
const copyBtn = document.querySelector('#copy');
const scheduleEl = document.querySelector('#schedule');
const metaEl = document.querySelector('#meta');

const DAYS = ['월요일', '화요일', '수요일', '목요일', '금요일'];

const RECIPES = [
  {
    name: '김치볶음밥',
    ingredients: ['김치', '밥', '달걀', '대파', '식용유', '간장'],
  },
  {
    name: '된장찌개',
    ingredients: ['된장', '두부', '애호박', '감자', '양파', '대파', '마늘'],
  },
  {
    name: '간장계란밥',
    ingredients: ['밥', '달걀', '간장', '버터', '김'],
  },
  {
    name: '닭가슴살 샐러드',
    ingredients: ['닭가슴살', '양상추', '방울토마토', '오이', '올리브오일', '소금'],
  },
  {
    name: '불고기',
    ingredients: ['소고기', '양파', '대파', '간장', '설탕', '마늘', '참기름'],
  },
  {
    name: '감자조림',
    ingredients: ['감자', '간장', '설탕', '식용유', '물엿'],
  },
  {
    name: '오믈렛',
    ingredients: ['달걀', '우유', '양파', '버터', '소금', '후추'],
  },
  {
    name: '돼지고기 김치찌개',
    ingredients: ['돼지고기', '김치', '두부', '양파', '대파', '고춧가루'],
  },
  {
    name: '토마토 파스타',
    ingredients: ['파스타면', '토마토소스', '양파', '올리브오일', '마늘', '치즈'],
  },
  {
    name: '참치마요 덮밥',
    ingredients: ['참치캔', '밥', '마요네즈', '간장', '김'],
  },
  {
    name: '야채볶음',
    ingredients: ['양파', '당근', '파프리카', '애호박', '간장', '식용유'],
  },
  {
    name: '비빔국수',
    ingredients: ['소면', '고춧가루', '식초', '설탕', '오이', '김'],
  },
];

const normalize = (value) => value.trim().toLowerCase();

const parseIngredients = (raw) => {
  return raw
    .split(/[,\n]/)
    .map((item) => normalize(item))
    .filter(Boolean);
};

const formatMissing = (missing) => {
  if (missing.length === 0) {
    return ['부족한 재료 없음'];
  }
  return missing;
};

const scoreRecipe = (recipe, availableSet) => {
  const missing = recipe.ingredients.filter(
    (item) => !availableSet.has(normalize(item))
  );
  const matched = recipe.ingredients.length - missing.length;
  return { ...recipe, missing, matched };
};

const pickWeeklyPlan = (available) => {
  const availableSet = new Set(available.map(normalize));
  const scored = RECIPES.map((recipe) => scoreRecipe(recipe, availableSet))
    .filter((recipe) => recipe.matched > 0);

  if (scored.length === 0) {
    return [];
  }

  scored.sort((a, b) => {
    if (b.matched !== a.matched) return b.matched - a.matched;
    return a.missing.length - b.missing.length;
  });

  return DAYS.map((day, index) => {
    const recipe = scored[index % scored.length];
    return {
      day,
      name: recipe.name,
      missing: recipe.missing,
      matched: recipe.matched,
      total: recipe.ingredients.length,
    };
  });
};

const renderPlan = (plan) => {
  scheduleEl.innerHTML = '';

  plan.forEach((item, index) => {
    const card = document.createElement('div');
    card.className = 'day-card';
    card.style.animationDelay = `${index * 0.05}s`;

    const header = document.createElement('div');
    header.className = 'day-header';

    const title = document.createElement('h3');
    title.textContent = `${item.day} · ${item.name}`;

    const badge = document.createElement('span');
    badge.className = 'badge';
    badge.textContent = `${item.matched}/${item.total} 재료 보유`;

    header.appendChild(title);
    header.appendChild(badge);

    const missingLabel = document.createElement('div');
    missingLabel.className = 'hint';
    missingLabel.textContent = '부족한 재료';

    const missingBox = document.createElement('div');
    missingBox.className = 'missing';

    formatMissing(item.missing).forEach((ingredient) => {
      const chip = document.createElement('span');
      chip.textContent = ingredient;
      missingBox.appendChild(chip);
    });

    card.appendChild(header);
    card.appendChild(missingLabel);
    card.appendChild(missingBox);

    scheduleEl.appendChild(card);
  });
};

const updateMeta = (plan, availableCount) => {
  if (plan.length === 0) {
    metaEl.textContent = '입력한 재료로 만들 수 있는 메뉴가 없습니다. 재료를 추가해보세요.';
    return;
  }

  const average = Math.round(
    (plan.reduce((sum, item) => sum + item.matched / item.total, 0) / plan.length) * 100
  );
  metaEl.textContent = `입력 재료 ${availableCount}개 기준 · 평균 충족률 ${average}%`;
};

const generatePlan = () => {
  const available = parseIngredients(ingredientsInput.value);
  if (available.length === 0) {
    metaEl.textContent = '재료를 입력하면 메뉴를 추천해드립니다.';
    scheduleEl.innerHTML = '';
    return;
  }

  const plan = pickWeeklyPlan(available);
  if (plan.length === 0) {
    scheduleEl.innerHTML = '';
    updateMeta(plan, available.length);
    return;
  }

  renderPlan(plan);
  updateMeta(plan, available.length);
};

const copyPlan = async () => {
  if (!scheduleEl.children.length) return;

  const lines = Array.from(scheduleEl.querySelectorAll('.day-card')).map((card) => {
    const title = card.querySelector('h3').textContent;
    const missing = Array.from(card.querySelectorAll('.missing span'))
      .map((chip) => chip.textContent)
      .join(', ');
    return `${title} | 부족: ${missing}`;
  });

  try {
    await navigator.clipboard.writeText(lines.join('\n'));
    copyBtn.textContent = '복사 완료!';
  } catch (err) {
    copyBtn.textContent = '복사 실패';
  }

  setTimeout(() => {
    copyBtn.textContent = '주간 메뉴 복사';
  }, 1500);
};

resetBtn.addEventListener('click', () => {
  ingredientsInput.value = '';
  scheduleEl.innerHTML = '';
  metaEl.textContent = '입력한 재료로 메뉴를 만들어보세요.';
});

generateBtn.addEventListener('click', generatePlan);
copyBtn.addEventListener('click', copyPlan);
