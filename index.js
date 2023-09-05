const core = require('@actions/core');
const fs = require('fs');

const DEFAULT_NAME = 'translation.json'
const IGNORED_KEYS = [
    'draft_complex_industri_maincategory_title',
    'draft_industry_budget00_title'
]


async function run()
{
    const defaultJson = JSON.parse(fs.readFileSync(DEFAULT_NAME, 'utf-8'))
    const defaultTranslations = defaultJson[0]['*']
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
            core.debug('language code: ' + langCode)
    
            var json = JSON.parse(fs.readFileSync(fileName, 'utf-8'))
            var keys = json[0][langCode]
    
            for (const defaultKey in defaultTranslations) {
                if (defaultKey in IGNORED_KEYS)
                    continue
                core.debug('checking key ' + defaultKey)
                if (!(defaultKey in keys))
                {
                    missingKeys.push(defaultKey)
                    core.debug('missing key ' + defaultKey)
                }
                else if (defaultTranslations[defaultKey] === keys[defaultKey])
                {
                    untranslatedKeys.push(defaultKey)
                    core.debug('missing translation for ' + defaultKey)
                }
            }
    
            var success = (missingKeys.length == 0 && untranslatedKeys.length == 0) ? '✓🎉' : '✖'
    
            resultsTable.push([
                langCode,
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
    });
    
    core.debug(JSON.stringify(resultsTable))
    core.debug(JSON.stringify())
    var summary = core.summary.addHeading('Translation completeness')
        .addTable(resultsTable)
        .addHeading('Incomplete languages')
    
    incompleteDetails.forEach(details => {
        summary.addBreak();
        summary.addRaw('<h2>' + details.langCode + '</h2>');

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
    
    await summary.write()
}

run()
