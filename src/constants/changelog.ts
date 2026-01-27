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
  // 最新バージョンを先頭に追加
  // {
  //   version: '1.3.0',
  //   date: '2025-01-27',
  //   features: ['新機能の説明'],
  //   improvements: ['改善点の説明'],
  //   bugfixes: ['修正したバグの説明'],
  // },
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
