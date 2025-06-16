<?php

namespace Alva\FilamentVirtualSelect\Forms\Components;

use Filament\Forms\Components\Select;

class VirtualSelect extends Select
{
    protected string $view = 'filament-virtual-select::forms.components.virtual-select';

    protected function setUp(): void
    {
        parent::setUp();

        $this->transformOptionsForJsUsing(static function (Select $component, array $options): array {
            return collect($options)
                ->map(fn ($label, $value): array => is_array($label)
                    ? ['label' => !empty($value) ? $value : __('No Group'), 'disabled' => false, 'options' => $component->transformOptionsForJs($label)]
                    : ['label' => $label, 'value' => strval($value), 'disabled' => $component->isOptionDisabled($value, $label)])
                ->sortBy(fn ($option) => in_array($option['label'], [__('No Group'), 'FR', 'EN']))
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
}
