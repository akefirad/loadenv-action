# LoadEnv GitHub Action

## Examples

```yaml
jobs:
  simple:
    runs-on: ubuntu-latest
    steps:
      - uses: akefirad/loadenv-action@naun
      - run: echo $FOO $BAR # FOO and BAR are defined in <root>/.env file

  complex:
    runs-on: ubuntu-latest
    steps:
      - uses: akefirad/loadenv-action@main
        id: loadenv
        name: Loads `./path/to/.env`, expands, checks, and export variables
        with:
          files: ./path/to/.env
          strict: true      # default true
          expand-vars: true # default true
          export-vars: true # default true
          additional-vars: "${{ toJSON(vars) }}" # to make them available while expanding!!!
      - name: Use output variables
        run: echo  ${{ steps.loadenv.FOO }} ${{ steps.loadenv.BAR }}
      - name: Use exported variables
        run: echo $FOO $BAR
```

See [tests.yml](.github/workflows/tests.yml) file for more examples.

## API

See [action.yml](action.yml) file for full API.
