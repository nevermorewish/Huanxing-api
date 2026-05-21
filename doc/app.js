// 寰星云科 API 文档 · 多页站布局脚本
// 每个 HTML 页面声明 window.__PAGE__ = { slug, section, title }，由本文件统一渲染 header/sidebar/breadcrumb/prev-next。

const SITE = {
  brand: '寰星云科',
  brandSub: 'Huanxing API Docs',
  brandHref: '/',
  logo: '/docs/logo.png',
  footer: [
    '寰星云科科技有限公司',
    'Huanxing Yunke Technology Co., Ltd',
  ],
};

const API_BASE_URL = 'https://api.huanxing.ai';

const NAV_TOP = [
  { href: '/docs/register/3-quota.html', label: '快速开始', matchPrefix: '/docs/register/' },
  { href: '/docs/token/1-intro.html', label: '模型分组', matchPrefix: '/docs/token/' },
  { href: '/docs/ccswitch/1-common.html', label: 'CC-Switch', matchPrefix: '/docs/ccswitch/' },
  { href: '/docs/cli/2-claude.html', label: 'CLI 配置', matchPrefix: '/docs/cli/' },
  { href: '/docs/paint/GPTImage.html', label: '绘图模型', matchPrefix: '/docs/paint/' },
  { href: '/docs/advanced/DeepSeekClaudeCode.html', label: '进阶玩法', matchPrefix: '/docs/advanced/' },
  { href: '/docs/faq/CC.html', label: '常见问题', matchPrefix: '/docs/faq/' },
];

const NAV_SIDEBAR = [
  {
    title: '快速开始',
    items: [
      { href: '/docs/register/3-quota.html', label: '（1）购买额度' },
      { href: '/docs/register/4-token.html', label: '（2）创建 API 令牌' },
      { href: '/docs/register/5-env.html', label: '（3）环境检查（必要）' },
      { href: '/docs/register/6-cli.html', label: '（4）安装 CLI 工具' },
    ],
  },
  {
    title: '模型分组介绍',
    items: [
      { href: '/docs/token/1-intro.html', label: '模型广场' },
      { href: '/docs/token/2-group.html', label: '令牌分组介绍' },
    ],
  },
  {
    title: 'CC-Switch 使用',
    items: [
      { href: '/docs/ccswitch/1-common.html', label: '通用步骤' },
      { href: '/docs/ccswitch/2-claude.html', label: 'Claude Code 配置' },
      { href: '/docs/ccswitch/3-codex.html', label: 'Codex 配置' },
      { href: '/docs/ccswitch/4-gemini.html', label: 'Gemini 配置' },
    ],
  },
  {
    title: 'CLI 配置教程',
    items: [
      { href: '/docs/cli/2-claude.html', label: 'Claude Code 配置' },
      { href: '/docs/cli/3-codex.html', label: 'Codex 配置' },
      { href: '/docs/cli/4-gemini.html', label: 'Gemini 配置' },
    ],
  },
  {
    title: '绘图模型教程',
    items: [
      { href: '/docs/paint/GPTImage.html', label: 'GPT-Image-2' },
    ],
  },
  {
    title: '进阶玩法',
    items: [
      { href: '/docs/advanced/DeepSeekClaudeCode.html', label: 'DS 接入 CC' },
    ],
  },
  {
    title: '常见问题',
    items: [
      { href: '/docs/faq/CC.html', label: 'Claude Code' },
      { href: '/docs/faq/Codex.html', label: 'Codex' },
      { href: '/docs/faq/Gemini.html', label: 'Gemini' },
    ],
  },
];

function currentPath() {
  let p = location.pathname || '/';
  // server fallback maps unknown to index.html, normalize trailing
  if (p.endsWith('/index.html')) p = p.replace(/index\.html$/, '');
  return p;
}

function pathsMatch(a, b) {
  const norm = (s) => s.replace(/\/index\.html$/, '/').replace(/\/+$/, '/');
  return norm(a) === norm(b);
}

