// This file is used to resolve TypeScript errors related to duplicate declarations

// Fix for duplicate index signature for type 'string'
declare global {
  // Override problematic NodeJS namespace to avoid conflicts
  namespace NodeJS {
    interface ProcessEnv {
      // Add your environment variables here
      FINNHUB_API_KEY?: string;
      NODE_ENV?: string;
      [key: string]: string | undefined;
    }
  }

  // Override Error constructor to fix duplicate prepareStackTrace
  interface ErrorConstructor {
    // This will override the conflicting declaration
    prepareStackTrace?: ((err: Error, stackTraces: any[]) => any) | undefined;
  }
}

// This export is needed to make this a module
export {}; 