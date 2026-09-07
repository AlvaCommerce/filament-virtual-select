@php
    use Filament\Support\Facades\FilamentView;

    $canSelectPlaceholder = $canSelectPlaceholder();
    $isDisabled = $isDisabled();
    $isPrefixInline = $isPrefixInline();
    $isSuffixInline = $isSuffixInline();
    $prefixActions = $getPrefixActions();
    $prefixIcon = $getPrefixIcon();
    $prefixLabel = $getPrefixLabel();
    $suffixActions = $getSuffixActions();
    $suffixIcon = $getSuffixIcon();
    $suffixLabel = $getSuffixLabel();
    $statePath = $getStatePath();
    $key = $getKey();
@endphp

<x-dynamic-component
    :component="$getFieldWrapperView()"
    :field="$field"
    :inline-label-vertical-alignment="\Filament\Support\Enums\VerticalAlignment::Center"
>
    <x-filament::input.wrapper
        :disabled="$isDisabled"
        :inline-prefix="$isPrefixInline"
        :inline-suffix="$isSuffixInline"
        :prefix="$prefixLabel"
        :prefix-actions="$prefixActions"
        :prefix-icon="$prefixIcon"
        :prefix-icon-color="$getPrefixIconColor()"
        :suffix="$suffixLabel"
        :suffix-actions="$suffixActions"
        :suffix-icon="$suffixIcon"
        :suffix-icon-color="$getSuffixIconColor()"
        :valid="! $errors->has($statePath)"
        :attributes="
            \Filament\Support\prepare_inherited_attributes($getExtraAttributeBag())
                ->class(['fi-fo-select'])
        "
    >
        <style>
            /* Ensure virtual-select expands to fill the wrapper width */
            .vscomp-ele,
            .vscomp-wrapper,
            .vscomp-toggle-button {
                width: 100% !important;
                max-width: 100% !important;
            }

            .vscomp-toggle-button {
                border-radius: 0.5rem;
            }
        </style>

        @if ((! ($isSearchable() || $isMultiple()) && $isNative()))
            <x-filament::input.select
                :autofocus="$isAutofocused()"
                :disabled="$isDisabled"
                :id="$getId()"
                :inline-prefix="$isPrefixInline && (count($prefixActions) || $prefixIcon || filled($prefixLabel))"
                :inline-suffix="$isSuffixInline && (count($suffixActions) || $suffixIcon || filled($suffixLabel))"
                :required="$isRequired() && (! $isConcealed())"
                :attributes="
                    $getExtraInputAttributeBag()
                        ->merge([
                            $applyStateBindingModifiers('wire:model') => $statePath,
                        ], escape: false)
                "
            >
                @php
                    $isHtmlAllowed = $isHtmlAllowed();
                @endphp

                @if ($canSelectPlaceholder)
                    <option value="">
                        @if (! $isDisabled)
                            {{ $getPlaceholder() }}
                        @endif
                    </option>
                @endif

                @foreach ($getOptions() as $value => $label)
                    @if (is_array($label))
                        <optgroup label="{{ $value }}">
                            @foreach ($label as $groupedValue => $groupedLabel)
                                <option
                                    @disabled($isOptionDisabled($groupedValue, $groupedLabel))
                                    value="{{ $groupedValue }}"
                                >
                                    @if ($isHtmlAllowed)
                                        {!! $groupedLabel !!}
                                    @else
                                        {{ $groupedLabel }}
                                    @endif
                                </option>
                            @endforeach
                        </optgroup>
                    @else
                        <option
                            @disabled($isOptionDisabled($value, $label))
                            value="{{ $value }}"
                        >
                            @if ($isHtmlAllowed)
                                {!! $label !!}
                            @else
                                {{ $label }}
                            @endif
                        </option>
                    @endif
                @endforeach
            </x-filament::input.select>
        @else
            <div
                class="hidden"
                x-data="{
                    isDisabled: @js($isDisabled),
                    init: function () {
                        const container = $el.nextElementSibling
                        container.dispatchEvent(
                            new CustomEvent('set-select-property', {
                                detail: { isDisabled: this.isDisabled },
                            }),
                        )
                    },
                }"
            ></div>
            <div
                @if (FilamentView::hasSpaMode())
                    {{-- format-ignore-start --}}x-load="visible || event (ax-modal-opened)"{{-- format-ignore-end --}}
                @else
                    x-load
                @endif
                x-load-src="{{ \Filament\Support\Facades\FilamentAsset::getAlpineComponentSrc('filament-virtual-select', 'alva/filament-virtual-select') }}"
                x-data="virtualSelectFormComponent({
                            canSelectPlaceholder: @js($canSelectPlaceholder),
                            isHtmlAllowed: @js($isHtmlAllowed()),
                            getOptionLabelUsing: async () => {
                                return await Livewire.fireAction(
                                    $wire.__instance,
                                    'callSchemaComponentMethod',
                                    [@js($key), 'getOptionLabel'],
                                    { async: true },
                                )
                            },
                            getOptionLabelsUsing: async () => {
                                return await Livewire.fireAction(
                                    $wire.__instance,
                                    'callSchemaComponentMethod',
                                    [@js($key), 'getOptionLabelsForJs'],
                                    { async: true },
                                )
                            },
                            getOptionsUsing: async () => {
                                return await Livewire.fireAction(
                                    $wire.__instance,
                                    'callSchemaComponentMethod',
                                    [@js($key), 'getOptionsForJs'],
                                    { async: true },
                                )
                            },
                            getSearchResultsUsing: async (search) => {
                                return await Livewire.fireAction(
                                    $wire.__instance,
                                    'callSchemaComponentMethod',
                                    [@js($key), 'getSearchResultsForJs', { search }],
                                    { async: true },
                                )
                            },
                            isAutofocused: @js($isAutofocused()),
                            isMultiple: @js($isMultiple()),
                            isSearchable: @js($isSearchable()),
                            livewireId: @js($this->getId()),
                            hasDynamicOptions: @js($hasDynamicOptions()),
                            hasDynamicSearchResults: @js($hasDynamicSearchResults()),
                            loadingMessage: @js($getLoadingMessage()),
                            maxItems: @js($getMaxItems()),
                            maxItemsMessage: @js($getMaxItemsMessage()),
                            noSearchResultsMessage: @js($getNoSearchResultsMessage()),
                            options: @js($getOptionsForJs()),
                            optionsLimit: @js($getOptionsLimit()),
                            placeholder: @js($getPlaceholder()),
                            position: @js($getPosition()),
                            searchDebounce: @js($getSearchDebounce()),
                            searchingMessage: @js($getSearchingMessage()),
                            searchPrompt: @js($getSearchPrompt()),
                            searchableOptionFields: @js($getSearchableOptionFields()),
                            state: $wire.{{ $applyStateBindingModifiers("\$entangle('{$statePath}')") }},
                            statePath: @js($statePath),
                            allOptionsSelectedText: @js($getAllOptionsSelectedText()),
                            optionsSelectedText: @js($getOptionsSelectedText()),
                            optionSelectedText: @js($getOptionSelectedText()),
                            hideClearButton: @js($getHideClearButton()),
                            selectAllText: @js($getSelectAllText()),
                            clearAllText: @js($getClearAllText()),
                        })"
                wire:ignore
                x-on:keydown.esc="select.isDropdownOpen && $event.stopPropagation()"
                x-on:set-select-property="$event.detail.isDisabled ? select.disable() : select.enable()"
                {{
                    $attributes
                        ->merge($getExtraAlpineAttributes(), escape: false)
                        ->class([
                            '[&_.vscomp-toggle-button]:ps-0' => $isPrefixInline && (count($prefixActions) || $prefixIcon || filled($prefixLabel)),
                        ])
                }}
            >
                <div x-ref="input" {{
                        $getExtraInputAttributeBag()
                            ->merge([
                                'disabled' => $isDisabled,
                                'id' => $getId()
                            ], escape: false)
                            ->class([
                                'w-full max-w-full rounded-lg border-none p-0',
                            ])
                    }}
                ></div>
            </div>
        @endif
    </x-filament::input.wrapper>
</x-dynamic-component>
