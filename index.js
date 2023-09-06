const core = require('@actions/core');
const fs = require('fs');
const iso639 = require('iso-639-1');


const IGNORED_KEYS = core.getInput('ignored-keys').split(' ')

// Collects all json files in the specified folder and subfolders
function collectJsons(dir) {
    var jsonFiles = []
    const files = fs.readdirSync(dir, 'utf-8')
    for (const file in files) {
        if (file.startsWith('.'))
            continue
        if (fs.lstatSync(file).isDirectory())
            jsonFiles.push(collectJsons(file))
        else if (file.endsWith('.json'))
            jsonFiles.push(file)
    }
    return jsonFiles
}

const jsonFiles = collectJsons('./')
var translations = {}
var defaultTranslation = null
for (const jsonFile of jsonFiles) {
    try
    {
        const json = JSON.parse(fs.readFileSync(jsonFile, 'utf-8'))
        if (Array.isArray(json) === false)
        {
            core.info(jsonFile + ' does not contain an array.')
            continue
        }

        for (const draft of json) {
            const id = draft.id
            if (draft.type != 'translation')
                core.info('Draft' + id + ' is not a translation draft.')
            for (const key in draft) {
                if (key === 'type' || key === 'id')
                    continue
                if (iso639.validate(key))
                {
                    translations[key] = draft[key]
                    core.info('detected translation for ' + iso639.getName(key))
                }
                else if (key === '*')
                    defaultTranslation = draft[key]
            }
        }
    }
    catch
    {
        core.warning('Unable to get translation content from ' + jsonFile)
    }
}

if (defaultTranslation === null)
{
    core.setFailed('Unable to find a default translation!')
    return
}

var resultsTable = [
    [{ data: 'language', header: true }, { data: 'code', header: true}, { data: 'complete', header: true }, { data: 'Missing keys', header: true }, { data: 'Untranslated keys', header: true }]
]
var incompleteDetails = []

for (const langCode in translations) {
    core.info('Checking ' + langCode)
    var missingKeys = []
    var untranslatedKeys = []
    try
    {
        var keys = translations[langCode]

        for (const defaultKey in defaultTranslation) {
            if (IGNORED_KEYS.includes(defaultKey))
                continue
            core.debug('checking key ' + defaultKey)
            if (!(defaultKey in keys))
            {
                missingKeys.push(defaultKey)
                core.debug('missing key ' + defaultKey)
            }
            else if (defaultTranslation[defaultKey] === keys[defaultKey])
            {
                untranslatedKeys.push(defaultKey)
                core.debug('missing translation for ' + defaultKey)
            }
        }

        var success = (missingKeys.length == 0 && untranslatedKeys.length == 0) ? '✓🎉' : '✖'

        resultsTable.push([
            langCode,
            iso639.getName(langCode),
            success,
            missingKeys.length.toString(),
            untranslatedKeys.length.toString()
        ])
        if (success === '✖') {
            incompleteDetails.push({
                langCode: langCode,
                missingKeys: missingKeys,
                untranslatedKeys: untranslatedKeys
            })
        }
        core.info('missing keys: ' + missingKeys.length)
        core.info('untranslated keys: ' + untranslatedKeys.length)
    } catch (error) {
        core.error(error.message);
    }
}


core.debug(JSON.stringify(resultsTable))
core.debug(JSON.stringify())
var summary = core.summary.addHeading('Translation completeness')
    .addTable(resultsTable)
    .addHeading('Incomplete languages')

incompleteDetails.forEach(details => {
    summary.addBreak();
    summary.addRaw('<h2>' + iso639.getName(details.langCode) + ' (' + details.langCode + ')</h2>');
 
    if (details.missingKeys.length > 0)
    {
        var missingKeysString = '<ul>';
        details.missingKeys.forEach(key => {
            missingKeysString += '<li>' + key + '</li>';
        });
        missingKeysString += '</ul>'
        summary.addDetails('Missing keys', missingKeysString);
    }

    if (details.untranslatedKeys.length > 0)
    {
        var untranslatedKeyString = '<ul>';
        details.untranslatedKeys.forEach(key => {
            untranslatedKeyString += '<li>' + key + '</li>';
        });
        untranslatedKeyString += '</ul>'
        summary.addDetails('Untranslated keys', untranslatedKeyString);
    }
});

summary.write()