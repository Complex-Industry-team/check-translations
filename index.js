const core = require('@actions/core');
const fs = require('fs');

const DEFAULT_NAME = 'translation.json'

const defaultJson = JSON.parse(fs.readFileSync(DEFAULT_NAME, 'utf-8'))
const defaultTranslations = defaultJson[0]['*']
core.info(JSON.stringify(defaultJson))
core.info(JSON.stringify(defaultTranslations))

var files = fs.readdirSync('./').filter(name => name.endsWith('.json') && name != DEFAULT_NAME)

var resultsTable = [
    [{ data: 'language', header: true }, { data: 'complete', header: true }, { data: 'Missing keys', header: true }, { data: 'Untranslated keys', header: true }]
]
var incompleteDetails = []

files.forEach(fileName => {
    try {
        core.info('Checking ' + fileName)
        var missingKeys = []
        var untranslatedKeys = []

        // jank method of extracting language code from file name
        var langCode = fileName.substring(fileName.indexOf('_') + 1).replace('.json', '')

        var json = JSON.parse(fs.readFileSync(fileName, 'utf-8'))
        var keys = json[0][langCode]

        for (const defaultKey in defaultTranslations) {
            if (!defaultKey in keys)
                missingKeys.push(defaultKey)
            else if (defaultTranslations[defaultKey] === keys[defaultKey])
                untranslatedKeys.push(defaultKey)
        }

        var success = (missingKeys.length == 0 && untranslatedKeys.length == 0) ? '✅' : '❌'

        resultsTable.push([
            langCode,
            success,
            missingKeys.length,
            untranslatedKeys.length
        ])
        if (success === false) {
            incompleteDetails.push({
                langCode: langCode,
                missingKeys: missingKeys,
                untranslatedKeys: untranslatedKeys
            })
        }

    } catch (error) {
        core.error(error.message);
    }
});

var summary = core.summary.addHeading('Translation completeness')
    .addTable(resultsTable)
    .addHeading('Incomplete langauges')

incompleteDetails.forEach(details => {
    summary.addBreak()
    summary.addRaw('#### ' + details.langCode)

    var missingKeysString = ''
    details.missingKeys.forEach(key => {
        missingKeysString += '- ' + key + '\n'
    });
    summary.addDetails('Missing keys', missingKeysString)

    var untranslatedKeyString = ''
    details.untranslatedKeys.forEach(key => {
        untranslatedKeyString += '- ' + key + '\n'
    });
    summary.addDetails('Untranslated keys', untranslatedKeyString)
});

summary.write()