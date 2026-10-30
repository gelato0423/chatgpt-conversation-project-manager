// Integration tests: load the real content.js against a fake ChatGPT sidebar
// whose structure was captured from chatgpt.com, and check how the panel and
// checkboxes behave. No network or real ChatGPT page is involved.

function buildSidebar() {
  document.body.innerHTML = `
    <header><a id="header-project" href="/g/g-p-111/project">科技輔助</a></header>
    <nav>
      <ul>
        <li id="row-chat"><a href="/c/aaa">確認 456<button aria-haspopup="menu"></button></a></li>
      </ul>
      <div role="listitem">
        <div data-sidebar-project-container-id="project:g-p-111">
          <div id="row-project" role="button" data-app-action-sidebar-project-row
               data-app-action-sidebar-project-id="g-p-111"
               data-app-action-sidebar-project-label="科技輔助">
            <span>科技輔助</span><button aria-haspopup="menu"></button><button></button>
          </div>
          <ul><li id="row-project-chat"><a href="/g/g-p-111/c/bbb">HW2 討論可行性</a></li></ul>
        </div>
      </div>
    </nav>`;
}

// content.js registers page-wide observers when loaded, so load it once per
// file and reopen the panel (via the popup's entry point) for every test.
beforeAll(() => {
  globalThis.BCM3Core = require('../lib/core');
  require('../content.js');
});

afterAll(() => {
  window._bcmNavObserver.disconnect();
});

beforeEach(() => {
  jest.useFakeTimers();
  sessionStorage.clear();
  buildSidebar();
  // Project list API is unavailable in tests; the panel falls back to the DOM
  global.fetch = jest.fn(() => Promise.reject(new Error('offline')));
  window.confirm = jest.fn(() => false);
  window._bcmInit();
});

afterEach(async () => {
  document.getElementById('bcm3-close-btn').click();
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
  // Let pending mutation-observer callbacks run before the next test
  await Promise.resolve();
});

const checkboxIds = () =>
  Array.from(document.querySelectorAll('.bcm3-cb')).map((cb) => cb.dataset.convId).sort();
const status = () => document.getElementById('bcm3-status').textContent;
const tab = (mode) => document.querySelector(`.bcm3-tab[data-mode="${mode}"]`);

test('panel opens on the chat tab with both tabs present', () => {
  expect(document.getElementById('bcm3-panel')).not.toBeNull();
  expect(tab('chats').classList.contains('bcm3-tab-active')).toBe(true);
  expect(tab('projects')).not.toBeNull();
});

test('chat mode: normal and project chats get checkboxes, projects do not', () => {
  expect(checkboxIds()).toEqual(['aaa', 'bbb']);
  expect(document.querySelector('#row-project .bcm3-cb')).toBeNull();
  expect(document.getElementById('bcm3-count').textContent).toBe('0 of 2 chats selected');
});

test('regression: checkbox goes inside the link without moving ChatGPT nodes', () => {
  const link = document.querySelector('a[href="/c/aaa"]');
  expect(link.firstChild.classList.contains('bcm3-cb')).toBe(true);
  // The <a> must stay in its original <li>; re-parenting it crashed React
  expect(link.parentElement.id).toBe('row-chat');
  expect(document.querySelector('.bcm3-wrap')).toBeNull();
});

test('project mode: only sidebar project rows get checkboxes', () => {
  tab('projects').click();
  expect(checkboxIds()).toEqual(['g-p-111']);
  // regression: the page-header project link must not get a checkbox
  expect(document.querySelector('#header-project .bcm3-cb')).toBeNull();
  expect(document.querySelector('#row-project .bcm3-cb').dataset.title).toBe('科技輔助');
  expect(status()).toBe('Project mode');
});

test('project mode hides Move, project picker and Archive', () => {
  tab('projects').click();
  for (const id of ['bcm3-move-btn', 'bcm3-project-sel', 'bcm3-refresh-btn', 'bcm3-archive-btn']) {
    expect(document.getElementById(id).style.display).toBe('none');
  }
  expect(document.getElementById('bcm3-pin-btn').style.display).toBe('');
  tab('chats').click();
  expect(document.getElementById('bcm3-archive-btn').style.display).toBe('');
  expect(checkboxIds()).toEqual(['aaa', 'bbb']);
});

test('select all toggles every checkbox of the current tab', () => {
  document.getElementById('bcm3-selall-btn').click();
  expect(document.querySelectorAll('.bcm3-cb:checked')).toHaveLength(2);
  document.getElementById('bcm3-selall-btn').click();
  expect(document.querySelectorAll('.bcm3-cb:checked')).toHaveLength(0);
});

test('delete with nothing selected does not ask for confirmation', () => {
  document.getElementById('bcm3-delete-btn').click();
  expect(window.confirm).not.toHaveBeenCalled();
  expect(status()).toBe('No chats selected');
});

test('delete asks for confirmation and does nothing when cancelled', () => {
  document.querySelector('.bcm3-cb[data-conv-id="aaa"]').checked = true;
  document.getElementById('bcm3-delete-btn').click();
  expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining('・確認 456'));
  expect(status()).toBe('Delete cancelled');
  // Nothing was queued, so no deletion will run
  expect(sessionStorage.getItem('bcm3-task-queue-v1')).toBeNull();
});
