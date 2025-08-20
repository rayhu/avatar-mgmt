import { useI18n } from 'vue-i18n';

export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public status?: number
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const handleError = (error: unknown) => {
  const { t } = useI18n();

  if (error instanceof AppError) {
    // 处理应用自定义错误
    console.error(`[${error.code}] ${error.message}`);
    return t(`errors.${error.code}`, { message: error.message });
  }

  if (error instanceof Error) {
    // 处理一般错误
    console.error(error.message);
    return t('errors.unknown', { message: error.message });
  }

  // 处理未知错误
  console.error('Unknown error:', error);
  return t('errors.unknown');
};

export const createError = (code: string, message: string, status?: number) => {
  return new AppError(message, code, status);
};
