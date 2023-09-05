const core = require('@actions/core');
const fs = require('fs');

const DEFAULT_NAME = 'translation.json'

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
    
    await summary.write()
}

run()
