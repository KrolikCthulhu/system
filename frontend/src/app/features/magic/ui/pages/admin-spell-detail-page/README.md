# Admin Spell Detail Page

## Structure

Основной поток:

`component -> view-model -> read-model / facade -> store / commands`

- `component` - template binding, inputs/outputs, layout.
- `view-model` - готовые объекты для template.
- `read-model` - options, labels, previews, derived state.
- `facade` - команды, toggles, координация store/use cases.
- `commands` - чистые immutable-изменения draft.
- `store` - состояние страницы.

## Folders

- `application/` - use cases, draft facades, commands.
- `application/commands/` - чистые изменения draft.
- `read-model/` - общие read helpers страницы.
- `mechanics/read-model/` - read helpers вкладки mechanics.
- `mechanics/view-model/` - VM builders вкладки mechanics.
- `area/` - area editor, его VM, commands и read-models.
- `state/` - signal store страницы.
- `mappers/` - API/draft mapping.
- `runtime/` - runtime preview VM.

## Adding Mechanics Fields

1. Draft change: `application/commands`.
2. Options/labels/preview: `mechanics/read-model`.
3. User action: command facade.
4. Template object: `mechanics/view-model`.
5. Component/template: binding only.
