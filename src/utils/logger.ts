/**
 * セキュリティを考慮したロギングユーティリティ
 * 本番環境では機密情報をサニタイズしてログ出力
 */

const __DEV__ = process.env.NODE_ENV !== 'production';

/**
 * エラーオブジェクトから安全なメッセージを抽出
 * 機密情報（ファイルパス、ユーザーID等）を除去
 */
function sanitizeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // ファイルパスを除去
    let message = error.message.replace(/\/[^\s]+/g, '[path]');
    // UUIDパターンを除去
    message = message.replace(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
      '[id]'
    );
    // メールアドレスを除去
    message = message.replace(/[^\s@]+@[^\s@]+\.[^\s@]+/g, '[email]');
    // 長いメッセージを切り詰め
    if (message.length > 200) {
      message = message.slice(0, 200) + '...';
    }
    return message;
  }
  return 'Unknown error';
}

/**
 * エラーをログ出力
 * 開発環境: 完全なエラー情報を出力
 * 本番環境: サニタイズされたメッセージのみ出力
 */
export function logError(context: string, error: unknown): void {
  if (__DEV__) {
    console.error(`[${context}]`, error);
  } else {
    const safeMessage = sanitizeErrorMessage(error);
    console.error(`[${context}] ${safeMessage}`);
  }
}

/**
 * 警告をログ出力
 */
export function logWarn(context: string, message: string): void {
  if (__DEV__) {
    console.warn(`[${context}] ${message}`);
  } else {
    // 本番環境では警告メッセージもサニタイズ
    const safeMessage = message
      .replace(/\/[^\s]+/g, '[path]')
      .replace(
        /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
        '[id]'
      )
      .slice(0, 200);
    console.warn(`[${context}] ${safeMessage}`);
  }
}

/**
 * デバッグ情報をログ出力（開発環境のみ）
 */
export function logDebug(context: string, ...args: unknown[]): void {
  if (__DEV__) {
    console.log(`[${context}]`, ...args);
  }
}
