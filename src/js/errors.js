/**
 * Custom Error Classes for Better Error Handling
 */

export class AppError extends Error {
  constructor(message, type) {
    super(message);
    this.name = this.constructor.name;
    this.type = type;
    this.timestamp = new Date();
  }
}

export class NetworkError extends AppError {
  constructor() {
    super('网络已断开，请检查网络连接', 'network');
  }
}

export class MicrophonePermissionError extends AppError {
  constructor() {
    super('请允许使用麦克风', 'not-allowed');
  }
}

export class MicrophoneAccessError extends AppError {
  constructor() {
    super('无法访问麦克风，请检查设备', 'no-audio');
  }
}

export class TokenError extends AppError {
  constructor() {
    super('连接服务失败，请稍后重试', 'token');
  }
}

export class InitializationError extends AppError {
  constructor() {
    super('初始化失败，请刷新页面重试', 'init');
  }
}

export class StartError extends AppError {
  constructor() {
    super('启动失败，请重新开始', 'start');
  }
}

export class UnknownError extends AppError {
  constructor(originalError) {
    super('出错了，请重新开始', 'unknown');
    this.originalError = originalError;
  }
}

export class SessionTimeoutError extends AppError {
  constructor() {
    super('会话时间过长，正在重新连接...', 'session-timeout');
  }
}

/**
 * Error Messages Dictionary
 */
export const ERROR_MESSAGES = {
  network: '⚠️ 网络已断开，请检查网络连接',
  'not-allowed': '⚠️ 请允许使用麦克风',
  'no-audio': '⚠️ 无法访问麦克风，请检查设备',
  token: '⚠️ 连接服务失败，请稍后重试',
  init: '⚠️ 初始化失败，请刷新页面重试',
  start: '⚠️ 启动失败，请重新开始',
  'session-timeout': 'ℹ️ 会话时间过长，正在重新连接...',
  unknown: '⚠️ 出错了，请重新开始'
};

/**
 * Parse error and return appropriate error instance
 */
export function parseError(error) {
  if (error instanceof AppError) {
    return error;
  }

  const errorString = error?.toString().toLowerCase() || '';
  const errorDetails = error?.errorDetails?.toLowerCase() || '';

  if (!navigator.onLine || errorString.includes('network') || errorDetails.includes('network')) {
    return new NetworkError();
  }

  if (errorString.includes('permission') || errorString.includes('notallowed')) {
    return new MicrophonePermissionError();
  }

  if (errorString.includes('microphone') || errorString.includes('audio') || 
      errorDetails.includes('microphone') || errorDetails.includes('audio')) {
    return new MicrophoneAccessError();
  }

  if (errorString.includes('token') || error?.message === 'token') {
    return new TokenError();
  }
  
  if (errorString.includes('session') || error?.type === 'session-timeout') {
    return new SessionTimeoutError();
  }

  return new UnknownError(error);
}
