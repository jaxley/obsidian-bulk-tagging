import { entry, _for_testing } from '../src/qa-bulk-add-tags'
import { MockQuickAddParams } from './mock-types';
import { MockQuickAddContext } from './mock-types';

let cleanTags = _for_testing.cleanTags
let convertAllTagsToStrings = _for_testing.convertAllTagsToStrings
let removeDuplicateTags = _for_testing.removeDuplicateTags
let removeHashPrefixesFromTagValues = _for_testing.removeHashPrefixesFromTagValues
let removeQuotesFromTagValues = _for_testing.removeQuotesFromTagValues
let removeUntaggedTagIfTagged = _for_testing.removeUntaggedTagIfTagged

test('Convert tags to strings happy path', () => {
  const test_vector = [
    [3, "3"],
    ["leave me alone", "leave me alone"],
    [{}, "{}"]
  ];

  for (let i = 0; i < test_vector.length; i++) {
    let output = convertAllTagsToStrings([test_vector[i][0]]);
    expect(output[0]).toBe(test_vector[i][1])
  }
})

test('entry', () => {
  const bEntry: Function = entry.bind(new MockQuickAddContext())
  bEntry(new MockQuickAddParams([]))
})

test('cleanTags', () => {

})