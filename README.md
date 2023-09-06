Reads the translations for a plugin and reports which languages have untranslated keys.

### Example workflow
here is a sample yml if you want to use this in your project.
```yml
name: 'Check translation completeness'
on: [push, pull_request]

jobs:
  check-translations:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - uses: Complex-Industry-team/check-translations@v2
        with: 
          ignored-keys: draft_complex_industri_maincategory_title draft_industry_budget00_title
```
