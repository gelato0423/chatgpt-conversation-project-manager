// Pure helpers shared by content.js and the unit tests.
// Nothing here touches the live ChatGPT page, so it can run under Node/Jest.
// In the extension it is loaded before content.js and exposed as BCM3Core.
(function (root) {
  'use strict';

  // ChatGPT sidebar selectors and URL patterns
  var CHATGPT = {
    // Matches both /c/<id> and project chats at /g/g-p-.../c/<id>
    chatLinkSelector: 'nav a[href*="/c/"]',
    chatHrefPattern: /\/c\/([^?#/]+)/,
    // Sidebar project rows are <div role="button"> carrying the id/label in
    // data attributes. (Plain /g/g-p- links also appear in the page header.)
    projectLinkSelector: 'nav [data-app-action-sidebar-project-row]',
    projectHrefPattern: /\/g\/(g-p-[^/?#]+)/,
    moveMenuItemTexts: ['move to project', '移至專案', '移動至專案', '移到專案', '移至项目', '移动到项目', '移到项目', 'プロジェクトに移動']
  };

  // Menu labels across UI languages. Matching is exact (after normalizing),
  // so "釘選" never matches "取消釘選".
  var DELETE_TEXTS = ['delete', 'delete chat', 'delete conversation', 'delete project', '刪除', '删除', '刪除聊天', '删除聊天', '刪除對話', '删除对话', '刪除專案', '删除项目', '刪除項目', '削除', '삭제'];
  // Project menus say "釘選專案" / "取消釘選專案" instead of the bare verb
  var PIN_TEXTS = ['pin', 'pin chat', 'pin project', '釘選', '釘選專案', '置顶', '置頂', '置顶项目', '固定', 'ピン留め', '고정'];
  var UNPIN_TEXTS = ['unpin', 'unpin chat', 'unpin project', '取消釘選', '取消釘選專案', '取消置顶', '取消置頂', '取消置顶项目', '取消固定', 'ピン留めを解除', '고정 해제'];
  var ARCHIVE_TEXTS = ['archive', 'archive chat', '封存', '封存對話', '归档', '歸檔', 'アーカイブ', '보관'];

  // Single-click menu actions. doneTexts = menu item shown when the item is
  // already in the target state (e.g. "取消釘選" means it is already pinned).
  var MENU_ACTIONS = {
    pin: { word: 'Pin', pastWord: 'Pinned', texts: PIN_TEXTS, doneTexts: UNPIN_TEXTS, alreadyMsg: 'Already pinned' },
    unpin: { word: 'Unpin', pastWord: 'Unpinned', texts: UNPIN_TEXTS, doneTexts: PIN_TEXTS, alreadyMsg: 'Not pinned' },
    archive: { word: 'Archive', pastWord: 'Archived', texts: ARCHIVE_TEXTS }
  };

  function normalizeText(s) {
    return (s || '').trim().replace(/\s+/g, ' ').toLowerCase();
  }
  function matchesText(texts, s) {
    return texts.indexOf(normalizeText(s)) !== -1;
  }
  function isDeleteText(s) {
    return matchesText(DELETE_TEXTS, s);
  }
  // Longer confirm labels, e.g. project delete: 從「對話」和「工作」中刪除
  function looksLikeDeleteConfirm(s) {
    var t = normalizeText(s);
    return /刪除|删除|delete|削除|삭제/.test(t) && !/取消|cancel/.test(t);
  }
  function isMoveMenuText(s, moveTexts) {
    var t = normalizeText(s);
    return moveTexts.some(function(m) { return t.indexOf(m) === 0; });
  }
  // Fallback for other wordings of "move to project"
  function looksLikeProjectSubmenu(s) {
    return /project|專案|项目|項目|プロジェクト/.test(normalizeText(s));
  }

  function idFromHref(href, pattern) {
    var m = (href || '').match(pattern);
    return m && m[1] || '';
  }
  // Project rows may be links (id in href) or divs (id in a data attribute)
  function projectIdOf(el, pattern) {
    var id = el.getAttribute('data-app-action-sidebar-project-id');
    if (id) return id;
    return idFromHref(el.getAttribute('href'), pattern || CHATGPT.projectHrefPattern);
  }
  function projectNameOf(el) {
    return (el.getAttribute('data-app-action-sidebar-project-label') || el.textContent || '').trim();
  }

  // Confirmation text for bulk delete; lists up to 10 titles
  function buildDeleteConfirmMessage(kind, titles) {
    var lines = titles.slice(0, 10).map(function(t) { return '・' + t; });
    if (titles.length > 10) lines.push('…還有 ' + (titles.length - 10) + ' 個');
    var head = kind === 'projects'
      ? '確定要刪除以下 ' + titles.length + ' 個專案嗎？專案內的對話和檔案通常也會一併刪除，無法復原。'
      : '確定要刪除以下 ' + titles.length + ' 個對話嗎？刪除後無法復原。';
    return head + '\n\n' + lines.join('\n');
  }

  var api = {
    CHATGPT: CHATGPT,
    DELETE_TEXTS: DELETE_TEXTS,
    PIN_TEXTS: PIN_TEXTS,
    UNPIN_TEXTS: UNPIN_TEXTS,
    ARCHIVE_TEXTS: ARCHIVE_TEXTS,
    MENU_ACTIONS: MENU_ACTIONS,
    normalizeText: normalizeText,
    matchesText: matchesText,
    isDeleteText: isDeleteText,
    looksLikeDeleteConfirm: looksLikeDeleteConfirm,
    isMoveMenuText: isMoveMenuText,
    looksLikeProjectSubmenu: looksLikeProjectSubmenu,
    idFromHref: idFromHref,
    projectIdOf: projectIdOf,
    projectNameOf: projectNameOf,
    buildDeleteConfirmMessage: buildDeleteConfirmMessage
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.BCM3Core = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
