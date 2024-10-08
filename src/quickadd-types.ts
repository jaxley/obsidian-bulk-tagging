import { App, CachedMetadata } from "obsidian";

export class ObsidianApp extends App {
  plugins: any
}

export interface QuickAddParams {
    obsidian: {
        getAllTags(file_cache: CachedMetadata): string[] | null;
    };
    app: ObsidianApp;
    quickAddApi: {
        inputPrompt: any;
        checkboxPrompt: any;
        suggester: any;
        yesNoPrompt: any;
    };
}

export interface QuickAddContext {
    app: ObsidianApp;
}

export class QuickAddPrompt {}

export interface QuickAddApi {
  inputPrompt(
    header: string,
    placeholder?: string,
    value?: string
  ): QuickAddPrompt;
  yesNoPrompt(header: string, text?: string): QuickAddPrompt;
  suggester(
    displayItems: string[] |
      ((
        value: string,
        index?: number,
        arr?: string[]
      ) => string[]),
    actualItems: string[]
  ): QuickAddPrompt;
  checkboxPrompt(items: string[], selectedItems?: string[]): QuickAddPrompt;
}

