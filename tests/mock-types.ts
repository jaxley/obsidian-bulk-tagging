import { ObsidianApp, QuickAddParams, QuickAddContext, QuickAddApi, QuickAddPrompt } from '../src/quickadd-types';
import { App, CachedMetadata } from 'obsidian';

jest.mock('obsidian')

export class MockQuickAddParams implements QuickAddParams {
  constructor(mockTags: string[]) {
    this.obsidian = new MockObsidianObject(mockTags);
    this.quickAddApi = this._mockedApiFactory()
    this.app = new ObsidianApp()
  }
  _mockedApiFactory(): QuickAddApi {
    return {
      inputPrompt: jest.fn().mockReturnValue({}),
      yesNoPrompt: jest.fn().mockReturnValue({}),
      checkboxPrompt: jest.fn().mockReturnValue({}),
      suggester: jest.fn().mockReturnValue({})
    }
  }
  obsidian: MockObsidianObject;
  app: ObsidianApp;
  quickAddApi: QuickAddApi

}

export class MockQuickAddContext implements QuickAddContext {
  constructor() {
    this.app = new ObsidianApp()
  }
  app: ObsidianApp;
}

export class MockObsidianObject {
  constructor(mockTags: string[]) {
    this._mockTags = mockTags;
  }
  _mockTags: string[];
  getAllTags(file_cache: CachedMetadata): string[] {
    return this._mockTags;
  }
}

