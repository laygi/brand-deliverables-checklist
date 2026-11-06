const storageKey = 'brand-handoff-checklist:v1';
const statuses = [
  ['need', '需要'], ['exclude', '不需要'], ['discuss', '待討論'], ['', '尚未選擇'],
];
const fields = [
  ['name', '專案名稱'], ['client', '業主／品牌名稱'], ['contact', '確認人'],
  ['date', '確認日期'], ['note', '專案總備註'],
];
const byId = (id) => document.getElementById(id);
const asText = (value) => typeof value === 'string' ? value : '';
const timestampFormat = new Intl.DateTimeFormat('zh-TW', {
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit',
  hourCycle: 'h23', timeZoneName: 'longOffset',
});

function restore(saved) {
  const project = Object.fromEntries(fields.map(([key]) => [key, asText(saved?.project?.[key])]));
  const categories = Object.fromEntries(catalog.map(({ id, items }) => {
    const previous = saved?.categories?.[id];
    return [id, {
      status: statuses.some(([key]) => key === previous?.status) ? previous.status : '',
      items: items.filter(([key]) => previous?.items?.includes?.(key)).map(([key]) => key),
      note: asText(previous?.note),
    }];
  }));
  return { project, categories };
}

function storageStatus(ok) {
  const status = byId('save-status');
  status.toggleAttribute('data-error', !ok);
  status.lastChild.textContent = ok ? '草稿儲存在此瀏覽器' : '本機儲存不可用，請先下載';
}

function load() {
  try {
    return restore(JSON.parse(localStorage.getItem(storageKey)));
  } catch {
    storageStatus(false);
    return restore();
  }
}

let state = load();

function save() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(state));
    if (byId('save-status').hasAttribute('data-error')) storageStatus(true);
  } catch {
    if (!byId('save-status').hasAttribute('data-error')) storageStatus(false);
  }
}

function element(tag, value, className) {
  const node = document.createElement(tag);
  if (value) node.textContent = value;
  if (className) node.className = className;
  return node;
}

function setDetailLabel(card, count) {
  card.querySelector('summary').textContent = count ? `子項與備註（已勾選 ${count} 項）` : '子項與備註';
}

function renderEditor() {
  for (const input of document.querySelectorAll('[data-project]')) {
    input.value = state.project[input.dataset.project];
  }
  const cards = catalog.map(({ id, name, label, icon, purpose, items }, index) => {
    const card = element('article', '', 'category');
    card.dataset.category = id;
    card.innerHTML = `
      <div class="category-top">
        <div class="category-title">
          <span class="category-icon" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="${icon}"/></svg></span>
          <div><p class="category-kicker">${String(index + 1).padStart(2, '0')} / ${label}</p><h3>${name}</h3></div>
        </div>
        <fieldset class="choices">
          <legend class="sr-only">${name}的需求狀態</legend>
          ${statuses.slice(0, 3).map(([key, text]) => `<label class="choice"><input type="radio" name="${id}" value="${key}"><span>${text}</span></label>`).join('')}
        </fieldset>
      </div>
      <p class="category-purpose">${purpose}</p>
      <details open>
        <summary></summary>
        <div class="detail-body">
          <div class="item-list">
            ${items.map(([key, title, description]) => `<label class="item"><input type="checkbox" value="${key}" aria-labelledby="item-${id}-${key}" aria-describedby="desc-${id}-${key}"><span><span id="item-${id}-${key}">${title}</span><small id="desc-${id}-${key}">${description}</small></span></label>`).join('')}
          </div>
          <label>${name}備註<textarea rows="2" maxlength="3000" placeholder="例如：數量、使用情境、檔案格式或待確認事項"></textarea></label>
        </div>
      </details>`;
    const entry = state.categories[id];
    for (const radio of card.querySelectorAll('input[type=radio]')) radio.checked = radio.value === entry.status;
    for (const checkbox of card.querySelectorAll('input[type=checkbox]')) checkbox.checked = entry.items.includes(checkbox.value);
    card.querySelector('textarea').value = entry.note;
    setDetailLabel(card, entry.items.length);
    return card;
  });
  byId('categories').replaceChildren(...cards);
}

