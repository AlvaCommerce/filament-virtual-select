import 'virtual-select-plugin/dist/virtual-select.min.js';
import 'tooltip-plugin/dist/tooltip.min.js'

export default function virtualSelectFormComponent({
   canSelectPlaceholder,
   isHtmlAllowed,
   getOptionLabelUsing,
   getOptionLabelsUsing,
   getOptionsUsing,
   getSearchResultsUsing,
   isAutofocused,
   isMultiple,
   isSearchable,
   hasDynamicOptions,
   hasDynamicSearchResults,
   livewireId,
   loadingMessage,
   maxItems,
   maxItemsMessage,
   noSearchResultsMessage,
   options,
   optionsLimit,
   placeholder,
   position,
   searchDebounce,
   searchingMessage,
   searchPrompt,
   searchableOptionFields,
   state,
   statePath,
   allOptionsSelectedText,
   optionsSelectedText,
   optionSelectedText,
}) {
    return {
        isSearching: false,

        select: null,

        selectedOptions: [],

        isStateBeingUpdated: false,

        state,

        init: async function () {
            new VirtualSelect({
                ele: this.$refs.input,
                allowHTML: isHtmlAllowed,
                multiple: isMultiple,
                search: isSearchable,
                autofocus: isAutofocused,
                hideClearButton: !canSelectPlaceholder,
                placeholder: placeholder,
                position: position ?? 'auto',
                searchPlaceholderText: searchPrompt,
                noOptionsText: searchPrompt,
                noSearchResultsText: noSearchResultsMessage,
                searchFields: searchableOptionFields ?? ['label'],
                optionsCount: optionsLimit,
                maxValues: maxItems ?? 0,
                loadingText: loadingMessage,
                allOptionsSelectedText: allOptionsSelectedText,
                optionsSelectedText: optionsSelectedText,
                optionSelectedText: optionSelectedText
            });

            this.select = this.$refs.input;

            window.addEventListener('filament-virtual-select--selectAll-'+livewireId, () => this.toggleSelectAll(true));
            window.addEventListener('filament-virtual-select--removeAll-'+livewireId, () => this.toggleSelectAll(false));

            await this.refreshChoices({ withInitialOptions: true })

            if (![null, undefined, ''].includes(this.state)) {
                this.select.setValue(this.formatState(this.state))
            }

            this.select.addEventListener('change', () => {
                if (this.isStateBeingUpdated) {
                    return
                }

                this.isStateBeingUpdated = true
                this.state = (this.select.getSelectedOptions() ?? [])
                    .map(option => option.value)
                    .filter(value => value !== '' && value !== null)

                this.$nextTick(() => (this.isStateBeingUpdated = false))
            })

            if (hasDynamicOptions) {
                this.select.addEventListener('dropdown-open', async () => {
                    this.select.setOptions([
                        {
                            label: loadingMessage,
                            value: '',
                            disabled: true,
                        },
                    ])

                    await this.refreshChoices()
                })
            }

            if (hasDynamicSearchResults) {
                this.select.addEventListener('search', async (event) => {
                    let search = event.detail.value?.trim()

                    this.isSearching = true

                    this.select.setOptions([
                        {
                            label: [null, undefined, ''].includes(search)
                                ? loadingMessage
                                : searchingMessage,
                            value: '',
                            disabled: true,
                        },
                    ])
                })

                this.select.addEventListener(
                    'search',
                    Alpine.debounce(async (event) => {
                        await this.refreshChoices({
                            search: event.detail.value?.trim(),
                        })

                        this.isSearching = false
                    }, searchDebounce),
                )
            }

            if (!isMultiple) {
                window.addEventListener(
                    'filament-forms::select.refreshSelectedOptionLabel',
                    async (event) => {
                        if (event.detail.livewireId !== livewireId) {
                            return
                        }

                        if (event.detail.statePath !== statePath) {
                            return
                        }

                        await this.refreshChoices({
                            withInitialOptions: false,
                        })
                    },
                )
            }

            this.$watch('state', async () => {
                if (!this.select) {
                    return
                }

                if (this.isStateBeingUpdated) {
                    return
                }

                await this.refreshChoices({
                    withInitialOptions: !hasDynamicOptions,
                })
            })
        },

        destroy: function () {
            this.select?.destroy()
            this.select = null
        },

        toggleSelectAll: function (state) {
            this.select.toggleSelectAll(state);
        },

        refreshChoices: async function (config = {}) {
            const choices = await this.getChoices(config)

            if (!this.select) {
                return
            }

            this.select.reset()
            this.select.setOptions(choices)

            if (![null, undefined, ''].includes(this.state)) {
                this.select.setValue(this.formatState(this.state))
            }
        },

        setChoices: function (choices) {
            this.select.setOptions(choices)
        },

        getChoices: async function (config = {}) {
            const existingOptions = await this.getExistingOptions(config);

            return existingOptions.concat(
                await this.getMissingOptions(existingOptions),
            )
        },

        getExistingOptions: async function ({ search, withInitialOptions }) {
            if (withInitialOptions) {
                return options
            }

            let results = []

            if (search !== '' && search !== null && search !== undefined) {
                results = await getSearchResultsUsing(search)
            } else {
                results = await getOptionsUsing()
            }

            return results.map((result) => {
                if (result.options) {
                    result.options = result.options.map((groupedOption) => {
                        groupedOption.selected = Array.isArray(this.state)
                            ? this.state.includes(groupedOption.value)
                            : this.state === groupedOption.value

                        return groupedOption
                    })

                    return result
                }

                result.selected = Array.isArray(this.state)
                    ? this.state.includes(result.value)
                    : this.state === result.value

                return result
            })
        },


        formatState: function (state) {
            if (isMultiple) {
                return (state ?? []).map((item) => item?.toString())
            }

            return state?.toString()
        },

        getMissingOptions: async function (existingOptions) {
            let state = this.formatState(this.state)

            if ([null, undefined, '', [], {}].includes(state)) {
                return {}
            }

            const existingOptionValues = new Set()

            existingOptions.forEach((existingOption) => {
                if (existingOption.options) {
                    existingOption.options.forEach((groupedExistingOption) =>
                        existingOptionValues.add(groupedExistingOption.value),
                    )

                    return
                }

                existingOptionValues.add(existingOption.value)
            })

            if (isMultiple) {
                if (state.every((value) => existingOptionValues.has(value))) {
                    return {}
                }

                return (await getOptionLabelsUsing())
                    .filter((option) => !existingOptionValues.has(option.value))
                    .map((option) => {
                        option.selected = true

                        return option
                    })
            }

            if (existingOptionValues.has(state)) {
                return existingOptionValues
            }

            return [
                {
                    label: await getOptionLabelUsing(),
                    value: state,
                    selected: true,
                },
            ]
        },
    }
}
