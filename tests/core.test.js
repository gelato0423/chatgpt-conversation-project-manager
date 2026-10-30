// Unit tests for lib/core.js. Most cases are regression tests for bugs that
// were fixed while adapting the extension to the current ChatGPT UI.
const Core = require('../lib/core');

describe('normalizeText', () => {
  test('trims, lowercases and collapses whitespace', () => {
    expect(Core.normalizeText('  Delete \n  Chat ')).toBe('delete chat');
  });

  test('regression: collapses runs of whitespace', () => {
    // The original regex was /\\s+/ (a literal backslash + "s"), so tabs,
    // newlines and repeated spaces were never collapsed
    expect(Core.normalizeText('a\t\tb')).toBe('a b');
    expect(Core.normalizeText('移至\n  專案')).toBe('移至 專案');
  });

  test('handles null and undefined', () => {
    expect(Core.normalizeText(null)).toBe('');
    expect(Core.normalizeText(undefined)).toBe('');
  });
});

describe('isDeleteText', () => {
  test.each(['Delete', '刪除', '删除', '刪除專案', '削除', '삭제'])(
    'regression: recognizes localized label %s',
    (label) => {
      expect(Core.isDeleteText(label)).toBe(true);
    }
  );

  test('does not match unrelated menu items', () => {
    expect(Core.isDeleteText('封存')).toBe(false);
    expect(Core.isDeleteText('重新命名')).toBe(false);
  });
});

describe('pin / unpin / archive labels', () => {
  test('regression: "釘選" never matches "取消釘選" (and vice versa)', () => {
    expect(Core.matchesText(Core.PIN_TEXTS, '取消釘選')).toBe(false);
    expect(Core.matchesText(Core.UNPIN_TEXTS, '釘選')).toBe(false);
  });

  test('regression: project menus use "釘選專案" / "取消釘選專案"', () => {
    expect(Core.matchesText(Core.PIN_TEXTS, '釘選專案')).toBe(true);
    expect(Core.matchesText(Core.UNPIN_TEXTS, '取消釘選專案')).toBe(true);
  });

  test('archive matches Chinese "封存"', () => {
    expect(Core.matchesText(Core.ARCHIVE_TEXTS, '封存')).toBe(true);
  });

  test('MENU_ACTIONS: pin and unpin detect each other as "already done"', () => {
    expect(Core.MENU_ACTIONS.pin.doneTexts).toBe(Core.UNPIN_TEXTS);
    expect(Core.MENU_ACTIONS.unpin.doneTexts).toBe(Core.PIN_TEXTS);
    expect(Core.MENU_ACTIONS.archive.doneTexts).toBeUndefined();
  });
});

describe('looksLikeDeleteConfirm', () => {
  test('regression: matches the long project delete button', () => {
    expect(Core.looksLikeDeleteConfirm('從「對話」和「工作」中刪除')).toBe(true);
  });

  test('never matches a cancel button', () => {
    expect(Core.looksLikeDeleteConfirm('取消')).toBe(false);
    expect(Core.looksLikeDeleteConfirm('Cancel delete')).toBe(false);
  });
});

describe('move to project labels', () => {
  test('regression: recognizes Chinese "移至專案"', () => {
    expect(Core.isMoveMenuText('移至專案', Core.CHATGPT.moveMenuItemTexts)).toBe(true);
    expect(Core.isMoveMenuText('Move to project', Core.CHATGPT.moveMenuItemTexts)).toBe(true);
  });

  test('fallback detects other wordings that mention a project', () => {
    expect(Core.looksLikeProjectSubmenu('加入專案')).toBe(true);
    expect(Core.looksLikeProjectSubmenu('分享')).toBe(false);
  });
});

describe('idFromHref', () => {
  const { chatHrefPattern, projectHrefPattern } = Core.CHATGPT;

  test('reads the id from a normal chat URL', () => {
    expect(Core.idFromHref('/c/6ae36d97-673c-83e8', chatHrefPattern)).toBe('6ae36d97-673c-83e8');
  });

  test('regression: reads the chat id from a project chat URL', () => {
    expect(Core.idFromHref('/g/g-p-abc123/c/xyz789', chatHrefPattern)).toBe('xyz789');
  });

  test('reads the project id from a project URL', () => {
    expect(Core.idFromHref('/g/g-p-abc123/project', projectHrefPattern)).toBe('g-p-abc123');
  });

  test('returns an empty string when nothing matches', () => {
    expect(Core.idFromHref('/settings', chatHrefPattern)).toBe('');
    expect(Core.idFromHref(null, chatHrefPattern)).toBe('');
  });
});

describe('projectIdOf / projectNameOf', () => {
  test('regression: reads id and label from the new <div> project row', () => {
    document.body.innerHTML = `
      <div role="button" data-app-action-sidebar-project-row
           data-app-action-sidebar-project-id="g-p-6a0b62ba3f8481918b473243b333049d"
           data-app-action-sidebar-project-label="寫作"><span>寫作</span></div>`;
    const row = document.querySelector('[data-app-action-sidebar-project-row]');
    expect(Core.projectIdOf(row)).toBe('g-p-6a0b62ba3f8481918b473243b333049d');
    expect(Core.projectNameOf(row)).toBe('寫作');
  });

  test('falls back to the href of an older link-style project row', () => {
    document.body.innerHTML = '<a href="/g/g-p-old123/project"> 舊專案 </a>';
    const link = document.querySelector('a');
    expect(Core.projectIdOf(link)).toBe('g-p-old123');
    expect(Core.projectNameOf(link)).toBe('舊專案');
  });
});

describe('buildDeleteConfirmMessage', () => {
  test('lists every title for a short selection', () => {
    const msg = Core.buildDeleteConfirmMessage('chats', ['確認 456', '翻譯']);
    expect(msg).toContain('2 個對話');
    expect(msg).toContain('・確認 456');
    expect(msg).toContain('・翻譯');
  });

  test('shows at most 10 titles plus a remainder line', () => {
    const titles = Array.from({ length: 13 }, (_, i) => 'chat ' + i);
    const msg = Core.buildDeleteConfirmMessage('chats', titles);
    expect(msg).toContain('13 個對話');
    expect(msg).toContain('・chat 9');
    expect(msg).not.toContain('・chat 10');
    expect(msg).toContain('…還有 3 個');
  });

  test('warns that deleting a project also deletes its chats', () => {
    const msg = Core.buildDeleteConfirmMessage('projects', ['電機']);
    expect(msg).toContain('1 個專案');
    expect(msg).toContain('一併刪除');
  });
});