function result() {
  const categories = catalog.map(({ id, name, items }) => {
    const entry = state.categories[id];
    return {
      id, name, status: entry.status || 'unanswered',
      statusLabel: statuses.find(([key]) => key === entry.status)[1],
      selectedItems: items.filter(([key]) => entry.items.includes(key)).map(([id, name]) => ({ id, name })),
      note: entry.note.trim(),
    };
  });
  const counts = Object.fromEntries(statuses.map(([key]) => {
    const status = key || 'unanswered';
    return [status, categories.filter((category) => category.status === status).length];
  }));
  const project = Object.fromEntries(fields.map(([key]) => [key, state.project[key].trim()]));
  return { project, counts, categories };
}

function renderSummary() {
  const { project, counts, categories } = result();
  const confirmed = categories.length - counts.unanswered;
  byId('progress').max = categories.length;
  byId('progress').value = confirmed;
  byId('progress-text').textContent = `${confirmed} / ${categories.length}`;
  byId('counts').replaceChildren(...statuses.slice(0, 3).map(([key, name]) => {
    const badge = element('div', '', 'counter');
    badge.dataset.state = key;
    badge.append(element('strong', String(counts[key])), name);
    return badge;
  }));
  const caption = byId('summary-project');
  caption.textContent = [project.name, project.client, project.date && `確認日期 ${project.date}`].filter(Boolean).join(' ／ ');
  caption.hidden = !caption.textContent;
  const groups = statuses.map(([key, label]) => {
    const matches = categories.filter((entry) => entry.status === (key || 'unanswered'));
    const visible = key ? matches : matches.filter((entry) => entry.selectedItems.length || entry.note);
    if (!visible.length) return null;
    const group = element('section', '', 'summary-group');
    group.append(element('h3', label));
    for (const entry of visible) {
      const line = element('div', '', 'summary-entry');
      line.append(element('strong', entry.name));
      if (entry.selectedItems.length && key !== 'exclude') {
        const list = element('ul');
        list.append(...entry.selectedItems.map(({ name }) => element('li', name)));
        line.append(list);
      } else if (key === 'need') {
        line.append(element('small', '尚未指定子項'));
      }
      if (entry.note) line.append(element('small', entry.note));
      group.append(line);
    }
    return group;
  }).filter(Boolean);
  const summary = byId('summary-groups');
  summary.replaceChildren(...(groups.length ? groups : [element('p', '選擇需求狀態後，這裡會整理你的交付清單。', 'empty-state')]));
  byId('summary').classList.toggle('expanded-summary', groups.length > 0);
}

function update(event) {
  const input = event.target;
  if (input.dataset.project) {
    state.project[input.dataset.project] = input.value;
  } else {
    const card = input.closest('[data-category]');
    if (!card) return;
    const entry = state.categories[card.dataset.category];
    if (input.type === 'radio') entry.status = input.value;
    if (input.type === 'checkbox') {
      entry.items = Array.from(card.querySelectorAll('input[type=checkbox]:checked'), (checked) => checked.value);
      setDetailLabel(card, entry.items.length);
    }
    if (input.tagName === 'TEXTAREA') entry.note = input.value;
  }
  save();
  renderSummary();
}

function reportRows({ project, counts, categories }) {
  const rows = [
    ['h1', '品牌交付物確認結果'],
    ['p', `檔案產生時間（裝置時間）｜${timestampFormat.format(new Date())}`],
    ['p', `需要 ${counts.need}　不需要 ${counts.exclude}　待討論 ${counts.discuss}　尚未選擇 ${counts.unanswered}`],
    ['h2', '專案資訊'],
  ];
  for (const [key, label] of fields) {
    rows.push(['p', `${label}｜${project[key] || '未填寫'}`]);
  }
  rows.push(['h2', '交付物清單']);
  for (const entry of categories) {
    rows.push(['h3', `${entry.name}｜${entry.statusLabel}`]);
    for (const item of entry.selectedItems) {
      rows.push(['p', `・${item.name}${entry.status === 'exclude' ? '（已勾選，依類別狀態不列入交付）' : ''}`]);
    }
    if (!entry.selectedItems.length && entry.status === 'need') rows.push(['p', '尚未指定子項']);
    if (entry.note) rows.push(['p', `備註｜${entry.note}`]);
  }
  return rows;
}