function escapeHTML(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function renderTopbar() {
  const path = currentPath();
  const items = NAV_TOP.map((n) => {
    const isActive = path.startsWith(n.matchPrefix);
    return `<a href="${n.href}" class="${isActive ? 'active' : ''}">${escapeHTML(n.label)}</a>`;
  }).join('');
  return `
    <header class="topbar">
      <a class="brand" href="${SITE.brandHref}" aria-label="返回文档首页">
        <img src="${SITE.logo}" alt="${escapeHTML(SITE.brand)}" />
        <span>
          <strong>${escapeHTML(SITE.brand)}</strong>
          <small>${escapeHTML(SITE.brandSub)}</small>
        </span>
      </a>
      <nav class="topnav" aria-label="顶部导航">${items}</nav>
      <button class="menu-button" type="button" aria-label="打开目录" aria-expanded="false">
        <span></span><span></span><span></span>
      </button>
    </header>
  `;
}

async function loadSiteConfig() {
  try {
    const response = await fetch('/api/status', {
      cache: 'no-store',
      credentials: 'same-origin',
    });
    if (!response.ok) return;

    const status = await response.json();
    const serverAddress = String(status.server_address || '').trim();
    if (serverAddress) {
      SITE.brandHref = serverAddress;
    }
  } catch {
    // Keep the local root fallback when the API is unavailable.
  }
}

function renderSidebar() {
  const path = currentPath();
  const home = `<a class="sidebar-home" href="/docs/">寰星云科 API 使用文档</a>`;
  const groups = NAV_SIDEBAR.map((g) => {
    const items = g.items.map((it) => {
      const active = pathsMatch(it.href, path) ? ' active' : '';
      return `<a class="sidebar-child${active}" href="${it.href}">${escapeHTML(it.label)}</a>`;
    }).join('');
    return `
      <div class="sidebar-group">
        <span class="sidebar-section">${escapeHTML(g.title)}</span>
        ${items}
      </div>
    `;
  }).join('');
  return home + groups;
}

function flatPages() {
  return NAV_SIDEBAR.flatMap((g) => g.items.map((it) => ({ ...it, section: g.title })));
}

function renderBreadcrumb() {
  const path = currentPath();
  const all = flatPages();
  const current = all.find((p) => pathsMatch(p.href, path));
  const parts = [
    `<a href="/docs/">寰星云科 API 文档</a>`,
  ];
  if (current) {
    parts.push(`<span class="sep">›</span>`);
    parts.push(`<span>${escapeHTML(current.section)}</span>`);
    parts.push(`<span class="sep">›</span>`);
    parts.push(`<span class="current">${escapeHTML(current.label)}</span>`);
  }
  return parts.join(' ');
}

function renderPrevNext() {
  const path = currentPath();
  const all = flatPages();
  const idx = all.findIndex((p) => pathsMatch(p.href, path));
  if (idx === -1) return '';
  const prev = idx > 0 ? all[idx - 1] : null;
  const next = idx < all.length - 1 ? all[idx + 1] : null;
  const prevHTML = prev
    ? `<a href="${prev.href}" class="prev"><span class="pn-label">上一页</span><span class="pn-title">${escapeHTML(prev.label)}</span></a>`
    : `<span class="prev placeholder"></span>`;
  const nextHTML = next
    ? `<a href="${next.href}" class="next"><span class="pn-label">下一页</span><span class="pn-title">${escapeHTML(next.label)}</span></a>`
    : `<span class="next placeholder"></span>`;
  return prevHTML + nextHTML;
}

function renderFooter() {
  const inner = SITE.footer.map((s) => `<span>${escapeHTML(s)}</span>`).join('');
  return `<footer class="footer">${inner}</footer>`;
}

async function mount() {
  await loadSiteConfig();

  const topMount = document.querySelector('[data-mount="topbar"]');
  if (topMount) topMount.outerHTML = renderTopbar();

  const sideMount = document.querySelector('[data-mount="sidebar"]');
  if (sideMount) sideMount.innerHTML = renderSidebar();

  const crumbMount = document.querySelector('[data-mount="breadcrumb"]');
  if (crumbMount) crumbMount.innerHTML = renderBreadcrumb();

  const pnMount = document.querySelector('[data-mount="prevnext"]');
  if (pnMount) pnMount.innerHTML = renderPrevNext();

  const footMount = document.querySelector('[data-mount="footer"]');
  if (footMount) footMount.outerHTML = renderFooter();

  const menuButton = document.querySelector('.menu-button');
  if (menuButton) {
    menuButton.addEventListener('click', () => {
      const isOpen = document.body.classList.toggle('sidebar-open');
      menuButton.setAttribute('aria-expanded', String(isOpen));
    });
  }
  document.querySelectorAll('.sidebar a').forEach((link) => {
    link.addEventListener('click', () => {
      document.body.classList.remove('sidebar-open');
    });
  });

  initTabs();
  initConstants();
}

function initConstants() {
  document.querySelectorAll('[data-api-base]').forEach((node) => {
    node.textContent = API_BASE_URL;
  });
}

function initTabs() {
  document.querySelectorAll('[data-tabs]').forEach((tabs) => {
    const buttons = tabs.querySelectorAll(':scope > .tabs-nav > button');
    const panels = tabs.querySelectorAll(':scope > .tab-panel');
    buttons.forEach((btn, i) => {
      btn.addEventListener('click', () => {
        buttons.forEach((b) => b.classList.remove('active'));
        panels.forEach((p) => p.classList.remove('active'));
        btn.classList.add('active');
        if (panels[i]) panels[i].classList.add('active');
      });
    });
  });

  document.querySelectorAll('[data-vp-tabs]').forEach((tabs) => {
    const buttons = tabs.querySelectorAll(':scope > .vp-tabs-nav > .vp-tab-nav');
    const panels = tabs.querySelectorAll(':scope > .vp-tab');
    buttons.forEach((btn, i) => {
      btn.addEventListener('click', () => {
        buttons.forEach((b) => {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        panels.forEach((p) => {
          p.classList.remove('active');
          p.setAttribute('aria-expanded', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
        if (panels[i]) {
          panels[i].classList.add('active');
          panels[i].setAttribute('aria-expanded', 'true');
        }
      });
    });
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount);
} else {
  mount();
}
