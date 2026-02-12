/**
 * Centralized error handling service for the application
 * Provides consistent error logging, categorization, and user-friendly messaging
 */

export enum ErrorType {
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  NETWORK = 'NETWORK',
  DATABASE = 'DATABASE',
  BUSINESS_LOGIC = 'BUSINESS_LOGIC',
  UNKNOWN = 'UNKNOWN',
}

export interface AppError {
  type: ErrorType;
  message: string;
  originalError?: Error;
  timestamp: Date;
  context?: Record<string, unknown>;
}

/**
 * Centralized error handler class
 */
export class ErrorHandler {
  /**
   * Creates and logs an application error
   */
  static createError(
    type: ErrorType,
    message: string,
    originalError?: Error,
    context?: Record<string, unknown>
  ): AppError {
    const error: AppError = {
      type,
      message,
      originalError,
      timestamp: new Date(),
      context,
    };

    // Log the error (in production, this would send to monitoring service)
    this.logError(error);
    
    return error;
  }

  /**
   * Logs error to console with appropriate formatting
   */
  private static logError(error: AppError): void {
    const logMessage = `[${error.type}] ${error.message}`;
    const logData = {
      timestamp: error.timestamp,
      context: error.context,
      originalError: error.originalError?.stack,
    };

    // In development, log full details
    if (process.env.NODE_ENV === 'development') {
      console.error(logMessage, logData);
    } else {
      // In production, log minimal information
      console.error(logMessage);
    }
  }

  /**
   * Converts native JavaScript errors to AppError format
   */
  static fromNativeError(error: Error, context?: Record<string, unknown>): AppError {
    // Determine error type based on error message or type
    let type = ErrorType.UNKNOWN;
    
    if (error.message.includes('Unauthorized') || error.message.includes('401')) {
      type = ErrorType.AUTHENTICATION;
    } else if (error.message.includes('Network') || error.message.includes('fetch')) {
      type = ErrorType.NETWORK;
    } else if (error.message.includes('Validation')) {
      type = ErrorType.VALIDATION;
    }

    return this.createError(type, error.message, error, context);
  }

  /**
   * Gets user-friendly error message based on error type
   */
  static getUserFriendlyMessage(error: AppError): string {
    switch (error.type) {
      case ErrorType.VALIDATION:
        return 'Введено некоректні дані. Будь ласка, перевірте форму.';
      case ErrorType.AUTHENTICATION:
        return 'Помилка авторизації. Будь ласка, увійдіть знову.';
      case ErrorType.NETWORK:
        return 'Проблеми з мережею. Перевірте підключення до Інтернету.';
      case ErrorType.DATABASE:
        return 'Тимчасові проблеми з сервером. Спробуйте пізніше.';
      case ErrorType.BUSINESS_LOGIC:
        return 'Сталася помилка обробки даних. Спробуйте ще раз.';
      default:
        return 'Сталася невідома помилка. Спробуйте оновити сторінку.';
    }
  }

  /**
   * Checks if error should be reported to monitoring service
   */
  static shouldReportError(error: AppError): boolean {
    // Don't report validation errors or authentication errors (user-caused)
    return ![ErrorType.VALIDATION, ErrorType.AUTHENTICATION].includes(error.type);
  }
}

/**
 * Hook for handling errors in React components
 */
export function useErrorHandler() {
  const handleError = (error: Error, context?: Record<string, unknown>) => {
    const appError = ErrorHandler.fromNativeError(error, context);
    
    // Report to monitoring in production
    if (ErrorHandler.shouldReportError(appError) && process.env.NODE_ENV === 'production') {
      // TODO: Send to error monitoring service (Sentry, etc.)
    }
    
    return appError;
  };

  return { handleError };
}