function renderPrint() {
  byId('print-report').replaceChildren(...reportRows(result()).map(([tag, line]) => element(tag, line)));
}

function filename(extension) {
  const prefix = state.project.name.trim().replace(/[<>:"/\\|?*\u0000-\u001f]+/g, '-').slice(0, 60);
  return `${prefix ? `${prefix}-` : ''}品牌交付確認.${extension}`;
}

function download(blob, name) {
  const url = URL.createObjectURL(blob);
  const link = element('a');
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

function exportJson() {
  const exportedAt = new Date();
  const data = {
    schemaVersion: 1,
    exportedAt: exportedAt.toISOString(),
    exportedAtLocal: timestampFormat.format(exportedAt),
    ...result(),
  };
  download(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }), filename('json'));
}

function wrapText(context, text, maxWidth) {
  return text.split(/\r?\n/).flatMap((paragraph) => {
    const lines = [];
    let line = '';
    for (const character of paragraph) {
      if (line && context.measureText(line + character).width > maxWidth) {
        lines.push(line);
        line = character;
      } else {
        line += character;
      }
    }
    return [...lines, line];
  });
}

function exportJpg() {
  const feedback = byId('export-feedback');
  feedback.hidden = true;
  const fail = (message) => {
    feedback.textContent = message;
    feedback.hidden = false;
  };
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) {
    fail('此瀏覽器無法產生 JPG，請下載 JSON 或列印。');
    return;
  }
  const width = 960;
  const margin = 48;
  const fonts = getComputedStyle(document.body).fontFamily;
  const styles = { h1: [38, 750, 0], h2: [26, 750, 19], h3: [21, 700, 10], p: [19, 400, 3] };
  let y = margin;
  const rows = reportRows(result()).map(([tag, line]) => {
    const [size, weight, gap] = styles[tag];
    const font = `${weight} ${size}px ${fonts}`;
    const leading = Math.ceil(size * 1.45);
    context.font = font;
    const lines = wrapText(context, line, width - margin * 2);
    y += gap;
    const top = y;
    y += lines.length * leading;
    return { font, lines, top, leading };
  });
  if (y + margin > 15000) {
    fail('摘要過長，無法存成單張 JPG。請下載 JSON 或列印完整內容。');
    return;
  }
  canvas.width = width;
  canvas.height = y + margin;
  context.fillStyle = '#fff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#151515';
  context.textBaseline = 'top';
  for (const row of rows) {
    context.font = row.font;
    row.lines.forEach((line, index) => context.fillText(line, margin, row.top + row.leading * index));
  }
  const name = filename('jpg');
  canvas.toBlob((blob) => {
    if (blob?.type === 'image/jpeg') download(blob, name);
    else fail('此瀏覽器無法產生 JPG，請下載 JSON 或列印。');
  }, 'image/jpeg', 0.92);
}

for (const section of [byId('project'), byId('categories')]) {
  section.addEventListener('input', update);
}
byId('export').addEventListener('click', exportJson);
byId('export-jpg').addEventListener('click', exportJpg);
window.addEventListener('beforeprint', renderPrint);
byId('print').addEventListener('click', () => {
  renderPrint();
  window.print();
});
byId('reset').addEventListener('click', () => {
  if (!window.confirm('要清除這個瀏覽器中的專案資訊、勾選結果與備註嗎？')) return;
  try {
    localStorage.removeItem(storageKey);
    storageStatus(true);
  } catch {
    storageStatus(false);
  }
  state = restore();
  renderEditor();
  renderSummary();
});
renderEditor();
renderSummary();
