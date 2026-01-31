/**
 * 積読熟成度定義（熟成酒系）
 * 積読日数に応じて本の「熟成度」を表示
 */

export interface MaturityLevel {
  id: string;
  name: string;
  icon: string;
  description: string;
  minDays: number;
  maxDays: number | null; // nullは上限なし
  color: string;
}

export const MATURITY_LEVELS: MaturityLevel[] = [
  {
    id: 'shinshu',
    name: '新酒',
    icon: '🍶',
    description: '買いたてフレッシュ',
    minDays: 0,
    maxDays: 30,
    color: '#4CAF50', // 緑
  },
  {
    id: 'wakashu',
    name: '若酒',
    icon: '🫗',
    description: '若さが残る',
    minDays: 31,
    maxDays: 90,
    color: '#8BC34A', // ライトグリーン
  },
  {
    id: 'jukuseishu',
    name: '熟成酒',
    icon: '🍷',
    description: 'いい感じに熟成中',
    minDays: 91,
    maxDays: 180,
    color: '#9C27B0', // 紫
  },
  {
    id: 'vintage',
    name: 'ヴィンテージ',
    icon: '🥃',
    description: '年代物の風格',
    minDays: 181,
    maxDays: 365,
    color: '#795548', // ブラウン
  },
  {
    id: 'premium',
    name: 'プレミアム',
    icon: '✨',
    description: 'プレミアムな逸品',
    minDays: 366,
    maxDays: 365 * 3, // 3年
    color: '#FF9800', // オレンジ
  },
  {
    id: 'hizoushu',
    name: '秘蔵酒',
    icon: '🏺',
    description: '蔵に眠る秘蔵品',
    minDays: 365 * 3 + 1,
    maxDays: 365 * 5, // 5年
    color: '#E91E63', // ピンク
  },
  {
    id: 'densetsu',
    name: '伝説の銘酒',
    icon: '🌟',
    description: '語り継がれる存在',
    minDays: 365 * 5 + 1,
    maxDays: 365 * 10, // 10年
    color: '#3F51B5', // インディゴ
  },
  {
    id: 'maboroshi',
    name: '幻の逸品',
    icon: '👑',
    description: '開けるのがもったいない',
    minDays: 365 * 10 + 1,
    maxDays: null,
    color: '#FFD700', // ゴールド
  },
];
