// You have to export the function you wish to run.
// QuickAdd automatically passes a parameter, which is an object with the Obsidian app object
// and the QuickAdd API (see description further on this page).

// TODO: refactor to make it easy to do other tag operations like remove vs. add in bulk.
// Lint tags - remove duplicates; remove untagged tag if there are other tags, etc.
import { getAllTags } from "obsidian"
import { QuickAddParams } from "./quickadd-types";
import { QuickAddContext } from "./quickadd-types";

export const settings = {};

export const _for_testing = {
    cleanTags,
    convertAllTagsToStrings,
    removeHashPrefixesFromTagValues,
    removeQuotesFromTagValues,
    removeUntaggedTagIfTagged,
    removeDuplicateTags
}

function removeDuplicateTags(tags: string[]): string[] {
    const unique = [...new Set(tags)];
    debugOnCleanTagsError(tags, unique);
    return unique;
}

function removeUntaggedTagIfTagged(tags: string[]): string[] {
    let cleaned = tags;
    if (tags && tags.length > 1) {
        cleaned = tags.filter((t) => t !== "untagged")
    }
    debugOnCleanTagsError(tags, cleaned);
    return cleaned;
}

function removeQuotesFromTagValues(tags: string[]): string[] {
    const cleaned = tags.filter((t) => t)
        .map((t) => t.replaceAll("\"", ""));
    debugOnCleanTagsError(tags, cleaned);
    return cleaned;
}

function removeHashPrefixesFromTagValues(tags: string[]) {
    const cleaned = tags.filter((t) => t)
        .map((t) => t.replace(/^#/, ""));
    debugOnCleanTagsError(tags, cleaned);
    return cleaned;
}

function convertAllTagsToStrings(tags: any[]): string[] {
    const converted = tags.map((t) => {
        if (t && typeof t !== 'string') {
            return t.toString();
        }
        return t;
    });
    console.log(`Converted tags to strings: ${converted}`)
    debugOnCleanTagsError(tags, converted)
    return converted;
}

/* Run multiple functions to clean tags. These are nested in a particular order! */
function cleanTags(tags: any[]): string[] {
    console.log(`Tags to clean: ` + tags)
    const cleanedTags = removeUntaggedTagIfTagged(
        removeDuplicateTags(
            removeHashPrefixesFromTagValues(
                removeQuotesFromTagValues(
                    convertAllTagsToStrings(tags)
                )
            )
        )
    );
    console.log(`Cleaned tags result: ` + cleanedTags);
    return cleanedTags;
}

function debugOnCleanTagsError(tags_before: any[], tags_after: string[]) {
    // if tags_before has tag that are non-null, check tags_after
    if (tags_before && tags_before.length >= 1 && tags_before[0]) {
        if (!tags_after || tags_after.length === 0 || !tags_after[0]) {
            debugger;
        }
    }
}

/**
 * 
 * @param {*} params 
 * @returns 
 */
export async function entry(this: QuickAddContext, params: QuickAddParams): Promise<void> {
    const targetProp = "tags";
    // Object destructuring. We pull inputPrompt out of the QuickAdd API in params.
    const { obsidian: { getAllTags }, app, quickAddApi: { inputPrompt, checkboxPrompt, suggester, yesNoPrompt } } = params;
    const { update, getPropertiesInFile } = app.plugins.plugins["metaedit"].api;

    const addOrRemove = await suggester(["Add", "Remove"], ["Add", "Remove"]);

    const sortedTagCounts = getSortedTagCounts(this.app.vault.getMarkdownFiles());

    const selectedTags = await promptToSelectMultipleTags([...sortedTagCounts.keys()]);

    const filter = await inputPrompt(`${addOrRemove} ${addOrRemove === "Add" ? "to" : "from"} files matching pattern (#<tag> or filename):`)

    if (!filter) {
        console.log("Operation canceled by user.")
        return;
    }

    let tagFilterNoHash = null;
    if (filter.charAt(0) === "#") {
        tagFilterNoHash = filter.replace("#", "")
    }

    const filesToEdit = this.app.vault.getMarkdownFiles()
        .filter(f => {
            if (tagFilterNoHash) {
                const file_cache = this.app.metadataCache.getFileCache(f);
                if (!file_cache) {
                    console.error(`Failed to get metadata for file ${f}. Skipping.`)
                    return false;
                }
                const tags = getAllTags(file_cache);
                return tags && (tags.includes(tagFilterNoHash) || tags.includes(filter));
            } else {
                return f.path.contains(filter);
            }
        })
        .map(f => f.path)

    console.log(`${filesToEdit.length} files selected to edit`)

    const doUpdate = await yesNoPrompt("OK to update these files?", filesToEdit.join(", "))

    if (!doUpdate) {
        console.log("Operation canceled by user.")
        return;
    }

    for (const filepath of filesToEdit) {
        console.log(`Processing ${filepath}`);
        const props: [{ key: any, content: any }] = await getPropertiesInFile(filepath)
        let tags: string[] = props.filter(p => p.key == targetProp)
            .map(p => p.content)
            .flat()
        tags = cleanTags(tags);
        switch (addOrRemove) {
            case "Add":
                tags = [...new Set([...tags, ...selectedTags])]
                break;
            case "Remove":
                tags = tags.filter((t) => !selectedTags.includes(t))
                break;
        }
        await update(targetProp, tags, filepath);
    }

    console.log(`${filesToEdit.length} files edited.`)

    async function promptToSelectMultipleTags(tagSuggestions: string[]) {
        const selectedTags = [];
        let doneSelectingTags = false;
        while (!doneSelectingTags) {
            const selectedTag = await suggester(tagSuggestions, tagSuggestions);
            if (selectedTag) {
                selectedTags.push(selectedTag);
            } else {
                doneSelectingTags = true;
            }
        }
        const selectedTagsClean = cleanTags(selectedTags);
        console.log(`Clean selected tags: ((${selectedTags})) => ((${selectedTagsClean}))`)
        debugOnCleanTagsError(selectedTags, selectedTagsClean)
        return selectedTagsClean;
    }

    function getSortedTagCounts(mdFiles: any[]) {

        const tagCounts = new Map();

        // sort tags by prevalence
        mdFiles.forEach((file) => {
            const file_cache = app.metadataCache.getFileCache(file);
            if (!file_cache) {
                console.error(`Unable to get metadata for fle ${file}`)
                return;
            } 
            const tags = getAllTags(file_cache);
            if (tags) {
                tags.forEach((t) => {
                    tagCounts.set(t, (tagCounts.get(t) ? tagCounts.get(t) : 0) + 1);
                });
            }
        });

        // descending sort by count
        const sortedTagCounts = new Map([...tagCounts.entries()].sort((a, b) => b[1] - a[1]));
        return sortedTagCounts;
    }
};

