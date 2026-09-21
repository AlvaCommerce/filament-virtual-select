<?php

namespace Alva\FilamentVirtualSelect\Forms\Components;

use Alva\FilamentVirtualSelect\Forms\Concerns\HasOptionAlias;
use Closure;
use Filament\Forms\Components\Select;

class VirtualSelect extends Select
{
    use HasOptionAlias;

    protected bool | Closure $hideClearButton = false;

    protected int | Closure $visibleOptionsCount = 5;

    protected string $view = 'filament-virtual-select::forms.components.virtual-select';

    protected function setUp(): void
    {
        parent::setUp();

        $this->transformOptionsForJsUsing(static function (VirtualSelect $component, array $options): array {
            return collect($options)
                ->map(
                    fn($label, $value): array => is_array($label) ? [
                        'label' => $value,
                        'options' => $component->transformOptionsForJs($label)
                    ] : [
                        'label' => $label,
                        'value' => strval($value),
                        ...($component->isEnabledOptionAlias() ? ['alias' => $component->getOptionAliases($label)] : []),
                        'disabled' => $component->isOptionDisabled($value, $label)
                    ]
                )
                ->values()
                ->all();
        });
    }

    public function getAllOptionsSelectedText(): string
    {
        return __('filament-virtual-select::virtual-select.all_options_selected');
    }

    public function getOptionsSelectedText(): string
    {
        return __('filament-virtual-select::virtual-select.options_selected');
    }

    public function getOptionSelectedText(): string
    {
        return __('filament-virtual-select::virtual-select.option_selected');
    }

    /**
     * How many options fit in the dropdown viewport before it scrolls. This is not
     * Filament's `optionsLimit()`: the plugin virtualises the whole list, so every
     * option is always reachable.
     */
    public function visibleOptionsCount(int | Closure $count): static
    {
        $this->visibleOptionsCount = $count;

        return $this;
    }

    public function getVisibleOptionsCount(): int
    {
        return max(1, (int) $this->evaluate($this->visibleOptionsCount));
    }

    public function hideClearButton(bool | Closure $condition = true): static
    {
        $this->hideClearButton = $condition;

        return $this;
    }

    public function getHideClearButton(): bool
    {
        return (bool) $this->evaluate($this->hideClearButton);
    }

    public function getSelectAllText(): string
    {
        return __('filament-virtual-select::virtual-select.select_all');
    }

    public function getClearAllText(): string
    {
        return __('filament-virtual-select::virtual-select.clear_all');
    }
}
