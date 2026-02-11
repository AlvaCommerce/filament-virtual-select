<?php

namespace Alva\FilamentVirtualSelect\Forms\Components;

use Alva\FilamentVirtualSelect\Forms\Concerns\HasOptionAlias;
use Closure;
use Filament\Forms\Components\Select;

class VirtualSelect extends Select
{
    use HasOptionAlias;

    protected bool | Closure $hideClearButton = false;

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
        return __('All');
    }

    public function getOptionsSelectedText(): string
    {
        return __('selected');
    }

    public function getOptionSelectedText(): string
    {
        return __('selected');
    }

    public function hideClearButton(bool | Closure $condition = false): static
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
        return __('Select All');
    }

    public function getClearAllText(): string
    {
        return __('Clear All');
    }
}
