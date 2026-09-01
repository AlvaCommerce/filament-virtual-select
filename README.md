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

- PHP 8.2+
- Laravel 11.28+
- Filament 4.0+

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

| Method | Description |
|--------|-------------|
| `getAllOptionsSelectedText()` | Customize the text shown when all options are selected |
| `getOptionsSelectedText()` | Customize the text shown when multiple options are selected |
| `getOptionSelectedText()` | Customize the text shown when a single option is selected |

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
