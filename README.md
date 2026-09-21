# Filament Virtual Select

A Filament form component that enhances the standard Select field with a powerful virtual select implementation. This package integrates the [virtual-select-plugin](https://github.com/sa-si-dev/virtual-select) with Filament to provide an improved select experience with features like virtualized scrolling, search, and multiple selection.

## Features

- 🚀 Virtualized scrolling for handling large option lists efficiently
- 🔍 Searchable options with customizable search fields
- ✅ Multiple selection support
- 🔄 Dynamic loading of options
- 🎨 Customizable styling and positioning
- 📱 Responsive design
- 🌐 Internationalization support
- 🧩 Option grouping
- 🔗 HTML content in options

## Requirements

- PHP 8.3+
- Laravel 11.28+
- Livewire 4.0+
- Filament 5.0+

## Installation

You can install the package via composer:

```bash
composer require alva/filament-virtual-select
```

The package will automatically register its service provider.

## Usage

```php
use Alva\FilamentVirtualSelect\Forms\Components\VirtualSelect;

// Basic usage
VirtualSelect::make('country')
    ->options([
        'us' => 'United States',
        'ca' => 'Canada',
        'mx' => 'Mexico',
    ])

// With search
VirtualSelect::make('country')
    ->options([
        'us' => 'United States',
        'ca' => 'Canada',
        'mx' => 'Mexico',
    ])
    ->searchable()

// Multiple selection
VirtualSelect::make('countries')
    ->options([
        'us' => 'United States',
        'ca' => 'Canada',
        'mx' => 'Mexico',
    ])
    ->multiple()

// With option groups
VirtualSelect::make('country')
    ->options([
        'North America' => [
            'us' => 'United States',
            'ca' => 'Canada',
            'mx' => 'Mexico',
        ],
        'Europe' => [
            'uk' => 'United Kingdom',
            'fr' => 'France',
            'de' => 'Germany',
        ],
    ])

// With dynamic options
VirtualSelect::make('user')
    ->getSearchResultsUsing(fn (string $search) => User::where('name', 'like', "%{$search}%")
        ->limit(50)
        ->get()
        ->mapWithKeys(fn (User $user) => [$user->id => $user->name])
        ->toArray())
```

## Configuration Options

The VirtualSelect component extends Filament's Select component and adds the following methods:

| Method | Default | Description |
|--------|---------|-------------|
| `visibleOptionsCount(int)` | `5` | How many options fit in the dropdown before it scrolls |
| `hideClearButton(bool)` | `false` | Hide the "Clear All" button inside the dropdown (multiple selection only) |
| `enableOptionAlias(bool)` | `true` | Build search aliases so non-adjacent words match, e.g. `Jean 514` matches `Jean Tremblay (ABC) 514-555-1234` |
| `maxOptionAliases(int)` | `31` | Cap on aliases generated per option; aliases grow as 2^words, so this bounds the payload |

Notes:

- `optionsLimit()` has **no effect**: the plugin virtualises the whole list, so every option stays reachable. Use `visibleOptionsCount()` to change the dropdown height.
- `maxItemsMessage()` is not rendered. Once `maxItems()` is reached the plugin simply stops accepting picks.
- Option aliases are generated per option on every render and shipped to the browser. On large lists disable them with `enableOptionAlias(false)` or lower `maxOptionAliases()`.

Translations live in `resources/lang/{en,fr}/virtual-select.php` and can be overridden with:

```bash
php artisan vendor:publish --tag=filament-virtual-select-translations
```

You can also use all the methods available in Filament's Select component:

- `options(array $options)` - Set the options for the select
- `multiple()` - Allow multiple selections
- `searchable()` - Make the select searchable
- `placeholder(string $placeholder)` - Set the placeholder text
- `getSearchResultsUsing(callable $callback)` - Load options dynamically based on search
- `getOptionLabelUsing(callable $callback)` - Format option labels
- And many more...

## License

This package is open-sourced software licensed under the [MIT license](LICENSE).
