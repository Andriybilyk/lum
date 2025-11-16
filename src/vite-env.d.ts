/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_TELEGRAM_BOT_TOKEN: string;
  readonly VITE_TELEGRAM_BOT_USERNAME: string;
  readonly VITE_APP_URL: string;
  readonly VITE_API_URL?: string;
  readonly VITE_GOOGLE_SHEETS_API_KEY?: string;
  readonly VITE_GOOGLE_SHEETS_SPREADSHEET_ID?: string;
  readonly VITE_ERROR_REPORTING_URL?: string;
  readonly VITE_BUILD_ENV?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
