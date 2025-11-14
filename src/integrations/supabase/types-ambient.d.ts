// Temporary ambient module to unblock TypeScript when Supabase types are not yet generated.
// This file is safe to keep; when src/integrations/supabase/types.ts appears,
// it will take precedence and these declarations will be ignored.
// Do NOT export any runtime values here – types only.

declare module './types' {
  export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json }
    | Json[];

  export interface Database {
    public: {
      Tables: Record<string, any>;
      Views: Record<string, any>;
      Functions: Record<string, any>;
      Enums: Record<string, string> | Record<string, never>;
      CompositeTypes: Record<string, any>;
    };
  }
}
