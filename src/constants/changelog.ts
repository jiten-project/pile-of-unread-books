/**
 * アプリの更新履歴データ
 * バージョンアップ時のお知らせモーダルで使用
 */

export interface ChangelogEntry {
  version: string;
  date: string;
  features?: string[]; // 新機能
  improvements?: string[]; // 改善
  bugfixes?: string[]; // バグ修正
}

export const CHANGELOG: ChangelogEntry[] = [
  {
    version: '1.2.0',
    date: '2026-01-28',
    features: [
      '本棚の並び替えに「積読期間」を追加',
      '並び順の昇順・降順を選択形式で切り替え可能に',
      'バージョンアップ時のお知らせ機能を追加',
      'ステータス「解放」を追加（手放した本を記録）',
    ],
    improvements: [
      'ホーム画面に「未読」ステータスカードを追加',
      '積読期間の算出が設定の積読定義に連動するように改善',
      'データベースのマイグレーション管理システムを導入',
      '同期処理のパフォーマンスを改善（バッチ処理化）',
    ],
    bugfixes: [
      '同期冊数のカウントでオーナーIDがフィルタリングされない問題を修正',
      'local_only の本が永久に同期対象から除外される問題を修正',
      '同期ステータス変更時にローカルストアが更新されない問題を修正',
    ],
  },
];

/**
 * 指定バージョンの変更履歴を取得
 */
export const getChangelogForVersion = (
  version: string
): ChangelogEntry | undefined => {
  return CHANGELOG.find((entry) => entry.version === version);
};

/**
 * バージョン文字列を比較
 * @returns v1 > v2 なら 1, v1 < v2 なら -1, 等しいなら 0
 */
export const compareVersions = (v1: string, v2: string): number => {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }
  return 0;
};
